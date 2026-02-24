"use client";

import { useState, useEffect } from "react";
import { MonitorPlay, ChevronDown, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Player {
    id: string;
    name: string;
    duration: number;
}

export default function PlayerSelector() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("player_id");

    useEffect(() => {
        async function fetchPlayers() {
            try {
                const res = await fetch("/api/vturb/players");
                if (res.ok) {
                    const data = await res.json();
                    setPlayers(data);
                }
            } catch (error) {
                console.error("Erro ao buscar players:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlayers();
    }, []);

    const selectedPlayer = players.find(p => p.id === selectedId);

    const handleSelect = (playerId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (playerId === "all") {
            params.delete("player_id");
        } else {
            params.set("player_id", playerId);
        }
        router.push(`/dashboard?${params.toString()}`);
        setOpen(false);
        setSearch("");
    };

    const filteredPlayers = players.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 hover:shadow transition-all min-w-[220px]"
            >
                <MonitorPlay className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">
                    {loading
                        ? "Carregando..."
                        : selectedPlayer
                            ? selectedPlayer.name
                            : "Todos os Players"
                    }
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch(""); }} />
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        {/* Busca */}
                        <div className="p-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar player..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="max-h-64 overflow-y-auto">
                            {/* Opção "Todos" */}
                            <button
                                onClick={() => handleSelect("all")}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${!selectedId ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                                    }`}
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                <span>Todos os Players</span>
                                <span className="ml-auto text-xs text-gray-400">{players.length} players</span>
                            </button>

                            <div className="border-t border-gray-100" />

                            {filteredPlayers.map((player) => (
                                <button
                                    key={player.id}
                                    onClick={() => handleSelect(player.id)}
                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${selectedId === player.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                                        }`}
                                >
                                    <MonitorPlay className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="truncate">{player.name}</span>
                                    {player.duration > 0 && (
                                        <span className="ml-auto text-xs text-gray-400 shrink-0">
                                            {formatDuration(player.duration)}
                                        </span>
                                    )}
                                </button>
                            ))}

                            {filteredPlayers.length === 0 && (
                                <div className="px-4 py-6 text-center text-sm text-gray-400">
                                    Nenhum player encontrado
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
