"use client";

import { useState, useEffect } from "react";
import MetricsTable from "@/components/analytics/MetricsTable";
import VSLFilter from "@/components/analytics/VSLFilter";
import PlatformFilter from "@/components/analytics/PlatformFilter";
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
    const [filteredData, setFilteredData] = useState<DailyAnalytics[]>([]);
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [selectedVSL, setSelectedVSL] = useState<string | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
    });

    // Buscar métricas reais da API
    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString()
            });

            const response = await fetch(`/api/analytics/metrics?${params}`);
            if (response.ok) {
                const result = await response.json();
                const metricsData = result.data || [];
                setData(metricsData);
                setFilteredData(metricsData);

                // Calcular sumário inicial
                if (metricsData.length > 0) {
                    calculateSummary(metricsData);
                } else {
                    // Inicializar sumário vazio
                    setSummary({
            totalGasto: 0,
            totalCliques: 0,
            totalVisitas: 0,
            totalVendas: 0,
            totalReceita: 0,
            cpcMedio: 0,
            cpvMedio: 0,
            cpaMedio: 0,
            aovMedio: 0,
            taxaConversaoGeral: 0,
            taxaCheckout: 0,
            taxaOB1: 0,
            taxaOB2: 0,
            taxaUpsell1: 0,
            taxaUpsell2: 0,
                        roi: 0,
                        roas: 0
                    });
                }
            } else {
                console.error('Erro ao buscar métricas');
                setData([]);
                setFilteredData([]);
                setSummary({
                    totalGasto: 0,
                    totalCliques: 0,
                    totalVisitas: 0,
                    totalVendas: 0,
                    totalReceita: 0,
                    cpcMedio: 0,
                    cpvMedio: 0,
                    cpaMedio: 0,
                    aovMedio: 0,
                    taxaConversaoGeral: 0,
                    taxaCheckout: 0,
                    taxaOB1: 0,
                    taxaOB2: 0,
                    taxaUpsell1: 0,
                    taxaUpsell2: 0,
                    roi: 0,
                    roas: 0
                });
            }
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
            setData([]);
            setFilteredData([]);
            setSummary({
                totalGasto: 0,
                totalCliques: 0,
                totalVisitas: 0,
                totalVendas: 0,
                totalReceita: 0,
                cpcMedio: 0,
                cpvMedio: 0,
                cpaMedio: 0,
                aovMedio: 0,
                taxaConversaoGeral: 0,
                taxaCheckout: 0,
                taxaOB1: 0,
                taxaOB2: 0,
                taxaUpsell1: 0,
                taxaUpsell2: 0,
                roi: 0,
                roas: 0
            });
        }
    };

    const calculateSummary = (metricsData: DailyAnalytics[]) => {
        const totals = metricsData.reduce(
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
            cpcMedio: totals.totalCliques > 0 ? totals.totalGasto / totals.totalCliques : 0,
            cpvMedio: totals.totalVisitas > 0 ? totals.totalGasto / totals.totalVisitas : 0,
            cpaMedio: totals.totalVendas > 0 ? totals.totalGasto / totals.totalVendas : 0,
            aovMedio: totals.totalVendas > 0 ? totals.totalReceita / totals.totalVendas : 0,
            taxaConversaoGeral: totals.totalVisitas > 0 ? (totals.totalVendas / totals.totalVisitas) * 100 : 0,
            taxaCheckout: 0,
            taxaOB1: 0,
            taxaOB2: 0,
            taxaUpsell1: 0,
            taxaUpsell2: 0,
            roi: totals.totalGasto > 0 ? ((totals.totalReceita - totals.totalGasto) / totals.totalGasto) * 100 : 0,
            roas: totals.totalGasto > 0 ? totals.totalReceita / totals.totalGasto : 0
        });
    };

    // Filtrar dados quando VSL ou Plataforma mudarem
    useEffect(() => {
        let filtered = [...data];

        // Filtrar por VSL
        if (selectedVSL) {
            filtered = filtered.filter(item => item.vslId === selectedVSL);
        }

        // Filtrar por Plataforma
        if (selectedPlatform) {
            filtered = filtered.filter(item =>
                item.platform?.toLowerCase() === selectedPlatform.toLowerCase()
            );
        }

        setFilteredData(filtered);

        // Recalcular sumário com dados filtrados
        if (filtered.length > 0) {
            const totals = filtered.reduce(
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
                cpcMedio: totals.totalCliques > 0 ? totals.totalGasto / totals.totalCliques : 0,
                cpvMedio: totals.totalVisitas > 0 ? totals.totalGasto / totals.totalVisitas : 0,
                cpaMedio: totals.totalVendas > 0 ? totals.totalGasto / totals.totalVendas : 0,
                aovMedio: totals.totalVendas > 0 ? totals.totalReceita / totals.totalVendas : 0,
                taxaConversaoGeral: totals.totalVisitas > 0 ? (totals.totalVendas / totals.totalVisitas) * 100 : 0,
                taxaCheckout: 0,
                taxaOB1: 0,
                taxaOB2: 0,
                taxaUpsell1: 0,
                taxaUpsell2: 0,
                roi: totals.totalGasto > 0 ? ((totals.totalReceita - totals.totalGasto) / totals.totalGasto) * 100 : 0,
                roas: totals.totalGasto > 0 ? totals.totalReceita / totals.totalGasto : 0
            });
        }
    }, [selectedVSL, selectedPlatform, data]);

    // Recarregar dados quando filtros mudarem
    const handleFilterChange = async () => {
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString()
            });

            if (selectedVSL && selectedVSL !== 'all') {
                params.append('vslId', selectedVSL);
            }

            if (selectedPlatform && selectedPlatform !== 'all') {
                params.append('platform', selectedPlatform);
            }

            const response = await fetch(`/api/analytics/metrics?${params}`);
            if (response.ok) {
                const result = await response.json();
                setData(result.data || []);
                setFilteredData(result.data || []);

                // Recalcular sumário
                if (result.data && result.data.length > 0) {
                    calculateSummary(result.data);
                }
            }
        } catch (error) {
            console.error('Erro ao recarregar métricas:', error);
        }
    };

    // Atualizar dados quando filtros mudarem
    useEffect(() => {
        if (selectedVSL !== null || selectedPlatform !== null) {
            const timer = setTimeout(() => {
                handleFilterChange();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [selectedVSL, selectedPlatform]);

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
                    <VSLFilter
                        selectedVSL={selectedVSL}
                        onVSLChange={setSelectedVSL}
                    />
                    <PlatformFilter
                        selectedPlatform={selectedPlatform}
                        onPlatformChange={setSelectedPlatform}
                    />
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        Mais Filtros
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
                        <p className="text-3xl font-bold">{summary.roi ? formatPercent(summary.roi) : '0%'}</p>
                        <p className="text-sm opacity-80 mt-2">ROAS: {summary.roas ? summary.roas.toFixed(2) : '0.00'}x</p>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Detalhamento Diário
                    {(selectedVSL || selectedPlatform) && filteredData.length > 0 && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                            ({filteredData.length} registros filtrados)
                        </span>
                    )}
                </h2>
                {filteredData.length > 0 ? (
                    <MetricsTable data={filteredData} />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado disponível</h3>
                            <p className="text-gray-600">
                                Importe seus dados ou aguarde a sincronização das métricas para visualizar o dashboard.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}