import { NextRequest, NextResponse } from "next/server";
import { VTurbClient } from "@/lib/vturb";

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.VTURB_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "VTURB_API_KEY não configurada",
                env: {
                    hasKey: false
                }
            });
        }

        console.log('[Test VTurb] Iniciando teste de integração...');

        const vturb = new VTurbClient(apiKey);

        // Teste 1: Listar players
        console.log('[Test VTurb] Testando listagem de players...');
        const players = await vturb.listPlayers();

        if (!players) {
            return NextResponse.json({
                success: false,
                error: "Não foi possível listar players",
                details: "A API retornou null ou erro",
                env: {
                    hasKey: true,
                    keyLength: apiKey.length,
                    baseUrl: "https://analytics.vturb.net"
                }
            });
        }

        // Teste 2: Se houver players, buscar eventos do primeiro
        let eventsTest = null;
        if (players.length > 0) {
            const firstPlayer = players[0];
            console.log(`[Test VTurb] Testando eventos do player ${firstPlayer.id}...`);

            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            eventsTest = await vturb.getEventsByDay(
                firstPlayer.id,
                weekAgo.toISOString().split('T')[0],
                today.toISOString().split('T')[0]
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                players: {
                    count: players.length,
                    list: players.map(p => ({
                        id: p.id,
                        name: p.name,
                        created: p.created_at
                    }))
                },
                eventsTest: eventsTest ? {
                    hasData: !!eventsTest.data,
                    daysCount: eventsTest.data ? Object.keys(eventsTest.data).length : 0,
                    sample: eventsTest.data ? Object.entries(eventsTest.data).slice(0, 2) : null
                } : null,
                env: {
                    hasKey: true,
                    keyLength: apiKey.length,
                    baseUrl: "https://analytics.vturb.net"
                }
            }
        });

    } catch (error) {
        console.error('[Test VTurb] Erro no teste:', error);
        return NextResponse.json({
            success: false,
            error: "Erro ao testar integração VTurb",
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}