import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Interface para o webhook da Kiwify
interface KiwifyWebhookPayload {
  order_id: string;
  order_ref: string;
  order_status: string;
  payment_method: string;
  store_id: string;
  payment_merchant_id: string;
  installments: number;
  card_type?: string;
  card_last4digits?: string;
  card_rejection_reason?: string | null;
  pix_code?: string | null;
  pix_expiration?: string | null;
  boleto_URL?: string | null;
  boleto_barcode?: string | null;
  boleto_expiry_date?: string | null;
  sale_type: string;
  approved_date?: string;
  created_at: string;
  updated_at: string;
  webhook_event_type: string;
  product_type: string;
  Product: {
    product_id: string;
    product_name: string;
  };
  Customer: {
    full_name: string;
    first_name: string;
    email: string;
    mobile?: string | null;
    CPF?: string | null;
    ip: string;
    country?: string | null;
  };
  Commissions: {
    charge_amount: string; // Em centavos
    currency: string;
    product_base_price: string;
    product_base_price_currency: string;
    kiwify_fee: string;
    kiwify_fee_currency: string;
    commissioned_stores: Array<{
      id: string;
      type: string;
      custom_name: string;
      affiliate_id: string;
      email: string;
      value: string;
    }>;
    my_commission: string;
    funds_status?: string | null;
    estimated_deposit_date?: string | null;
    deposit_date?: string | null;
  };
  TrackingParameters: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  Subscription?: {
    start_date: string;
    next_payment: string;
    status: string;
    customer_access: {
      has_access: boolean;
      active_period: boolean;
      access_until: string;
    };
    plan: {
      id: string;
      name: string;
      frequency: string;
      qty_charges: number;
    };
    charges: {
      completed: Array<any>;
      future: Array<any>;
    };
  };
  subscription_id?: string;
  checkout_link: string;
  access_url: string;
  SmartInstallment?: {
    id: string;
    installment_number: number;
    installment_quantity: number;
    first_installment_date: string;
    last_installment_date: string;
    amount_total: number;
    fees_total: number;
    interest_total: number;
  };
}

// Função para verificar signature HMAC-SHA1
function verifyKiwifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) {
    console.warn('[Kiwify] ⚠️ Secret ou signature não fornecidos');
    return false;
  }

  try {
    const calculatedSignature = crypto
      .createHmac('sha1', secret)
      .update(payload)
      .digest('hex');

    const isValid = signature === calculatedSignature;

    if (!isValid) {
      console.error('[Kiwify] ❌ Signature inválida');
      console.error(`   Esperado: ${calculatedSignature}`);
      console.error(`   Recebido: ${signature}`);
    }

    return isValid;
  } catch (error) {
    console.error('[Kiwify] ❌ Erro ao verificar signature:', error);
    return false;
  }
}

// Função para processar evento da Kiwify
async function processKiwifyEvent(webhookData: KiwifyWebhookPayload): Promise<void> {
  try {
    const eventType = webhookData.webhook_event_type;
    const orderId = webhookData.order_id;
    const orderStatus = webhookData.order_status;

    console.log(`[Kiwify] Processing event: ${eventType}, order: ${orderId}, status: ${orderStatus}`);

    switch (eventType) {
      case 'order_approved':
        if (orderStatus === 'paid') {
          // Processar venda aprovada e paga
          const amount = parseFloat(webhookData.Commissions.charge_amount) / 100; // Converter centavos para reais
          const email = webhookData.Customer.email;
          const customerName = webhookData.Customer.full_name;

          console.log(`[Kiwify] Processing paid order: ${orderId}, amount: R$ ${amount}, customer: ${email}`);

          // Verificar se já existe
          const existingSale = await prisma.sale.findFirst({
            where: { externalId: orderId }
          });

          if (!existingSale) {
            // Criar nova venda
            const saleData = {
              platform: 'KIWIFY',
              externalId: orderId,
              amount: amount,
              status: 'approved',
              customerEmail: email,
              customerName: customerName,
              createdAt: webhookData.approved_date
                ? new Date(webhookData.approved_date)
                : new Date(webhookData.created_at),

              // UTM Parameters da Kiwify
              utmSource: webhookData.TrackingParameters.utm_source || null,
              utmMedium: webhookData.TrackingParameters.utm_medium || null,
              utmCampaign: webhookData.TrackingParameters.utm_campaign || null,
              utmContent: webhookData.TrackingParameters.utm_content || null,
              utmTerm: webhookData.TrackingParameters.utm_term || null,

              // Dados adicionais específicos da Kiwify
              paymentMethod: webhookData.payment_method,
              productName: webhookData.Product.product_name,
              productId: webhookData.Product.product_id,
              installments: webhookData.installments,

              // Informações de pagamento específicas
              cardType: webhookData.card_type || null,
              cardLast4: webhookData.card_last4digits || null,
            };

            await prisma.sale.create({ data: saleData });
            console.log(`[Kiwify] ✅ Sale created: ${orderId} - R$ ${amount}`);

            // Atualizar métricas diárias
            const saleDate = webhookData.approved_date
              ? new Date(webhookData.approved_date)
              : new Date(webhookData.created_at);

            const startOfDay = new Date(saleDate);
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

            console.log(`[Kiwify] ✅ Daily metrics updated for ${startOfDay.toISOString()}`);

            // Processar assinatura se existir
            if (webhookData.Subscription && webhookData.subscription_id) {
              console.log(`[Kiwify] 📋 Processing subscription: ${webhookData.subscription_id}`);
              // TODO: Implementar lógica de assinatura se necessário
              // Por enquanto apenas logar
            }

            // Processar Smart Installment se existir
            if (webhookData.SmartInstallment) {
              console.log(`[Kiwify] 💳 Smart Installment detected: ${webhookData.SmartInstallment.installment_number}/${webhookData.SmartInstallment.installment_quantity}`);
              // TODO: Implementar lógica de parcelamento inteligente se necessário
            }

          } else {
            console.log(`[Kiwify] ⚠️ Sale already exists: ${orderId}`);
          }
        } else {
          console.log(`[Kiwify] ⚠️ Order approved but not paid: ${orderId}, status: ${orderStatus}`);
        }
        break;

      case 'order_rejected':
        console.log(`[Kiwify] 🚫 Order rejected: ${orderId}`);
        // TODO: Implementar lógica de venda recusada se necessário
        break;

      case 'order_refunded':
        console.log(`[Kiwify] 💰 Order refunded: ${orderId}`);
        // TODO: Implementar lógica de reembolso
        // Marcar venda como refunded ou criar registro de reembolso
        break;

      case 'pix_created':
        console.log(`[Kiwify] 🔲 PIX created: ${orderId}`);
        // PIX criado - aguardando pagamento
        break;

      case 'billet_created':
        console.log(`[Kiwify] 📋 Boleto created: ${orderId}`);
        // Boleto criado - aguardando pagamento
        break;

      case 'subscription_canceled':
        console.log(`[Kiwify] ❌ Subscription canceled: ${webhookData.subscription_id}`);
        // TODO: Implementar lógica de cancelamento de assinatura
        break;

      case 'subscription_renewed':
        console.log(`[Kiwify] 🔄 Subscription renewed: ${webhookData.subscription_id}`);
        // TODO: Implementar lógica de renovação de assinatura
        break;

      case 'subscription_late':
        console.log(`[Kiwify] ⏰ Subscription late: ${webhookData.subscription_id}`);
        // TODO: Implementar lógica de assinatura em atraso
        break;

      case 'chargeback':
        console.log(`[Kiwify] 💳 Chargeback: ${orderId}`);
        // TODO: Implementar lógica de chargeback
        // Marcar venda como contestada ou criar registro de chargeback
        break;

      default:
        console.log(`[Kiwify] ❓ Unknown event type: ${eventType}`);
        break;
    }

  } catch (error) {
    console.error('[Kiwify] ❌ Error processing event:', error);
    throw error; // Re-throw para retornar erro 500
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Kiwify] 📡 Webhook received');

    // 1. Ler o corpo da requisição
    const body = await request.text();
    let webhookData: KiwifyWebhookPayload;

    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('[Kiwify] ❌ Invalid JSON in webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 2. Verificar signature HMAC-SHA1 (se configurado)
    const signature = request.nextUrl.searchParams.get('signature');
    const secret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (secret) {
      if (!verifyKiwifySignature(body, signature || '', secret)) {
        console.error('[Kiwify] ❌ Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('[Kiwify] ✅ Signature validated');
    } else {
      console.warn('[Kiwify] ⚠️ KIWIFY_WEBHOOK_SECRET not configured - signature not verified');
    }

    // 3. Verificar se tem os campos obrigatórios
    if (!webhookData.order_id) {
      console.error('[Kiwify] ❌ Missing required field: order_id');
      return NextResponse.json(
        { error: 'Missing required field: order_id' },
        { status: 400 }
      );
    }

    // 3.1 Verificar se é um evento de carrinho abandonado (não tem webhook_event_type)
    if (!webhookData.webhook_event_type) {
      console.log(`[Kiwify] 🛒 Carrinho abandonado detected: ${webhookData.order_id}`);

      // TODO: Implementar lógica de carrinho abandonado
      // Por enquanto apenas logar e retornar sucesso

      return NextResponse.json({
        status: 'ok',
        message: 'Carrinho abandonado processed successfully',
        order_id: webhookData.order_id,
        event_type: 'carrinho_abandonado',
        processing_time: `${Date.now() - startTime}ms`
      });
    }

    // 4. Processar evento de forma síncrona (Kiwify tem timeout de 40s)
    try {
      await processKiwifyEvent(webhookData);

      console.log(`[Kiwify] ✅ Event processed successfully in ${Date.now() - startTime}ms`);

      // 5. Retornar resposta de sucesso
      return NextResponse.json({
        status: 'ok',
        message: 'Webhook processed successfully',
        order_id: webhookData.order_id,
        event_type: webhookData.webhook_event_type,
        processing_time: `${Date.now() - startTime}ms`
      });

    } catch (processError) {
      console.error('[Kiwify] ❌ Error processing webhook:', processError);

      // Retornar erro 500 para que a Kiwify tente reenviar
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'Failed to process webhook event'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Kiwify] ❌ Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Kiwify webhook endpoint is active',
    timestamp: new Date().toISOString(),
    security: {
      signature_validation: !!process.env.KIWIFY_WEBHOOK_SECRET,
      supported_events: [
        'order_approved',
        'order_rejected',
        'order_refunded',
        'pix_created',
        'billet_created',
        'subscription_canceled',
        'subscription_renewed',
        'subscription_late',
        'chargeback'
      ]
    },
    documentation: 'https://docs.kiwify.com.br/webhooks'
  });
}