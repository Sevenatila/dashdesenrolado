export class VTurbClient {
    private apiKey: string;
    private baseUrl = "https://analytics.vturb.net";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private getHeaders() {
        return {
            'X-Api-Token': this.apiKey,
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json'
        };
    }

    // Lista todos os players (vídeos) da conta
    async listPlayers() {
        try {
            console.log("[VTurb] Listando players...");
            const response = await fetch(`${this.baseUrl}/players/list`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.error(`[VTurb] Erro ao listar players: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            console.log(`[VTurb] Encontrados ${data?.length || 0} players.`);
            return data;
        } catch (error) {
            console.error("[VTurb] Erro na requisição listPlayers:", error);
            return null;
        }
    }

    // Busca eventos (plays, views, finished) por dia para um player
    async getEventsByDay(playerId: string, startDate: string, endDate: string) {
        try {
            console.log(`[VTurb] Buscando eventos para player ${playerId} de ${startDate} a ${endDate}...`);
            const response = await fetch(`${this.baseUrl}/events/total_by_company`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    player_id: playerId,
                    events: ['started', 'finished', 'viewed'],
                    start_date: startDate,
                    end_date: endDate,
                    timezone: 'America/Sao_Paulo'
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[VTurb] Erro nos eventos: ${response.status} - ${errorBody}`);
                return null;
            }

            const data = await response.json();
            console.log(`[VTurb] Eventos recebidos:`, JSON.stringify(data).substring(0, 200));
            return data;
        } catch (error) {
            console.error("[VTurb] Erro na requisição getEventsByDay:", error);
            return null;
        }
    }

    // Busca engajamento/retenção de um player
    async getEngagement(playerId: string, videoDuration: number, startDate: string, endDate: string) {
        try {
            console.log(`[VTurb] Buscando engajamento para player ${playerId}...`);
            const response = await fetch(`${this.baseUrl}/times/user_engagement`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    player_id: playerId,
                    video_duration: videoDuration,
                    start_date: startDate,
                    end_date: endDate,
                    timezone: 'America/Sao_Paulo'
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[VTurb] Erro no engajamento: ${response.status} - ${errorBody}`);
                return null;
            }

            const data = await response.json();
            console.log(`[VTurb] Engajamento recebido:`, JSON.stringify(data).substring(0, 200));
            return data;
        } catch (error) {
            console.error("[VTurb] Erro na requisição getEngagement:", error);
            return null;
        }
    }
}
