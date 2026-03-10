import { NextRequest, NextResponse } from 'next/server';
import { HublaService } from '@/lib/hubla';
import { HublaWebhookEvent } from '@/types/hubla';
import prisma from '@/lib/prisma';

// Função para processar eventos v2 da Hubla de forma assíncrona
async function processHublaV2Event(webhookData: any, idempotencyKey?: string): Promise<void> {
  try {
    const eventType = webhookData.type;
    const eventData = webhookData.event;
    const version = webhookData.version || '1.0.0';

    console.log(`[Hubla] Processing event: ${eventType}, version: ${version}, idempotency: ${idempotencyKey}`);

    // Verificar controle de versão se aplicável
    if (eventData.invoice?.version || eventData.subscription?.version) {
      const entityVersion = eventData.invoice?.version || eventData.subscription?.version;
      const entityId = eventData.invoice?.id || eventData.subscription?.id;

      // Verificar se já processamos uma versão mais recente
      const existingRecord = await prisma.webhookEvent.findFirst({
        where: {
          entityId: entityId,
          entityVersion: { gte: entityVersion }
        }
      });

      if (existingRecord && existingRecord.entityVersion && existingRecord.entityVersion > entityVersion) {
        console.log(`[Hubla] ⚠️ Ignoring older version ${entityVersion} for entity ${entityId}`);
        return;
      }
    }

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

        // ✅ CORREÇÃO: Identificar order bump pelo padrão -offer- no externalId
        const isOrderBump = invoiceId && invoiceId.includes('-offer-');

        // Salvar evento para controle de idempotência e versão
        if (idempotencyKey) {
          await prisma.webhookEvent.create({
            data: {
              idempotencyKey,
              eventType,
              entityId: invoiceId,
              entityVersion: eventData.invoice?.version || 1,
              processedAt: new Date()
            }
          });
        }

        console.log(`[Hubla] Processing transaction: ${invoiceId}, isOrderBump: ${isOrderBump}, amount: ${amount}, email: ${email}`);

        if (isOrderBump) {
          // ✅ CORREÇÃO: Extrair ID da venda principal do externalId
          const mainSaleId = invoiceId.replace(/-offer-\d+$/, '');
          console.log(`[Hubla] Order bump detected. Main sale ID: ${mainSaleId}`);

          // Buscar venda principal pelo externalId correspondente
          const mainSale = await prisma.sale.findFirst({
            where: {
              platform: 'HUBLA',
              externalId: mainSaleId,
              customerEmail: email
            }
          });

          if (mainSale) {
            console.log(`[Hubla] ✅ Main sale found: ${mainSale.externalId}`);

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
              console.log(`[Hubla] ✅ Order bump saved as SaleItem: ${invoiceId}`);
            } else {
              console.log(`[Hubla] ⚠️  Order bump already exists: ${invoiceId}`);
            }
          } else {
            console.error(`[Hubla] ❌ Main sale not found for order bump ${invoiceId} - customer: ${email} - expected main ID: ${mainSaleId}`);
            throw new Error('Main sale not found for order bump');
          }
          return;
        }

        if (invoiceId && amount) {
          console.log(`[Hubla] Processing main sale: ${invoiceId}`);

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

            console.log(`[Hubla] ✅ Main sale created: ${invoiceId} - R$ ${amount}`);

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
          } else {
            console.log(`[Hubla] ⚠️  Sale already exists: ${invoiceId}`);
          }
        } else {
          console.error(`[Hubla] ❌ Missing invoiceId or amount - invoiceId: ${invoiceId}, amount: ${amount}`);
        }
        break;

      case 'lead.abandoned_checkout':
        // Lead abandonou carrinho - apenas logar por enquanto
        console.log(`[Hubla] Lead abandonou carrinho: ${eventData.lead?.email}`);
        break;

      case 'subscription.created':
        console.log(`[Hubla] Nova assinatura criada: ${eventData.subscription?.id}`);
        // TODO: Implementar lógica de assinatura
        break;

      case 'subscription.activated':
        console.log(`[Hubla] Assinatura ativada: ${eventData.subscription?.id}`);
        // TODO: Implementar lógica de ativação
        break;

      case 'subscription.deactivated':
        console.log(`[Hubla] Assinatura desativada: ${eventData.subscription?.id}`);
        // TODO: Implementar lógica de desativação
        break;

      case 'customer.member_added':
        console.log(`[Hubla] Novo membro adicionado: ${eventData.user?.email}`);
        // TODO: Implementar lógica de membro
        break;

      case 'customer.member_removed':
        console.log(`[Hubla] Membro removido: ${eventData.user?.email}`);
        // TODO: Implementar lógica de remoção
        break;

      case 'refund_request.accepted':
        console.log(`[Hubla] Reembolso aceito: ${eventData.invoice?.id}`);
        // TODO: Implementar lógica de reembolso
        break;

      default:
        console.log(`[Hubla] Evento não tratado: ${eventType}`);
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
  // IPs oficiais da Hubla - atualizar conforme documentação oficial
  '127.0.0.1', // Para desenvolvimento local
  '::1', // IPv6 localhost
];

// Função para verificar autenticação do token
function verifyHublaToken(receivedToken: string | null): boolean {
  const expectedToken = process.env.HUBLA_WEBHOOK_TOKEN || process.env.HUBLA_WEBHOOK_SECRET;

  if (!expectedToken) {
    console.warn('[Hubla] ⚠️ HUBLA_WEBHOOK_TOKEN não configurado');
    return true; // Permitir em desenvolvimento se não configurado
  }

  if (!receivedToken) {
    console.error('[Hubla] ❌ Token não fornecido no header x-hubla-token');
    return false;
  }

  return receivedToken === expectedToken;
}

// Função para verificar se IP está na lista permitida
function isAllowedIP(clientIP: string): boolean {
  // Em desenvolvimento, permitir qualquer IP
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Extrair IP real de headers de proxy
  const realIP = clientIP.split(',')[0].trim();

  return HUBLA_ALLOWED_IPS.includes(realIP) || realIP.startsWith('192.168.') || realIP.startsWith('10.');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verificar IP do remetente (TEMPORARIAMENTE DESABILITADO)
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    // TODO: Reativar quando tivermos os IPs oficiais da Hubla
    // if (!isAllowedIP(clientIP)) {
    //   console.error(`[Hubla] ❌ IP não autorizado: ${clientIP}`);
    //   return NextResponse.json(
    //     { error: 'IP not allowed' },
    //     { status: 403 }
    //   );
    // }
    console.log(`[Hubla] 📡 Webhook recebido do IP: ${clientIP} (validação de IP desabilitada)`);

    // 2. Verificar autenticação via token
    const hublaToken = request.headers.get('x-hubla-token');
    if (!verifyHublaToken(hublaToken)) {
      console.error(`[Hubla] ❌ Token inválido ou ausente - Esperado: ${process.env.HUBLA_WEBHOOK_TOKEN}, Recebido: ${hublaToken}`);
      return NextResponse.json(
        { error: 'Invalid or missing authentication token' },
        { status: 401 }
      );
    }
    console.log(`[Hubla] ✅ Token válido - autenticação bem-sucedida`);

    // 3. Verificar idempotência ANTES de processar
    const idempotencyKey = request.headers.get('x-hubla-idempotency');

    if (idempotencyKey) {
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { idempotencyKey }
      });

      if (existingEvent) {
        console.log(`[Hubla] ✅ Evento já processado (idempotência): ${idempotencyKey}`);
        return NextResponse.json({
          status: 'already_processed',
          message: 'Event already processed',
          processed_at: existingEvent.processedAt
        });
      }
    }

    // 4. Ler o corpo da requisição
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

    // 5. Verificar se tem os campos obrigatórios
    if (!webhookData.event && !(webhookData as any).type) {
      console.error('Webhook missing both event and type fields');
      return NextResponse.json(
        { error: 'Missing required fields: event or type' },
        { status: 400 }
      );
    }

    // 6. Retornar resposta 200 RAPIDAMENTE (conforme boas práticas)
    const responsePromise = NextResponse.json({
      status: 'received',
      message: 'Webhook received and will be processed',
      event_id: (webhookData as any).id || idempotencyKey || 'unknown',
      processing_time: `${Date.now() - startTime}ms`
    });

    // 7. Processar evento de forma ASSÍNCRONA (não bloquear resposta)
    setImmediate(async () => {
      try {
        if ((webhookData as any).type && webhookData.event) {
          // Formato v2 da Hubla (com 'type' e 'event')
          await processHublaV2Event(webhookData, idempotencyKey || undefined);
        } else if (webhookData.event && webhookData.data) {
          // Formato legacy da Hubla
          const hublaService = HublaService.getInstance();
          await hublaService.processWebhookEvent(webhookData);
        }

        console.log(`[Hubla] ✅ Evento processado com sucesso em ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error('[Hubla] ❌ Erro no processamento assíncrono:', error);
        // Em produção, você pode querer implementar retry ou dead letter queue
      }
    });

    // Retornar resposta de sucesso IMEDIATAMENTE
    return responsePromise;

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
    message: 'Hubla webhook endpoint is active (v2.0)',
    timestamp: new Date().toISOString(),
    security: {
      token_auth: true, // Reativado com token correto
      token_configured: !!process.env.HUBLA_WEBHOOK_TOKEN || !!process.env.HUBLA_WEBHOOK_SECRET,
      ip_filtering: false, // Temporariamente desabilitado
      idempotency: true,
      version_control: true,
      async_processing: true
    },
    note: "IP filtering temporarily disabled - only token authentication active"
  });
}