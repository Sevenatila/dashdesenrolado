import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VTurbClient } from "@/lib/vturb";
import { DailyAnalytics } from "@/types/analytics";

export async function GET(request: NextRequest) {
    try {
        // Pegar parâmetros de filtro
        const searchParams = request.nextUrl.searchParams;
        const vslId = searchParams.get('vslId');
        const platform = searchParams.get('platform');
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = searchParams.get('endDate') || new Date().toISOString();

        console.log('TEST ROUTE - Fetching metrics for:', { vslId, platform, startDate, endDate });

        // CÓDIGO REAL - BUSCAR DADOS REAIS
        const metrics: DailyAnalytics[] = [];

        // 1. Buscar dados do VTurb para VSL
        if (process.env.VTURB_API_KEY) {
            const vturb = new VTurbClient(process.env.VTURB_API_KEY);

            // Buscar todos os players se não especificado
            const players = await vturb.listPlayers();
            console.log('VTurb Players found:', players?.length || 0);

            const vsls = vslId && vslId !== 'all'
                ? players?.filter((p: any) => p.id === vslId)
                : players?.slice(0, 1); // Pegar apenas o primeiro para teste

            if (vsls && vsls.length > 0) {
                for (const vsl of vsls) {
                    console.log('Processing VSL:', vsl.id, vsl.name);

                    // Buscar eventos por dia
                    const events = await vturb.getEventsByDay(
                        vsl.id,
                        startDate.split('T')[0],
                        endDate.split('T')[0]
                    );

                    console.log('Events received:', events?.data ? Object.keys(events.data).length : 0, 'days');

                    // Buscar engajamento
                    const engagement = await vturb.getEngagement(
                        vsl.id,
                        vsl.video_duration || 300,
                        startDate.split('T')[0],
                        endDate.split('T')[0]
                    );

                    console.log('Engagement data:', engagement?.retention_rate);

                    if (events && events.data) {
                        // Processar eventos por dia
                        for (const [date, dayEvents] of Object.entries(events.data)) {
                            const plays = (dayEvents as any).started || 0;
                            const finished = (dayEvents as any).finished || 0;
                            const viewed = (dayEvents as any).viewed || 0;

                            console.log(`Date ${date}: plays=${plays}, finished=${finished}, viewed=${viewed}`);

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

                            console.log(`Sales for ${date}:`, sales.length);

                            const totalSales = sales.length;
                            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

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

                            metrics.push(metric);
                        }
                    }
                }
            }
        }

        // 2. Se não houver dados do VTurb, buscar vendas direto do banco
        if (metrics.length === 0) {
            console.log('No VTurb data, fetching sales directly from database');

            // Agrupar vendas por dia
            const startOfPeriod = new Date(startDate);
            const endOfPeriod = new Date(endDate);

            const sales = await prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: startOfPeriod,
                        lte: endOfPeriod
                    },
                    platform: platform || undefined
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            console.log('Total sales found:', sales.length);

            // Agrupar por dia
            const salesByDay: { [key: string]: typeof sales } = {};
            sales.forEach(sale => {
                const dateKey = sale.createdAt.toISOString().split('T')[0];
                if (!salesByDay[dateKey]) {
                    salesByDay[dateKey] = [];
                }
                salesByDay[dateKey].push(sale);
            });

            // Criar métricas por dia
            for (const [date, daySales] of Object.entries(salesByDay)) {
                const totalSales = daySales.length;
                const totalRevenue = daySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

                const metric: DailyAnalytics = {
                    date: new Date(date),
                    vslId: 'all',
                    vslName: 'Todos os VSLs',
                    platform: platform || 'all',

                    // Métricas básicas com vendas reais
                    valorGasto: 0,
                    cliques: 0,
                    cpc: 0,
                    visitas: 0,
                    cpv: 0,
                    connectRate: 0,
                    passagem: 0,
                    visuUnicaVSL: 0,
                    cpvv: 0,
                    iniciouCheckout: totalSales * 2, // Estimativa
                    convCheckout: 50, // Estimativa
                    vendas: totalSales,
                    aov: totalSales > 0 ? totalRevenue / totalSales : 0,
                    cpa: 0,
                    vendasOB1: 0,
                    convOB1: 0,
                    vendasOB2: 0,
                    convOB2: 0,
                    upsell1: 0,
                    convUpsell1: 0,
                    upsell2: 0,
                    convUpsell2: 0,
                    downsell: 0,
                    observacoes: 'Dados de vendas reais do banco'
                };

                metrics.push(metric);
            }
        }

        // Ordenar por data
        metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('Total metrics to return:', metrics.length);

        return NextResponse.json({
            success: true,
            data: metrics,
            count: metrics.length,
            source: metrics.length > 0 ? (metrics[0].visitas > 0 ? 'VTurb + Sales' : 'Sales Only') : 'No data'
        });

    } catch (error) {
        console.error("Test Metrics API Error:", error);
        return NextResponse.json(
            { error: "Erro ao buscar métricas", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}