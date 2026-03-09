import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';

    console.log('Hubla webhook received from IP:', clientIP);

    // Ler o corpo da requisição
    const body = await request.text();
    let webhookData: any;

    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in Hubla webhook:', error);
      console.log('Raw body received:', body.substring(0, 500));

      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('Hubla webhook data:', {
      hasEvent: !!webhookData.event,
      hasData: !!webhookData.data,
      hasEvento: !!webhookData.evento,
      hasProduto: !!webhookData.produto,
      hasComprador: !!webhookData.comprador,
      hasVenda: !!webhookData.venda,
      keys: Object.keys(webhookData).slice(0, 10)
    });

    // Processar diferentes estruturas possíveis da Hubla

    // Formato 1: Com campo 'evento' (formato mais comum)
    if (webhookData.evento || webhookData.event_type) {
      const evento = webhookData.evento || webhookData.event_type;

      // Processar vendas
      if (evento === 'nova_venda' || evento === 'venda_aprovada' || evento === 'purchase') {
        try {
          const saleId = webhookData.venda?.id ||
                        webhookData.sale_id ||
                        webhookData.transaction_id ||
                        `hubla_${Date.now()}`;

          // IGNORAR webhooks de offers/upsells
          if (saleId && (saleId.includes('-offer-') || saleId.includes('-upsell-') || saleId.includes('-downsell-'))) {
            console.log('🚫 Ignoring offer/upsell webhook:', saleId);
            return NextResponse.json({ status: 'ignored', reason: 'offer/upsell webhook' });
          }

          // Verificar se já existe
          const existing = await prisma.sale.findFirst({
            where: { externalId: saleId.toString() }
          });

          if (!existing) {
            const amount = webhookData.venda?.valor ||
                          webhookData.valor ||
                          webhookData.price ||
                          webhookData.amount ||
                          0;

            const email = webhookData.comprador?.email ||
                         webhookData.customer?.email ||
                         webhookData.buyer_email ||
                         'unknown@hubla.com';

            await prisma.sale.create({
              data: {
                platform: 'HUBLA',
                externalId: saleId.toString(),
                amount: parseFloat(amount.toString()),
                status: webhookData.status || 'approved',
                customerEmail: email,
                createdAt: webhookData.criado_em ? new Date(webhookData.criado_em) : new Date(),
                utmSource: webhookData.utm_source || webhookData.src || null,
                utmMedium: webhookData.utm_medium || null,
                utmCampaign: webhookData.utm_campaign || null
              }
            });

            console.log(`✅ Hubla sale saved: ${saleId} - R$ ${amount}`);
          }
        } catch (dbError) {
          console.error('Database error saving Hubla sale:', dbError);
        }
      }
    }

    // Formato 2: Campo 'event' com 'data' (formato webhook v2)
    else if (webhookData.event && webhookData.data) {
      const event = webhookData.event;
      const data = webhookData.data;

      if (event === 'purchase.approved' || event === 'purchase' || event === 'sale') {
        try {
          const saleId = data.id || webhookData.id || `hubla_${Date.now()}`;

          // IGNORAR webhooks de offers/upsells
          if (saleId && (saleId.includes('-offer-') || saleId.includes('-upsell-') || saleId.includes('-downsell-'))) {
            console.log('🚫 Ignoring offer/upsell webhook:', saleId);
            return NextResponse.json({ status: 'ignored', reason: 'offer/upsell webhook' });
          }

          const existing = await prisma.sale.findFirst({
            where: { externalId: saleId.toString() }
          });

          if (!existing) {
            await prisma.sale.create({
              data: {
                platform: 'HUBLA',
                externalId: saleId.toString(),
                amount: data.amount || data.price || 0,
                status: data.status || 'approved',
                customerEmail: data.customer?.email || data.email || 'unknown@hubla.com',
                createdAt: data.created_at ? new Date(data.created_at) : new Date(),
                utmSource: data.utm_source || null,
                utmMedium: data.utm_medium || null,
                utmCampaign: data.utm_campaign || null
              }
            });

            console.log(`✅ Hubla sale saved (v2): ${saleId} - R$ ${data.amount || data.price}`);
          }
        } catch (dbError) {
          console.error('Database error saving Hubla sale:', dbError);
        }
      }
    }

    // Formato 3: Direto no root (formato antigo)
    else if (webhookData.product || webhookData.produto) {
      try {
        const saleId = webhookData.id ||
                      webhookData.sale_id ||
                      webhookData.transaction_id ||
                      `hubla_${Date.now()}`;

        // IGNORAR webhooks de offers/upsells
        if (saleId && (saleId.includes('-offer-') || saleId.includes('-upsell-') || saleId.includes('-downsell-'))) {
          console.log('🚫 Ignoring offer/upsell webhook:', saleId);
          return NextResponse.json({ status: 'ignored', reason: 'offer/upsell webhook' });
        }

        const existing = await prisma.sale.findFirst({
          where: { externalId: saleId.toString() }
        });

        if (!existing && (webhookData.status === 'approved' || webhookData.status === 'completed')) {
          await prisma.sale.create({
            data: {
              platform: 'HUBLA',
              externalId: saleId.toString(),
              amount: webhookData.price || webhookData.amount || 0,
              status: webhookData.status || 'approved',
              customerEmail: webhookData.email || webhookData.buyer_email || 'unknown@hubla.com',
              createdAt: new Date()
            }
          });

          console.log(`✅ Hubla sale saved (legacy): ${saleId}`);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // Sempre retornar sucesso para evitar retentativas
    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing Hubla webhook:', error);

    // Ainda retornar 200 para evitar muitas retentativas
    return NextResponse.json({
      status: 'acknowledged',
      message: 'Error occurred but webhook acknowledged',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  const salesCount = await prisma.sale.count({
    where: { platform: 'HUBLA' }
  });

  return NextResponse.json({
    status: 'ok',
    message: 'Hubla webhook endpoint is active',
    timestamp: new Date().toISOString(),
    path: '/api/webhooks/hubla',
    totalHublaSales: salesCount,
    note: 'Configure this URL in your Hubla webhook settings'
  });
}