import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['tax_pix_percent', 'tax_card_percent']
        }
      }
    });

    // Converter para formato mais fácil de usar
    const settingsMap = {
      tax_pix_percent: '0',
      tax_card_percent: '0',
    };

    settings.forEach(setting => {
      settingsMap[setting.key as keyof typeof settingsMap] = setting.value;
    });

    return NextResponse.json({
      pixTax: parseFloat(settingsMap.tax_pix_percent),
      cardTax: parseFloat(settingsMap.tax_card_percent)
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pixTax, cardTax } = await request.json();

    // Validar valores
    if (typeof pixTax !== 'number' || typeof cardTax !== 'number') {
      return NextResponse.json(
        { error: 'Invalid tax values' },
        { status: 400 }
      );
    }

    if (pixTax < 0 || pixTax > 100 || cardTax < 0 || cardTax > 100) {
      return NextResponse.json(
        { error: 'Tax values must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    await prisma.settings.upsert({
      where: { key: 'tax_pix_percent' },
      update: { value: pixTax.toString() },
      create: {
        key: 'tax_pix_percent',
        value: pixTax.toString(),
        description: 'Taxa do PIX em percentual'
      }
    });

    await prisma.settings.upsert({
      where: { key: 'tax_card_percent' },
      update: { value: cardTax.toString() },
      create: {
        key: 'tax_card_percent',
        value: cardTax.toString(),
        description: 'Taxa do Cartão em percentual'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}