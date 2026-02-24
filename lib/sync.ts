import prisma from "./prisma";
import { MetaAdsClient } from "./meta";
import { VTurbClient } from "./vturb";
import { UTMifyClient } from "./utmify";

export class SyncService {
    async syncDay(dateStr: string) {
        const date = new Date(dateStr);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        // 1. Buscar métricas de vendas do nosso banco (populado via webhooks)
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lte: new Date(date.setHours(23, 59, 59, 999))
                }
            }
        });

        const totalRevenue = sales.filter(s => s.status === 'PAID').reduce((acc, s) => acc + s.amount, 0);
        const totalSales = sales.filter(s => s.status === 'PAID').length;

        // 2. Buscar Meta Ads
        let metaMetrics = { spend: 0, clicks: 0, impressions: 0 };
        if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
            const meta = new MetaAdsClient(process.env.META_ACCESS_TOKEN, process.env.META_AD_ACCOUNT_ID);
            metaMetrics = await meta.getDailyMetrics(dateStr);
        }

        // 3. Buscar UTMify (Conversões de Funil)
        let utmifyData = null;
        if (process.env.UTMIFY_API_TOKEN) {
            const utmify = new UTMifyClient(process.env.UTMIFY_API_TOKEN);
            utmifyData = await utmify.getOrders(dateStr, dateStr);
        }

        // 4. Atualizar DailyPerformance
        await prisma.dailyPerformance.upsert({
            where: { date: new Date(dateStr) },
            update: {
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                vendas: totalSales,
                receitaGerada: totalRevenue,
                cpa: totalSales > 0 ? metaMetrics.spend / totalSales : 0,
                ticketMedio: totalSales > 0 ? totalRevenue / totalSales : 0,
                // Aqui poderíamos processar utmifyData para preencher métricas de upsell/backredirect
            },
            create: {
                date: new Date(dateStr),
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                vendas: totalSales,
                receitaGerada: totalRevenue,
                cpa: totalSales > 0 ? metaMetrics.spend / totalSales : 0,
                ticketMedio: totalSales > 0 ? totalRevenue / totalSales : 0,
            }
        });

        console.log(`Sync completo para ${dateStr}`);
    }
}
