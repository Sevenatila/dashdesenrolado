const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function checkSalesData() {
  console.log('🔍 Verificando dados de vendas...\n');

  const totalSales = await prisma.sale.count();
  console.log('Total vendas no banco:', totalSales);

  const recentSales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: true }
  });

  console.log('\nÚltimas 5 vendas:');
  recentSales.forEach(sale => {
    console.log('- ID:', sale.externalId);
    console.log('  Data:', sale.createdAt.toISOString().split('T')[0]);
    console.log('  Valor: R$', sale.amount);
    console.log('  Order bumps:', sale.items.length);
    if (sale.items.length > 0) {
      sale.items.forEach(item => {
        console.log('    -', item.type, 'R$', item.amount);
      });
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkSalesData().catch(console.error);