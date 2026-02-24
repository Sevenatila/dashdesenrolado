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
        const dateStr = searchParams.get("date") || new Date().toISOString().split('T')[0];

        console.log(`Manual Sync requested for date: ${dateStr}`);

        const syncService = new SyncService();
        await syncService.syncDay(dateStr);

        return NextResponse.json({
            status: "success",
            message: `Sincronização concluída para ${dateStr}`
        });
    } catch (error) {
        console.error("Sync API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
