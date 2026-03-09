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
        const targetPlayerId = "69921cdd92e29505e061e647";

        console.log(`[VTurb Sessions] Testando novo endpoint /sessions/stats`);

        // Testar o endpoint sugerido pelo suporte VTurb
        const hoje = new Date();
        const resultados: any[] = [];

        // Diferentes configurações de video_duration e pitch_time para testar
        const configuracoes = [
            { video_duration: 3600, pitch_time: 30, descricao: "1h video, pitch aos 30s" },
            { video_duration: 1800, pitch_time: 60, descricao: "30min video, pitch aos 60s" },
            { video_duration: 600, pitch_time: 300, descricao: "10min video, pitch aos 5min" },
            { video_duration: 900, pitch_time: 450, descricao: "15min video, pitch aos 7min30s" }
        ];

        // Diferentes períodos para testar
        const periodos = [
            { dias: 7, nome: "Última semana" },
            { dias: 30, nome: "Último mês" },
            { dias: 60, nome: "Últimos 60 dias" }
        ];

        for (const periodo of periodos) {
            const dataInicio = new Date(hoje);
            dataInicio.setDate(dataInicio.getDate() - periodo.dias);

            const startDate = dataInicio.toISOString().split('T')[0] + 'T00:00:00';
            const endDate = hoje.toISOString().split('T')[0] + 'T23:59:59';

            for (const config of configuracoes) {
                console.log(`[VTurb Sessions] Testando: ${periodo.nome} com ${config.descricao}`);

                try {
                    const response = await fetch("https://analytics.vturb.net/sessions/stats", {
                        method: "POST",
                        headers: {
                            "X-Api-Token": apiKey,
                            "X-Api-Version": "v1",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            player_id: targetPlayerId,
                            start_date: startDate,
                            end_date: endDate,
                            timezone: "America/Sao_Paulo",
                            video_duration: config.video_duration,
                            pitch_time: config.pitch_time
                        })
                    });

                    const responseText = await response.text();
                    let responseData = null;

                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        responseData = { parseError: true, raw: responseText.substring(0, 500) };
                    }

                    resultados.push({
                        teste: `${periodo.nome} - ${config.descricao}`,
                        periodo: {
                            nome: periodo.nome,
                            startDate,
                            endDate
                        },
                        configuracao: config,
                        resposta: {
                            status: response.status,
                            statusText: response.statusText,
                            headers: Object.fromEntries(response.headers.entries()),
                            data: responseData,
                            hasData: !!(responseData && !responseData.parseError && !responseData.error)
                        }
                    });

                    // Se encontrou dados, pare de testar configurações
                    if (responseData && !responseData.parseError && !responseData.error) {
                        console.log(`[VTurb Sessions] SUCESSO! Dados encontrados com configuração:`, config);
                        break;
                    }

                } catch (error) {
                    console.error(`[VTurb Sessions] Erro no teste:`, error);
                    resultados.push({
                        teste: `${periodo.nome} - ${config.descricao}`,
                        erro: error instanceof Error ? error.message : "Erro desconhecido"
                    });
                }
            }
        }

        // Teste específico com os parâmetros exatos sugeridos pelo suporte
        console.log("[VTurb Sessions] Teste com parâmetros exatos do suporte...");

        const testeSuporteResponse = await fetch("https://analytics.vturb.net/sessions/stats", {
            method: "POST",
            headers: {
                "X-Api-Token": apiKey,
                "X-Api-Version": "v1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                player_id: targetPlayerId,
                start_date: "2026-03-01T00:00:00",
                end_date: "2026-03-09T23:59:59",
                timezone: "America/Sao_Paulo",
                video_duration: 3600,
                pitch_time: 30
            })
        });

        const testeSuporteText = await testeSuporteResponse.text();
        let testeSuporteData = null;

        try {
            testeSuporteData = JSON.parse(testeSuporteText);
        } catch (e) {
            testeSuporteData = { parseError: true, raw: testeSuporteText.substring(0, 500) };
        }

        // Análise dos resultados
        const resultadosComDados = resultados.filter(r => r.resposta?.hasData);
        const todosOsStatus = [...new Set(resultados.map(r => r.resposta?.status).filter(Boolean))];

        return NextResponse.json({
            success: true,
            resumo: {
                endpointTestado: "/sessions/stats",
                playerTestado: {
                    id: targetPlayerId,
                    nome: targetPlayerName
                },
                totalTestes: resultados.length,
                testesComSucesso: resultadosComDados.length,
                statusEncontrados: todosOsStatus
            },
            testeEspecificoSuporte: {
                descricao: "Teste com parâmetros exatos sugeridos pelo suporte VTurb",
                parametros: {
                    player_id: targetPlayerId,
                    start_date: "2026-03-01T00:00:00",
                    end_date: "2026-03-09T23:59:59",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resposta: {
                    status: testeSuporteResponse.status,
                    statusText: testeSuporteResponse.statusText,
                    data: testeSuporteData,
                    hasData: !!(testeSuporteData && !testeSuporteData.parseError && !testeSuporteData.error)
                }
            },
            todosOsResultados: resultados,
            apiInfo: {
                baseUrl: "https://analytics.vturb.net",
                endpoint: "/sessions/stats",
                method: "POST",
                apiKeyConfigured: true,
                apiKeyLength: apiKey.length
            }
        });

    } catch (error) {
        console.error('[VTurb Sessions] Erro geral:', error);
        return NextResponse.json({
            success: false,
            error: "Erro ao testar endpoint /sessions/stats",
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}