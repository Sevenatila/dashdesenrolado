const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrderBumps() {
    try {
        console.log('🔍 ANÁLISE DE ORDER BUMPS E UPSELLS\n');

        // Data de hoje
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Buscar vendas com items
        const salesWithItems = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            include: {
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Total de vendas principais hoje: ${salesWithItems.length}`);

        // Analisar vendas que têm order bumps identificados pelo ID
        const salesWithOfferIds = salesWithItems.filter(sale =>
            sale.externalId && sale.externalId.includes('-offer-')
        );

        console.log(`🎯 Vendas com "-offer-" no ID: ${salesWithOfferIds.length}`);

        if (salesWithOfferIds.length > 0) {
            console.log('\nVendas que parecem ser order bumps/offers:');
            salesWithOfferIds.forEach(sale => {
                console.log(`  - ${sale.externalId}: R$ ${sale.amount} (${sale.customerEmail})`);
            });
        }

        // Verificar vendas na tabela SaleItem
        const saleItems = await prisma.saleItem.findMany({
            include: { sale: true },
            where: {
                sale: {
                    createdAt: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            }
        });

        console.log(`\n🛍️ Itens na tabela SaleItem hoje: ${saleItems.length}`);

        if (saleItems.length > 0) {
            console.log('\nItens encontrados:');
            saleItems.forEach(item => {
                console.log(`  - Tipo: ${item.type}, Valor: R$ ${item.amount}, Venda: ${item.sale.externalId}`);
            });
        }

        // Verificar se vendas com "-offer-" deveriam estar como SaleItems
        console.log('\n🔍 ANÁLISE DE ESTRUTURA:');
        console.log('Vendas que têm padrão de order bump no ID mas estão como vendas principais:');

        const potentialOrderBumps = salesWithItems.filter(sale => {
            return sale.externalId && sale.externalId.match(/-offer-\d+$/);
        });

        console.log(`Total: ${potentialOrderBumps.length}`);

        if (potentialOrderBumps.length > 0) {
            // Agrupar por venda principal
            const groupedByMain = {};
            potentialOrderBumps.forEach(sale => {
                const mainId = sale.externalId.replace(/-offer-\d+$/, '');
                if (!groupedByMain[mainId]) {
                    groupedByMain[mainId] = [];
                }
                groupedByMain[mainId].push(sale);
            });

            console.log('\nAgrupamento por venda principal:');
            Object.entries(groupedByMain).forEach(([mainId, offers]) => {
                console.log(`\n📦 Venda principal: ${mainId}`);
                offers.forEach(offer => {
                    console.log(`  └─ ${offer.externalId}: R$ ${offer.amount}`);
                });

                // Verificar se existe a venda principal
                const mainSale = salesWithItems.find(s => s.externalId === mainId);
                if (mainSale) {
                    console.log(`  ✅ Venda principal encontrada: R$ ${mainSale.amount}`);
                } else {
                    console.log(`  ❌ Venda principal NÃO encontrada`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrderBumps();