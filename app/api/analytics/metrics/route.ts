import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { VTurbClient } from "@/lib/vturb";
import { DailyAnalytics } from "@/types/analytics";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Pegar parâmetros de filtro
        const searchParams = request.nextUrl.searchParams;
        const vslId = searchParams.get('vslId');
        const platform = searchParams.get('platform');
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = searchParams.get('endDate') || new Date().toISOString();

        console.log('Fetching metrics for:', { vslId, platform, startDate, endDate });

        // RETORNAR DADOS DE TESTE PRIMEIRO
        const testMetrics: DailyAnalytics[] = [
            {
                date: new Date(),
                vslId: 'test-vsl',
                vslName: 'VSL Teste',
                platform: platform || 'TESTE',
                valorGasto: 150.50,
                cliques: 1200,
                cpc: 0.12,
                visitas: 800,
                cpv: 0.19,
                connectRate: 66.7,
                passagem: 45.2,
                visuUnicaVSL: 650,
                cpvv: 0.23,
                iniciouCheckout: 98,
                convCheckout: 12.25,
                vendas: 12,
                aov: 97.00,
                cpa: 12.54,
                vendasOB1: 5,
                convOB1: 41.7,
                vendasOB2: 2,
                convOB2: 16.7,
                upsell1: 3,
                convUpsell1: 25.0,
                upsell2: 1,
                convUpsell2: 8.3,
                downsell: 1,
                observacoes: 'Teste de dados'
            }
        ];

        console.log('Returning test metrics:', testMetrics);

        return NextResponse.json({
            success: true,
            data: testMetrics,
            count: testMetrics.length
        });

        // CÓDIGO COMPLEXO COMENTADO PARA DEBUG
        /*
        // Buscar dados de diferentes fontes
        const metrics: DailyAnalytics[] = [];

        // 1. Buscar dados do VTurb para VSL
        if (process.env.VTURB_API_KEY) {
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

                                // Métricas de Tráfego (exemplo - precisaria integrar com Meta Ads)
                                valorGasto: performance?.valorGasto || 0,
                                cliques: performance?.cliquesLink || 0,
                                cpc: performance?.cliquesLink ? (performance.valorGasto / performance.cliquesLink) : 0,
                                visitas: performance?.visualizacaoPage || plays,
                                cpv: performance?.visualizacaoPage ? (performance.valorGasto / performance.visualizacaoPage) : 0,
                                connectRate: plays > 0 ? (viewed / plays * 100) : 0,

                                // Métricas de Engajamento
                                passagem: engagement?.retention_rate || 0,
                                visuUnicaVSL: plays,
                                cpvv: plays > 0 ? (performance?.valorGasto || 0) / plays : 0,

                                // Métricas de Checkout (precisaria de dados de checkout)
                                iniciouCheckout: Math.floor(plays * 0.15), // Estimativa 15% dos plays
                                convCheckout: totalSales > 0 ? (totalSales / Math.max(1, Math.floor(plays * 0.15))) * 100 : 0,

                                // Métricas de Vendas
                                vendas: totalSales,
                                aov: totalSales > 0 ? totalRevenue / totalSales : 0,
                                cpa: totalSales > 0 ? (performance?.valorGasto || 0) / totalSales : 0,

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

                            metrics.push(metric);
                        }
                    }
                }
            }
        }

        // 2. Se não houver dados do VTurb, buscar do banco
        if (metrics.length === 0) {
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

                    // Métricas de Tráfego
                    valorGasto: perf.valorGasto || 0,
                    cliques: perf.cliquesLink || 0,
                    cpc: perf.cliquesLink > 0 ? perf.valorGasto / perf.cliquesLink : 0,
                    visitas: perf.visualizacaoPage || 0,
                    cpv: perf.visualizacaoPage > 0 ? perf.valorGasto / perf.visualizacaoPage : 0,
                    connectRate: 0,

                    // Métricas de Engajamento
                    passagem: perf.retencaoLeadVSL || 0,
                    visuUnicaVSL: perf.playsUnicosVSL || 0,
                    cpvv: perf.playsUnicosVSL > 0 ? perf.valorGasto / perf.playsUnicosVSL : 0,

                    // Métricas de Checkout
                    iniciouCheckout: 0,
                    convCheckout: perf.conversaocheckout || 0,

                    // Métricas de Vendas
                    vendas: totalSales,
                    aov: totalSales > 0 ? totalRevenue / totalSales : perf.ticketMedio || 0,
                    cpa: perf.cpa || 0,

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
        }

        // Ordenar por data
        metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            success: true,
            data: metrics,
            count: metrics.length
        });
        */

    } catch (error) {
        console.error("Analytics Metrics API Error:", error);
        return NextResponse.json(
            { error: "Erro ao buscar métricas", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}