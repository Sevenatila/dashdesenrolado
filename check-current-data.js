const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function checkCurrentData() {
  console.log('🔍 DADOS ATUAIS NO BANCO DE DADOS:\n');

  // Total de vendas principais
  const totalMainSales = await prisma.sale.count();
  console.log('📦 VENDAS PRINCIPAIS (tabela Sale):', totalMainSales);

  // Total de order bumps/upsells
  const totalOrderBumps = await prisma.saleItem.count();
  console.log('🛒 ORDER BUMPS/UPSELLS (tabela SaleItem):', totalOrderBumps);

  // Receita das vendas principais
  const salesData = await prisma.sale.findMany();
  const totalMainRevenue = salesData.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('💰 RECEITA VENDAS PRINCIPAIS: R$', totalMainRevenue.toFixed(2));

  // Receita dos order bumps
  const orderBumpsData = await prisma.saleItem.findMany();
  const totalOrderBumpRevenue = orderBumpsData.reduce((acc, item) => acc + item.amount, 0);
  console.log('💸 RECEITA ORDER BUMPS: R$', totalOrderBumpRevenue.toFixed(2));

  console.log('');
  console.log('📊 RESUMO TOTAL:');
  console.log('- Total de itens vendidos:', totalMainSales + totalOrderBumps);
  console.log('- Receita total líquida: R$', (totalMainRevenue + totalOrderBumpRevenue).toFixed(2));

  // Detalhes por plataforma
  console.log('\n🏪 POR PLATAFORMA:');
  const hublaCount = await prisma.sale.count({ where: { platform: 'HUBLA' }});
  const kiwifyCount = await prisma.sale.count({ where: { platform: 'KIWIFY' }});

  console.log('- Hubla:', hublaCount, 'vendas principais');
  console.log('- Kiwify:', kiwifyCount, 'vendas principais');

  // Verificar se há vendas com order bumps
  const salesWithItems = await prisma.sale.findMany({
    include: { items: true },
    where: { items: { some: {} }},
    take: 3
  });

  if (salesWithItems.length > 0) {
    console.log('\n📦 VENDAS COM ORDER BUMPS (últimas 3):');
    salesWithItems.forEach(sale => {
      console.log('- Venda:', sale.externalId, '| Principal: R$', sale.amount);
      sale.items.forEach(item => {
        console.log('  + Order bump:', item.type, 'R$', item.amount);
      });
    });
  } else {
    console.log('\n⚠️ NENHUMA VENDA COM ORDER BUMPS AINDA');
    console.log('(Webhooks futuros de order bumps serão salvos separadamente)');
  }

  // Mostrar últimas 3 vendas para referência
  console.log('\n📋 ÚLTIMAS 3 VENDAS:');
  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: true }
  });

  recentSales.forEach(sale => {
    console.log(`- ${sale.externalId} | ${sale.platform} | R$ ${sale.amount} | ${sale.createdAt.toISOString().split('T')[0]}`);
  });

  await prisma.$disconnect();
}

checkCurrentData().catch(console.error);