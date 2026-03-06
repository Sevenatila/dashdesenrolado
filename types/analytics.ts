export interface DailyAnalytics {
    date: Date;

    // Métricas de Tráfego
    valorGasto: number;
    cliques: number;
    cpc: number; // Custo Por Clique
    visitas: number;
    cpv: number; // Custo Por Visita
    connectRate: number; // Taxa de Conexão (%)

    // Métricas de Engajamento
    passagem: number; // % Passagem
    visuUnicaVSL: number; // Visualizações Únicas VSL
    cpvv: number; // Custo Por Visualização VSL

    // Métricas de Checkout
    iniciouCheckout: number;
    convCheckout: number; // Taxa de Conversão Checkout (%)

    // Métricas de Vendas Principal
    vendas: number;
    aov: number; // Average Order Value (Ticket Médio)
    cpa: number; // Custo Por Aquisição

    // Order Bumps
    vendasOB1: number;
    convOB1: number; // Conversão Order Bump 1 (%)
    vendasOB2: number;
    convOB2: number; // Conversão Order Bump 2 (%)

    // Upsells
    upsell1: number;
    convUpsell1: number; // Conversão Upsell 1 (%)
    upsell2: number;
    convUpsell2: number; // Conversão Upsell 2 (%)

    // Downsells
    downsell: number;
    convDownsell?: number; // Conversão Downsell (%)

    // Observações e Extras
    observacoes?: string;
}

export interface MetricsSummary {
    // Totais
    totalGasto: number;
    totalCliques: number;
    totalVisitas: number;
    totalVendas: number;
    totalReceita: number;

    // Médias
    cpcMedio: number;
    cpvMedio: number;
    cpaMedio: number;
    aovMedio: number;

    // Taxas de Conversão
    taxaConversaoGeral: number;
    taxaCheckout: number;
    taxaOB1: number;
    taxaOB2: number;
    taxaUpsell1: number;
    taxaUpsell2: number;

    // ROI
    roi: number;
    roas: number; // Return on Ad Spend
}

export interface AnalyticsFilters {
    startDate?: Date;
    endDate?: Date;
    campaign?: string;
    source?: string;
    product?: string;
}