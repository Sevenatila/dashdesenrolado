const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function syncDailyPerformance() {
  console.log('🔄 Sincronizando DailyPerformance com dados reais...\n');

  // Para 09/03/2026
  const date09 = new Date('2026-03-09T00:00:00.000Z');
  const sales09 = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: date09,
        lte: new Date('2026-03-09T23:59:59.999Z')
      }
    }
  });

  const total09 = sales09.reduce((acc, sale) => acc + sale.amount, 0);

  // Atualizar ou criar DailyPerformance
  await prisma.dailyPerformance.upsert({
    where: { date: date09 },
    update: {
      vendas: sales09.length,
      receitaGerada: total09,
      ticketMedio: total09 / (sales09.length || 1)
    },
    create: {
      date: date09,
      vendas: sales09.length,
      receitaGerada: total09,
      cliquesLink: 0,
      visualizacaoPage: 0,
      playsUnicosVSL: 0,
      retencaoLeadVSL: 0,
      engajamentoVSL: 0,
      retencaoPitchVSL: 0,
      conversaocheckout: 0,
      conversaoVSL: 0,
      cpa: 0,
      valorGasto: 0,
      ticketMedio: total09 / (sales09.length || 1),
      conversaoOrderBump: 0,
      conversaoBackredirect: 0,
      conversaoUpsell: 0,
      conversaoDownsell: 0,
      conversaoUpsell2: 0
    }
  });

  console.log('✅ DailyPerformance atualizada para 09/03/2026:');
  console.log('Vendas:', sales09.length);
  console.log('Receita: R$', total09.toFixed(2));

  // Também atualizar 08/03/2026
  const date08 = new Date('2026-03-08T00:00:00.000Z');
  const sales08 = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: date08,
        lte: new Date('2026-03-08T23:59:59.999Z')
      }
    }
  });

  const total08 = sales08.reduce((acc, sale) => acc + sale.amount, 0);

  await prisma.dailyPerformance.upsert({
    where: { date: date08 },
    update: {
      vendas: sales08.length,
      receitaGerada: total08,
      ticketMedio: total08 / (sales08.length || 1)
    },
    create: {
      date: date08,
      vendas: sales08.length,
      receitaGerada: total08,
      cliquesLink: 0,
      visualizacaoPage: 0,
      playsUnicosVSL: 0,
      retencaoLeadVSL: 0,
      engajamentoVSL: 0,
      retencaoPitchVSL: 0,
      conversaocheckout: 0,
      conversaoVSL: 0,
      cpa: 0,
      valorGasto: 0,
      ticketMedio: total08 / (sales08.length || 1),
      conversaoOrderBump: 0,
      conversaoBackredirect: 0,
      conversaoUpsell: 0,
      conversaoDownsell: 0,
      conversaoUpsell2: 0
    }
  });

  console.log('\n✅ DailyPerformance atualizada para 08/03/2026:');
  console.log('Vendas:', sales08.length);
  console.log('Receita: R$', total08.toFixed(2));

  await prisma.$disconnect();
}

syncDailyPerformance().catch(console.error);