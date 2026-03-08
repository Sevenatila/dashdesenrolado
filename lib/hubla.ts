import {
  HublaWebhookEvent,
  HublaSale,
  HublaLead,
  HublaDashboardMetrics,
  HublaEventType
} from '@/types/hubla';
import prisma from '@/lib/prisma';

export class HublaService {
  private static instance: HublaService;
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.HUBLA_WEBHOOK_SECRET || '';
  }

  static getInstance(): HublaService {
    if (!HublaService.instance) {
      HublaService.instance = new HublaService();
    }
    return HublaService.instance;
  }

  // Verificar se o webhook é válido (baseado nos IPs da Hubla)
  verifyWebhookSignature(signature: string, body: string): boolean {
    // Implementar verificação de assinatura da Hubla
    // Por enquanto, retorna true para desenvolvimento
    return true;
  }

  // Processar evento de webhook recebido
  async processWebhookEvent(event: HublaWebhookEvent): Promise<void> {
    try {
      console.log('Processing Hubla webhook event:', event.event);

      switch (event.event) {
        case HublaEventType.SALE_CREATED:
        case HublaEventType.SALE_UPDATED:
          await this.processSaleEvent(event.data);
          break;

        case HublaEventType.LEAD_CREATED:
        case HublaEventType.LEAD_UPDATED:
          await this.processLeadEvent(event.data);
          break;

        case HublaEventType.PAYMENT_APPROVED:
          await this.processPaymentApproved(event.data);
          break;

        case HublaEventType.SALE_REFUNDED:
          await this.processRefund(event.data);
          break;

        default:
          console.log('Unhandled event type:', event.event);
      }
    } catch (error) {
      console.error('Error processing Hubla webhook:', error);
      throw error;
    }
  }

  private async processSaleEvent(saleData: HublaSale): Promise<void> {
    console.log('Processing Hubla sale:', saleData);

    try {
      // Salvar venda no modelo Sale existente
      await prisma.sale.upsert({
        where: {
          externalId: String(saleData.id)
        },
        update: {
          amount: Number(saleData.amount || 0),
          status: String(saleData.status || 'approved').toLowerCase(),
          customerEmail: String(saleData.customer?.email || ''),
        },
        create: {
          platform: 'HUBLA',
          externalId: String(saleData.id),
          amount: Number(saleData.amount || 0),
          status: String(saleData.status || 'approved').toLowerCase(),
          customerEmail: String(saleData.customer?.email || ''),
          createdAt: saleData.created_at ? new Date(saleData.created_at) : new Date(),
        },
      });

      console.log('Hubla sale saved successfully');

      // Atualizar métricas diárias
      await this.updateDailyMetrics(
        saleData.created_at ? new Date(saleData.created_at) : new Date(),
        Number(saleData.amount || 0),
        'sale'
      );
    } catch (error) {
      console.error('Error saving Hubla sale:', error);
      throw error;
    }
  }

  private async processLeadEvent(leadData: HublaLead): Promise<void> {
    console.log('Processing lead:', leadData);

    // Exemplo: salvar no banco de dados
    // await prisma.hublaLead.upsert({
    //   where: { hubla_id: leadData.id },
    //   update: leadData,
    //   create: leadData
    // });
  }

  private async processPaymentApproved(paymentData: any): Promise<void> {
    console.log('Processing Hubla payment approval:', paymentData);

    try {
      // Atualizar status da venda para aprovada
      if (paymentData.id) {
        await prisma.sale.updateMany({
          where: {
            platform: 'HUBLA',
            externalId: String(paymentData.id)
          },
          data: {
            status: 'approved'
          }
        });

        console.log('Hubla payment approved and sale updated');
      }
    } catch (error) {
      console.error('Error processing Hubla payment approval:', error);
    }
  }

  // Processar evento de reembolso
  private async processRefund(refundData: any): Promise<void> {
    console.log('Processing Hubla refund:', refundData);

    try {
      if (refundData.id) {
        await prisma.sale.updateMany({
          where: {
            platform: 'HUBLA',
            externalId: String(refundData.id)
          },
          data: {
            status: 'refunded'
          }
        });

        // Atualizar métricas para reembolso
        await this.updateDailyMetrics(
          refundData.created_at ? new Date(refundData.created_at) : new Date(),
          Number(refundData.amount || 0),
          'refund'
        );

        console.log('Hubla refund processed successfully');
      }
    } catch (error) {
      console.error('Error processing Hubla refund:', error);
    }
  }

  // Calcular métricas do dashboard
  async getDashboardMetrics(startDate: string, endDate: string): Promise<HublaDashboardMetrics> {
    // Aqui você buscaria os dados do banco e calcularia as métricas
    // Por enquanto, retornando dados de exemplo
    return {
      total_sales: 0,
      total_revenue: 0,
      conversion_rate: 0,
      total_leads: 0,
      pending_payments: 0,
      refunded_amount: 0,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    };
  }

  // Buscar vendas por período
  async getSalesByPeriod(startDate: string, endDate: string): Promise<HublaSale[]> {
    // Implementar busca no banco de dados
    return [];
  }

  // Buscar leads por período
  async getLeadsByPeriod(startDate: string, endDate: string): Promise<HublaLead[]> {
    // Implementar busca no banco de dados
    return [];
  }

  // Atualizar métricas diárias
  private async updateDailyMetrics(date: Date, amount: number, type: 'sale' | 'refund'): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Buscar ou criar registro de performance do dia
      const performance = await prisma.dailyPerformance.upsert({
        where: {
          date: startOfDay
        },
        update: {
          vendas: type === 'sale' ? { increment: 1 } : { decrement: 1 },
          receitaGerada: type === 'sale' ? { increment: amount } : { decrement: amount },
        },
        create: {
          date: startOfDay,
          vendas: type === 'sale' ? 1 : 0,
          receitaGerada: type === 'sale' ? amount : 0,
        },
      });

      console.log(`Daily metrics updated for ${startOfDay.toISOString().split('T')[0]}: ${type} ${amount}`);
    } catch (error) {
      console.error('Error updating daily metrics:', error);
    }
  }
}