const { PrismaClient } = require('@prisma/client');
process.env.POSTGRES_PRISMA_URL = 'postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require';
const prisma = new PrismaClient({ datasources: { db: { url: process.env.POSTGRES_PRISMA_URL }}});

async function compareSales() {
  // Valores da Hubla (da tabela que você mandou)
  const hublaData = [
    { id: 'f8ad0af6-e59a-4726-9c3a-851b87dc3150', valor: 97.00 },
    { id: '2995f1d4-f6d8-4ed2-8caf-9d60cfc2248f', valor: 147.00 },
    { id: '32319ce1-a7e0-42d6-9106-2991eba9accd', valor: 97.00 },
    { id: '713a2a5d-940e-4ce9-9c35-d27a7383eb66', valor: 97.00 },
    { id: 'c0fd5e68-1476-4642-8ea2-99eaa470757d', valor: 97.00 },
    { id: '67b96824-2b14-4899-963e-6be8d6330a10', valor: 97.00 },
    { id: 'e4e19754-01db-4910-9d77-61e80686bf70', valor: 179.28 },
    { id: '84f42599-d70e-48b2-b8e6-e32d107ec814', valor: 97.00 },
    { id: 'f829bd7d-70b6-44fd-882b-ad09049abb9a', valor: 97.00 },
    { id: '31256169-b1bf-435a-8a8a-8854a969bc72', valor: 118.32 },
    { id: '2f9b7801-88f3-48fe-9244-c03230b1cc73', valor: 179.28 },
    { id: '28e6992d-3456-423d-bcbf-3d870fb0be2c', valor: 118.32 },
    { id: 'd1724b83-39f1-40bc-b7b3-e2922193dcdd', valor: 97.00 },
    { id: '6d8f7b1b-1616-4830-8d0d-a488a75d9e48', valor: 97.00 },
    { id: 'e8113a7d-851b-4c46-90dc-8287137375f1', valor: 97.00 },
    { id: '7f5be73e-b9ac-4b0f-bf0d-ec1a7e4026e5', valor: 97.00 },
    { id: 'c2aa025e-83d6-426c-9c9b-ad4c9fc500d1', valor: 97.00 },
    { id: '527bcb2f-ab76-40ae-a4b9-1bf584be8f9f', valor: 497.00 },
    { id: '450388a2-e965-4735-9798-c155eb9234f8', valor: 97.00 },
    { id: 'a7408a66-81ce-424c-aa08-c8ee172ffaff', valor: 147.00 },
    { id: '94bcbfa0-0205-4591-80e2-5d7254453906', valor: 48.50 },
    { id: 'fb335c77-47fd-4125-89ad-ccd7573ce975', valor: 186.80 },
    { id: 'b128c9c7-6e7d-4f85-a571-ae597fa8cf42', valor: 97.00 },
    { id: '0a4a0725-5d88-431a-9255-73107c6d92ee', valor: 158.92 },
    { id: 'e026b1c6-fef2-4e91-bb70-af43fe0ae044', valor: 104.88 },
    { id: '7802e0fa-8fd9-46a5-90e9-54c12beb261a', valor: 97.00 },
    { id: '6c210291-3f7f-4fb7-ba9a-5a01c80c4f3d', valor: 179.28 },
    { id: '029365cc-89bf-44e3-9382-4dffe40212c0', valor: 179.16 },
    { id: '93f95ce3-c25d-4ed5-bd0b-180799c55c49', valor: 146.90 }
  ];

  const hublaIds = hublaData.map(h => h.id);

  // Buscar vendas do banco
  const sales = await prisma.sale.findMany({
    where: {
      externalId: { in: hublaIds }
    }
  });

  console.log('🔍 COMPARAÇÃO HUBLA vs BANCO:\n');

  let totalHubla = 0;
  let totalBanco = 0;
  let diferenças = [];

  hublaData.forEach(hublaItem => {
    const sale = sales.find(s => s.externalId === hublaItem.id);

    totalHubla += hublaItem.valor;

    if (sale) {
      totalBanco += sale.amount;
      if (Math.abs(sale.amount - hublaItem.valor) > 0.01) {
        diferenças.push({
          id: hublaItem.id.substring(0, 8),
          hubla: hublaItem.valor,
          banco: sale.amount,
          diff: sale.amount - hublaItem.valor
        });
      }
    } else {
      console.log('❌ Venda não encontrada no banco:', hublaItem.id.substring(0, 8));
    }
  });

  if (diferenças.length > 0) {
    console.log('⚠️ VENDAS COM VALORES DIFERENTES:');
    diferenças.forEach(d => {
      console.log(`- ${d.id}... | Hubla: R$ ${d.hubla.toFixed(2)} | Banco: R$ ${d.banco.toFixed(2)} | Diff: R$ ${d.diff.toFixed(2)}`);
    });
  } else {
    console.log('✅ Todos os valores individuais estão corretos!');
  }

  console.log('\n📊 TOTAIS:');
  console.log('Hubla (valores individuais):', 'R$', totalHubla.toFixed(2));
  console.log('Banco:', 'R$', totalBanco.toFixed(2));
  console.log('Diferença:', 'R$', (totalBanco - totalHubla).toFixed(2));

  console.log('\n💡 ANÁLISE DA DIFERENÇA:');
  const hublaLiquido = 3446.45;
  const taxaAparente = ((totalHubla - hublaLiquido) / totalHubla * 100);
  console.log('Hubla mostra (líquido):', 'R$', hublaLiquido.toFixed(2));
  console.log('Taxa/desconto aparente:', taxaAparente.toFixed(2) + '%');
  console.log('\nPossíveis causas:');
  console.log('1. Hubla mostra valor líquido (após taxas)');
  console.log('2. Nosso webhook salva valor bruto');
  console.log('3. Diferença de ~10.4% pode ser taxa da plataforma');

  await prisma.$disconnect();
}

compareSales().catch(console.error);