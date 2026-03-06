import { NextRequest, NextResponse } from 'next/server';
import { KiwifyService } from '@/lib/kiwify';
import { KiwifyWebhookEvent } from '@/types/kiwify';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token || !await KiwifyService.validateWebhook(token)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as KiwifyWebhookEvent;

        console.log('Received Kiwify webhook:', {
            event: body.event,
            id: body.id,
            timestamp: new Date().toISOString(),
        });

        await KiwifyService.processWebhookEvent(body);

        return NextResponse.json(
            {
                success: true,
                message: `Event ${body.event} processed successfully`,
                eventId: body.id
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error processing Kiwify webhook:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'Kiwify webhook endpoint is active',
        timestamp: new Date().toISOString(),
        supportedEvents: [
            'sale.created',
            'sale.approved',
            'sale.cancelled',
            'sale.refunded',
            'sale.chargeback',
            'sale.dispute',
            'cart.abandoned',
            'subscription.created',
            'subscription.cancelled',
            'subscription.renewed'
        ]
    });
}