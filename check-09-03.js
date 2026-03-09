const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function checkDay09() {
  console.log('📅 VENDAS DO DIA 09/03/2026:\n');

  const startDate = new Date('2026-03-09T00:00:00.000Z');
  const endDate = new Date('2026-03-09T23:59:59.999Z');

  // Buscar vendas do dia 09/03/2026
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log('📦 TOTAL DE VENDAS:', sales.length);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('💰 RECEITA TOTAL: R$', totalRevenue.toFixed(2));

  // Verificar order bumps
  const totalOrderBumps = sales.reduce((acc, sale) => acc + sale.items.length, 0);
  console.log('🛒 ORDER BUMPS:', totalOrderBumps);

  if (totalOrderBumps > 0) {
    const orderBumpRevenue = sales.reduce((acc, sale) => {
      return acc + sale.items.reduce((itemAcc, item) => itemAcc + item.amount, 0);
    }, 0);
    console.log('💸 RECEITA ORDER BUMPS: R$', orderBumpRevenue.toFixed(2));
    console.log('💎 RECEITA TOTAL LÍQUIDA: R$', (totalRevenue + orderBumpRevenue).toFixed(2));
  }

  console.log('\n📋 DETALHES DAS VENDAS:');
  console.log('----------------------------------------');

  sales.forEach((sale, index) => {
    console.log(`${index + 1}. ID: ${sale.externalId.substring(0, 8)}...`);
    console.log(`   Hora: ${sale.createdAt.toISOString().split('T')[1].split('.')[0]}`);
    console.log(`   Valor: R$ ${sale.amount.toFixed(2)}`);
    if (sale.items.length > 0) {
      sale.items.forEach(item => {
        console.log(`   + Order Bump: ${item.type} R$ ${item.amount.toFixed(2)}`);
      });
    }
  });

  console.log('\n📊 RESUMO DO DIA 09/03/2026:');
  console.log('- Número de Faturas:', sales.length);
  console.log('- Receita Produto Principal: R$', totalRevenue.toFixed(2));
  console.log('- Ticket Médio: R$', (totalRevenue / (sales.length || 1)).toFixed(2));

  await prisma.$disconnect();
}

checkDay09().catch(console.error);