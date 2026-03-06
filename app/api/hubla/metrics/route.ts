import { NextRequest, NextResponse } from 'next/server';
import { HublaService } from '@/lib/hubla';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Obter parâmetros de data
    const startDate = searchParams.get('startDate') ||
                     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 dias atrás
    const endDate = searchParams.get('endDate') ||
                   new Date().toISOString(); // hoje

    const hublaService = HublaService.getInstance();

    // Buscar métricas do período
    const metrics = await hublaService.getDashboardMetrics(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching Hubla metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch metrics'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, metrics } = body;

    // Aqui você pode implementar lógica para salvar métricas customizadas
    // ou fazer cálculos específicos baseados nos parâmetros recebidos

    return NextResponse.json({
      success: true,
      message: 'Metrics processed successfully'
    });

  } catch (error) {
    console.error('Error processing metrics request:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process metrics'
      },
      { status: 500 }
    );
  }
}