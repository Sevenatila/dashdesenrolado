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

        // 1. Buscar dados do VTurb para VSL
        let vslMetrics: DailyAnalytics[] = [];
        if (process.env.VTURB_API_KEY) {
            try {
                console.log('[VTurb] Iniciando integração com API do VTurb...');
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);

                // Buscar todos os players com timeout adequado
                const playersPromise = vturb.listPlayers();
                const players = await Promise.race([
                    playersPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao buscar players')), 30000))
                ]) as any[];

                console.log('[VTurb] Players encontrados:', players?.length || 0);

                if (players && players.length > 0) {
                    // Processar eventos de todos os players
                    for (const player of players) {
                        console.log(`[VTurb] Buscando eventos do player: ${player.id} - ${player.name}`);

                        try {
                            const eventsPromise = vturb.getEventsByDay(
                                player.id,
                                startDate.split('T')[0],
                                endDate.split('T')[0]
                            );

                            const events = await Promise.race([
                                eventsPromise,
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout eventos')), 30000))
                            ]) as any;

                            if (events && events.data) {
                                console.log(`[VTurb] Processando eventos do player ${player.name}`);

                                // Processar eventos por dia
                                for (const [date, dayEvents] of Object.entries(events.data)) {
                                    const plays = (dayEvents as any).started || 0;
                                    const views = (dayEvents as any).viewed || 0;
                                    const finished = (dayEvents as any).finished || 0;

                                    // Criar métrica para este dia e player
                                    const vturbMetric: DailyAnalytics = {
                                        date: new Date(date + 'T00:00:00'),
                                        vslId: player.id,
                                        vslName: player.name || 'VSL VTurb',
                                        platform: 'vturb',

                                        // Métricas de Tráfego (Meta Ads será integrado separadamente)
                                        valorGasto: 0,
                                        cliques: 0,
                                        cpc: 0,
                                        visitas: views, // Views do VTurb
                                        cpv: 0,
                                        connectRate: 0,

                                        // Métricas de Engajamento
                                        passagem: finished > 0 && plays > 0 ? (finished / plays) * 100 : 0,
                                        visuUnicaVSL: plays, // Plays únicos
                                        cpvv: 0,

                                        // Métricas de Checkout (serão preenchidas com dados de vendas)
                                        iniciouCheckout: 0,
                                        convCheckout: 0,

                                        // Métricas de Vendas (serão combinadas com dados do banco)
                                        vendas: 0,
                                        aov: 0,
                                        cpa: 0,

                                        // Order Bumps e Upsells
                                        vendasOB1: 0,
                                        convOB1: 0,
                                        vendasOB2: 0,
                                        convOB2: 0,
                                        upsell1: 0,
                                        convUpsell1: 0,
                                        upsell2: 0,
                                        convUpsell2: 0,
                                        downsell: 0,

                                        observacoes: `Dados do VTurb - Plays: ${plays}, Views: ${views}, Finished: ${finished}`
                                    };

                                    vslMetrics.push(vturbMetric);
                                }
                            }
                        } catch (playerError) {
                            console.error(`[VTurb] Erro ao processar player ${player.id}:`, playerError.message);
                            // Continua com próximo player
                        }
                    }

                    console.log(`[VTurb] Total de métricas coletadas: ${vslMetrics.length}`);
                }
            } catch (vTurbError) {
                console.error('[VTurb] Erro na integração:', vTurbError.message);
                // Continua sem VTurb - não trava o dashboard
            }
        } else {
            console.log('[VTurb] VTURB_API_KEY não configurada no ambiente');
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