const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanVTurbData() {
  try {
    console.log('🧹 Iniciando limpeza de dados VTurb do banco...');

    // 1. Deletar métricas do VTurb
    const deletedMetrics = await prisma.metric.deleteMany({
      where: {
        platform: 'VTURB'
      }
    });
    console.log(`✅ Deletadas ${deletedMetrics.count} métricas do VTurb`);

    // 2. Deletar dados de performance diária (que podem ter dados VTurb misturados)
    const deletedPerformance = await prisma.dailyPerformance.deleteMany({});
    console.log(`✅ Deletadas ${deletedPerformance.count} entradas de DailyPerformance`);

    // 3. Verificar se há outros dados relacionados ao VTurb
    const remainingMetrics = await prisma.metric.count({
      where: {
        OR: [
          { platform: { contains: 'VTURB', mode: 'insensitive' } },
          { platform: { contains: 'vturb', mode: 'insensitive' } }
        ]
      }
    });

    if (remainingMetrics > 0) {
      console.log(`⚠️  Ainda existem ${remainingMetrics} métricas com VTurb`);
    } else {
      console.log('✅ Nenhuma métrica VTurb restante encontrada');
    }

    // 4. Manter dados de Sales intactos (não são do VTurb)
    const salesCount = await prisma.sale.count();
    console.log(`📊 Mantidas ${salesCount} vendas do banco (Hubla/Kiwify)`);

    console.log('🎉 Limpeza concluída! Banco pronto para receber dados VTurb via API.');

  } catch (error) {
    console.error('❌ Erro ao limpar dados VTurb:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanVTurbData();