export interface KiwifyWebhookEvent {
    id: string;
    event: KiwifyEventType;
    data: KiwifyEventData;
    timestamp?: string;
}

export type KiwifyEventType =
    | 'sale.created'
    | 'sale.approved'
    | 'sale.cancelled'
    | 'sale.refunded'
    | 'sale.chargeback'
    | 'sale.dispute'
    | 'cart.abandoned'
    | 'subscription.created'
    | 'subscription.cancelled'
    | 'subscription.renewed';

export interface KiwifyEventData {
    sale_id?: string;
    product_id?: string;
    product_name?: string;
    customer_email?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_document?: string;
    amount?: number;
    status?: string;
    payment_method?: string;
    checkout_url?: string;
    boleto_url?: string;
    pix_code?: string;
    created_at?: string;
    updated_at?: string;
    commission?: number;
    affiliate_id?: string;
    affiliate_name?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

export interface KiwifySale {
    id: string;
    productId: string;
    productName: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    status: string;
    paymentMethod: string;
    createdAt: Date;
    affiliate?: {
        id: string;
        name: string;
        commission: number;
    };
    utmParams?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
}

export interface KiwifyMetrics {
    totalSales: number;
    totalRevenue: number;
    totalRefunds: number;
    refundedAmount: number;
    conversionRate: number;
    averageTicket: number;
    abandonedCarts: number;
    activeSubscriptions: number;
}