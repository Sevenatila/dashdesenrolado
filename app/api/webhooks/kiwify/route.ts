import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// Token secreto da Kiwify para validar assinatura
const KIWIFY_TOKEN = process.env.KIWIFY_TOKEN || 'rw40jlb46x8';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('Kiwify webhook received:', {
            hasOrder: !!body.order,
            hasSignature: !!body.signature,
            event: body.order?.webhook_event_type,
            orderId: body.order?.order_id,
            url: body.url
        });

        // Validar assinatura se fornecida
        if (body.signature) {
            // A Kiwify usa HMAC SHA1 para assinar
            const payload = JSON.stringify(body.order);
            const expectedSignature = crypto
                .createHmac('sha1', KIWIFY_TOKEN)
                .update(payload)
                .digest('hex');

            if (body.signature !== expectedSignature) {
                console.warn('Kiwify signature mismatch - processing anyway');
                // Não vamos bloquear por enquanto, só logar
            }
        }

        const order = body.order;

        // Processar diferentes tipos de eventos
        if (order.webhook_event_type === 'order_approved' || order.order_status === 'paid') {
            // Salvar venda no banco
            try {
                // Verificar se já existe
                const existing = await prisma.sale.findFirst({
                    where: { externalId: order.order_id }
                });

                if (!existing) {
                    await prisma.sale.create({
                        data: {
                            platform: 'KIWIFY',
                            externalId: order.order_id,
                            amount: (order.Commissions?.charge_amount || 0) / 100, // Valor em centavos
                            status: order.order_status || 'paid',
                            customerEmail: order.Customer?.email || 'unknown@kiwify.com',
                            createdAt: order.created_at ? new Date(order.created_at) : new Date(),
                            utmSource: order.TrackingParameters?.utm_source || null,
                            utmMedium: order.TrackingParameters?.utm_medium || null,
                            utmCampaign: order.TrackingParameters?.utm_campaign || null,
                            utmContent: order.TrackingParameters?.utm_content || null,
                            utmTerm: order.TrackingParameters?.utm_term || null
                        }
                    });

                    console.log(`✅ Kiwify sale saved: ${order.order_id} - R$ ${(order.Commissions?.charge_amount || 0) / 100}`);
                } else {
                    console.log(`⚠️ Kiwify sale already exists: ${order.order_id}`);
                }

                // Atualizar métricas diárias
                const date = order.created_at ? new Date(order.created_at) : new Date();
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);

                const existingMetric = await prisma.dailyPerformance.findFirst({
                    where: { date: startOfDay }
                });

                if (existingMetric) {
                    await prisma.dailyPerformance.update({
                        where: { id: existingMetric.id },
                        data: {
                            vendas: (existingMetric.vendas || 0) + 1,
                            receitaGerada: (existingMetric.receitaGerada || 0) + ((order.Commissions?.charge_amount || 0) / 100)
                        }
                    });
                } else {
                    await prisma.dailyPerformance.create({
                        data: {
                            date: startOfDay,
                            vendas: 1,
                            receitaGerada: (order.Commissions?.charge_amount || 0) / 100
                        }
                    });
                }

            } catch (dbError) {
                console.error('Database error:', dbError);
                // Não retornar erro para não fazer a Kiwify retentar
            }
        } else if (order.webhook_event_type === 'order_refunded') {
            // Atualizar status para refunded
            await prisma.sale.updateMany({
                where: {
                    platform: 'KIWIFY',
                    externalId: order.order_id
                },
                data: {
                    status: 'refunded'
                }
            });

            console.log(`💸 Kiwify refund processed: ${order.order_id}`);
        }

        // Sempre retornar sucesso para a Kiwify
        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully',
            orderId: order.order_id
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing Kiwify webhook:', error);

        // Ainda assim retornar 200 para evitar retentativas
        return NextResponse.json({
            success: false,
            message: 'Error processed but acknowledged',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 200 });
    }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Kiwify webhook endpoint is active',
        timestamp: new Date().toISOString(),
        path: '/api/webhooks/kiwify',
        note: 'Configure this URL in your Kiwify webhook settings'
    });
}