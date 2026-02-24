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

        // 2. Buscar VTurb (Plays, Engajamento)
        let vturbMetrics = { plays: 0, engagement: 0 };
        if (process.env.VTURB_API_KEY) {
            try {
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);
                let targetPlayerId = playerId;
                let videoDuration = 600;

                if (!targetPlayerId) {
                    // Se não especificou player, usa o primeiro
                    const players = await vturb.listPlayers();
                    if (players && players.length > 0) {
                        targetPlayerId = players[0].id || players[0]._id;
                        videoDuration = players[0].video_duration || players[0].duration || 600;
                        console.log(`[Sync] VTurb: Usando primeiro player "${players[0].name}" (${targetPlayerId})`);
                    }
                } else {
                    console.log(`[Sync] VTurb: Usando player selecionado (${targetPlayerId})`);
                }

                if (targetPlayerId) {
                    // Buscar eventos (plays, views)
                    const events = await vturb.getEventsByDay(targetPlayerId, dateStr, dateStr);
                    if (events && Array.isArray(events) && events.length > 0) {
                        // Formato real da VTurb: {"event":"started","total":35,"total_uniq_sessions":35,"total_uniq_device":35}
                        const startedEvent = events.find((e: any) => e.event === 'started');
                        if (startedEvent) {
                            vturbMetrics.plays = startedEvent.total_uniq_device || startedEvent.total || 0;
                        }
                        console.log(`[Sync] VTurb parsed: started=${JSON.stringify(startedEvent)}`);
                    }

                    // Buscar engajamento
                    const engagement = await vturb.getEngagement(targetPlayerId, videoDuration, dateStr, dateStr);
                    if (engagement) {
                        vturbMetrics.engagement = engagement.engagement_rate || engagement.rate || 0;
                    }

                    console.log(`[Sync] VTurb: plays=${vturbMetrics.plays}, engajamento=${vturbMetrics.engagement}%`);
                }
            } catch (error) {
                console.error("[Sync] Erro ao buscar VTurb:", error);
            }
        } else {
            console.log("[Sync] VTurb: API key não configurada, pulando.");
        }

        // 3. Salvar no banco de dados
        console.log(`[Sync] Salvando no banco: cliques=${metaMetrics.clicks}, plays=${vturbMetrics.plays}, gasto=${metaMetrics.spend}`);

        await prisma.dailyPerformance.upsert({
            where: { date: new Date(dateStr) },
            update: {
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                playsUnicosVSL: vturbMetrics.plays,
                engajamentoVSL: vturbMetrics.engagement,
            },
            create: {
                date: new Date(dateStr),
                valorGasto: metaMetrics.spend,
                cliquesLink: metaMetrics.clicks,
                playsUnicosVSL: vturbMetrics.plays,
                engajamentoVSL: vturbMetrics.engagement,
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
