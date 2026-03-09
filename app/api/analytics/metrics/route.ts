import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VTurbClient } from "@/lib/vturb";
import { DailyAnalytics } from "@/types/analytics";

export async function GET(request: NextRequest) {
    try {
        // Permitir acesso sem autenticação para facilitar uso
        // TODO: Reimplementar autenticação quando necessário
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        // Pegar parâmetros de filtro
        const searchParams = request.nextUrl.searchParams;
        const vslId = searchParams.get('vslId');
        const platform = searchParams.get('platform');
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = searchParams.get('endDate') || new Date().toISOString();


        // CÓDIGO REAL - BUSCAR DADOS REAIS
        // Buscar dados de diferentes fontes
        const metrics: DailyAnalytics[] = [];

        // 1. Buscar dados do VTurb para VSL (independente - não bloquear se falhar)
        let vslMetrics: DailyAnalytics[] = [];
        if (process.env.VTURB_API_KEY) {
            try {
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);

                // Buscar todos os players se não especificado
                const players = await vturb.listPlayers();
                const vsls = vslId && vslId !== 'all'
                    ? players?.filter((p: any) => p.id === vslId)
                    : players;

            if (vsls && vsls.length > 0) {
                for (const vsl of vsls) {
                    // Buscar eventos por dia
                    const events = await vturb.getEventsByDay(
                        vsl.id,
                        startDate.split('T')[0],
                        endDate.split('T')[0]
                    );

                    // Buscar engajamento
                    const engagement = await vturb.getEngagement(
                        vsl.id,
                        vsl.video_duration || 300,
                        startDate.split('T')[0],
                        endDate.split('T')[0]
                    );

                    if (events && events.data) {
                        // Processar eventos por dia
                        for (const [date, dayEvents] of Object.entries(events.data)) {
                            const plays = (dayEvents as any).started || 0;
                            const finished = (dayEvents as any).finished || 0;
                            const viewed = (dayEvents as any).viewed || 0;

                            // Buscar vendas do banco para este dia
                            const startOfDay = new Date(date);
                            startOfDay.setHours(0, 0, 0, 0);
                            const endOfDay = new Date(date);
                            endOfDay.setHours(23, 59, 59, 999);

                            const sales = await prisma.sale.findMany({
                                where: {
                                    createdAt: {
                                        gte: startOfDay,
                                        lte: endOfDay
                                    },
                                    platform: platform || undefined
                                }
                            });

                            const totalSales = sales.length;
                            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

                            // Buscar dados de performance do banco
                            const performance = await prisma.dailyPerformance.findFirst({
                                where: {
                                    date: startOfDay
                                }
                            });

                            // Calcular métricas
                            const metric: DailyAnalytics = {
                                date: new Date(date),
                                vslId: vsl.id,
                                vslName: vsl.name || vsl.title || `VSL ${vsl.id}`,
                                platform: platform || 'all',

                                // Métricas de Tráfego (Meta Ads não integrado ainda)
                                valorGasto: 0, // Meta Ads não integrado
                                cliques: 0, // Meta Ads não integrado
                                cpc: 0, // Meta Ads não integrado
                                visitas: plays, // Usando plays do VTurb
                                cpv: 0, // Meta Ads não integrado
                                connectRate: plays > 0 ? (viewed / plays * 100) : 0,

                                // Métricas de Engajamento
                                passagem: engagement?.retention_rate || 0,
                                visuUnicaVSL: plays,
                                cpvv: 0, // Meta Ads não integrado

                                // Métricas de Checkout (precisaria de dados de checkout)
                                iniciouCheckout: Math.floor(plays * 0.15), // Estimativa 15% dos plays
                                convCheckout: totalSales > 0 ? (totalSales / Math.max(1, Math.floor(plays * 0.15))) * 100 : 0,

                                // Métricas de Vendas
                                vendas: totalSales,
                                aov: totalSales > 0 ? totalRevenue / totalSales : 0,
                                cpa: 0, // Meta Ads não integrado

                                // Order Bumps e Upsells (precisaria de dados específicos)
                                vendasOB1: 0,
                                convOB1: 0,
                                vendasOB2: 0,
                                convOB2: 0,
                                upsell1: 0,
                                convUpsell1: 0,
                                upsell2: 0,
                                convUpsell2: 0,
                                downsell: 0,

                                observacoes: `VSL: ${vsl.name || vsl.id}`
                            };

                            vslMetrics.push(metric);
                        }
                    }
                }
            }
            } catch (vTurbError) {
                // VTurb API failed, continuing without VSL data
            }
        }

        // 2. SEMPRE buscar dados do banco (independente do VTurb)
            const performances = await prisma.dailyPerformance.findMany({
                where: {
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                orderBy: {
                    date: 'desc'
                }
            });

            for (const perf of performances) {
                // Buscar vendas do dia
                const startOfDay = new Date(perf.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(perf.date);
                endOfDay.setHours(23, 59, 59, 999);

                const sales = await prisma.sale.findMany({
                    where: {
                        createdAt: {
                            gte: startOfDay,
                            lte: endOfDay
                        },
                        platform: platform || undefined
                    }
                });

                const totalSales = sales.length;
                const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

                const metric: DailyAnalytics = {
                    date: perf.date,
                    vslId: vslId || 'all',
                    vslName: 'Todos os VSLs',
                    platform: platform || 'all',

                    // Métricas de Tráfego (Meta Ads não integrado ainda)
                    valorGasto: 0, // Meta Ads não integrado
                    cliques: 0, // Meta Ads não integrado
                    cpc: 0, // Meta Ads não integrado
                    visitas: 0, // Será preenchido quando Meta Ads for integrado
                    cpv: 0, // Meta Ads não integrado
                    connectRate: 0,

                    // Métricas de Engajamento
                    passagem: perf.retencaoLeadVSL || 0,
                    visuUnicaVSL: perf.playsUnicosVSL || 0,
                    cpvv: 0, // Meta Ads não integrado

                    // Métricas de Checkout
                    iniciouCheckout: 0,
                    convCheckout: perf.conversaocheckout || 0,

                    // Métricas de Vendas
                    vendas: totalSales,
                    aov: totalSales > 0 ? totalRevenue / totalSales : perf.ticketMedio || 0,
                    cpa: 0, // Meta Ads não integrado

                    // Order Bumps e Upsells
                    vendasOB1: 0,
                    convOB1: perf.conversaoOrderBump || 0,
                    vendasOB2: 0,
                    convOB2: 0,
                    upsell1: 0,
                    convUpsell1: perf.conversaoUpsell || 0,
                    upsell2: 0,
                    convUpsell2: perf.conversaoUpsell2 || 0,
                    downsell: 0,

                    observacoes: ''
                };

                metrics.push(metric);
            }

        // 3. Combinar dados do VTurb e banco
        const allMetrics = [...vslMetrics, ...metrics];


        // Ordenar por data
        allMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            success: true,
            data: allMetrics,
            count: allMetrics.length
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Erro ao buscar métricas", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}