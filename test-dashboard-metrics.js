const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function testNewMetrics() {
  console.log('🧪 Testando novas métricas do dashboard...\n');

  const start = '2026-03-08';
  const end = '2026-03-08';

  // Usar o dia inteiro (até 23:59:59) - importante usar UTC
  const startDate = new Date(start + 'T00:00:00.000Z');
  const endDate = new Date(end + 'T23:59:59.999Z');

  console.log('Debug - Filtro de data:', startDate, 'até', endDate);

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      items: true
    }
  });

  console.log('Vendas encontradas com filtro:', sales.length);

  if (sales.length === 0) {
    console.log('❌ Nenhuma venda encontrada para 08/03/2026');
    return;
  }

  const totalMainSales = sales.length;
  const totalMainRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalItems = sales.reduce((acc, sale) => acc + 1 + sale.items.length, 0);
  const totalRevenue = sales.reduce((acc, sale) => {
    const orderBumpRevenue = sale.items.reduce((itemAcc, item) => itemAcc + item.amount, 0);
    return acc + sale.amount + orderBumpRevenue;
  }, 0);

  console.log('📊 MÉTRICAS DO DASHBOARD AGORA:');
  console.log('');
  console.log('📦 Número de Faturas:', totalMainSales);
  console.log('💰 Receita Produto Principal: R$', totalMainRevenue.toFixed(2));
  console.log('🛒 Número de Itens nas Faturas:', totalItems);
  console.log('💸 Receita Total Líquida: R$', totalRevenue.toFixed(2));
  console.log('');
  console.log('🎯 Ticket Médio Principal: R$', (totalMainRevenue / (totalMainSales || 1)).toFixed(2));
  console.log('🎯 Ticket Médio Total: R$', (totalRevenue / (totalMainSales || 1)).toFixed(2));
  console.log('');

  const orderBumps = sales.flatMap(sale => sale.items);
  if (orderBumps.length > 0) {
    console.log('📦 Order Bumps encontrados:', orderBumps.length);
    const orderBumpTotal = orderBumps.reduce((acc, item) => acc + item.amount, 0);
    console.log('💰 Valor total dos Order Bumps: R$', orderBumpTotal.toFixed(2));
  } else {
    console.log('⚠️ Nenhum order bump encontrado ainda (normal se webhooks ainda não receberam order bumps)');
  }

  await prisma.$disconnect();
}

testNewMetrics().catch(console.error);