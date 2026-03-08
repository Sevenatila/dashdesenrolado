import { NextRequest, NextResponse } from 'next/server';
import { HublaService } from '@/lib/hubla';
import { HublaWebhookEvent } from '@/types/hubla';
import prisma from '@/lib/prisma';

// Função para processar eventos v2 da Hubla
async function processHublaV2Event(webhookData: any): Promise<void> {
  try {
    const eventType = webhookData.type;
    const eventData = webhookData.event;

    console.log('Processing Hubla v2 event:', eventType);

    switch (eventType) {
      case 'invoice.paid':
      case 'payment.approved':
      case 'purchase.approved':
        // Processar pagamento/venda aprovado
        if (eventData.lead && eventData.lead.amount) {
          const leadId = eventData.lead.id;
          const amount = eventData.lead.amount.totalCents / 100; // Converter de centavos
          const email = eventData.lead.email;
          const fullName = eventData.lead.fullName;

          // Verificar se já existe
          const existing = await prisma.sale.findFirst({
            where: { externalId: leadId }
          });

          if (!existing) {
            await prisma.sale.create({
              data: {
                platform: 'HUBLA',
                externalId: leadId,
                amount: amount,
                status: 'approved',
                customerEmail: email || 'unknown@hubla.com',
                createdAt: eventData.lead.createdAt ? new Date(eventData.lead.createdAt) : new Date(),
                utmSource: eventData.lead.session?.utm?.source || null,
                utmMedium: eventData.lead.session?.utm?.medium || null,
                utmCampaign: eventData.lead.session?.utm?.campaign || null,
                utmContent: eventData.lead.session?.utm?.content || null,
                utmTerm: eventData.lead.session?.utm?.term || null
              }
            });

            console.log(`✅ Hubla v2 sale saved: ${leadId} - R$ ${amount} - ${email}`);

            // Atualizar métricas diárias
            const date = eventData.lead.createdAt ? new Date(eventData.lead.createdAt) : new Date();
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            await prisma.dailyPerformance.upsert({
              where: { date: startOfDay },
              update: {
                vendas: { increment: 1 },
                receitaGerada: { increment: amount }
              },
              create: {
                date: startOfDay,
                vendas: 1,
                receitaGerada: amount
              }
            });
          }
        }
        break;

      case 'lead.abandoned_checkout':
        // Lead abandonou carrinho - apenas logar por enquanto
        console.log('Lead abandoned checkout:', eventData.lead?.email);
        break;

      case 'subscription.created':
      case 'subscription.cancelled':
        console.log('Subscription event:', eventType, eventData.lead?.email);
        break;

      default:
        console.log('Unhandled Hubla v2 event type:', eventType);
    }
  } catch (error) {
    console.error('Error processing Hubla v2 event:', error);
    // Não jogar erro para não bloquear webhook
  }
}

// Lista de IPs permitidos da Hubla (baseado na documentação)
const HUBLA_ALLOWED_IPS = [
  // Adicionar IPs reais da Hubla aqui conforme documentação
  '127.0.0.1', // Para desenvolvimento local
];

export async function POST(request: NextRequest) {
  try {
    // Verificar IP do remetente (opcional, para produção)
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    console.log('Webhook received from IP:', clientIP);

    // Ler o corpo da requisição
    const body = await request.text();
    let webhookData: HublaWebhookEvent;

    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Log dos dados recebidos para debug
    console.log('Hubla webhook structure:', {
      hasEvent: !!webhookData.event,
      hasData: !!webhookData.data,
      hasType: !!webhookData.type,
      hasVersion: !!webhookData.version,
      type: webhookData.type,
      keys: Object.keys(webhookData)
    });

    // Aceitar formato v2 da Hubla (com 'type' e 'event')
    if (webhookData.type && webhookData.event) {
      // Processar formato v2
      console.log('Processing Hubla v2 webhook:', webhookData.type);

      // Passar para processamento específico baseado no tipo
      webhookData = {
        event: webhookData.type,
        data: webhookData.event,
        id: webhookData.event?.id || `hubla_${Date.now()}`,
        version: webhookData.version
      };
    }

    // Verificar se tem os campos obrigatórios (formato v1)
    if (!webhookData.event || !webhookData.data) {
      console.warn('Webhook missing event or data, but processing anyway');
      // Não retornar erro para não bloquear
    }

    // Verificar header de idempotência
    const idempotencyKey = request.headers.get('x-hubla-idempotency');
    if (idempotencyKey && idempotencyKey === webhookData.idempotency_key) {
      console.log('Duplicate webhook event detected:', idempotencyKey);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Processar evento baseado no tipo real da Hubla
    if (webhookData.type && webhookData.event) {
      await processHublaV2Event(webhookData);
    } else {
      // Processar formato legacy
      const hublaService = HublaService.getInstance();
      await hublaService.processWebhookEvent(webhookData);
    }

    // Log do evento processado
    console.log('Hubla webhook processed successfully:', {
      event: webhookData.event,
      id: webhookData.id,
      timestamp: new Date().toISOString()
    });

    // Retornar resposta de sucesso rapidamente
    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully',
      event_id: webhookData.id
    });

  } catch (error) {
    console.error('Error processing Hubla webhook:', error);

    // Retornar erro 500 para que a Hubla tente reenviar
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Hubla webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}