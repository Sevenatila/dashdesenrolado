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
import prisma from "@/lib/prisma";

async function getMetrics(start?: string, end?: string) {
    try {
        if (start && end) {
            const metrics = await prisma.dailyPerformance.findMany({
                where: {
                    date: {
                        gte: new Date(start),
                        lte: new Date(end)
                    }
                }
            });

            if (metrics.length === 0) return null;

            // Agrega os dados do período
            return {
                date: end,
                receitaGerada: metrics.reduce((acc, m) => acc + m.receitaGerada, 0),
                vendas: metrics.reduce((acc, m) => acc + m.vendas, 0),
                valorGasto: metrics.reduce((acc, m) => acc + m.valorGasto, 0),
                cliquesLink: metrics.reduce((acc, m) => acc + m.cliquesLink, 0),
                playsUnicosVSL: metrics.reduce((acc, m) => acc + m.playsUnicosVSL, 0),
                visualizacaoPage: metrics.reduce((acc, m) => acc + m.visualizacaoPage, 0),
                // Médias ponderadas para outras métricas seriam ideais, mas aqui fazemos médias simples ou novos cálculos
                cpa: metrics.reduce((acc, m) => acc + m.valorGasto, 0) / (metrics.reduce((acc, m) => acc + m.vendas, 0) || 1),
                ticketMedio: metrics.reduce((acc, m) => acc + m.receitaGerada, 0) / (metrics.reduce((acc, m) => acc + m.vendas, 0) || 1),
                conversaoVSL: Math.round(metrics.reduce((acc, m) => acc + m.conversaoVSL, 0) / metrics.length),
                retencaoLeadVSL: Math.round(metrics.reduce((acc, m) => acc + m.retencaoLeadVSL, 0) / metrics.length),
                engajamentoVSL: Math.round(metrics.reduce((acc, m) => acc + m.engajamentoVSL, 0) / metrics.length),
                retencaoPitchVSL: Math.round(metrics.reduce((acc, m) => acc + m.retencaoPitchVSL, 0) / metrics.length),
                conversaocheckout: Math.round(metrics.reduce((acc, m) => acc + m.conversaocheckout, 0) / metrics.length),
                conversaoOrderBump: Math.round(metrics.reduce((acc, m) => acc + m.conversaoOrderBump, 0) / metrics.length),
                conversaoBackredirect: Math.round(metrics.reduce((acc, m) => acc + m.conversaoBackredirect, 0) / metrics.length),
                conversaoUpsell: Math.round(metrics.reduce((acc, m) => acc + m.conversaoUpsell, 0) / metrics.length),
                conversaoDownsell: Math.round(metrics.reduce((acc, m) => acc + m.conversaoDownsell, 0) / metrics.length),
                conversaoUpsell2: Math.round(metrics.reduce((acc, m) => acc + m.conversaoUpsell2, 0) / metrics.length),
            };
        }

        const latest = await prisma.dailyPerformance.findFirst({
            orderBy: { date: 'desc' }
        });
        return latest;
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return null;
    }
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ start?: string; end?: string }>;
}) {
    const { start, end } = await searchParams;
    const metrics = await getMetrics(start, end);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Métricas de Tomada de Decisão</h2>
                        <p className="text-sm text-gray-500">
                            Período: {start ? `${new Date(start).toLocaleDateString('pt-BR')} até ${new Date(end!).toLocaleDateString('pt-BR')}` : 'Últimos dados disponíveis'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <PlayerSelector />
                        <DateRangePicker />
                        <SyncButton />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Financeiro e Vendas */}
                    <MetricCard
                        title="Receita Gerada"
                        value={formatCurrency(metrics?.receitaGerada || 0)}
                        icon={DollarSign}
                        description="UTMify"
                    />
                    <MetricCard
                        title="Vendas Totais"
                        value={metrics?.vendas.toString() || "0"}
                        icon={ShoppingCart}
                    />
                    <MetricCard
                        title="Ticket Médio"
                        value={formatCurrency(metrics?.ticketMedio || 0)}
                        icon={BarChart3}
                        description="Receita / Vendas"
                    />
                    <MetricCard
                        title="Valor Gasto"
                        value={formatCurrency(metrics?.valorGasto || 0)}
                        icon={TrendingUp}
                        description="Meta Ads"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Tráfego e Performance */}
                    <MetricCard
                        title="CPA Total"
                        value={formatCurrency(metrics?.cpa || 0)}
                        icon={Target}
                        description="Gasto / Vendas"
                    />
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
