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

        // Teste direto com o formato que sabemos que funciona
        console.log('[VTurb Direto] Testando com formato que funcionou antes...');

        const playerId = "69921cdd92e29505e061e647";

        const response = await fetch("https://analytics.vturb.net/sessions/stats", {
            method: "POST",
            headers: {
                "X-Api-Token": apiKey,
                "X-Api-Version": "v1",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                player_id: playerId,
                start_date: "2026-03-09 00:00:00 UTC",
                end_date: "2026-03-09 23:59:59 UTC",
                timezone: "America/Sao_Paulo",
                video_duration: 3600,
                pitch_time: 30
            }),
            signal: AbortSignal.timeout(10000)
        });

        const responseText = await response.text();
        console.log(`[VTurb Direto] Status: ${response.status}`);
        console.log(`[VTurb Direto] Response: ${responseText.substring(0, 500)}`);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { parseError: true, raw: responseText };
        }

        return NextResponse.json({
            success: true,
            test: "Formato exato que funcionou antes",
            request: {
                url: "https://analytics.vturb.net/sessions/stats",
                method: "POST",
                body: {
                    player_id: playerId,
                    start_date: "2026-03-09 00:00:00 UTC",
                    end_date: "2026-03-09 23:59:59 UTC",
                    timezone: "America/Sao_Paulo",
                    video_duration: 3600,
                    pitch_time: 30
                }
            },
            response: {
                status: response.status,
                statusText: response.statusText,
                data: data,
                funcionou: !!(data && !data.parseError && !data.error && data.data)
            }
        });

    } catch (error) {
        console.error('[VTurb Direto] Erro:', error);
        return NextResponse.json({
            success: false,
            error: "Erro no teste direto VTurb",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}