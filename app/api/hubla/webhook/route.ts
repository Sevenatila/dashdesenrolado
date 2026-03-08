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
      case 'invoice.payment_succeeded':  // Adicionar este evento da Hubla
      case 'payment.approved':
      case 'purchase.approved':
      case 'NewSale':  // Formato v1 da Hubla
        // Processar pagamento/venda aprovado
        let invoiceId, amount, email, fullName;

        if (eventType === 'NewSale') {
          // Formato v1 da Hubla (NewSale)
          invoiceId = eventData.transactionId;
          amount = eventData.totalAmount;
          email = eventData.userEmail;
          fullName = eventData.userName;
        } else {
          // Formato v2 da Hubla (invoice.payment_succeeded)
          const invoiceData = eventData.invoice || eventData.lead;
          const userData = eventData.user || eventData.payer || invoiceData?.payer;
          invoiceId = invoiceData?.id;
          amount = invoiceData?.amount?.totalCents / 100; // Converter de centavos
          email = userData?.email;
          fullName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : '';
        }

        console.log('Processed webhook data:', { invoiceId, amount, email, fullName, eventType });

        if (invoiceId && amount) {
          console.log('Attempting to save sale to database...');

          // Verificar se já existe
          const existing = await prisma.sale.findFirst({
            where: { externalId: invoiceId }
          });

          console.log('Existing sale check:', existing ? 'Found existing' : 'No existing sale');

          if (!existing) {
            console.log('Creating new sale record...');
            await prisma.sale.create({
              data: {
                platform: 'HUBLA',
                externalId: invoiceId,
                amount: amount,
                status: 'approved',
                customerEmail: email || 'unknown@hubla.com',
                createdAt: eventType === 'NewSale'
                  ? (eventData.createdAt ? new Date(eventData.createdAt) : new Date())
                  : (eventData.invoice?.createdAt ? new Date(eventData.invoice.createdAt) : new Date()),
                utmSource: eventType === 'NewSale'
                  ? null  // NewSale não tem UTM no formato mostrado
                  : (eventData.invoice?.paymentSession?.utm?.source || null),
                utmMedium: eventType === 'NewSale'
                  ? null
                  : (eventData.invoice?.paymentSession?.utm?.medium || null),
                utmCampaign: eventType === 'NewSale'
                  ? null
                  : (eventData.invoice?.paymentSession?.utm?.campaign || null),
                utmContent: eventType === 'NewSale'
                  ? null
                  : (eventData.invoice?.paymentSession?.utm?.content || null),
                utmTerm: eventType === 'NewSale'
                  ? null
                  : (eventData.invoice?.paymentSession?.utm?.term || null)
              }
            });

            console.log(`✅ Hubla v2 sale saved: ${invoiceId} - R$ ${amount} - ${email}`);

            // Atualizar métricas diárias
            const date = eventType === 'NewSale'
              ? (eventData.createdAt ? new Date(eventData.createdAt) : new Date())
              : (eventData.invoice?.createdAt ? new Date(eventData.invoice.createdAt) : new Date());
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
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error; // Jogar erro para que webhook retorne 500
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
      hasType: !!(webhookData as any).type,
      hasVersion: !!(webhookData as any).version,
      type: (webhookData as any).type,
      keys: Object.keys(webhookData)
    });

    // Log formato para debug
    if ((webhookData as any).type && webhookData.event) {
      console.log('Detected Hubla v2 webhook format:', (webhookData as any).type);
    }

    // Log detalhado para debug
    console.log('Full webhook payload:', JSON.stringify(webhookData, null, 2));

    // Verificar se tem os campos obrigatórios
    if (!webhookData.event && !(webhookData as any).type) {
      console.error('Webhook missing both event and type fields');
      return NextResponse.json(
        { error: 'Missing required fields: event or type' },
        { status: 400 }
      );
    }

    // Verificar header de idempotência
    const idempotencyKey = request.headers.get('x-hubla-idempotency');
    if (idempotencyKey && idempotencyKey === webhookData.idempotency_key) {
      console.log('Duplicate webhook event detected:', idempotencyKey);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Processar evento baseado no formato
    if ((webhookData as any).type && webhookData.event) {
      // Formato v2 da Hubla (com 'type' e 'event')
      await processHublaV2Event(webhookData);
    } else if (webhookData.event && webhookData.data) {
      // Formato legacy da Hubla
      const hublaService = HublaService.getInstance();
      await hublaService.processWebhookEvent(webhookData);
    } else {
      console.warn('Unknown webhook format:', Object.keys(webhookData));
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