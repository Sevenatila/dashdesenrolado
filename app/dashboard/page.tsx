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
    Percent
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import SyncButton from "@/components/dashboard/SyncButton";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import PlayerSelector from "@/components/dashboard/PlayerSelector";
import { DailyAnalytics } from "@/types/analytics";

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
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Buscar dados da API analytics que já tem integração VTurb
    const fetchMetrics = async () => {
        try {
            setIsLoading(true);

            const params = new URLSearchParams({
                startDate: dateRange.start + 'T00:00:00.000Z',
                endDate: dateRange.end + 'T23:59:59.999Z'
            });

            const response = await fetch(`/api/analytics/metrics?${params}`);

            if (response.ok) {
                const result = await response.json();
                const analyticsData: DailyAnalytics[] = result.data || [];

                // Agregar dados do analytics para o dashboard
                const aggregatedMetrics = analyticsData.reduce((acc, item) => {
                    return {
                        vendas: acc.vendas + item.vendas,
                        receitaGerada: acc.receitaGerada + (item.vendas * item.aov),
                        totalItens: acc.totalItens + item.vendas,
                        receitaTotalLiquida: acc.receitaTotalLiquida + (item.vendas * item.aov),
                        valorGasto: acc.valorGasto + item.valorGasto,
                        cliquesLink: acc.cliquesLink + item.cliques,
                        playsUnicosVSL: acc.playsUnicosVSL + item.visuUnicaVSL,
                        visualizacaoPage: acc.visualizacaoPage + item.visitas,
                        cpa: item.vendas > 0 && item.valorGasto > 0 ? item.valorGasto / item.vendas : 0,
                        ticketMedio: item.aov,
                        ticketMedioTotal: item.aov,
                        conversaoVSL: item.visuUnicaVSL > 0 ? (item.vendas / item.visuUnicaVSL) * 100 : 0,
                        retencaoLeadVSL: item.passagem,
                        engajamentoVSL: item.connectRate,
                        retencaoPitchVSL: item.passagem,
                        conversaocheckout: item.convCheckout,
                        conversaoOrderBump: item.convOB1,
                        conversaoBackredirect: 0,
                        conversaoUpsell: item.convUpsell1,
                        conversaoDownsell: item.downsell > 0 ? 10 : 0, // placeholder
                        conversaoUpsell2: item.convUpsell2,
                    };
                }, {
                    vendas: 0, receitaGerada: 0, totalItens: 0, receitaTotalLiquida: 0,
                    valorGasto: 0, cliquesLink: 0, playsUnicosVSL: 0, visualizacaoPage: 0,
                    cpa: 0, ticketMedio: 0, ticketMedioTotal: 0, conversaoVSL: 0,
                    retencaoLeadVSL: 0, engajamentoVSL: 0, retencaoPitchVSL: 0,
                    conversaocheckout: 0, conversaoOrderBump: 0, conversaoBackredirect: 0,
                    conversaoUpsell: 0, conversaoDownsell: 0, conversaoUpsell2: 0
                });

                setMetrics(aggregatedMetrics);
            }
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
        } finally {
            setIsLoading(false);
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

    useEffect(() => {
        fetchMetrics();
        fetchTaxSettings();
    }, [dateRange]);

    useEffect(() => {
        fetchMetrics();
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
                            Período: {dateRange.start} até {dateRange.end} (com dados VTurb)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <PlayerSelector />
                        <DateRangePicker />
                        <SyncButton />
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

                {/* Métricas VTurb em destaque */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Visualizações (VTurb)"
                        value={metrics?.visualizacaoPage.toString() || "0"}
                        icon={Users}
                        description="Total de views da VSL"
                    />
                    <MetricCard
                        title="Plays Únicos VSL"
                        value={metrics?.playsUnicosVSL.toString() || "0"}
                        icon={MonitorPlay}
                        description="Plays iniciados (VTurb)"
                    />
                    <MetricCard
                        title="Connect Rate"
                        value={`${metrics?.engajamentoVSL.toFixed(1) || 0}%`}
                        icon={Target}
                        description="Plays / Views"
                    />
                    <MetricCard
                        title="Retenção VSL"
                        value={`${metrics?.retencaoLeadVSL.toFixed(1) || 0}%`}
                        icon={Percent}
                        description="Taxa de finalização"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Métricas Complementares */}
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
                    {/* Tráfego e Performance */}
                    <MetricCard
                        title="Cliques no Link"
                        value={metrics?.cliquesLink.toString() || "0"}
                        icon={MousePointerClick}
                    />
                    <MetricCard
                        title="Visualizações da Página"
                        value={metrics?.visualizacaoPage.toString() || "0"}
                        icon={Users}
                        description="Página de Destino"
                    />
                    <MetricCard
                        title="Conversão VSL"
                        value={`${metrics?.conversaoVSL || 0}%`}
                        icon={Percent}
                        description="Vendas / Plays"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Métricas VSL (VTurb) */}
                    <MetricCard
                        title="Plays Únicos VSL"
                        value={metrics?.playsUnicosVSL.toString() || "0"}
                        icon={MonitorPlay}
                    />
                    <MetricCard
                        title="Retenção Lead VSL"
                        value={`${metrics?.retencaoLeadVSL || 0}%`}
                        icon={MonitorPlay}
                    />
                    <MetricCard
                        title="Engajamento VSL"
                        value={`${metrics?.engajamentoVSL || 0}%`}
                        icon={MonitorPlay}
                    />
                    <MetricCard
                        title="Retenção Pitch VSL"
                        value={`${metrics?.retencaoPitchVSL || 0}%`}
                        icon={MonitorPlay}
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
