import prisma from "./prisma";
import { MetaAdsClient } from "./meta";
import { VTurbClient } from "./vturb";

export class SyncService {
    async syncDay(dateStr: string, playerId?: string) {
        console.log(`[Sync] Iniciando sync para ${dateStr}...`);

        // 1. Buscar Meta Ads (gastos, cliques, impressões)
        let metaMetrics = { spend: 0, clicks: 0, impressions: 0 };
        if (process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID) {
            try {
                const meta = new MetaAdsClient(process.env.META_ACCESS_TOKEN, process.env.META_AD_ACCOUNT_ID);
                metaMetrics = await meta.getDailyMetrics(dateStr);
                console.log(`[Sync] Meta Ads: gasto=${metaMetrics.spend}, cliques=${metaMetrics.clicks}`);
            } catch (error) {
                console.error("[Sync] Erro ao buscar Meta Ads:", error);
            }
        } else {
            console.log("[Sync] Meta Ads: tokens não configurados, pulando.");
        }

        // 2. Buscar VTurb (Plays, Retenção Lead, Engajamento, Retenção Pitch)
        let vturbMetrics = {
            plays: 0,
            viewed: 0,
            finished: 0,
            retencaoLead: 0,
            engagement: 0,
            retencaoPitch: 0,
        };

        if (process.env.VTURB_API_KEY) {
            try {
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);
                let targetPlayerId = playerId;
                let videoDuration = 600;

                // Buscar lista de players para pegar a duração real do vídeo
                const players = await vturb.listPlayers();
                if (players && players.length > 0) {
                    if (!targetPlayerId) {
                        // Se não especificou player, usa o primeiro
                        targetPlayerId = players[0].id || players[0]._id;
                        videoDuration = players[0].video_duration || players[0].duration || 600;
                        console.log(`[Sync] VTurb: Usando primeiro player "${players[0].name}" (${targetPlayerId}), duração=${videoDuration}s`);
                    } else {
                        // Buscar a duração real do player selecionado
                        const selectedPlayer = players.find((p: any) => (p.id || p._id) === targetPlayerId);
                        if (selectedPlayer) {
                            videoDuration = selectedPlayer.video_duration || selectedPlayer.duration || 600;
                            console.log(`[Sync] VTurb: Player "${selectedPlayer.name}" (${targetPlayerId}), duração=${videoDuration}s`);
                        } else {
                            console.log(`[Sync] VTurb: Player selecionado (${targetPlayerId}), duração padrão=${videoDuration}s`);
                        }
                    }
                }

                if (targetPlayerId) {
                    // ===== EVENTOS (plays, viewed, finished) =====
                    const events = await vturb.getEventsByDay(targetPlayerId, dateStr, dateStr);
                    if (events && Array.isArray(events) && events.length > 0) {
                        // Formato: {"event":"started","total":35,"total_uniq_sessions":35,"total_uniq_device":35}
                        const startedEvent = events.find((e: any) => e.event === 'started');
                        const viewedEvent = events.find((e: any) => e.event === 'viewed');
                        const finishedEvent = events.find((e: any) => e.event === 'finished');

                        vturbMetrics.plays = startedEvent?.total_uniq_device || startedEvent?.total || 0;
                        vturbMetrics.viewed = viewedEvent?.total_uniq_device || viewedEvent?.total || 0;
                        vturbMetrics.finished = finishedEvent?.total_uniq_device || finishedEvent?.total || 0;

                        // Calcular retenções
                        if (vturbMetrics.plays > 0) {
                            // Retenção Lead = % que assistiu (viewed / started)
                            vturbMetrics.retencaoLead = Math.round((vturbMetrics.viewed / vturbMetrics.plays) * 100);

                            // Retenção Pitch = % que terminou (finished / started)
                            vturbMetrics.retencaoPitch = Math.round((vturbMetrics.finished / vturbMetrics.plays) * 100);
                        }

                        console.log(`[Sync] VTurb eventos: plays=${vturbMetrics.plays}, viewed=${vturbMetrics.viewed}, finished=${vturbMetrics.finished}`);
                        console.log(`[Sync] VTurb retenção: lead=${vturbMetrics.retencaoLead}%, pitch=${vturbMetrics.retencaoPitch}%`);
                    }

                    // ===== ENGAJAMENTO =====
                    const engagement = await vturb.getEngagement(targetPlayerId, videoDuration, dateStr, dateStr);
                    if (engagement && engagement.engagement_rate > 0) {
                        vturbMetrics.engagement = engagement.engagement_rate;
                        if (vturbMetrics.engagement > 0 && vturbMetrics.engagement <= 1) {
                            vturbMetrics.engagement = Math.round(vturbMetrics.engagement * 100);
                        }
                    } else if (vturbMetrics.plays > 0 && vturbMetrics.viewed > 0) {
                        // Fallback: calcular engajamento a partir dos eventos
                        vturbMetrics.engagement = Math.round((vturbMetrics.viewed / vturbMetrics.plays) * 100);
                        // Limitar a 100% max
                        if (vturbMetrics.engagement > 100) vturbMetrics.engagement = 100;
                    }
                    console.log(`[Sync] VTurb engajamento: ${vturbMetrics.engagement}%, tempo_medio=${engagement?.average_watched_time || 0}s`);
                }
            } catch (error) {
                console.error("[Sync] Erro ao buscar VTurb:", error);
            }
        } else {
            console.log("[Sync] VTurb: API key não configurada, pulando.");
        }

        // 3. Buscar dados existentes no banco (para preservar vendas de webhook)
        const existingData = await prisma.dailyPerformance.findUnique({
            where: { date: new Date(dateStr) }
        });
        const vendas = existingData?.vendas || 0;
        const receitaGerada = existingData?.receitaGerada || 0;

        // 4. Calcular Conversão VSL = (vendas / plays) * 100
        let conversaoVSL = 0;
        if (vturbMetrics.plays > 0 && vendas > 0) {
            conversaoVSL = Math.round((vendas / vturbMetrics.plays) * 100 * 100) / 100; // 2 casas decimais
        }

        // 5. Salvar no banco de dados
        console.log(`[Sync] Salvando: plays=${vturbMetrics.plays}, retLead=${vturbMetrics.retencaoLead}%, engaj=${vturbMetrics.engagement}%, retPitch=${vturbMetrics.retencaoPitch}%, convVSL=${conversaoVSL}%, gasto=${metaMetrics.spend}`);

        await prisma.dailyPerformance.upsert({
            where: { date: new Date(dateStr) },
            update: {
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                playsUnicosVSL: vturbMetrics.plays,
                retencaoLeadVSL: vturbMetrics.retencaoLead,
                engajamentoVSL: vturbMetrics.engagement,
                retencaoPitchVSL: vturbMetrics.retencaoPitch,
                conversaoVSL: conversaoVSL,
            },
            create: {
                date: new Date(dateStr),
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                playsUnicosVSL: vturbMetrics.plays,
                retencaoLeadVSL: vturbMetrics.retencaoLead,
                engajamentoVSL: vturbMetrics.engagement,
                retencaoPitchVSL: vturbMetrics.retencaoPitch,
                conversaoVSL: conversaoVSL,
            }
        });

        console.log(`[Sync] ✅ Sync completo para ${dateStr}`);
    }

    async syncRange(startStr: string, endStr: string, playerId?: string) {
        const start = new Date(startStr);
        const end = new Date(endStr);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDayStr = d.toISOString().split('T')[0];
            await this.syncDay(currentDayStr, playerId);
        }

        console.log(`[Sync] ✅ Sync de intervalo completo de ${startStr} até ${endStr}`);
    }
}
