"use client";

import { useState, useEffect } from "react";
import { VSLOption } from "@/types/analytics";
import { Video, ChevronDown, Check } from "lucide-react";

interface VSLFilterProps {
    selectedVSL: string | null;
    onVSLChange: (vslId: string | null) => void;
}

export default function VSLFilter({ selectedVSL, onVSLChange }: VSLFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [vslOptions, setVslOptions] = useState<VSLOption[]>([]);
    const [loading, setLoading] = useState(false);

    // Buscar lista de VSLs disponíveis
    useEffect(() => {
        fetchVSLOptions();
    }, []);

    const fetchVSLOptions = async () => {
        setLoading(true);
        try {
            // Buscar VSLs do VTurb
            const response = await fetch('/api/vturb/players');
            if (response.ok) {
                const data = await response.json();
                const options: VSLOption[] = data.players?.map((player: any) => ({
                    id: player.id,
                    name: player.name || `VSL ${player.id}`,
                    platform: 'VTurb'
                })) || [];

                // Adicionar opção para ver todos
                setVslOptions([
                    { id: 'all', name: 'Todos os VSLs', platform: '' },
                    ...options
                ]);
            }
        } catch (error) {
            console.error('Erro ao buscar VSLs:', error);
            setVslOptions([
                { id: 'all', name: 'Todos os VSLs', platform: '' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (vslId: string) => {
        if (vslId === 'all') {
            onVSLChange(null);
        } else {
            onVSLChange(vslId);
        }
        setIsOpen(false);
    };

    const selectedOption = vslOptions.find(opt =>
        opt.id === (selectedVSL || 'all')
    ) || { id: 'all', name: 'Todos os VSLs' };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 min-w-[200px] justify-between transition-colors"
                disabled={loading}
            >
                <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        {loading ? 'Carregando...' : selectedOption.name}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !loading && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {vslOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option.id)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-gray-400" />
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">
                                        {option.name}
                                    </span>
                                    {option.platform && (
                                        <span className="text-xs text-gray-500">
                                            {option.platform}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {(selectedVSL === option.id || (!selectedVSL && option.id === 'all')) && (
                                <Check className="w-4 h-4 text-blue-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Click outside para fechar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}