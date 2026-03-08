// Teste da API VTurb
class VTurbClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://analytics.vturb.net";
    }

    getHeaders() {
        return {
            'X-Api-Token': this.apiKey,
            'X-Api-Version': 'v1',
            'Content-Type': 'application/json'
        };
    }

    async listPlayers() {
        try {
            console.log("[VTurb] Listando players...");
            const response = await fetch(`${this.baseUrl}/players/list`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                console.error(`[VTurb] Erro ao listar players: ${response.status} ${response.statusText}`);
                const errorBody = await response.text();
                console.error("Resposta de erro:", errorBody);
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

    async getEventsByDay(playerId, startDate, endDate) {
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
}

// Usar a chave real
const VTURB_API_KEY = "6785ae5df3bbf8eb9103ec0d";

async function testVTurbAPI() {
    console.log("=== TESTANDO API VTURB ===\n");

    try {
        const vturb = new VTurbClient(VTURB_API_KEY);

        console.log("1. TESTANDO LISTAGEM DE PLAYERS:");
        const players = await vturb.listPlayers();

        if (players) {
            console.log(`✅ Sucesso! Encontrados ${players.length} players:`);
            players.forEach((player, index) => {
                console.log(`   ${index + 1}. ${player.name || player.title || player.id}`);
                console.log(`      ID: ${player.id}`);
                console.log(`      Duração: ${player.video_duration || 'N/A'}s`);
                console.log("");
            });

            // Testar eventos para o primeiro player
            if (players.length > 0) {
                console.log("\n2. TESTANDO EVENTOS DO PRIMEIRO PLAYER:");
                const playerId = players[0].id;
                const hoje = new Date().toISOString().split('T')[0];
                const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                console.log(`Buscando eventos de ${ontem} a ${hoje} para player ${playerId}...`);

                const events = await vturb.getEventsByDay(playerId, ontem, hoje);

                if (events) {
                    console.log("✅ Eventos recebidos:");
                    console.log(JSON.stringify(events, null, 2));
                } else {
                    console.log("❌ Falha ao buscar eventos");
                }

                // Testar engajamento
                console.log("\n3. TESTANDO ENGAJAMENTO:");
                const engagement = await vturb.getEngagement(
                    playerId,
                    players[0].video_duration || 300,
                    ontem,
                    hoje
                );

                if (engagement) {
                    console.log("✅ Engajamento recebido:");
                    console.log(JSON.stringify(engagement, null, 2));
                } else {
                    console.log("❌ Falha ao buscar engajamento");
                }
            }

        } else {
            console.log("❌ Falha ao listar players");
        }

    } catch (error) {
        console.error("❌ ERRO:", error.message);
    }

    console.log("\n=== TESTE CONCLUÍDO ===");
}

testVTurbAPI();