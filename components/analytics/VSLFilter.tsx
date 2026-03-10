"use client";

import React, { useState, useEffect } from "react";
import { VSLOption } from "@/types/analytics";
import { Video, ChevronDown, Check, Search } from "lucide-react";

interface VSLFilterProps {
    selectedVSL: string | null;
    onVSLChange: (vslId: string | null) => void;
}

export default function VSLFilter({ selectedVSL, onVSLChange }: VSLFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [vslOptions, setVslOptions] = useState<VSLOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Buscar lista de VSLs disponíveis
    useEffect(() => {
        // Delay para evitar erro de hidratação
        const timer = setTimeout(() => {
            fetchVSLOptions();
        }, 200);

        return () => clearTimeout(timer);
    }, []);

    const fetchVSLOptions = async () => {
        setLoading(true);
        try {
            // Lista padrão como fallback
            const defaultOptions = [
                { id: 'all', name: 'Todos os VSLs', platform: '' },
                { id: 'vsl_cdr', name: 'CDR - Como Destruir Relacionamentos', platform: 'VTurb' },
                { id: 'vsl_reconquista', name: 'Reconquista Definitiva', platform: 'VTurb' },
                { id: 'vsl_ex_volta', name: 'Faz a Ex Voltar em 7 Dias', platform: 'VTurb' },
                { id: 'vsl_relacionamento', name: 'Salve seu Relacionamento', platform: 'VTurb' }
            ];

            try {
                // Buscar VSLs do VTurb
                const response = await fetch('/api/vturb/players');

                if (response?.ok) {
                    const data = await response.json();
                    console.log('VSL Data received:', data);

                    // Verificação defensiva rigorosa dos dados
                    const options: VSLOption[] = [];

                    // A API retorna { players: [...] }, não um array direto
                    const playersArray = data.players || data;

                    if (Array.isArray(playersArray) && playersArray.length > 0) {

                        // Processar cada player com verificação individual
                        for (const player of playersArray) {
                            try {
                                if (player && typeof player === 'object') {
                                    options.push({
                                        id: String(player.id || player._id || `vsl_${Math.random().toString(36).substr(2, 9)}`),
                                        name: String(player.name || player.title || `VSL ${player.id || 'Unknown'}`),
                                        platform: 'VTurb'
                                    });
                                }
                            } catch (playerError) {
                                console.warn('Erro ao processar player individual:', playerError);
                                continue;
                            }
                        }
                    }

                    // Se conseguiu obter dados válidos, usar eles
                    if (options.length > 0) {
                        setVslOptions([
                            { id: 'all', name: 'Todos os VSLs', platform: '' },
                            ...options
                        ]);
                        return;
                    }
                }
            } catch (fetchError) {
                console.error('Erro na requisição VSLs:', fetchError);
            }

            // Fallback para lista padrão em caso de qualquer erro
            setVslOptions(defaultOptions);

        } catch (outerError) {
            console.error('Erro crítico ao buscar VSLs:', outerError);
            // Garantir que sempre temos pelo menos as opções básicas
            setVslOptions([
                { id: 'all', name: 'Todos os VSLs', platform: '' },
                { id: 'vsl_cdr', name: 'CDR - Como Destruir Relacionamentos', platform: 'VTurb' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (vslId: string) => {
        console.log('🎯 VSL FILTER SELECTED:', vslId);

        if (vslId === 'all') {
            console.log('🎯 Setting VSL to null (all)');
            onVSLChange(null);
        } else {
            console.log('🎯 Setting VSL to:', vslId);
            onVSLChange(vslId);
        }
        setIsOpen(false);
        setSearchTerm(""); // Limpar busca ao selecionar
    };

    // Filtrar VSLs baseado no termo de busca
    const filteredOptions = React.useMemo(() => {
        if (!searchTerm.trim()) return vslOptions;

        return vslOptions.filter(option =>
            option && option.name &&
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vslOptions, searchTerm]);

    // Acesso defensivo à opção selecionada
    const selectedOption = React.useMemo(() => {
        try {
            // Verificação rigorosa se vslOptions é array válido
            if (!vslOptions || !Array.isArray(vslOptions) || vslOptions.length === 0) {
                console.warn('vslOptions não é array válido:', vslOptions);
                return null;
            }

            const found = vslOptions.find(opt => opt && opt.id === (selectedVSL || 'all'));
            return found || null;
        } catch (error) {
            console.error('Erro ao buscar opção selecionada:', error);
            console.error('vslOptions type:', typeof vslOptions, 'value:', vslOptions);
            return null;
        }
    }, [vslOptions, selectedVSL]);

    const displayOption = React.useMemo(() => {
        // Se selectedVSL é undefined (não null), significa que nenhuma VSL foi selecionada ainda
        if (selectedVSL === undefined) {
            return { id: '', name: 'Selecione uma VSL', platform: '' };
        }
        return selectedOption || { id: 'all', name: 'Todos os VSLs', platform: '' };
    }, [selectedOption, selectedVSL]);

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
                        {loading ? 'Carregando...' : (displayOption?.name || 'Todos os VSLs')}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !loading && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
                    {/* Campo de busca */}
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar VSL..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Lista de opções filtradas */}
                    <div className="max-h-60 overflow-y-auto">
                        {Array.isArray(filteredOptions) && filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                // Proteção individual para cada item
                                if (!option || typeof option !== 'object' || !option.id) {
                                    return null;
                                }

                                try {
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelect(option.id)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Video className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700 block">
                                                        {option.name || 'VSL Sem Nome'}
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
                                    );
                                } catch (renderError) {
                                    console.warn('Erro ao renderizar opção VSL:', renderError, option);
                                    return null;
                                }
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                {searchTerm ? 'Nenhum VSL encontrado' : 'Carregando...'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Click outside para fechar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setIsOpen(false);
                        setSearchTerm("");
                    }}
                />
            )}
        </div>
    );
}