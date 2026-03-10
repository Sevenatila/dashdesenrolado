const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeHublaStructure() {
    try {
        console.log('🔍 ANÁLISE DETALHADA DA ESTRUTURA HUBLA\n');
        console.log('='.repeat(60));

        // Buscar vendas de hoje com mais detalhes
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const sales = await prisma.sale.findMany({
            where: {
                platform: 'HUBLA',
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        console.log(`📊 Analisando ${sales.length} vendas de hoje:\n`);

        // Agrupar vendas por padrões
        const patterns = {
            'Produto Principal (sem -offer-)': [],
            'Order Bump (-offer-1)': [],
            'Order Bump (-offer-2)': [],
            'Order Bump (-offer-3)': [],
            'Outros padrões': []
        };

        sales.forEach(sale => {
            const id = sale.externalId;
            if (!id.includes('-offer-')) {
                patterns['Produto Principal (sem -offer-)'].push(sale);
            } else if (id.includes('-offer-1')) {
                patterns['Order Bump (-offer-1)'].push(sale);
            } else if (id.includes('-offer-2')) {
                patterns['Order Bump (-offer-2)'].push(sale);
            } else if (id.includes('-offer-3')) {
                patterns['Order Bump (-offer-3)'].push(sale);
            } else {
                patterns['Outros padrões'].push(sale);
            }
        });

        // Analisar cada categoria
        Object.entries(patterns).forEach(([category, salesInCategory]) => {
            if (salesInCategory.length > 0) {
                console.log(`\n📦 ${category}: ${salesInCategory.length} vendas`);
                console.log('─'.repeat(50));

                salesInCategory.forEach(sale => {
                    const time = sale.createdAt.toLocaleString('pt-BR');
                    console.log(`   ID: ${sale.externalId}`);
                    console.log(`   Valor: R$ ${sale.amount}`);
                    console.log(`   Cliente: ${sale.customerEmail}`);
                    console.log(`   Data: ${time}`);
                    console.log(`   Customer Name: ${sale.customerName || 'null'}`);
                    console.log(`   Product Name: ${sale.productName || 'null'}`);
                    console.log('');
                });
            }
        });

        // Análise de relacionamentos entre vendas principais e order bumps
        console.log('\n🔗 ANÁLISE DE RELACIONAMENTOS:\n');

        const mainSales = patterns['Produto Principal (sem -offer-)'];
        console.log(`Vendas principais encontradas: ${mainSales.length}`);

        // Para cada venda principal, buscar order bumps relacionados
        for (const mainSale of mainSales) {
            const baseId = mainSale.externalId;
            const relatedOffers = sales.filter(s =>
                s.externalId.startsWith(baseId + '-offer-') &&
                s.customerEmail === mainSale.customerEmail
            );

            if (relatedOffers.length > 0) {
                console.log(`\n🎯 Venda Principal: ${baseId}`);
                console.log(`   Cliente: ${mainSale.customerEmail}`);
                console.log(`   Valor Principal: R$ ${mainSale.amount}`);
                console.log(`   Order Bumps relacionados: ${relatedOffers.length}`);

                let totalOffers = 0;
                relatedOffers.forEach(offer => {
                    console.log(`   └─ ${offer.externalId}: R$ ${offer.amount}`);
                    totalOffers += offer.amount;
                });

                const totalTransaction = mainSale.amount + totalOffers;
                console.log(`   💰 TOTAL da transação: R$ ${totalTransaction.toFixed(2)}`);
            }
        }

        // Verificar se há vendas órfãs (order bumps sem venda principal)
        console.log('\n🔍 VERIFICAÇÃO DE ORDER BUMPS ÓRFÃOS:\n');

        const allOffers = [...patterns['Order Bump (-offer-1)'], ...patterns['Order Bump (-offer-2)'], ...patterns['Order Bump (-offer-3)']];

        for (const offer of allOffers) {
            const baseId = offer.externalId.replace(/-offer-\d+$/, '');
            const mainSale = sales.find(s => s.externalId === baseId && s.customerEmail === offer.customerEmail);

            if (!mainSale) {
                console.log(`❌ Order bump órfão encontrado:`);
                console.log(`   ${offer.externalId} - R$ ${offer.amount} (${offer.customerEmail})`);
                console.log(`   Venda principal esperada: ${baseId}`);
            }
        }

        console.log('\n✅ Análise concluída!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeHublaStructure();