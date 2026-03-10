"use client";

import { useState, useEffect } from "react";
import {
    DollarSign,
    TrendingUp,
    Users,
    MousePointerClick,
    MonitorPlay,
    ShoppingCart,
    Target,
    BarChart3,
    ArrowRightLeft,
    Percent,
    RefreshCw
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import SyncButton from "@/components/dashboard/SyncButton";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import PlayerSelector from "@/components/dashboard/PlayerSelector";
import VSLFilter from "@/components/analytics/VSLFilter";
import PlatformFilter from "@/components/analytics/PlatformFilter";
import DateFilter from "@/components/analytics/DateFilter";
import { DailyAnalytics, MetricsSummary } from "@/types/analytics";

interface DashboardMetrics {
    vendas: number;
    receitaGerada: number;
    totalItens: number;
    receitaTotalLiquida: number;
    valorGasto: number;
    cliquesLink: number;
    playsUnicosVSL: number;
    visualizacaoPage: number;
    cpa: number;
    ticketMedio: number;
    ticketMedioTotal: number;
    conversaoVSL: number;
    retencaoLeadVSL: number;
    engajamentoVSL: number;
    retencaoPitchVSL: number;
    conversaocheckout: number;
    conversaoOrderBump: number;
    conversaoBackredirect: number;
    conversaoUpsell: number;
    conversaoDownsell: number;
    conversaoUpsell2: number;
}

interface TaxSettings {
    pixTax: number;
    cardTax: number;
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [taxSettings, setTaxSettings] = useState<TaxSettings>({ pixTax: 0, cardTax: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedVSL, setSelectedVSL] = useState<string | null | undefined>(undefined);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null | undefined>(undefined);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)),
        end: new Date()
    });

    // Buscar dados da API analytics que já tem integração VTurb
    const fetchMetrics = async () => {
        try {
            if (!isRefreshing) {
                setIsLoading(true);
            }
            setIsRefreshing(true);

            // Usar dateRange dinâmico ao invés de forçar data
            const params = new URLSearchParams({
                startDate: dateRange.start.toISOString(),
                endDate: dateRange.end.toISOString()
            });

            // Adicionar filtros se selecionados
            // Se selectedVSL é undefined, não enviar parâmetro (não busca VTurb)
            // Se é null, envia 'all' para buscar todas
            // Se tem valor específico, envia o ID da VSL
            if (selectedVSL !== undefined) {
                if (selectedVSL === null || selectedVSL === 'all') {
                    params.append('vslId', 'all');
                } else {
                    params.append('vslId', selectedVSL);
                }
            }

            if (selectedPlatform !== undefined) {
                if (selectedPlatform === null || selectedPlatform === 'all') {
                    params.append('platform', 'all');
                } else {
                    params.append('platform', selectedPlatform);
                }
            }

            console.log('🌐 Dashboard API URL:', `/api/analytics/metrics?${params}`);
            const response = await fetch(`/api/analytics/metrics?${params}`);

            if (response.ok) {
                const result = await response.json();
                const analyticsData: DailyAnalytics[] = result.data || [];

                // Separar dados: analytics de vídeo do VTurb (pode ser múltiplos), vendas vêm do banco
                const vturbDataArray = analyticsData.filter(item => item.platform === 'vturb');
                const bankDataArray = analyticsData.filter(item => item.platform !== 'vturb'); // Tudo que não é VTurb são vendas do banco

                console.log('🎯 VTurb Analytics Data:', vturbDataArray.length, 'VSLs');
                console.log('🏦 Vendas do Banco:', bankDataArray.length, 'registros');
                console.log('📊 All Data:', analyticsData);

                // AGREGAR dados de múltiplas VSLs do VTurb
                let vturbTotals = {
                    viewsUnicosVSL: 0, // Views únicos da VSL (VTurb)
                    visuUnicaVSL: 0,   // Plays únicos da VSL (VTurb)
                    passagem: 0,
                    connectRate: 0,
                    vendas: 0,
                    receita: 0
                };

                if (vturbDataArray.length > 0) {
                    // Somar todas as métricas das VSLs
                    vturbTotals = vturbDataArray.reduce((acc, vsl) => ({
                        viewsUnicosVSL: acc.viewsUnicosVSL + (vsl.viewsUnicosVSL || 0),
                        visuUnicaVSL: acc.visuUnicaVSL + (vsl.visuUnicaVSL || 0),
                        passagem: acc.passagem + (vsl.passagem || 0), // Média ponderada seria melhor
                        connectRate: acc.connectRate + (vsl.connectRate || 0), // Média ponderada seria melhor
                        vendas: acc.vendas + (vsl.vendas || 0),
                        receita: acc.receita + ((vsl.vendas || 0) * (vsl.aov || 0))
                    }), vturbTotals);

                    // Calcular médias para percentuais
                    if (vturbDataArray.length > 1) {
                        vturbTotals.passagem = vturbTotals.passagem / vturbDataArray.length;
                        vturbTotals.connectRate = vturbTotals.connectRate / vturbDataArray.length;
                    }

                    console.log('🔥 TOTAIS AGREGADOS VTURB:');
                    console.log('   - Total VSLs processadas:', vturbDataArray.length);
                    console.log('   - viewsUnicosVSL (views únicos da VSL):', vturbTotals.viewsUnicosVSL);
                    console.log('   - visuUnicaVSL (plays únicos da VSL):', vturbTotals.visuUnicaVSL);
                    console.log('   - passagem (retenção média):', vturbTotals.passagem);
                    console.log('   - connectRate (média):', vturbTotals.connectRate);
                }

                // AGREGAR dados do banco
                const bankTotals = bankDataArray.reduce((acc, bank) => ({
                    vendas: acc.vendas + (bank.vendas || 0),
                    receita: acc.receita + ((bank.vendas || 0) * (bank.aov || 0)),
                    aov: bank.aov || 0 // Pegar o último AOV
                }), { vendas: 0, receita: 0, aov: 0 });

                // CORREÇÃO: Usar dados agregados de todas as VSLs
                const aggregatedMetrics: DashboardMetrics = {
                    // VENDAS: Apenas do banco (Hubla, Kiwify, etc)
                    vendas: bankTotals.vendas,
                    receitaGerada: bankTotals.receita,
                    totalItens: bankTotals.vendas,
                    receitaTotalLiquida: bankTotals.receita,

                    // TRÁFEGO: Meta Ads (manual ou API futura)
                    valorGasto: 0, // Meta Ads
                    cliquesLink: 0, // Meta Ads

                    // VSL ANALYTICS: Soma de TODAS as VSLs do VTurb
                    playsUnicosVSL: vturbTotals.visuUnicaVSL,        // Plays únicos da VSL (VTurb)
                    visualizacaoPage: 0,                             // Visualizações de PÁGINA (Facebook) - não VTurb
                    retencaoLeadVSL: vturbTotals.passagem,
                    engajamentoVSL: vturbTotals.connectRate,
                    retencaoPitchVSL: vturbTotals.passagem,

                    // MÉTRICAS CALCULADAS: Baseadas nos sistemas corretos
                    cpa: 0, // Será: gastoMetaAds / vendas
                    ticketMedio: bankTotals.vendas > 0 ? bankTotals.receita / bankTotals.vendas : 0,
                    ticketMedioTotal: bankTotals.vendas > 0 ? bankTotals.receita / bankTotals.vendas : 0,
                    conversaoVSL: 0, // Será: vendas / plays quando tiver Meta Ads
                    conversaocheckout: bankDataArray[0]?.convCheckout || 0,
                    conversaoOrderBump: bankDataArray[0]?.convOB1 || 0,
                    conversaoBackredirect: 0,
                    conversaoUpsell: bankDataArray[0]?.convUpsell1 || 0,
                    conversaoDownsell: 0,
                    conversaoUpsell2: bankDataArray[0]?.convUpsell2 || 0,
                };

                setMetrics(aggregatedMetrics);
            }
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Buscar configurações de taxa
    const fetchTaxSettings = async () => {
        try {
            // Por enquanto usar valores default, depois implementar API para settings
            setTaxSettings({ pixTax: 0, cardTax: 0 });
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            setTaxSettings({ pixTax: 0, cardTax: 0 });
        }
    };

    // Buscar métricas quando filtros mudarem
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMetrics();
        }, 500); // Debounce de 500ms para evitar muitas requisições

        return () => clearTimeout(timer);
    }, [dateRange, selectedVSL, selectedPlatform]);

    // Buscar configurações iniciais
    useEffect(() => {
        fetchTaxSettings();
    }, []);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const hasTaxes = taxSettings.pixTax > 0 || taxSettings.cardTax > 0;

    if (isLoading) {
        return (
            <div className="space-y-8 pb-12">
                <div className="flex justify-center items-center h-96">
                    <div className="text-gray-500">Carregando dados do VTurb...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Métricas de Tomada de Decisão</h2>
                        <p className="text-sm text-gray-500">
                            {dateRange.start.toLocaleDateString('pt-BR')} até {dateRange.end.toLocaleDateString('pt-BR')}
                            {selectedVSL && selectedVSL !== 'all' && ' • VSL filtrada'}
                            {selectedPlatform && selectedPlatform !== 'all' && ' • Plataforma filtrada'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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
                            onClick={() => fetchMetrics()}
                            disabled={isRefreshing}
                            className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Vendas de Produto Principal */}
                    <MetricCard
                        title="Número de Faturas"
                        value={metrics?.vendas.toString() || "0"}
                        icon={ShoppingCart}
                        description="Total de faturas criadas durante o período"
                    />
                    <MetricCard
                        title={hasTaxes ? "Receita Bruta Principal" : "Receita Produto Principal"}
                        value={formatCurrency(metrics?.receitaGerada || 0)}
                        icon={DollarSign}
                        description="Receita apenas do produto principal"
                    />
                    <MetricCard
                        title="Número de Itens nas Faturas"
                        value={(metrics?.totalItens || metrics?.vendas || 0).toString()}
                        icon={ShoppingCart}
                        description="Vendas + Order Bumps + Upsells"
                    />
                    <MetricCard
                        title={hasTaxes ? "Receita Total Bruta" : "Receita Total Líquida"}
                        value={formatCurrency((metrics?.receitaTotalLiquida || metrics?.receitaGerada || 0))}
                        icon={DollarSign}
                        description="Principal + Order Bumps + Upsells"
                    />
                </div>

                {/* Métricas VSL - APENAS analytics do VTurb */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Views Únicos VSL"
                        value="0"
                        icon={Users}
                        description="Analytics VTurb - Views únicos da VSL (aguardando implementação)"
                    />
                    <MetricCard
                        title="Connect Rate"
                        value={`${metrics?.engajamentoVSL.toFixed(1) || 0}%`}
                        icon={Target}
                        description="Analytics VTurb - Plays/Views"
                    />
                    <MetricCard
                        title="Retenção VSL"
                        value={`${metrics?.retencaoLeadVSL.toFixed(1) || 0}%`}
                        icon={Percent}
                        description="Analytics VTurb - Taxa de finalização"
                    />
                    <MetricCard
                        title="Plays Únicos VSL"
                        value={metrics?.playsUnicosVSL.toString() || "0"}
                        icon={MonitorPlay}
                        description="Analytics VTurb - Plays únicos iniciados"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Métricas de Tráfego - Facebook/Meta Ads (aguardando integração) */}
                    <MetricCard
                        title="Visualizações de Página"
                        value="0"
                        icon={Users}
                        description="Facebook Ads - Visualizações do site (aguardando integração)"
                    />
                    <MetricCard
                        title="Cliques no Link"
                        value="0"
                        icon={MousePointerClick}
                        description="Facebook Ads - Cliques do anúncio para o site (aguardando)"
                    />
                    <MetricCard
                        title="CPC Médio"
                        value="R$ 0,00"
                        icon={Target}
                        description="Facebook Ads - Custo por clique (aguardando)"
                    />
                    <MetricCard
                        title="CPV Médio"
                        value="R$ 0,00"
                        icon={BarChart3}
                        description="Facebook Ads - Custo por visualização (aguardando)"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Métricas Complementares de Vendas */}
                    <MetricCard
                        title="Ticket Médio Principal"
                        value={formatCurrency(metrics?.ticketMedio || 0)}
                        icon={BarChart3}
                        description="Receita Principal / Faturas"
                    />
                    <MetricCard
                        title="Ticket Médio Total"
                        value={formatCurrency((metrics?.ticketMedioTotal || metrics?.ticketMedio || 0))}
                        icon={BarChart3}
                        description="Receita Total / Faturas"
                    />
                    <MetricCard
                        title="Valor Gasto"
                        value={formatCurrency(metrics?.valorGasto || 0)}
                        icon={TrendingUp}
                        description="Meta Ads"
                    />
                    <MetricCard
                        title="CPA Total"
                        value={formatCurrency(metrics?.cpa || 0)}
                        icon={Target}
                        description="Gasto / Vendas"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Tráfego (Meta Ads - futuro) */}
                    <MetricCard
                        title="Visualizações da Página"
                        value={metrics?.visualizacaoPage.toString() || "0"}
                        icon={Users}
                        description="Meta Ads (a configurar)"
                    />
                    <MetricCard
                        title="Conversão VSL"
                        value={`${metrics?.conversaoVSL || 0}%`}
                        icon={Percent}
                        description="Vendas / Plays (será calculado)"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Taxas de Conversão e Funil */}
                    <MetricCard
                        title="Conv. Checkout"
                        value={`${metrics?.conversaocheckout || 0}%`}
                        icon={Percent}
                        description="Vendas / Clicks Botão"
                    />
                    <MetricCard
                        title="Conv. Order Bump"
                        value={`${metrics?.conversaoOrderBump || 0}%`}
                        icon={ArrowRightLeft}
                    />
                    <MetricCard
                        title="Conv. Backredirect"
                        value={`${metrics?.conversaoBackredirect || 0}%`}
                        icon={ArrowRightLeft}
                    />
                    <MetricCard
                        title="Conv. Upsell 1"
                        value={`${metrics?.conversaoUpsell || 0}%`}
                        icon={ArrowRightLeft}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Conv. Downsell"
                        value={`${metrics?.conversaoDownsell || 0}%`}
                        icon={ArrowRightLeft}
                    />
                    <MetricCard
                        title="Conv. Upsell 2"
                        value={`${metrics?.conversaoUpsell2 || 0}%`}
                        icon={ArrowRightLeft}
                    />
                </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                    <p>Gráfico de Tendência (Conectado ao Supabase)</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center text-gray-400">
                    <Users className="w-12 h-12 mb-2 opacity-20" />
                    <p>Performance por Campanha (Conectado ao Supabase)</p>
                </div>
            </div>
        </div>
    );
}
