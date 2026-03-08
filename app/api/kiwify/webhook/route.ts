import { NextRequest, NextResponse } from 'next/server';
import { KiwifyService } from '@/lib/kiwify';
import { KiwifyWebhookEvent } from '@/types/kiwify';

export async function POST(request: NextRequest) {
    try {
        // Tentar pegar o token de várias formas possíveis
        let token = null;

        // 1. Authorization header com Bearer
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            token = authHeader.replace('Bearer ', '').replace('bearer ', '');
        }

        // 2. X-Kiwify-Token header (comum em webhooks)
        if (!token) {
            token = request.headers.get('x-kiwify-token');
        }

        // 3. X-Token header
        if (!token) {
            token = request.headers.get('x-token');
        }

        // 4. Query parameter
        const url = new URL(request.url);
        if (!token) {
            token = url.searchParams.get('token');
        }

        const body = await request.json() as KiwifyWebhookEvent;

        // 5. Token no body da requisição
        if (!token && body) {
            token = (body as any).token || (body as any).api_token;
        }

        console.log('Kiwify webhook auth debug:', {
            hasAuthHeader: !!authHeader,
            hasXKiwifyToken: !!request.headers.get('x-kiwify-token'),
            hasXToken: !!request.headers.get('x-token'),
            hasQueryToken: !!url.searchParams.get('token'),
            hasBodyToken: !!(body as any).token,
            tokenFound: !!token,
            allHeaders: Object.fromEntries(request.headers.entries())
        });

        if (!token || !await KiwifyService.validateWebhook(token)) {
            console.error('Kiwify webhook unauthorized - token:', token ? 'present but invalid' : 'missing');
            return NextResponse.json(
                { error: 'Unauthorized', debug: 'Token validation failed' },
                { status: 401 }
            );
        }

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