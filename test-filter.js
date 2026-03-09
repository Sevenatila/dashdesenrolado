const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function testFilter() {
  // Testar filtro corrigido
  const startDate = new Date('2026-03-09' + 'T00:00:00.000Z');
  const endDate = new Date('2026-03-09' + 'T23:59:59.999Z');

  console.log('🔧 Filtro corrigido:');
  console.log('- startDate:', startDate.toISOString());
  console.log('- endDate:', endDate.toISOString());

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const total = sales.reduce((acc, sale) => acc + sale.amount, 0);

  console.log('\n✅ Resultado com filtro corrigido:');
  console.log('- Vendas encontradas:', sales.length);
  console.log('- Valor total: R$', total.toFixed(2));

  await prisma.$disconnect();
}

testFilter().catch(console.error);