import prisma from "./prisma";
import { MetaAdsClient } from "./meta";
import { VTurbClient } from "./vturb";

export class SyncService {
    async syncDay(dateStr: string) {
        const date = new Date(dateStr);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

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

        // 2. Buscar VTurb (Plays, Engajamento, Retenção)
        let vturbMetrics = { plays: 0, engagement: 0 };
        if (process.env.VTURB_API_KEY) {
            try {
                const vturb = new VTurbClient(process.env.VTURB_API_KEY);

                // Primeiro, listar players para pegar o ID do vídeo
                const players = await vturb.listPlayers();
                if (players && players.length > 0) {
                    const player = players[0]; // Usar o primeiro player
                    const playerId = player.id || player._id;
                    const videoDuration = player.video_duration || player.duration || 600;
                    console.log(`[Sync] VTurb: Usando player "${player.name}" (${playerId})`);

                    // Buscar eventos (plays, views)
                    const events = await vturb.getEventsByDay(playerId, dateStr, dateStr);
                    if (events) {
                        // A resposta pode variar, vamos tentar extrair os dados
                        if (Array.isArray(events)) {
                            const startedEvent = events.find((e: any) => e.event_name === 'started' || e.name === 'started');
                            vturbMetrics.plays = startedEvent?.total || startedEvent?.count || startedEvent?.unique_devices || 0;
                        } else if (events.started !== undefined) {
                            vturbMetrics.plays = events.started?.total || events.started || 0;
                        } else if (typeof events === 'object') {
                            // Tentar pegar qualquer campo numérico relevante
                            vturbMetrics.plays = events.total || events.count || events.plays || 0;
                        }
                    }

                    // Buscar engajamento/retenção
                    const engagement = await vturb.getEngagement(playerId, videoDuration, dateStr, dateStr);
                    if (engagement) {
                        vturbMetrics.engagement = engagement.engagement_rate || engagement.rate || 0;
                    }

                    console.log(`[Sync] VTurb: plays=${vturbMetrics.plays}, engajamento=${vturbMetrics.engagement}%`);
                } else {
                    console.log("[Sync] VTurb: Nenhum player encontrado na conta.");
                }
            } catch (error) {
                console.error("[Sync] Erro ao buscar VTurb:", error);
            }
        } else {
            console.log("[Sync] VTurb: API key não configurada, pulando.");
        }

        // 3. Atualizar DailyPerformance no banco
        // Nota: Vendas/Receita vêm dos webhooks da UTMify (pixel), não de API GET
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

    async syncRange(startStr: string, endStr: string) {
        const start = new Date(startStr);
        const end = new Date(endStr);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDayStr = d.toISOString().split('T')[0];
            console.log(`Iniciando sync para ${currentDayStr}...`);
            await this.syncDay(currentDayStr);
        }

        console.log(`[Sync] ✅ Sync de intervalo completo de ${startStr} até ${endStr}`);
    }
}
