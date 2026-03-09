import { NextRequest, NextResponse } from "next/server";
import { VTurbClient } from "@/lib/vturb";

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.VTURB_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "VTURB_API_KEY não configurada"
            });
        }

        console.log('[Test VTurb] Iniciando teste detalhado...');
        const vturb = new VTurbClient(apiKey);

        // 1. Listar todos os players
        console.log('[Test VTurb] Buscando players...');
        const players = await vturb.listPlayers();

        if (!players || players.length === 0) {
            return NextResponse.json({
                success: false,
                error: "Nenhum player encontrado"
            });
        }

        console.log(`[Test VTurb] ${players.length} players encontrados`);

        // 2. Buscar um player específico que provavelmente tem dados
        // Vamos pegar alguns players diferentes para testar
        const testPlayers = players.slice(0, 5); // Testar com os primeiros 5

        const results: any[] = [];

        for (const player of testPlayers) {
            console.log(`[Test VTurb] Testando player: ${player.id} - ${player.name}`);

            // Testar diferentes períodos de data
            const hoje = new Date();
            const ontem = new Date(hoje);
            ontem.setDate(ontem.getDate() - 1);

            const semanaPassada = new Date(hoje);
            semanaPassada.setDate(semanaPassada.getDate() - 7);

            const mesPassado = new Date(hoje);
            mesPassado.setMonth(mesPassado.getMonth() - 1);

            // Teste 1: Últimos 7 dias
            try {
                const events7Days = await vturb.getEventsByDay(
                    player.id,
                    semanaPassada.toISOString().split('T')[0],
                    hoje.toISOString().split('T')[0]
                );

                // Teste 2: Último mês
                const events30Days = await vturb.getEventsByDay(
                    player.id,
                    mesPassado.toISOString().split('T')[0],
                    hoje.toISOString().split('T')[0]
                );

                // Teste 3: Apenas ontem
                const eventsYesterday = await vturb.getEventsByDay(
                    player.id,
                    ontem.toISOString().split('T')[0],
                    ontem.toISOString().split('T')[0]
                );

                const playerResult = {
                    id: player.id,
                    name: player.name,
                    created: player.created_at,
                    tests: {
                        last7Days: {
                            period: `${semanaPassada.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`,
                            hasData: !!(events7Days && events7Days.data),
                            daysWithData: events7Days?.data ? Object.keys(events7Days.data).length : 0,
                            totalEvents: events7Days?.data ?
                                Object.values(events7Days.data).reduce((sum: number, day: any) => {
                                    return sum + (day.started || 0) + (day.viewed || 0) + (day.finished || 0);
                                }, 0) : 0,
                            sample: events7Days?.data ?
                                Object.entries(events7Days.data).slice(0, 2).map(([date, data]) => ({
                                    date,
                                    data
                                })) : null
                        },
                        last30Days: {
                            period: `${mesPassado.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`,
                            hasData: !!(events30Days && events30Days.data),
                            daysWithData: events30Days?.data ? Object.keys(events30Days.data).length : 0,
                            totalEvents: events30Days?.data ?
                                Object.values(events30Days.data).reduce((sum: number, day: any) => {
                                    return sum + (day.started || 0) + (day.viewed || 0) + (day.finished || 0);
                                }, 0) : 0
                        },
                        yesterday: {
                            period: ontem.toISOString().split('T')[0],
                            hasData: !!(eventsYesterday && eventsYesterday.data),
                            data: eventsYesterday?.data
                        }
                    },
                    rawResponse: {
                        events7Days: events7Days ? JSON.stringify(events7Days).substring(0, 500) : null
                    }
                };

                results.push(playerResult);

                // Se encontrou dados, não precisa testar todos
                if (playerResult.tests.last7Days.totalEvents > 0) {
                    console.log(`[Test VTurb] Player ${player.name} tem dados! Eventos: ${playerResult.tests.last7Days.totalEvents}`);
                }

            } catch (error) {
                console.error(`[Test VTurb] Erro ao buscar eventos do player ${player.id}:`, error);
                results.push({
                    id: player.id,
                    name: player.name,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                });
            }
        }

        // 3. Testar também com diferentes formatos de requisição
        const testPlayer = players[0];
        const hoje = new Date();
        const mesPassado = new Date(hoje);
        mesPassado.setMonth(mesPassado.getMonth() - 1);

        const directTest = await fetch(`https://analytics.vturb.net/events/total_by_company`, {
            method: 'POST',
            headers: {
                'X-Api-Token': apiKey,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: testPlayer.id,
                events: ['started', 'finished', 'viewed'],
                start_date: mesPassado.toISOString().split('T')[0],
                end_date: hoje.toISOString().split('T')[0],
                timezone: 'America/Sao_Paulo'
            })
        });

        const directResponse = await directTest.text();

        return NextResponse.json({
            success: true,
            summary: {
                totalPlayers: players.length,
                testedPlayers: results.length,
                playersWithData: results.filter(r => r.tests && (r.tests.last7Days?.totalEvents > 0 || r.tests.last30Days?.totalEvents > 0)).length
            },
            results,
            directApiTest: {
                status: directTest.status,
                statusText: directTest.statusText,
                headers: Object.fromEntries(directTest.headers.entries()),
                response: directResponse.substring(0, 1000)
            },
            environment: {
                apiKeyLength: apiKey.length,
                apiKeyPrefix: apiKey.substring(0, 10) + '...',
                baseUrl: 'https://analytics.vturb.net'
            }
        });

    } catch (error) {
        console.error('[Test VTurb] Erro geral:', error);
        return NextResponse.json({
            success: false,
            error: "Erro ao testar integração VTurb",
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}