"use client";

import { useState } from "react";
import { PlatformOption } from "@/types/analytics";
import { ShoppingBag, ChevronDown, Check } from "lucide-react";

interface PlatformFilterProps {
    selectedPlatform: string | null;
    onPlatformChange: (platform: string | null) => void;
}

export default function PlatformFilter({ selectedPlatform, onPlatformChange }: PlatformFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Lista de plataformas disponíveis
    const platforms: PlatformOption[] = [
        { id: 'all', name: 'Todas as Plataformas', color: '' },
        { id: 'hubla', name: 'Hubla', color: 'bg-blue-500' },
        { id: 'kiwify', name: 'Kiwify', color: 'bg-green-500' },
        { id: 'hotmart', name: 'Hotmart', color: 'bg-red-500' },
        { id: 'eduzz', name: 'Eduzz', color: 'bg-purple-500' },
        { id: 'monetizze', name: 'Monetizze', color: 'bg-orange-500' },
        { id: 'perfectpay', name: 'PerfectPay', color: 'bg-pink-500' },
    ];

    const handleSelect = (platformId: string) => {
        if (platformId === 'all') {
            onPlatformChange(null);
        } else {
            onPlatformChange(platformId);
        }
        setIsOpen(false);
    };

    const selectedOption = platforms.find(p =>
        p.id === (selectedPlatform || 'all')
    ) || platforms[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 min-w-[200px] justify-between transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        {selectedOption.color && selectedOption.id !== 'all' && (
                            <span className={`w-2 h-2 rounded-full ${selectedOption.color}`} />
                        )}
                        {selectedOption.name}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {platforms.map((platform) => (
                        <button
                            key={platform.id}
                            onClick={() => handleSelect(platform.id)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {platform.color && platform.id !== 'all' && (
                                    <span className={`w-2 h-2 rounded-full ${platform.color}`} />
                                )}
                                <span className="text-sm font-medium text-gray-700">
                                    {platform.name}
                                </span>
                            </div>
                            {(selectedPlatform === platform.id || (!selectedPlatform && platform.id === 'all')) && (
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