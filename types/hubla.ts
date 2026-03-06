// Tipos para integração com Hubla

export interface HublaWebhookEvent {
  id: string;
  event: HublaEventType;
  data: any;
  created_at: string;
  idempotency_key: string;
}

export enum HublaEventType {
  // Eventos de venda
  SALE_CREATED = 'sale.created',
  SALE_UPDATED = 'sale.updated',
  SALE_REFUNDED = 'sale.refunded',
  SALE_CANCELLED = 'sale.cancelled',

  // Eventos de pagamento
  PAYMENT_APPROVED = 'payment.approved',
  PAYMENT_REJECTED = 'payment.rejected',
  PAYMENT_WAITING = 'payment.waiting',

  // Eventos de lead
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',

  // Eventos de produto
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated'
}

export interface HublaSale {
  id: string;
  product_id: string;
  product_name: string;
  customer: HublaCustomer;
  amount: number;
  currency: string;
  status: HublaSaleStatus;
  payment_method: string;
  created_at: string;
  updated_at: string;
  commission?: number;
  affiliate?: HublaAffiliate;
}

export interface HublaCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  created_at: string;
}

export interface HublaAffiliate {
  id: string;
  name: string;
  email: string;
  commission_percentage: number;
}

export enum HublaSaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  WAITING_PAYMENT = 'waiting_payment'
}

export interface HublaLead {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  product_id: string;
  product_name: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
}

export interface HublaProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface HublaDashboardMetrics {
  total_sales: number;
  total_revenue: number;
  conversion_rate: number;
  total_leads: number;
  pending_payments: number;
  refunded_amount: number;
  period: {
    start_date: string;
    end_date: string;
  };
}