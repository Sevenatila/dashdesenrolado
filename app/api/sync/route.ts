import { NextResponse } from "next/server";
import { SyncService } from "@/lib/sync";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        // Proteção básica: Verificar se o usuário está logado
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const date = searchParams.get("date");

        const syncService = new SyncService();

        if (start && end) {
            console.log(`Manual Range Sync requested: ${start} to ${end}`);
            await syncService.syncRange(start, end);
        } else {
            const dateStr = date || start || new Date().toISOString().split('T')[0];
            console.log(`Manual Day Sync requested for date: ${dateStr}`);
            await syncService.syncDay(dateStr);
        }

        return NextResponse.json({
            status: "success",
            message: `Sincronização concluída`
        });
    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
