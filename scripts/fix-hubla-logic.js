const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHublaLogic() {
    try {
        console.log('🔧 CORREÇÃO DA LÓGICA HUBLA\n');
        console.log('='.repeat(50));

        // Buscar todas as vendas Hubla do último mês para análise completa
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const allSales = await prisma.sale.findMany({
            where: {
                platform: 'HUBLA',
                createdAt: {
                    gte: lastMonth
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Total de vendas Hubla no último mês: ${allSales.length}\n`);

        // Separar vendas principais de order bumps
        const mainSales = [];
        const orderBumps = [];
        const orphanOrderBumps = [];

        for (const sale of allSales) {
            const id = sale.externalId;

            if (id.includes('-offer-')) {
                // É um order bump
                const baseId = id.replace(/-offer-\d+$/, '');
                const mainSale = allSales.find(s =>
                    s.externalId === baseId &&
                    s.customerEmail === sale.customerEmail
                );

                if (mainSale) {
                    orderBumps.push({
                        orderBump: sale,
                        mainSale: mainSale,
                        baseId: baseId
                    });
                } else {
                    orphanOrderBumps.push(sale);
                }
            } else {
                // É uma venda principal
                mainSales.push(sale);
            }
        }

        console.log(`📦 Vendas principais: ${mainSales.length}`);
        console.log(`🎯 Order bumps válidos: ${orderBumps.length}`);
        console.log(`❌ Order bumps órfãos: ${orphanOrderBumps.length}\n`);

        // Analisar order bumps órfãos para tentar encontrar padrão
        if (orphanOrderBumps.length > 0) {
            console.log('🔍 ANÁLISE DE ORDER BUMPS ÓRFÃOS:\n');

            for (const orphan of orphanOrderBumps) {
                const baseId = orphan.externalId.replace(/-offer-\d+$/, '');
                console.log(`❌ ${orphan.externalId}`);
                console.log(`   Cliente: ${orphan.customerEmail}`);
                console.log(`   Valor: R$ ${orphan.amount}`);
                console.log(`   Data: ${orphan.createdAt.toLocaleString('pt-BR')}`);
                console.log(`   Venda principal esperada: ${baseId}`);

                // Verificar se existe venda próxima no tempo do mesmo cliente
                const nearSales = allSales.filter(s =>
                    s.customerEmail === orphan.customerEmail &&
                    s.externalId !== orphan.externalId &&
                    !s.externalId.includes('-offer-') &&
                    Math.abs(s.createdAt.getTime() - orphan.createdAt.getTime()) < 5 * 60 * 1000 // 5 minutos
                );

                if (nearSales.length > 0) {
                    console.log(`   🔗 Possíveis vendas principais próximas:`);
                    nearSales.forEach(near => {
                        const timeDiff = Math.abs(near.createdAt.getTime() - orphan.createdAt.getTime()) / 1000;
                        console.log(`     - ${near.externalId}: R$ ${near.amount} (${timeDiff}s de diferença)`);
                    });
                }
                console.log('');
            }
        }

        // Calcular métricas corretas
        const totalMainSales = mainSales.length;
        const totalOrderBumps = orderBumps.length;
        const orderBumpConversionRate = totalMainSales > 0 ? (totalOrderBumps / totalMainSales) * 100 : 0;

        const totalMainRevenue = mainSales.reduce((sum, sale) => sum + sale.amount, 0);
        const totalOrderBumpRevenue = orderBumps.reduce((sum, ob) => sum + ob.orderBump.amount, 0);
        const totalRevenue = totalMainRevenue + totalOrderBumpRevenue;

        console.log('📈 MÉTRICAS CORRETAS:\n');
        console.log(`💰 Receita principal: R$ ${totalMainRevenue.toFixed(2)}`);
        console.log(`🎯 Receita order bumps: R$ ${totalOrderBumpRevenue.toFixed(2)}`);
        console.log(`💵 Receita total: R$ ${totalRevenue.toFixed(2)}`);
        console.log(`📊 Taxa de conversão order bump: ${orderBumpConversionRate.toFixed(1)}%`);

        // Agrupar por período para mostrar evolução
        const salesByDate = new Map();

        for (const sale of mainSales) {
            const dateKey = sale.createdAt.toISOString().split('T')[0];
            if (!salesByDate.has(dateKey)) {
                salesByDate.set(dateKey, { main: 0, orderBumps: 0, revenue: 0 });
            }
            const dayData = salesByDate.get(dateKey);
            dayData.main++;
            dayData.revenue += sale.amount;

            // Adicionar order bumps do mesmo dia
            const dayOrderBumps = orderBumps.filter(ob =>
                ob.mainSale.externalId === sale.externalId &&
                ob.orderBump.createdAt.toISOString().split('T')[0] === dateKey
            );
            dayData.orderBumps += dayOrderBumps.length;
            dayData.revenue += dayOrderBumps.reduce((sum, ob) => sum + ob.orderBump.amount, 0);
        }

        console.log('\n📅 EVOLUÇÃO POR DIA (últimos 7 dias):\n');
        const sortedDates = Array.from(salesByDate.keys()).sort().slice(-7);

        sortedDates.forEach(date => {
            const data = salesByDate.get(date);
            const convRate = data.main > 0 ? (data.orderBumps / data.main) * 100 : 0;
            console.log(`${date}: ${data.main} vendas, ${data.orderBumps} order bumps (${convRate.toFixed(1)}%), R$ ${data.revenue.toFixed(2)}`);
        });

        // Identificar padrões de preços para melhor classificação
        console.log('\n💰 ANÁLISE DE PREÇOS:\n');

        const priceRanges = {
            'Baixo (< R$ 100)': mainSales.filter(s => s.amount < 100),
            'Médio (R$ 100-300)': mainSales.filter(s => s.amount >= 100 && s.amount < 300),
            'Alto (≥ R$ 300)': mainSales.filter(s => s.amount >= 300)
        };

        Object.entries(priceRanges).forEach(([range, sales]) => {
            if (sales.length > 0) {
                const avgPrice = sales.reduce((sum, s) => sum + s.amount, 0) / sales.length;
                console.log(`${range}: ${sales.length} vendas (média R$ ${avgPrice.toFixed(2)})`);
            }
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixHublaLogic();