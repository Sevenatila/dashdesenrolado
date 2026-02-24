import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { VTurbClient } from "@/lib/vturb";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.VTURB_API_KEY) {
            return NextResponse.json({ error: "VTURB_API_KEY não configurada" }, { status: 500 });
        }

        const vturb = new VTurbClient(process.env.VTURB_API_KEY);
        const players = await vturb.listPlayers();

        if (!players) {
            return NextResponse.json({ error: "Erro ao buscar players" }, { status: 500 });
        }

        // Retorna lista simplificada: id, name, duration
        const simplified = players.map((p: any) => ({
            id: p.id || p._id,
            name: p.name || "Sem nome",
            duration: p.video_duration || p.duration || 0,
        }));

        return NextResponse.json(simplified);
    } catch (error) {
        console.error("VTurb Players API Error:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
