"use client";

import { useState } from "react";
import { DailyAnalytics } from "@/types/analytics";
import {
    ChevronDown,
    ChevronUp,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    MousePointer,
    Eye,
    ShoppingCart,
    Package
} from "lucide-react";

interface MetricsTableProps {
    data: DailyAnalytics[];
}

export default function MetricsTable({ data }: MetricsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [sortField, setSortField] = useState<keyof DailyAnalytics>("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const toggleRow = (index: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedRows(newExpanded);
    };

    const handleSort = (field: keyof DailyAnalytics) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(date));
    };

    const getMetricTrend = (current: number, previous?: number) => {
        if (!previous) return null;
        const change = ((current - previous) / previous) * 100;

        if (Math.abs(change) < 5) return null;

        return change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
        );
    };

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left">
                            <button
                                onClick={() => handleSort("date")}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-600"
                            >
                                <Calendar className="w-4 h-4" />
                                Data
                            </button>
                        </th>

                        {/* Métricas de Tráfego */}
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Gasto</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Cliques</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">CPC</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Visitas</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">CPV</div>
                        </th>

                        {/* Métricas de Engajamento */}
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">VSL</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">CPVV</div>
                        </th>

                        {/* Métricas de Vendas */}
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Checkout</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Vendas</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">AOV</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">CPA</div>
                        </th>
                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">ROI</div>
                        </th>

                        <th className="px-4 py-3 text-center">
                            <div className="text-xs font-semibold text-gray-700 uppercase">Ações</div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedData.map((row, index) => (
                        <React.Fragment key={index}>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {formatDate(row.date)}
                                </td>

                                {/* Métricas de Tráfego */}
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="font-medium">{formatCurrency(row.valorGasto)}</span>
                                        {index > 0 && getMetricTrend(row.valorGasto, sortedData[index - 1].valorGasto)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="font-medium">{row.cliques.toLocaleString("pt-BR")}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="text-blue-600 font-medium">{formatCurrency(row.cpc)}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="font-medium">{row.visitas.toLocaleString("pt-BR")}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="text-blue-600 font-medium">{formatCurrency(row.cpv)}</span>
                                </td>

                                {/* Métricas de Engajamento */}
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="font-medium">{row.visuUnicaVSL.toLocaleString("pt-BR")}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="text-blue-600 font-medium">{formatCurrency(row.cpvv)}</span>
                                </td>

                                {/* Métricas de Vendas */}
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{row.iniciouCheckout}</span>
                                        <span className="text-xs text-gray-500">{formatPercent(row.convCheckout)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="font-semibold text-green-600">{row.vendas}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="font-medium">{formatCurrency(row.aov)}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className="text-orange-600 font-medium">{formatCurrency(row.cpa)}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                                    <span className={`font-bold ${(row.vendas * row.aov / row.valorGasto - 1) * 100 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercent((row.vendas * row.aov / row.valorGasto - 1) * 100)}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => toggleRow(index)}
                                        className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {expandedRows.has(index) ? (
                                            <ChevronUp className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                        )}
                                    </button>
                                </td>
                            </tr>

                            {/* Linha Expandida com Detalhes */}
                            {expandedRows.has(index) && (
                                <tr className="bg-blue-50">
                                    <td colSpan={14} className="px-4 py-4">
                                        <div className="grid grid-cols-4 gap-6">
                                            {/* Order Bumps */}
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                                    <Package className="w-4 h-4" />
                                                    Order Bumps
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">OB #1:</span>
                                                        <span className="font-medium">
                                                            {row.vendasOB1} vendas ({formatPercent(row.convOB1)})
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">OB #2:</span>
                                                        <span className="font-medium">
                                                            {row.vendasOB2} vendas ({formatPercent(row.convOB2)})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Upsells */}
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4" />
                                                    Upsells
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Upsell #1:</span>
                                                        <span className="font-medium">
                                                            {row.upsell1} vendas ({formatPercent(row.convUpsell1)})
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Upsell #2:</span>
                                                        <span className="font-medium">
                                                            {row.upsell2} vendas ({formatPercent(row.convUpsell2)})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Taxas de Conversão */}
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-sm text-gray-700 mb-3">
                                                    Taxas de Conversão
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Connect Rate:</span>
                                                        <span className="font-medium">{formatPercent(row.connectRate)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Passagem:</span>
                                                        <span className="font-medium">{formatPercent(row.passagem)}</span>
                                                    </div>
                                                    {row.downsell > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Downsell:</span>
                                                            <span className="font-medium">{row.downsell} vendas</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Observações */}
                                            {row.observacoes && (
                                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                                                        Observações
                                                    </h4>
                                                    <p className="text-sm text-gray-600">{row.observacoes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}