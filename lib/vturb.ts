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
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(30000) // 30 segundos timeout
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

    // Busca estatísticas de sessões para um player (endpoint atualizado pelo suporte VTurb)
    async getSessionStats(playerId: string, startDate: string, endDate: string, videoDuration: number = 600, pitchTime: number = 300) {
        try {
            // Formato correto descoberto: "YYYY-MM-DD HH:MM:SS UTC"
            let startDateTime: string;
            let endDateTime: string;

            if (startDate.includes(' UTC')) {
                startDateTime = startDate;
            } else {
                // Formato exato do suporte VTurb: "YYYY-MM-DD HH:MM:SS UTC"
                const startDateOnly = startDate.split('T')[0]; // Remove parte de tempo se existir
                startDateTime = startDateOnly + ' 00:00:00 UTC';
            }

            if (endDate.includes(' UTC')) {
                endDateTime = endDate;
            } else {
                // Formato exato do suporte VTurb: "YYYY-MM-DD HH:MM:SS UTC"
                const endDateOnly = endDate.split('T')[0]; // Remove parte de tempo se existir
                endDateTime = endDateOnly + ' 23:59:59 UTC';
            }

            console.log(`[VTurb] Buscando estatísticas de sessão para player ${playerId} de ${startDateTime} a ${endDateTime}...`);
            const response = await fetch(`${this.baseUrl}/sessions/stats`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    player_id: playerId,
                    start_date: startDateTime,
                    end_date: endDateTime,
                    timezone: 'America/Sao_Paulo',
                    video_duration: videoDuration,
                    pitch_time: pitchTime
                }),
                signal: AbortSignal.timeout(30000) // 30 segundos timeout
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[VTurb] Erro nas estatísticas de sessão: ${response.status} - ${errorBody}`);
                return null;
            }

            const data = await response.json();
            console.log(`[VTurb] Estatísticas recebidas:`, JSON.stringify(data).substring(0, 200));
            return data;
        } catch (error) {
            console.error("[VTurb] Erro na requisição getSessionStats:", error);
            return null;
        }
    }

    // Busca eventos (plays, views, finished) por dia para um player - MÉTODO ANTIGO
    async getEventsByDay(playerId: string, startDate: string, endDate: string) {
        // Usar o novo método por padrão
        return this.getSessionStats(playerId, startDate, endDate);
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
                }),
                signal: AbortSignal.timeout(30000) // 30 segundos timeout
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
