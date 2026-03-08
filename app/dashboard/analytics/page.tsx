"use client";

import { useState, useEffect } from "react";
import MetricsTable from "@/components/analytics/MetricsTable";
import VSLFilter from "@/components/analytics/VSLFilter";
import PlatformFilter from "@/components/analytics/PlatformFilter";
import DateFilter from "@/components/analytics/DateFilter";
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
    Activity,
    RefreshCw
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Buscar métricas reais da API
    useEffect(() => {
        // Delay para garantir que o componente está montado
        const timer = setTimeout(() => {
            fetchMetrics();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const fetchMetrics = async () => {
        try {
            setIsRefreshing(true);
            console.log('Fetching metrics...', { dateRange, selectedVSL, selectedPlatform });

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

            console.log('API URL:', `/api/analytics/metrics?${params.toString()}`);

            const response = await fetch(`/api/analytics/metrics?${params}`);
            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Metrics result:', result);

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
                const errorText = await response.text();
                console.error('Erro ao buscar métricas:', response.status, errorText);
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
        } finally {
            setIsRefreshing(false);
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

    // NÃO FILTRAR LOCALMENTE - A API JÁ FAZ ISSO!
    useEffect(() => {
        console.log('🔄 DATA UPDATE TRIGGERED!');
        console.log('📊 Data from API:', data.length, 'items');
        console.log('🎯 Selected VSL:', selectedVSL);
        console.log('🏢 Selected Platform:', selectedPlatform);

        // Usar os dados diretamente da API sem filtrar novamente
        setFilteredData(data);
        console.log('✅ Using API data directly:', data);

        // Recalcular sumário com dados filtrados
        if (data.length > 0) {
            const totals = data.reduce(
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
            console.log('🔄 HANDLE FILTER CHANGE CALLED!');
            console.log('📅 Date range:', dateRange);
            console.log('🎯 Selected VSL:', selectedVSL);
            console.log('🏢 Selected Platform:', selectedPlatform);

            setIsRefreshing(true);
            const params = new URLSearchParams({
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString()
            });

            if (selectedVSL && selectedVSL !== 'all') {
                console.log('➕ Adding VSL param:', selectedVSL);
                params.append('vslId', selectedVSL);
            }

            if (selectedPlatform && selectedPlatform !== 'all') {
                console.log('➕ Adding Platform param:', selectedPlatform);
                params.append('platform', selectedPlatform);
            }

            const finalUrl = `/api/analytics/metrics?${params}`;
            console.log('🌐 Final API URL:', finalUrl);

            const response = await fetch(finalUrl);
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
        } finally {
            setIsRefreshing(false);
        }
    };

    // Função para botão de atualização manual
    const handleManualRefresh = async () => {
        console.log('🔄 MANUAL REFRESH BUTTON CLICKED!');
        console.log('⚙️ Current state:', { selectedVSL, selectedPlatform, dateRange });
        await handleFilterChange();
    };

    // Atualizar dados quando filtros mudarem
    useEffect(() => {
        console.log('🎯🏢 FILTER CHANGE EFFECT TRIGGERED!');
        console.log('🎯 selectedVSL:', selectedVSL);
        console.log('🏢 selectedPlatform:', selectedPlatform);

        if (selectedVSL !== null || selectedPlatform !== null) {
            console.log('✅ Filter condition met, calling handleFilterChange in 500ms');
            const timer = setTimeout(() => {
                console.log('⏰ Timer triggered, calling handleFilterChange now');
                handleFilterChange();
            }, 500);

            return () => {
                console.log('🚮 Cleaning up timer');
                clearTimeout(timer);
            };
        } else {
            console.log('❌ No filter selected, skipping API call');
        }
    }, [selectedVSL, selectedPlatform]);

    // Atualizar dados quando período de data mudar
    useEffect(() => {
        console.log('📅 DATE RANGE EFFECT TRIGGERED!');
        console.log('📅 New date range:', dateRange);

        const timer = setTimeout(() => {
            console.log('📅⏰ Date timer triggered, calling handleFilterChange');
            handleFilterChange();
        }, 500);

        return () => {
            console.log('📅🚮 Cleaning up date timer');
            clearTimeout(timer);
        };
    }, [dateRange]);

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
                    <DateFilter
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                    <VSLFilter
                        selectedVSL={selectedVSL}
                        onVSLChange={setSelectedVSL}
                    />
                    <PlatformFilter
                        selectedPlatform={selectedPlatform}
                        onPlatformChange={setSelectedPlatform}
                    />
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Atualizando...' : 'Atualizar'}
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
                <MetricsTable data={filteredData} />
            </div>
        </div>
    );
}