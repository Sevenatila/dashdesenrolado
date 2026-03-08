// Script para testar a API do VTurb
const VTURB_API_KEY = "a7dc52ffabfe22ff8f78a02e28e8de4ac3fc3e43e7c770d49d2f9bd3f03bea8b";
const baseUrl = "https://analytics.vturb.net";

async function testVTurbAPI() {
    console.log("=== Testando API do VTurb ===\n");

    // 1. Testar listagem de players
    console.log("1. Listando players...");
    try {
        const response = await fetch(`${baseUrl}/players/list`, {
            method: 'GET',
            headers: {
                'X-Api-Token': VTURB_API_KEY,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`   Players encontrados: ${data?.length || 0}`);

            if (data && data.length > 0) {
                console.log("\n   Primeiros 3 players:");
                data.slice(0, 3).forEach(player => {
                    console.log(`   - ID: ${player.id}`);
                    console.log(`     Nome: ${player.name || player.title || 'Sem nome'}`);
                    console.log(`     Duração: ${player.video_duration || 'Não informada'} segundos`);
                });

                // 2. Testar eventos do primeiro player
                const firstPlayer = data[0];
                console.log(`\n2. Buscando eventos do player: ${firstPlayer.id}`);

                const today = new Date();
                const lastMonth = new Date(today);
                lastMonth.setDate(today.getDate() - 30);

                const startDate = lastMonth.toISOString().split('T')[0];
                const endDate = today.toISOString().split('T')[0];

                const eventsResponse = await fetch(`${baseUrl}/events/total_by_company`, {
                    method: 'POST',
                    headers: {
                        'X-Api-Token': VTURB_API_KEY,
                        'X-Api-Version': 'v1',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        player_id: firstPlayer.id,
                        events: ['started', 'finished', 'viewed'],
                        start_date: startDate,
                        end_date: endDate,
                        timezone: 'America/Sao_Paulo'
                    })
                });

                console.log(`   Status: ${eventsResponse.status} ${eventsResponse.statusText}`);

                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    console.log(`   Dados recebidos: ${eventsData ? 'Sim' : 'Não'}`);

                    if (eventsData && eventsData.data) {
                        const dates = Object.keys(eventsData.data);
                        console.log(`   Dias com dados: ${dates.length}`);

                        if (dates.length > 0) {
                            const lastDay = dates[dates.length - 1];
                            const dayData = eventsData.data[lastDay];
                            console.log(`\n   Dados do dia ${lastDay}:`);
                            console.log(`   - Started (plays): ${dayData.started || 0}`);
                            console.log(`   - Finished: ${dayData.finished || 0}`);
                            console.log(`   - Viewed: ${dayData.viewed || 0}`);
                        }
                    }
                } else {
                    const errorText = await eventsResponse.text();
                    console.log(`   Erro: ${errorText}`);
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`   Erro: ${errorText}`);
        }
    } catch (error) {
        console.error("   Erro na requisição:", error.message);
    }

    console.log("\n=== Fim do teste ===");
}

// Executar teste
testVTurbAPI();