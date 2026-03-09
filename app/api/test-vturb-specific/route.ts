import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.VTURB_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "VTURB_API_KEY não configurada"
            });
        }

        // Player específico que sabemos que tem dados
        const targetPlayerName = "MINI_VSL_REEDICAO_QUIZ_CDR_97_86b842mnp_HUBLA";

        console.log(`[VTurb Test] Buscando player específico: ${targetPlayerName}`);

        // 1. Primeiro, buscar todos os players para encontrar o ID correto
        const playersResponse = await fetch(`https://analytics.vturb.net/players/list`, {
            method: 'GET',
            headers: {
                'X-Api-Token': apiKey,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json'
            }
        });

        if (!playersResponse.ok) {
            return NextResponse.json({
                success: false,
                error: `Erro ao listar players: ${playersResponse.status}`,
                details: await playersResponse.text()
            });
        }

        const players = await playersResponse.json();

        // Encontrar o player específico
        const targetPlayer = players.find((p: any) => p.name === targetPlayerName);

        if (!targetPlayer) {
            return NextResponse.json({
                success: false,
                error: `Player ${targetPlayerName} não encontrado`,
                availablePlayers: players.map((p: any) => p.name).slice(0, 20),
                totalPlayers: players.length
            });
        }

        console.log(`[VTurb Test] Player encontrado: ID ${targetPlayer.id}`);

        // 2. Testar diferentes períodos de data
        const hoje = new Date();
        const resultados: any[] = [];

        // Teste com diferentes períodos
        const periodos = [
            { dias: 1, nome: "Hoje" },
            { dias: 7, nome: "Última semana" },
            { dias: 30, nome: "Último mês" },
            { dias: 60, nome: "Últimos 60 dias" },
            { dias: 90, nome: "Últimos 90 dias" }
        ];

        for (const periodo of periodos) {
            const dataInicio = new Date(hoje);
            dataInicio.setDate(dataInicio.getDate() - periodo.dias);

            const startDate = dataInicio.toISOString().split('T')[0];
            const endDate = hoje.toISOString().split('T')[0];

            console.log(`[VTurb Test] Testando período: ${periodo.nome} (${startDate} até ${endDate})`);

            // Fazer requisição direta para eventos
            const eventsResponse = await fetch(`https://analytics.vturb.net/events/total_by_company`, {
                method: 'POST',
                headers: {
                    'X-Api-Token': apiKey,
                    'X-Api-Version': 'v1',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: targetPlayer.id,
                    events: ['started', 'finished', 'viewed'],
                    start_date: startDate,
                    end_date: endDate,
                    timezone: 'America/Sao_Paulo'
                })
            });

            const responseText = await eventsResponse.text();
            let eventsData = null;

            try {
                eventsData = JSON.parse(responseText);
            } catch (e) {
                eventsData = { error: "Não foi possível fazer parse da resposta", raw: responseText.substring(0, 500) };
            }

            // Calcular total de eventos
            let totalEventos = 0;
            let diasComDados = 0;
            let primeirosDias: any[] = [];

            if (eventsData && eventsData.data && typeof eventsData.data === 'object') {
                const dias = Object.entries(eventsData.data);
                diasComDados = dias.length;

                for (const [date, dayData] of dias) {
                    const day = dayData as any;
                    const dayTotal = (day.started || 0) + (day.viewed || 0) + (day.finished || 0);
                    totalEventos += dayTotal;

                    if (primeirosDias.length < 3) {
                        primeirosDias.push({
                            date,
                            started: day.started || 0,
                            viewed: day.viewed || 0,
                            finished: day.finished || 0,
                            total: dayTotal
                        });
                    }
                }
            }

            resultados.push({
                periodo: periodo.nome,
                dias: periodo.dias,
                startDate,
                endDate,
                status: eventsResponse.status,
                statusText: eventsResponse.statusText,
                hasData: !!(eventsData && eventsData.data),
                diasComDados,
                totalEventos,
                amostra: primeirosDias,
                responseHeaders: Object.fromEntries(eventsResponse.headers.entries()),
                rawResponse: eventsData
            });
        }

        // 3. Testar também diferentes formatos de requisição
        const testesAlternativos: any[] = [];

        // Teste sem timezone
        const testeSemTimezone = await fetch(`https://analytics.vturb.net/events/total_by_company`, {
            method: 'POST',
            headers: {
                'X-Api-Token': apiKey,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: targetPlayer.id,
                events: ['started', 'finished', 'viewed'],
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            })
        });

        testesAlternativos.push({
            teste: "Sem timezone",
            status: testeSemTimezone.status,
            response: await testeSemTimezone.text().then(t => {
                try { return JSON.parse(t); } catch { return t.substring(0, 200); }
            })
        });

        // Teste com apenas um evento
        const testeUmEvento = await fetch(`https://analytics.vturb.net/events/total_by_company`, {
            method: 'POST',
            headers: {
                'X-Api-Token': apiKey,
                'X-Api-Version': 'v1',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: targetPlayer.id,
                events: ['started'],
                start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                timezone: 'America/Sao_Paulo'
            })
        });

        testesAlternativos.push({
            teste: "Apenas evento 'started'",
            status: testeUmEvento.status,
            response: await testeUmEvento.text().then(t => {
                try { return JSON.parse(t); } catch { return t.substring(0, 200); }
            })
        });

        return NextResponse.json({
            success: true,
            player: {
                id: targetPlayer.id,
                name: targetPlayer.name,
                created: targetPlayer.created_at,
                // Incluir outros campos do player se existirem
                fullData: targetPlayer
            },
            resultadosPorPeriodo: resultados,
            testesAlternativos,
            apiInfo: {
                keyLength: apiKey.length,
                keyPrefix: apiKey.substring(0, 10) + '...'
            }
        });

    } catch (error) {
        console.error('[VTurb Test] Erro:', error);
        return NextResponse.json({
            success: false,
            error: "Erro ao testar player específico",
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}