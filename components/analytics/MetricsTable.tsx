"use client";

import React, { useState } from "react";
import { DailyAnalytics } from "@/types/analytics";
import {
    Calendar,
    Edit3,
    Save,
    X
} from "lucide-react";

interface MetricsTableProps {
    data: DailyAnalytics[];
}

interface EditingCell {
    rowIndex: number;
    field: keyof DailyAnalytics;
}

export default function MetricsTable({ data }: MetricsTableProps) {
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [sortField, setSortField] = useState<keyof DailyAnalytics>("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Sempre mostrar pelo menos uma linha vazia se não há dados
    const dataToShow = data.length > 0 ? data : [createEmptyRow()];

    function createEmptyRow(): DailyAnalytics {
        return {
            date: new Date(),
            vslId: "",
            vslName: "",
            platform: "",
            valorGasto: 0,
            cliques: 0,
            cpc: 0,
            visitas: 0,
            cpv: 0,
            connectRate: 0,
            passagem: 0,
            visuUnicaVSL: 0,
            cpvv: 0,
            iniciouCheckout: 0,
            convCheckout: 0,
            vendas: 0,
            aov: 0,
            cpa: 0,
            vendasOB1: 0,
            convOB1: 0,
            vendasOB2: 0,
            convOB2: 0,
            upsell1: 0,
            convUpsell1: 0,
            upsell2: 0,
            convUpsell2: 0,
            downsell: 0,
            observacoes: ""
        };
    }

    const sortedData = [...dataToShow].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (sortField === "date") {
            const aDate = new Date(aValue as Date);
            const bDate = new Date(bValue as Date);
            return sortOrder === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        return sortOrder === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });

    const handleSort = (field: keyof DailyAnalytics) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleCellClick = (rowIndex: number, field: keyof DailyAnalytics) => {
        // Só permite edição de campos que não são auto-preenchidos pela integração
        const readOnlyFields = ['date', 'vslId', 'vslName', 'platform', 'vendas', 'aov'];
        if (readOnlyFields.includes(field as string)) return;

        setEditingCell({ rowIndex, field });
        setEditValue(String(sortedData[rowIndex][field] || ""));
    };

    const handleSaveEdit = () => {
        if (!editingCell) return;

        // Aqui você implementaria a lógica para salvar no banco
        console.log(`Salvando ${editingCell.field}: ${editValue} para linha ${editingCell.rowIndex}`);

        setEditingCell(null);
        setEditValue("");
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString("pt-BR");
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(value || 0);
    };

    const formatPercent = (value: number) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const formatNumber = (value: number) => {
        return (value || 0).toLocaleString("pt-BR");
    };

    const renderCell = (row: DailyAnalytics, field: keyof DailyAnalytics, rowIndex: number) => {
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
        const value = row[field];

        // Campos auto-preenchidos (readonly)
        const readOnlyFields = ['date', 'vslId', 'vslName', 'platform', 'vendas', 'aov'];
        const isReadOnly = readOnlyFields.includes(field as string);

        if (isEditing && !isReadOnly) {
            return (
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                        }}
                    />
                    <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Save className="w-3 h-3" />
                    </button>
                    <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            );
        }

        let formattedValue: string;

        // Formatação específica por tipo de campo
        if (field === 'date') {
            formattedValue = formatDate(value as Date);
        } else if (['valorGasto', 'cpc', 'cpv', 'cpvv', 'aov', 'cpa'].includes(field as string)) {
            const numValue = value as number;
            formattedValue = numValue === 0 && data.length === 0 ? "" : formatCurrency(numValue);
        } else if (['connectRate', 'passagem', 'convCheckout', 'convOB1', 'convOB2', 'convUpsell1', 'convUpsell2'].includes(field as string)) {
            const numValue = value as number;
            formattedValue = numValue === 0 && data.length === 0 ? "" : formatPercent(numValue);
        } else if (typeof value === 'number') {
            const numValue = value as number;
            formattedValue = numValue === 0 && data.length === 0 ? "" : formatNumber(numValue);
        } else {
            formattedValue = String(value || "");
        }

        return (
            <div
                className={`relative group ${!isReadOnly ? 'cursor-pointer hover:bg-blue-50' : ''} ${isReadOnly ? 'bg-gray-50' : ''}`}
                onClick={() => !isReadOnly && handleCellClick(rowIndex, field)}
            >
                <span className={`${isReadOnly ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                    {formattedValue}
                </span>
                {!isReadOnly && (
                    <Edit3 className="absolute top-1 right-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="overflow-x-auto max-w-full">
                <table className="min-w-full" style={{ minWidth: '2400px' }}>
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                            {/* Data */}
                            <th className="px-3 py-3 text-left min-w-[100px] sticky left-0 bg-gray-50 z-10 border-r">
                                <button
                                    onClick={() => handleSort("date")}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-blue-600"
                                >
                                    <Calendar className="w-3 h-3" />
                                    Data
                                </button>
                            </th>

                            {/* Métricas de Tráfego */}
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Valor Gasto</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Cliques</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">CPC</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Visitas</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">CPV</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Connect Rate</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">% Passagem</div>
                            </th>

                            {/* Métricas de VSL */}
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Visu Única VSL</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">CPVV</div>
                            </th>

                            {/* Métricas de Checkout */}
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Iniciou Checkout</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Conv Checkout</div>
                            </th>

                            {/* Métricas de Vendas */}
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Vendas</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">AOV</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">CPA</div>
                            </th>

                            {/* Order Bumps */}
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Vendas OB1</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Conv OB1</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Vendas OB2</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Conv OB2</div>
                            </th>

                            {/* Upsells */}
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Upsell 1</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Conv Upsell 1</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Upsell 2</div>
                            </th>
                            <th className="px-3 py-3 text-center min-w-[120px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Conv Upsell 2</div>
                            </th>

                            {/* Downsell */}
                            <th className="px-3 py-3 text-center min-w-[100px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Downsell</div>
                            </th>

                            {/* Observações */}
                            <th className="px-3 py-3 text-center min-w-[200px]">
                                <div className="text-xs font-semibold text-gray-700 uppercase">Observações</div>
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {sortedData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                {/* Data - Sticky */}
                                <td className="px-3 py-3 text-sm sticky left-0 bg-white z-10 border-r">
                                    {renderCell(row, 'date', index)}
                                </td>

                                {/* Métricas de Tráfego */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'valorGasto', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'cliques', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'cpc', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'visitas', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'cpv', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'connectRate', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'passagem', index)}
                                </td>

                                {/* Métricas de VSL */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'visuUnicaVSL', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'cpvv', index)}
                                </td>

                                {/* Métricas de Checkout */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'iniciouCheckout', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'convCheckout', index)}
                                </td>

                                {/* Métricas de Vendas */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'vendas', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'aov', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'cpa', index)}
                                </td>

                                {/* Order Bumps */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'vendasOB1', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'convOB1', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'vendasOB2', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'convOB2', index)}
                                </td>

                                {/* Upsells */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'upsell1', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'convUpsell1', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'upsell2', index)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'convUpsell2', index)}
                                </td>

                                {/* Downsell */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'downsell', index)}
                                </td>

                                {/* Observações */}
                                <td className="px-3 py-3 text-sm text-center">
                                    {renderCell(row, 'observacoes', index)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                    <span>📝 Clique nas células em branco para editar | 🔒 Campos cinzas são preenchidos automaticamente</span>
                    <span>{sortedData.length} registro(s)</span>
                </div>
            </div>
        </div>
    );
}