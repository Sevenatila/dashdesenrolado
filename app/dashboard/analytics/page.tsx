"use client";

import { useState, useEffect } from "react";
import MetricsTable from "@/components/analytics/MetricsTable";
import { DailyAnalytics, MetricsSummary } from "@/types/analytics";
import {
    TrendingUp,
    DollarSign,
    MousePointer,
    ShoppingCart,
    Package,
    Calendar,
    Download,
    Upload,
    Filter,
    BarChart3,
    Activity
} from "lucide-react";

export default function AnalyticsPage() {
    const [data, setData] = useState<DailyAnalytics[]>([]);
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
    });

    // Mock data para demonstração - será substituído por dados reais
    useEffect(() => {
        const mockData: DailyAnalytics[] = [
            {
                date: new Date("2024-03-06"),
                valorGasto: 1250.00,
                cliques: 450,
                cpc: 2.78,
                visitas: 380,
                cpv: 3.29,
                connectRate: 84.44,
                passagem: 65.00,
                visuUnicaVSL: 247,
                cpvv: 5.06,
                iniciouCheckout: 45,
                convCheckout: 18.22,
                vendas: 8,
                aov: 297.00,
                cpa: 156.25,
                vendasOB1: 3,
                convOB1: 37.50,
                vendasOB2: 1,
                convOB2: 12.50,
                upsell1: 2,
                convUpsell1: 25.00,
                upsell2: 1,
                convUpsell2: 12.50,
                downsell: 0,
                observacoes: "Campanha com bom desempenho"
            },
            {
                date: new Date("2024-03-05"),
                valorGasto: 980.00,
                cliques: 320,
                cpc: 3.06,
                visitas: 280,
                cpv: 3.50,
                connectRate: 87.50,
                passagem: 62.00,
                visuUnicaVSL: 174,
                cpvv: 5.63,
                iniciouCheckout: 32,
                convCheckout: 18.39,
                vendas: 6,
                aov: 297.00,
                cpa: 163.33,
                vendasOB1: 2,
                convOB1: 33.33,
                vendasOB2: 0,
                convOB2: 0,
                upsell1: 1,
                convUpsell1: 16.67,
                upsell2: 0,
                convUpsell2: 0,
                downsell: 1
            }
        ];

        setData(mockData);

        // Calcular sumário
        const totals = mockData.reduce(
            (acc, day) => ({
                totalGasto: acc.totalGasto + day.valorGasto,
                totalCliques: acc.totalCliques + day.cliques,
                totalVisitas: acc.totalVisitas + day.visitas,
                totalVendas: acc.totalVendas + day.vendas,
                totalReceita: acc.totalReceita + (day.vendas * day.aov)
            }),
            { totalGasto: 0, totalCliques: 0, totalVisitas: 0, totalVendas: 0, totalReceita: 0 }
        );

        setSummary({
            ...totals,
            cpcMedio: totals.totalGasto / totals.totalCliques,
            cpvMedio: totals.totalGasto / totals.totalVisitas,
            cpaMedio: totals.totalGasto / totals.totalVendas,
            aovMedio: totals.totalReceita / totals.totalVendas,
            taxaConversaoGeral: (totals.totalVendas / totals.totalVisitas) * 100,
            taxaCheckout: 18.3,
            taxaOB1: 35.4,
            taxaOB2: 6.25,
            taxaUpsell1: 20.8,
            taxaUpsell2: 6.25,
            roi: ((totals.totalReceita - totals.totalGasto) / totals.totalGasto) * 100,
            roas: totals.totalReceita / totals.totalGasto
        });
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Completo</h1>
                    <p className="text-gray-600 mt-1">Visão detalhada de todas as métricas do funil</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        Importar
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            {summary && (
                <div className="grid grid-cols-5 gap-4">
                    {/* Card ROI */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">ROI</h3>
                            <TrendingUp className="w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{formatPercent(summary.roi)}</p>
                        <p className="text-sm opacity-80 mt-2">ROAS: {summary.roas.toFixed(2)}x</p>
                    </div>

                    {/* Card Receita */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Receita Total</h3>
                            <DollarSign className="w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(summary.totalReceita)}</p>
                        <p className="text-sm opacity-80 mt-2">AOV: {formatCurrency(summary.aovMedio)}</p>
                    </div>

                    {/* Card Vendas */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Vendas</h3>
                            <ShoppingCart className="w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{summary.totalVendas}</p>
                        <p className="text-sm opacity-80 mt-2">Conv: {formatPercent(summary.taxaConversaoGeral)}</p>
                    </div>

                    {/* Card Tráfego */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Cliques</h3>
                            <MousePointer className="w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{summary.totalCliques.toLocaleString("pt-BR")}</p>
                        <p className="text-sm opacity-80 mt-2">CPC: {formatCurrency(summary.cpcMedio)}</p>
                    </div>

                    {/* Card Gasto */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium opacity-90">Investimento</h3>
                            <Activity className="w-5 h-5 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold">{formatCurrency(summary.totalGasto)}</p>
                        <p className="text-sm opacity-80 mt-2">CPA: {formatCurrency(summary.cpaMedio)}</p>
                    </div>
                </div>
            )}

            {/* Mini Cards de Conversão */}
            {summary && (
                <div className="grid grid-cols-6 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Checkout</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(summary.taxaCheckout)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Order Bump 1</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(summary.taxaOB1)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Order Bump 2</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(summary.taxaOB2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Upsell 1</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(summary.taxaUpsell1)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Upsell 2</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(summary.taxaUpsell2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">CPV Médio</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.cpvMedio)}</p>
                    </div>
                </div>
            )}

            {/* Tabela de Métricas */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento Diário</h2>
                <MetricsTable data={data} />
            </div>
        </div>
    );
}