import { NextRequest, NextResponse } from 'next/server';
import { HublaService } from '@/lib/hubla';
import { HublaWebhookEvent } from '@/types/hubla';
import prisma from '@/lib/prisma';

// Função para processar eventos v2 da Hubla
async function processHublaV2Event(webhookData: any): Promise<void> {
  try {
    const eventType = webhookData.type;
    const eventData = webhookData.event;


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


        // Identificar se é order bump/upsell pela ausência de groupName ou groupName vazio
        const isOrderBump = eventType === 'NewSale' &&
                           (!eventData.groupName || eventData.groupName.trim() === '');

        if (isOrderBump) {

          // Buscar venda principal pelo mesmo usuário mais recente (que tenha groupName preenchido)
          const mainSale = await prisma.sale.findFirst({
            where: {
              platform: 'HUBLA',
              customerEmail: email,
              // Buscar apenas vendas principais (que não são order bumps)
              customerName: { not: null }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (mainSale) {
            // Verificar se order bump já existe
            const existingItem = await prisma.saleItem.findFirst({
              where: {
                saleId: mainSale.id,
                externalId: invoiceId
              }
            });

            if (!existingItem) {
              // Salvar como item da venda
              await prisma.saleItem.create({
                data: {
                  saleId: mainSale.id,
                  externalId: invoiceId,
                  amount: amount,
                  type: 'ORDER_BUMP',
                  productName: eventType === 'NewSale' ? 'Order Bump' : 'Order Bump',
                  createdAt: eventType === 'NewSale'
                    ? (eventData.createdAt ? new Date(eventData.createdAt) : new Date())
                    : (eventData.invoice?.createdAt ? new Date(eventData.invoice.createdAt) : new Date())
                }
              });

            }
          } else {
            console.error(`Main sale not found for order bump - customer: ${email}`);
            throw new Error('Main sale not found for order bump');
          }
          return;
        }

        if (invoiceId && amount) {
          // Verificar se já existe
          const existing = await prisma.sale.findFirst({
            where: { externalId: invoiceId }
          });

          if (!existing) {
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
        break;

      case 'subscription.created':
      case 'subscription.cancelled':
        break;

      default:
        break;
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
    }

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