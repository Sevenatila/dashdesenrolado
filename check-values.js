const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function checkValues() {
  console.log('🔍 Verificando valores das vendas...\n');

  // Total geral
  const allSales = await prisma.sale.findMany({
    include: { items: true }
  });

  const totalGeral = allSales.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('📊 TOTAL GERAL:');
  console.log('- Vendas:', allSales.length);
  console.log('- Valor: R$', totalGeral.toFixed(2));

  // Por dia
  console.log('\n📅 POR DIA:');

  // 08/03/2026
  const sales08 = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-03-08T00:00:00.000Z'),
        lte: new Date('2026-03-08T23:59:59.999Z')
      }
    }
  });
  const total08 = sales08.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('\n08/03/2026:');
  console.log('- Vendas:', sales08.length);
  console.log('- Valor: R$', total08.toFixed(2));
  console.log('- Ticket médio: R$', (total08 / sales08.length).toFixed(2));

  // 09/03/2026
  const sales09 = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-03-09T00:00:00.000Z'),
        lte: new Date('2026-03-09T23:59:59.999Z')
      }
    }
  });
  const total09 = sales09.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('\n09/03/2026:');
  console.log('- Vendas:', sales09.length);
  console.log('- Valor: R$', total09.toFixed(2));
  console.log('- Ticket médio: R$', (total09 / sales09.length).toFixed(2));

  // Testar o mesmo filtro que o dashboard usa
  console.log('\n🔧 TESTE COM FILTRO DO DASHBOARD:');

  // Simular o filtro do dashboard para 09/03/2026
  const startDate = new Date('2026-03-09');
  const endDate = new Date('2026-03-09');
  endDate.setHours(23, 59, 59, 999);

  const salesDashFilter = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: { items: true }
  });

  const totalDashFilter = salesDashFilter.reduce((acc, sale) => acc + sale.amount, 0);
  console.log('\nCom filtro do dashboard (09/03):');
  console.log('- startDate:', startDate);
  console.log('- endDate:', endDate);
  console.log('- Vendas encontradas:', salesDashFilter.length);
  console.log('- Valor total: R$', totalDashFilter.toFixed(2));

  // Verificar se há problema com timezone
  console.log('\n🕐 AMOSTRA DE DATAS:');
  const samples = await prisma.sale.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' }
  });

  samples.forEach(sale => {
    console.log(`- ${sale.externalId.substring(0, 8)}... | ${sale.createdAt.toISOString()} | R$ ${sale.amount}`);
  });

  await prisma.$disconnect();
}

checkValues().catch(console.error);