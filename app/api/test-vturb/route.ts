import { NextRequest, NextResponse } from "next/server";
import { VTurbClient } from "@/lib/vturb";

export async function GET(request: NextRequest) {
    try {
        if (!process.env.VTURB_API_KEY) {
            return NextResponse.json({ error: "VTURB_API_KEY not found" }, { status: 400 });
        }

        const vturb = new VTurbClient(process.env.VTURB_API_KEY);

        console.log("Testing VTurb with token:", process.env.VTURB_API_KEY.substring(0, 10) + "...");

        // Testar listagem de players
        const players = await vturb.listPlayers();

        if (!players) {
            return NextResponse.json({
                error: "Failed to fetch players",
                token: process.env.VTURB_API_KEY.substring(0, 10) + "..."
            }, { status: 500 });
        }

        // Testar dados de um player se existir
        let testData = null;
        if (players.length > 0) {
            const firstPlayer = players[0];
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            console.log(`Testing events for player ${firstPlayer.id} from ${yesterday} to ${today}`);

            testData = await vturb.getEventsByDay(firstPlayer.id, yesterday, today);
        }

        return NextResponse.json({
            success: true,
            players: players.length,
            playersData: players.slice(0, 2), // Primeiro 2 players
            testData: testData,
            token: process.env.VTURB_API_KEY.substring(0, 10) + "..."
        });

    } catch (error) {
        console.error("VTurb test error:", error);
        return NextResponse.json({
            error: "VTurb test failed",
            details: error instanceof Error ? error.message : 'Unknown error',
            token: process.env.VTURB_API_KEY?.substring(0, 10) + "..."
        }, { status: 500 });
    }
}