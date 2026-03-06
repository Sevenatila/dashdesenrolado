import { NextRequest, NextResponse } from 'next/server';
import { HublaService } from '@/lib/hubla';
import { HublaWebhookEvent } from '@/types/hubla';

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

    // Verificar se tem os campos obrigatórios
    if (!webhookData.event || !webhookData.data || !webhookData.id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar header de idempotência
    const idempotencyKey = request.headers.get('x-hubla-idempotency');
    if (idempotencyKey && idempotencyKey === webhookData.idempotency_key) {
      console.log('Duplicate webhook event detected:', idempotencyKey);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Processar o evento
    const hublaService = HublaService.getInstance();
    await hublaService.processWebhookEvent(webhookData);

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