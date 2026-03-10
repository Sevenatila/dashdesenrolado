const fetch = require('node-fetch');

const VTURB_API_KEY = "a7dc52ffabfe22ff8f78a02e28e8de4ac3fc3e43e7c770d49d2f9bd3f03bea8b";

async function testVTurbAPI() {
    console.log('🧪 Testando API VTurb...\n');

    try {
        // 1. Testar listagem de players
        console.log('1. Testando /players/list');
        const playersResponse = await fetch('https://analytics.vturb.net/players/list', {
            method: 'GET',
            headers: {
                'X-Api-Token': VTURB_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!playersResponse.ok) {
            console.error('❌ Erro ao buscar players:', playersResponse.status, playersResponse.statusText);
            const errorText = await playersResponse.text();
            console.error('Response:', errorText);
            return;
        }

        const players = await playersResponse.json();
        console.log('✅ Players encontrados:', players.length);

        if (players.length > 0) {
            console.log('📋 Primeiro player:');
            console.log('   ID:', players[0].id);
            console.log('   Nome:', players[0].name);
            console.log('   Created:', players[0].created_at);

            // 2. Testar estatísticas de sessão do primeiro player
            console.log('\n2. Testando /sessions/stats do primeiro player');
            const statsResponse = await fetch('https://analytics.vturb.net/sessions/stats', {
                method: 'POST',
                headers: {
                    'X-Api-Token': VTURB_API_KEY,
                    'X-Api-Version': 'v1',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: players[0].id,
                    start_date: '2026-03-09',
                    end_date: '2026-03-10',
                    timezone: 'America/Sao_Paulo'
                })
            });

            if (!statsResponse.ok) {
                console.error('❌ Erro ao buscar stats:', statsResponse.status, statsResponse.statusText);
                const errorText = await statsResponse.text();
                console.error('Response:', errorText);
                return;
            }

            const stats = await statsResponse.json();
            console.log('✅ Estatísticas obtidas:');
            console.log('   total_viewed:', stats.total_viewed || 0);
            console.log('   total_viewed_device_uniq (Views Únicos):', stats.total_viewed_device_uniq || 0);
            console.log('   total_started_device_uniq (Plays Únicos):', stats.total_started_device_uniq || 0);
            console.log('   total_clicked:', stats.total_clicked || 0);
            console.log('   total_conversions:', stats.total_conversions || 0);
            console.log('   engagement_rate:', stats.engagement_rate || 0);

            console.log('\n🎯 Campos importantes:');
            console.log('   Views Únicos VSL → total_viewed_device_uniq:', stats.total_viewed_device_uniq || 0);
            console.log('   Plays Únicos VSL → total_started_device_uniq:', stats.total_started_device_uniq || 0);
        } else {
            console.log('⚠️ Nenhum player encontrado');
        }

    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
    }
}

testVTurbAPI();