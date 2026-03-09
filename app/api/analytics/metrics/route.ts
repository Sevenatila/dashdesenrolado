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

        // 1. Buscar dados do VTurb para VSL (com timeout rápido e fallback)
        let vslMetrics: DailyAnalytics[] = [];
        if (process.env.VTURB_API_KEY) {
            try {
                console.log('[DEBUG] Tentando integração VTurb com timeout curto...');
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);

                // Buscar apenas os players primeiro (timeout rápido)
                const playersPromise = vturb.listPlayers();
                const players = await Promise.race([
                    playersPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 5s')), 5000))
                ]) as any[];

                console.log('[DEBUG] Players encontrados:', players?.length || 0);

                if (players && players.length > 0) {
                    // Se conseguiu buscar players, continua mas só com o primeiro player para teste
                    const testPlayer = players[0];
                    console.log('[DEBUG] Testando com player:', testPlayer.id);

                    const eventsPromise = vturb.getEventsByDay(
                        testPlayer.id,
                        startDate.split('T')[0],
                        endDate.split('T')[0]
                    );

                    const events = await Promise.race([
                        eventsPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout eventos')), 5000))
                    ]) as any;

                    if (events && events.data) {
                        console.log('[DEBUG] Eventos recebidos para teste');
                        // Processar apenas um dia para teste
                        const dateEntries = Object.entries(events.data);
                        if (dateEntries.length > 0) {
                            const [date, dayEvents] = dateEntries[0];
                            const plays = (dayEvents as any).started || 0;
                            console.log('[DEBUG] Plays encontrados:', plays);
                        }
                    }
                }
            } catch (vTurbError) {
                console.error('[DEBUG] VTurb falhou (esperado):', vTurbError.message);
                // Continua sem VTurb - não trava
            }
        } else {
            console.log('[DEBUG] VTURB_API_KEY não encontrada');
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