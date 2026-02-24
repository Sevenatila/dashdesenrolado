"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export default function DateRangePicker() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");

    useEffect(() => {
        // Inicializar com datas da URL ou padrões (hoje)
        const today = new Date().toISOString().split('T')[0];
        setStart(searchParams.get("start") || today);
        setEnd(searchParams.get("end") || today);
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("start", start);
        params.set("end", end);
        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
                />
            </div>
            <span className="text-gray-300">até</span>
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
                />
            </div>
            <button
                onClick={handleFilter}
                className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-black transition-colors"
            >
                Filtrar
            </button>
        </div>
    );
}
