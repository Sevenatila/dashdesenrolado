import prisma from "./prisma";
import { MetaAdsClient } from "./meta";
import { VTurbClient } from "./vturb";
import { UTMifyClient } from "./utmify";

export class SyncService {
    async syncDay(dateStr: string) {
        const date = new Date(dateStr);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        // 1. Métricas de vendas (agora centralizadas na UTMify, removida busca local do banco)
        const totalRevenue = 0;
        const totalSales = 0;

        // 2. Buscar Meta Ads
        let metaMetrics = { spend: 0, clicks: 0, impressions: 0 };
        if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
            const meta = new MetaAdsClient(process.env.META_ACCESS_TOKEN, process.env.META_AD_ACCOUNT_ID);
            metaMetrics = await meta.getDailyMetrics(dateStr);
        }

        // 3. Buscar UTMify (Conversões de Funil e Vendas)
        let utmifyMetrics = {
            revenue: 0,
            salesCount: 0,
            checkoutConversions: 0,
            upsell1: 0,
            upsell2: 0,
            downsell: 0,
            backredirect: 0,
            orderBump: 0
        };

        if (process.env.UTMIFY_API_TOKEN) {
            const utmify = new UTMifyClient(process.env.UTMIFY_API_TOKEN);
            const utmifyData = await utmify.getOrders(dateStr, dateStr);

            if (utmifyData && Array.isArray(utmifyData)) {
                // Filtrar apenas ordens pagas/aprovadas da UTMify
                const paidOrders = utmifyData.filter((o: any) =>
                    o.status === 'approved' || o.status === 'paid' || o.status === 'complete'
                );

                utmifyMetrics.revenue = paidOrders.reduce((acc: number, o: any) => acc + (o.total_price || 0), 0);
                utmifyMetrics.salesCount = paidOrders.length;

                // Exemplo de como processar taxas de conversão se a UTMify fornecer os eventos
                // utmifyMetrics.checkoutConversions = ...
            }
        }

        // 4. Buscar VTurb (Métricas de VSL)
        // ... (mantém o código de vturb)
        let vturbMetrics = { plays: 0, leadRetention: 0, engagement: 0, pitchRetention: 0 };
        if (process.env.VTURB_API_KEY) {
            const vturb = new VTurbClient(process.env.VTURB_API_KEY);
            const videoId = "68fda7c738d7cd51cf68c89a";
            const stats = await vturb.getVideoMetrics(videoId);
            if (stats) {
                vturbMetrics = {
                    plays: stats.plays || 0,
                    leadRetention: stats.lead_retention || 0,
                    engagement: stats.engagement || 0,
                    pitchRetention: stats.pitch_retention || 0
                };
            }
        }

        // Usar dados da UTMify se as vendas locais (webhook) estiverem zeradas (útil para dados históricos)
        const finalRevenue = totalRevenue > 0 ? totalRevenue : utmifyMetrics.revenue;
        const finalSalesCount = totalSales > 0 ? totalSales : utmifyMetrics.salesCount;

        // 5. Atualizar DailyPerformance
        console.log(`[Sync] Preparando upsert para ${dateStr}...`);
        console.log(`[Sync] Vendas: ${finalSalesCount}, Receita: ${finalRevenue}, Gasto: ${metaMetrics.spend}`);

        await prisma.dailyPerformance.upsert({
            where: { date: new Date(dateStr) },
            update: {
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                vendas: finalSalesCount,
                receitaGerada: finalRevenue,
                cpa: finalSalesCount > 0 ? metaMetrics.spend / finalSalesCount : 0,
                ticketMedio: finalSalesCount > 0 ? finalRevenue / finalSalesCount : 0,
                playsUnicosVSL: vturbMetrics.plays,
                retencaoLeadVSL: vturbMetrics.leadRetention,
                engajamentoVSL: vturbMetrics.engagement,
                retencaoPitchVSL: vturbMetrics.pitchRetention,
            },
            create: {
                date: new Date(dateStr),
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                vendas: finalSalesCount,
                receitaGerada: finalRevenue,
                cpa: finalSalesCount > 0 ? metaMetrics.spend / finalSalesCount : 0,
                ticketMedio: finalSalesCount > 0 ? finalRevenue / finalSalesCount : 0,
                playsUnicosVSL: vturbMetrics.plays,
                retencaoLeadVSL: vturbMetrics.leadRetention,
                engajamentoVSL: vturbMetrics.engagement,
                retencaoPitchVSL: vturbMetrics.pitchRetention,
            }
        });

        console.log(`[Sync] Sucesso: Registro para ${dateStr} atualizado.`);
    }

    async syncRange(startStr: string, endStr: string) {
        const start = new Date(startStr);
        const end = new Date(endStr);

        // Loop por cada dia no intervalo
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDayStr = d.toISOString().split('T')[0];
            console.log(`Iniciando sync para ${currentDayStr}...`);
            await this.syncDay(currentDayStr);
        }

        console.log(`Sync de intervalo completo de ${startStr} até ${endStr}`);
    }
}
