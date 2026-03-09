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

async function getTaxSettings() {
    try {
        const settings = await prisma.settings.findMany({
            where: {
                key: {
                    in: ['tax_pix_percent', 'tax_card_percent']
                }
            }
        });

        const settingsMap = {
            tax_pix_percent: '0',
            tax_card_percent: '0',
        };

        settings.forEach(setting => {
            settingsMap[setting.key as keyof typeof settingsMap] = setting.value;
        });

        return {
            pixTax: parseFloat(settingsMap.tax_pix_percent),
            cardTax: parseFloat(settingsMap.tax_card_percent)
        };
    } catch (error) {
        console.error('Error fetching tax settings:', error);
        return { pixTax: 0, cardTax: 0 };
    }
}

async function getMetrics(start?: string, end?: string) {
    try {
        if (start && end) {
            // Ajustar datas para incluir o dia inteiro em UTC
            const startDate = new Date(start + 'T00:00:00.000Z');
            const endDate = new Date(end + 'T23:59:59.999Z');

            // Buscar vendas e order bumps direto da tabela Sale
            const sales = await prisma.sale.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    items: true // Incluir order bumps/upsells
                }
            });

            if (sales.length === 0) return null;

            // Calcular métricas de vendas
            const totalMainSales = sales.length;
            const totalMainRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);

            // Calcular total de itens (vendas + order bumps)
            const totalItems = sales.reduce((acc, sale) => acc + 1 + sale.items.length, 0);

            // Calcular receita total (principal + order bumps)
            const totalRevenue = sales.reduce((acc, sale) => {
                const orderBumpRevenue = sale.items.reduce((itemAcc, item) => itemAcc + item.amount, 0);
                return acc + sale.amount + orderBumpRevenue;
            }, 0);

            // Retornar métricas calculadas direto das vendas
            return {
                date: end,
                // Métricas de vendas principais
                vendas: totalMainSales,
                receitaGerada: totalMainRevenue,

                // Métricas totais (principal + order bumps)
                totalItens: totalItems,
                receitaTotalLiquida: totalRevenue,

                // Outras métricas (valores default por enquanto - podem vir de APIs externas)
                valorGasto: 0,
                cliquesLink: 0,
                playsUnicosVSL: 0,
                visualizacaoPage: 0,
                cpa: 0,
                ticketMedio: totalMainRevenue / (totalMainSales || 1),
                ticketMedioTotal: totalRevenue / (totalMainSales || 1),
                conversaoVSL: 0,
                retencaoLeadVSL: 0,
                engajamentoVSL: 0,
                retencaoPitchVSL: 0,
                conversaocheckout: 0,
                conversaoOrderBump: 0,
                conversaoBackredirect: 0,
                conversaoUpsell: 0,
                conversaoDownsell: 0,
                conversaoUpsell2: 0,
            };
        }

        // Sem filtro de data - mostrar todas as vendas
        const sales = await prisma.sale.findMany({
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalMainSales = sales.length;
        const totalMainRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
        const totalItems = sales.reduce((acc, sale) => acc + 1 + sale.items.length, 0);
        const totalRevenue = sales.reduce((acc, sale) => {
            const orderBumpRevenue = sale.items.reduce((itemAcc, item) => itemAcc + item.amount, 0);
            return acc + sale.amount + orderBumpRevenue;
        }, 0);

        return {
            date: new Date().toISOString(),
            vendas: totalMainSales,
            receitaGerada: totalMainRevenue,
            totalItens: totalItems,
            receitaTotalLiquida: totalRevenue,
            valorGasto: 0,
            cliquesLink: 0,
            playsUnicosVSL: 0,
            visualizacaoPage: 0,
            cpa: 0,
            ticketMedio: totalMainRevenue / (totalMainSales || 1),
            ticketMedioTotal: totalRevenue / (totalMainSales || 1),
            conversaoVSL: 0,
            retencaoLeadVSL: 0,
            engajamentoVSL: 0,
            retencaoPitchVSL: 0,
            conversaocheckout: 0,
            conversaoOrderBump: 0,
            conversaoBackredirect: 0,
            conversaoUpsell: 0,
            conversaoDownsell: 0,
            conversaoUpsell2: 0,
        };
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
    const taxSettings = await getTaxSettings();

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Calcular valores líquidos com base nas taxas configuradas
    const calculateNetValues = () => {
        if (!metrics) return { netRevenue: 0, netTotalRevenue: 0 };

        // Para demonstração, assumimos que 60% são PIX e 40% cartão
        // Em implementação real, buscaríamos o método de pagamento de cada venda
        const pixPercentage = 0.6;
        const cardPercentage = 0.4;

        // Receita principal líquida
        const pixRevenue = (metrics.receitaGerada * pixPercentage);
        const cardRevenue = (metrics.receitaGerada * cardPercentage);
        const netRevenue = (pixRevenue * (1 - taxSettings.pixTax / 100)) +
                          (cardRevenue * (1 - taxSettings.cardTax / 100));

        // Receita total líquida (principal + order bumps)
        const totalPixRevenue = ((metrics.receitaTotalLiquida || metrics.receitaGerada) * pixPercentage);
        const totalCardRevenue = ((metrics.receitaTotalLiquida || metrics.receitaGerada) * cardPercentage);
        const netTotalRevenue = (totalPixRevenue * (1 - taxSettings.pixTax / 100)) +
                               (totalCardRevenue * (1 - taxSettings.cardTax / 100));

        return { netRevenue, netTotalRevenue };
    };

    const { netRevenue, netTotalRevenue } = calculateNetValues();
    const hasTaxes = taxSettings.pixTax > 0 || taxSettings.cardTax > 0;

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

                {/* Valores Líquidos - só mostrar se há taxas configuradas */}
                {hasTaxes && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div></div> {/* Espaço vazio */}
                        <MetricCard
                            title="Receita Líquida Principal"
                            value={formatCurrency(netRevenue)}
                            icon={DollarSign}
                            description={`Após taxas PIX (${taxSettings.pixTax}%) e Cartão (${taxSettings.cardTax}%)`}
                        />
                        <div></div> {/* Espaço vazio */}
                        <MetricCard
                            title="Receita Total Líquida"
                            value={formatCurrency(netTotalRevenue)}
                            icon={DollarSign}
                            description={`Após taxas PIX (${taxSettings.pixTax}%) e Cartão (${taxSettings.cardTax}%)`}
                        />
                    </div>
                )}

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
