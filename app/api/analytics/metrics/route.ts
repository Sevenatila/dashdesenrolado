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
        const startDateParam = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDateParam = searchParams.get('endDate') || new Date().toISOString();

        // ✅ CORREÇÃO: Usar timezone UTC-8 (mesmo da Hubla) para contar vendas
        // Descoberto que Hubla usa timezone EUA West para contar vendas diárias
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);

        // Ajustar para timezone UTC-8 (igual à Hubla)
        // Se recebemos 2026-03-10, queremos 2026-03-10T08:00:00.000Z até 2026-03-11T07:59:59.999Z
        const hublaStartDate = new Date(startDate.toISOString().split('T')[0] + 'T08:00:00.000Z');
        const hublaEndDate = new Date(endDate.toISOString().split('T')[0] + 'T07:59:59.999Z');
        hublaEndDate.setDate(hublaEndDate.getDate() + 1); // Próximo dia

        console.log(`[Timezone] Original: ${startDateParam} to ${endDateParam}`);
        console.log(`[Timezone] Hubla UTC-8: ${hublaStartDate.toISOString()} to ${hublaEndDate.toISOString()}`);


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
                    // Se tiver filtro de VSL específica, processar apenas ela
                    let playersToProcess = players;

                    if (vslId && vslId !== 'all') {
                        const specificPlayer = players.find(p => p.id === vslId);
                        playersToProcess = specificPlayer ? [specificPlayer] : [];
                    } else {
                        // Processar mais VSLs para capturar dados, mas com limite para evitar timeout
                        // Aumentado para 20 VSLs para capturar mais dados da VTurb
                        playersToProcess = players.slice(0, 20);
                    }

                    console.log(`[VTurb] Processando ${playersToProcess.length} players`);

                    for (const player of playersToProcess) {
                        console.log(`[VTurb] Buscando eventos do player: ${player.id} - ${player.name}`);

                        try {
                            const eventsPromise = vturb.getSessionStats(
                                player.id,
                                startDateParam.split('T')[0], // Usar data original para VTurb
                                endDateParam.split('T')[0]   // VTurb não tem problema de timezone
                            );

                            const sessionStats = await Promise.race([
                                eventsPromise,
                                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout eventos')), 8000))
                            ]) as any;

                            if (sessionStats && sessionStats.total_viewed !== undefined) {
                                console.log(`[VTurb] Processando estatísticas de sessão do player ${player.name}`);

                                // A API /sessions/stats retorna dados agregados diretos (não tem .data)
                                const totalViews = sessionStats.total_viewed || 0;  // Total de views (não único)
                                const totalViewsUnique = sessionStats.total_viewed_device_uniq || 0; // Views únicos por dispositivo (VSL)
                                const totalStarts = sessionStats.total_started || 0;
                                const totalStartsUnique = sessionStats.total_started_device_uniq || 0; // Starts únicos por dispositivo (VSL)
                                const totalFinished = sessionStats.total_finished || 0;
                                const conversions = sessionStats.total_conversions || 0;
                                const totalRevenue = sessionStats.total_amount_brl || 0;

                                // Criar uma métrica única para todo o período
                                const dateRange = `${startDateParam.split('T')[0]} a ${endDateParam.split('T')[0]}`;

                                console.log(`[VTurb] Player ${player.name} - Views: ${totalViews}, Views Únicas: ${totalViewsUnique}, Starts: ${totalStarts}, Starts Únicos: ${totalStartsUnique}, Finished: ${totalFinished}, Conversões: ${conversions}, Revenue: R$ ${totalRevenue}`);

                                const vturbMetric: DailyAnalytics = {
                                    date: new Date(endDateParam.split('T')[0] + 'T00:00:00'),
                                    vslId: player.id,
                                    vslName: player.name || 'VSL VTurb',
                                    platform: 'vturb',

                                    // Métricas de Tráfego (Facebook/Meta Ads)
                                    valorGasto: 0,
                                    cliques: 0,
                                    cpc: 0,
                                    visitas: 0, // Visualizações de PÁGINA (Facebook) - não é do VTurb
                                    cpv: 0,
                                    connectRate: totalViewsUnique > 0 && totalStartsUnique > 0 ? (totalStartsUnique / totalViewsUnique) * 100 : 0,

                                    // Métricas de Engajamento VSL (VTurb)
                                    passagem: totalStartsUnique > 0 && totalFinished > 0 ? (totalFinished / totalStartsUnique) * 100 : 0,
                                    visuUnicaVSL: totalStartsUnique, // Plays ÚNICOS da VSL (VTurb)
                                    cpvv: 0, // Custo por view da VSL (quando tiver Facebook integrado)

                                    // Nova métrica: Views únicos da VSL (diferente de visualizações de página)
                                    viewsUnicosVSL: totalViewsUnique, // Views únicos da VSL (VTurb)

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

                                    observacoes: `VTurb (${dateRange}) - Views Únicas: ${totalViewsUnique}, Plays Únicos: ${totalStartsUnique}, Finished: ${totalFinished}, Conversões: ${conversions}, Revenue: R$ ${totalRevenue}`
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

        // 2. SEMPRE buscar vendas diretamente do banco (usando timezone Hubla UTC-8)
            // Corrigir case-sensitivity do filtro de plataforma
            // Se platform é 'all' ou null/undefined, não filtrar (buscar todas)
            const platformFilter = (platform && platform !== 'all') ? platform.toUpperCase() : undefined;

            const sales = await prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: hublaStartDate,  // Data ajustada para timezone Hubla UTC-8
                        lte: hublaEndDate     // Data ajustada para timezone Hubla UTC-8
                    },
                    platform: platformFilter
                },
                include: {
                    items: true  // Incluir order bumps/upsells
                }
            });

            console.log(`[Sales] Filtro plataforma: '${platformFilter}' | Encontradas ${sales.length} vendas no período Hubla de ${hublaStartDate.toISOString()} a ${hublaEndDate.toISOString()}`);

            // Agrupar vendas por data para criar métricas agregadas
            const salesByDate = new Map<string, typeof sales>();

            for (const sale of sales) {
                const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
                if (!salesByDate.has(dateKey)) {
                    salesByDate.set(dateKey, []);
                }
                salesByDate.get(dateKey)?.push(sale);
            }

            // Se não houver vendas, criar uma métrica vazia para o período
            if (sales.length === 0) {
                const emptyMetric: DailyAnalytics = {
                    date: new Date(endDateParam.split('T')[0] + 'T00:00:00'),
                    vslId: vslId || 'all',
                    vslName: 'Todos os VSLs',
                    platform: platformFilter ? platformFilter.toLowerCase() : 'all',
                    valorGasto: 0,
                    cliques: 0,
                    cpc: 0,
                    visitas: 0,
                    cpv: 0,
                    connectRate: 0,
                    passagem: 0,
                    visuUnicaVSL: 0,
                    cpvv: 0,
                    iniciouCheckout: 0,
                    convCheckout: 0,
                    vendas: 0,
                    aov: 0,
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
                    observacoes: 'Sem vendas no período'
                };
                metrics.push(emptyMetric);
            } else {
                // ✅ CORREÇÃO: Separar vendas principais de order bumps
                const mainSales = sales.filter(sale => !sale.externalId.includes('-offer-'));
                const orderBumpSales = sales.filter(sale => sale.externalId.includes('-offer-'));

                console.log(`[Sales] Total records: ${sales.length}, Main sales: ${mainSales.length}, Order bumps as Sales: ${orderBumpSales.length}`);

                // Calcular métricas apenas das vendas principais
                const totalSales = mainSales.length;
                const totalRevenue = mainSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);

                // Order bumps via SaleItem (método correto)
                const totalOrderBumps = sales.reduce((sum, sale) =>
                    sum + sale.items.filter(item => item.type === 'ORDER_BUMP').length, 0);
                const totalUpsells = sales.reduce((sum, sale) =>
                    sum + sale.items.filter(item => item.type === 'UPSELL').length, 0);

                const metric: DailyAnalytics = {
                    date: new Date(endDateParam.split('T')[0] + 'T00:00:00'),
                    vslId: vslId || 'all',
                    vslName: 'Todos os VSLs',
                    platform: platformFilter ? platformFilter.toLowerCase() : 'all',

                    // Métricas de Tráfego (Meta Ads não integrado ainda)
                    valorGasto: 0, // Meta Ads não integrado
                    cliques: 0, // Meta Ads não integrado
                    cpc: 0, // Meta Ads não integrado
                    visitas: 0, // Será preenchido quando Meta Ads for integrado
                    cpv: 0, // Meta Ads não integrado
                    connectRate: 0,

                    // Métricas de Engajamento
                    passagem: 0,
                    visuUnicaVSL: 0,
                    cpvv: 0, // Meta Ads não integrado

                    // Métricas de Checkout
                    iniciouCheckout: 0,
                    convCheckout: 0,

                    // Métricas de Vendas
                    vendas: totalSales,
                    aov: totalSales > 0 ? totalRevenue / totalSales : 0,
                    cpa: 0, // Meta Ads não integrado

                    // Order Bumps e Upsells
                    vendasOB1: totalOrderBumps,
                    convOB1: totalSales > 0 ? (totalOrderBumps / totalSales) * 100 : 0,
                    vendasOB2: 0,
                    convOB2: 0,
                    upsell1: totalUpsells,
                    convUpsell1: totalSales > 0 ? (totalUpsells / totalSales) * 100 : 0,
                    upsell2: 0,
                    convUpsell2: 0,
                    downsell: 0,

                    observacoes: `${totalSales} vendas principais (${orderBumpSales.length} order bumps como Sales + ${totalOrderBumps} como SaleItem)`
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