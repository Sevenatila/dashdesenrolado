import { NextRequest, NextResponse } from "next/server";
import { VTurbClient } from "@/lib/vturb";
import { DailyAnalytics } from "@/types/analytics";

export async function GET(request: NextRequest) {
    try {
        console.log('[DEBUG VTurb] Iniciando debug da integração...');

        const startDate = "2026-03-09";
        const endDate = "2026-03-09";

        if (!process.env.VTURB_API_KEY) {
            return NextResponse.json({
                success: false,
                error: "VTURB_API_KEY não configurada"
            });
        }

        const vturb = new VTurbClient(process.env.VTURB_API_KEY);
        let logs: string[] = [];
        let vslMetrics: DailyAnalytics[] = [];

        try {
            logs.push('[DEBUG] Iniciando busca de players...');
            const playersPromise = vturb.listPlayers();
            const players = await Promise.race([
                playersPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao buscar players')), 15000))
            ]) as any[];

            logs.push(`[DEBUG] Players encontrados: ${players?.length || 0}`);

            if (players && players.length > 0) {
                // Buscar VSL específica
                const targetPlayer = players.find(p => p.id === "69921cdd92e29505e061e647");

                if (!targetPlayer) {
                    logs.push('[DEBUG] VSL específica 69921cdd92e29505e061e647 NÃO encontrada');
                    logs.push(`[DEBUG] IDs disponíveis: ${players.slice(0, 5).map(p => p.id).join(', ')}`);
                } else {
                    logs.push(`[DEBUG] VSL específica encontrada: ${targetPlayer.name}`);

                    try {
                        logs.push('[DEBUG] Iniciando busca de estatísticas...');
                        const sessionStats = await Promise.race([
                            vturb.getSessionStats(targetPlayer.id, startDate, endDate),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout estatísticas')), 15000))
                        ]) as any;

                        logs.push(`[DEBUG] Resposta recebida: ${JSON.stringify(sessionStats).substring(0, 200)}`);

                        if (sessionStats && sessionStats.total_viewed !== undefined) {
                            const totalViews = sessionStats.total_viewed || 0;
                            const totalViewsUnique = sessionStats.total_viewed_device_uniq || 0; // Views Únicos VSL
                            const totalStarts = sessionStats.total_started || 0;
                            const totalStartsUnique = sessionStats.total_started_device_uniq || 0; // Plays Únicos VSL
                            const totalFinished = sessionStats.total_finished || 0;
                            const conversions = sessionStats.total_conversions || 0;
                            const totalRevenue = sessionStats.total_amount_brl || 0;

                            logs.push(`[DEBUG] Dados processados: Views=${totalViews}, ViewsUniq=${totalViewsUnique}, Starts=${totalStarts}, StartsUniq=${totalStartsUnique}, Finished=${totalFinished}, Conv=${conversions}, Rev=R$${totalRevenue}`);

                            const vturbMetric: DailyAnalytics = {
                                date: new Date(endDate + 'T00:00:00'),
                                vslId: targetPlayer.id,
                                vslName: targetPlayer.name || 'VSL VTurb',
                                platform: 'vturb',

                                valorGasto: 0,
                                cliques: 0,
                                cpc: 0,
                                visitas: totalViews,
                                cpv: 0,
                                connectRate: totalViewsUnique > 0 && totalStartsUnique > 0 ? (totalStartsUnique / totalViewsUnique) * 100 : 0,

                                passagem: totalStartsUnique > 0 && totalFinished > 0 ? (totalFinished / totalStartsUnique) * 100 : 0,
                                visuUnicaVSL: totalStartsUnique, // Plays Únicos VSL (corrigido)
                                viewsUnicosVSL: totalViewsUnique, // Views Únicos VSL (novo campo)
                                cpvv: 0,

                                iniciouCheckout: 0,
                                convCheckout: totalFinished > 0 && conversions > 0 ? (conversions / totalFinished) * 100 : 0,

                                vendas: conversions,
                                aov: conversions > 0 ? totalRevenue / conversions : 0,
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

                                observacoes: `VTurb Debug - Views: ${totalViews}, Views Únicos: ${totalViewsUnique}, Starts: ${totalStarts}, Starts Únicos: ${totalStartsUnique}, Finished: ${totalFinished}, Conversões: ${conversions}, Revenue: R$ ${totalRevenue}`
                            };

                            vslMetrics.push(vturbMetric);
                            logs.push('[DEBUG] Métrica VTurb criada com sucesso!');
                        } else {
                            logs.push('[DEBUG] Dados não encontrados na resposta');
                        }
                    } catch (statsError) {
                        logs.push(`[DEBUG] Erro ao buscar estatísticas: ${statsError instanceof Error ? statsError.message : 'Erro desconhecido'}`);
                    }
                }
            } else {
                logs.push('[DEBUG] Nenhum player encontrado');
            }

        } catch (vTurbError) {
            logs.push(`[DEBUG] Erro na integração VTurb: ${vTurbError instanceof Error ? vTurbError.message : 'Erro desconhecido'}`);
        }

        return NextResponse.json({
            success: true,
            debug: {
                logs,
                metricsFound: vslMetrics.length,
                metrics: vslMetrics,
                apiKeyConfigured: !!process.env.VTURB_API_KEY,
                environment: {
                    startDate,
                    endDate
                }
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Erro no debug VTurb",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}