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
                    // Processar apenas os primeiros 5 players para evitar timeout
                    console.log(`[VTurb] Processando apenas os primeiros 5 players de ${players.length} disponíveis para evitar timeout`);
                    const playersToProcess = players.slice(0, 5);

                    for (const player of playersToProcess) {
                        console.log(`[VTurb] Buscando eventos do player: ${player.id} - ${player.name}`);

                        try {
                            const eventsPromise = vturb.getSessionStats(
                                player.id,
                                startDate.split('T')[0],
                                endDate.split('T')[0]
                            );

                            const sessionStats = await Promise.race([
                                eventsPromise,
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout eventos')), 30000))
                            ]) as any;

                            if (sessionStats && sessionStats.data) {
                                console.log(`[VTurb] Processando estatísticas de sessão do player ${player.name}`);

                                // A API /sessions/stats retorna dados agregados diretos
                                const totalViews = sessionStats.data.total_viewed || 0;
                                const totalStarts = sessionStats.data.total_started || 0;
                                const totalFinished = sessionStats.data.total_finished || 0;
                                const conversions = sessionStats.data.total_conversions || 0;
                                const totalRevenue = sessionStats.data.total_amount_brl || 0;

                                // Criar uma métrica única para todo o período
                                const dateRange = `${startDate.split('T')[0]} a ${endDate.split('T')[0]}`;

                                console.log(`[VTurb] Player ${player.name} - Views: ${totalViews}, Starts: ${totalStarts}, Finished: ${totalFinished}, Conversões: ${conversions}, Revenue: R$ ${totalRevenue}`);

                                const vturbMetric: DailyAnalytics = {
                                    date: new Date(endDate.split('T')[0] + 'T00:00:00'),
                                    vslId: player.id,
                                    vslName: player.name || 'VSL VTurb',
                                    platform: 'vturb',

                                    // Métricas de Tráfego
                                    valorGasto: 0,
                                    cliques: 0,
                                    cpc: 0,
                                    visitas: totalViews, // Views totais do VTurb
                                    cpv: 0,
                                    connectRate: totalViews > 0 && totalStarts > 0 ? (totalStarts / totalViews) * 100 : 0,

                                    // Métricas de Engajamento
                                    passagem: totalStarts > 0 && totalFinished > 0 ? (totalFinished / totalStarts) * 100 : 0,
                                    visuUnicaVSL: totalStarts, // Plays únicos
                                    cpvv: 0,

                                    // Métricas de Checkout
                                    iniciouCheckout: 0,
                                    convCheckout: totalFinished > 0 && conversions > 0 ? (conversions / totalFinished) * 100 : 0,

                                    // Métricas de Vendas
                                    vendas: conversions,
                                    aov: conversions > 0 ? totalRevenue / conversions : 0,
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

                                    observacoes: `VTurb (${dateRange}) - Views: ${totalViews}, Starts: ${totalStarts}, Finished: ${totalFinished}, Conversões: ${conversions}, Revenue: R$ ${totalRevenue}`
                                };

                                vslMetrics.push(vturbMetric);
                            }
                        } catch (playerError) {
                            console.error(`[VTurb] Erro ao processar player ${player.id}:`, playerError instanceof Error ? playerError.message : 'Erro desconhecido');
                            // Continua com próximo player
                        }
                    }

                    console.log(`[VTurb] Total de métricas coletadas: ${vslMetrics.length}`);
                }
            } catch (vTurbError) {
                console.error('[VTurb] Erro na integração:', vTurbError instanceof Error ? vTurbError.message : 'Erro desconhecido');
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