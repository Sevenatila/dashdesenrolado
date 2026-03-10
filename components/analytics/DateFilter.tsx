"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Clock } from "lucide-react";

interface DateRange {
    start: Date;
    end: Date;
}

interface DateFilterProps {
    dateRange: DateRange;
    onDateRangeChange: (dateRange: DateRange) => void;
}

const datePresets = [
    {
        label: "Hoje",
        getValue: () => ({
            start: new Date(new Date().setHours(0, 0, 0, 0)),
            end: new Date(new Date().setHours(23, 59, 59, 999))
        })
    },
    {
        label: "Últimos 7 dias",
        getValue: () => ({
            start: new Date(new Date().setDate(new Date().getDate() - 7)),
            end: new Date()
        })
    },
    {
        label: "Últimos 30 dias",
        getValue: () => ({
            start: new Date(new Date().setDate(new Date().getDate() - 30)),
            end: new Date()
        })
    },
    {
        label: "Este mês",
        getValue: () => ({
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date()
        })
    },
    {
        label: "Mês passado",
        getValue: () => {
            const now = new Date();
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return {
                start: firstDayLastMonth,
                end: lastDayLastMonth
            };
        }
    },
    {
        label: "Últimos 3 meses",
        getValue: () => ({
            start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
            end: new Date()
        })
    }
];

export default function DateFilter({ dateRange, onDateRangeChange }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDateRange = (start: Date, end: Date) => {
        const formatDate = (date: Date) => {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const startStr = formatDate(start);
        const endStr = formatDate(end);

        if (startStr === endStr) {
            return startStr;
        }

        return `${startStr} - ${endStr}`;
    };

    const handlePresetSelect = (preset: typeof datePresets[0]) => {
        const newRange = preset.getValue();
        onDateRangeChange(newRange);
        setIsOpen(false);
    };

    const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
        if (!value) return;

        const newDate = new Date(value);
        if (isNaN(newDate.getTime())) return;

        const newRange = {
            ...dateRange,
            [field]: field === 'start'
                ? new Date(newDate.setHours(0, 0, 0, 0))
                : new Date(newDate.setHours(23, 59, 59, 999))
        };

        onDateRangeChange(newRange);
    };

    const getCurrentPresetLabel = () => {
        const now = new Date();

        for (const preset of datePresets) {
            const presetRange = preset.getValue();

            // Verificar se as datas são aproximadamente iguais (diferença de até 1 hora)
            const startDiff = Math.abs(dateRange.start.getTime() - presetRange.start.getTime());
            const endDiff = Math.abs(dateRange.end.getTime() - presetRange.end.getTime());

            if (startDiff < 3600000 && endDiff < 3600000) { // 1 hora em ms
                return preset.label;
            }
        }

        return formatDateRange(dateRange.start, dateRange.end);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 min-w-[200px] justify-between transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        {getCurrentPresetLabel()}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {/* Presets */}
                    <div className="border-b border-gray-100">
                        <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2">
                                Períodos Rápidos
                            </div>
                            {datePresets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetSelect(preset)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 rounded-md transition-colors"
                                >
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                        {preset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seleção personalizada */}
                    <div className="p-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                            Período Personalizado
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.start.toISOString().split('T')[0]}
                                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.end.toISOString().split('T')[0]}
                                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min={dateRange.start.toISOString().split('T')[0]}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Aplicar Filtro
                            </button>
                        </div>
                    </div>
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