"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SyncButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSync = async () => {
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const playerId = searchParams.get("player_id");

        const confirmMsg = start && end
            ? `Deseja sincronizar as métricas de ${start} até ${end}?`
            : "Deseja sincronizar as métricas de hoje?";

        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (start && end) {
                params.set("start", start);
                params.set("end", end);
            }
            if (playerId) {
                params.set("player_id", playerId);
            }
            const query = params.toString() ? `?${params.toString()}` : "";
            const res = await fetch(`/api/sync${query}`);

            const data = await res.json();

            if (res.ok) {
                alert("✅ Sincronização concluída com sucesso!");
                router.refresh(); // Recarrega os dados do servidor (Server Components)
            } else {
                alert(`❌ Erro na sincronização: ${data.message || data.error}`);
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("❌ Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                }`}
        >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Sincronizando..." : "Atualizar Métricas"}
        </button>
    );
}
