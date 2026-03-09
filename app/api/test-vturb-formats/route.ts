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

        const targetPlayerId = "69921cdd92e29505e061e647";

        console.log('[VTurb] Testando diferentes formatos conforme documentação...');

        const resultados: any[] = [];

        // Formato 1: Como o suporte mandou (sem start_date/end_date)
        try {
            const response1 = await fetch("https://analytics.vturb.net/sessions/stats", {
                method: "POST",
                headers: {
                    "X-Api-Token": apiKey,
                    "X-Api-Version": "v1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: targetPlayerId,
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                })
            });

            const responseText1 = await response1.text();
            let responseData1 = null;

            try {
                responseData1 = JSON.parse(responseText1);
            } catch (e) {
                responseData1 = { parseError: true, raw: responseText1.substring(0, 500) };
            }

            resultados.push({
                teste: "Formato do suporte - sem dates",
                parametros: {
                    player_id: targetPlayerId,
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resultado: {
                    status: response1.status,
                    statusText: response1.statusText,
                    data: responseData1,
                    hasData: !!(responseData1 && !responseData1.parseError && !responseData1.error)
                }
            });
        } catch (error) {
            resultados.push({
                teste: "Formato do suporte - sem dates",
                erro: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }

        // Formato 2: "2023-10-26T18:24:05.000+00:00"
        try {
            const response2 = await fetch("https://analytics.vturb.net/sessions/stats", {
                method: "POST",
                headers: {
                    "X-Api-Token": apiKey,
                    "X-Api-Version": "v1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: targetPlayerId,
                    start_date: "2026-03-01T00:00:00.000+00:00",
                    end_date: "2026-03-09T23:59:59.000+00:00",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                })
            });

            const responseText2 = await response2.text();
            let responseData2 = null;

            try {
                responseData2 = JSON.parse(responseText2);
            } catch (e) {
                responseData2 = { parseError: true, raw: responseText2.substring(0, 500) };
            }

            resultados.push({
                teste: "Formato ISO com timezone (+00:00)",
                parametros: {
                    player_id: targetPlayerId,
                    start_date: "2026-03-01T00:00:00.000+00:00",
                    end_date: "2026-03-09T23:59:59.000+00:00",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resultado: {
                    status: response2.status,
                    statusText: response2.statusText,
                    data: responseData2,
                    hasData: !!(responseData2 && !responseData2.parseError && !responseData2.error)
                }
            });
        } catch (error) {
            resultados.push({
                teste: "Formato ISO com timezone (+00:00)",
                erro: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }

        // Formato 3: "2023-10-26 18:24:05 UTC"
        try {
            const response3 = await fetch("https://analytics.vturb.net/sessions/stats", {
                method: "POST",
                headers: {
                    "X-Api-Token": apiKey,
                    "X-Api-Version": "v1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: targetPlayerId,
                    start_date: "2026-03-01 00:00:00 UTC",
                    end_date: "2026-03-09 23:59:59 UTC",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                })
            });

            const responseText3 = await response3.text();
            let responseData3 = null;

            try {
                responseData3 = JSON.parse(responseText3);
            } catch (e) {
                responseData3 = { parseError: true, raw: responseText3.substring(0, 500) };
            }

            resultados.push({
                teste: "Formato com UTC explícito",
                parametros: {
                    player_id: targetPlayerId,
                    start_date: "2026-03-01 00:00:00 UTC",
                    end_date: "2026-03-09 23:59:59 UTC",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resultado: {
                    status: response3.status,
                    statusText: response3.statusText,
                    data: responseData3,
                    hasData: !!(responseData3 && !responseData3.parseError && !responseData3.error)
                }
            });
        } catch (error) {
            resultados.push({
                teste: "Formato com UTC explícito",
                erro: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }

        // Formato 4: Apenas data "2023-10-26"
        try {
            const response4 = await fetch("https://analytics.vturb.net/sessions/stats", {
                method: "POST",
                headers: {
                    "X-Api-Token": apiKey,
                    "X-Api-Version": "v1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: targetPlayerId,
                    start_date: "2026-03-01",
                    end_date: "2026-03-09",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                })
            });

            const responseText4 = await response4.text();
            let responseData4 = null;

            try {
                responseData4 = JSON.parse(responseText4);
            } catch (e) {
                responseData4 = { parseError: true, raw: responseText4.substring(0, 500) };
            }

            resultados.push({
                teste: "Formato simples de data",
                parametros: {
                    player_id: targetPlayerId,
                    start_date: "2026-03-01",
                    end_date: "2026-03-09",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resultado: {
                    status: response4.status,
                    statusText: response4.statusText,
                    data: responseData4,
                    hasData: !!(responseData4 && !responseData4.parseError && !responseData4.error)
                }
            });
        } catch (error) {
            resultados.push({
                teste: "Formato simples de data",
                erro: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }

        // Formato 5: Com timezone brasileiro (-03:00)
        try {
            const response5 = await fetch("https://analytics.vturb.net/sessions/stats", {
                method: "POST",
                headers: {
                    "X-Api-Token": apiKey,
                    "X-Api-Version": "v1",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: targetPlayerId,
                    start_date: "2026-03-01T00:00:00.000-03:00",
                    end_date: "2026-03-09T23:59:59.000-03:00",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                })
            });

            const responseText5 = await response5.text();
            let responseData5 = null;

            try {
                responseData5 = JSON.parse(responseText5);
            } catch (e) {
                responseData5 = { parseError: true, raw: responseText5.substring(0, 500) };
            }

            resultados.push({
                teste: "Formato ISO com timezone brasileiro (-03:00)",
                parametros: {
                    player_id: targetPlayerId,
                    start_date: "2026-03-01T00:00:00.000-03:00",
                    end_date: "2026-03-09T23:59:59.000-03:00",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                },
                resultado: {
                    status: response5.status,
                    statusText: response5.statusText,
                    data: responseData5,
                    hasData: !!(responseData5 && !responseData5.parseError && !responseData5.error)
                }
            });
        } catch (error) {
            resultados.push({
                teste: "Formato ISO com timezone brasileiro (-03:00)",
                erro: error instanceof Error ? error.message : "Erro desconhecido"
            });
        }

        // Resumo
        const testesComSucesso = resultados.filter(r => r.resultado?.hasData || (r.resultado?.status && r.resultado.status !== 400));
        const statusCodes = [...new Set(resultados.map(r => r.resultado?.status).filter(Boolean))];

        return NextResponse.json({
            success: true,
            resumo: {
                totalTestes: resultados.length,
                testesComSucesso: testesComSucesso.length,
                statusCodes: statusCodes,
                formatosFuncionando: testesComSucesso.map(t => t.teste)
            },
            resultados: resultados,
            observacao: "Testando formatos conforme documentação VTurb e exemplo do suporte"
        });

    } catch (error) {
        console.error('[VTurb] Erro geral:', error);
        return NextResponse.json({
            success: false,
            error: "Erro ao testar formatos de data VTurb",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}