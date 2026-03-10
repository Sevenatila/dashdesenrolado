const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHublaSales() {
    try {
        console.log('\n🔍 ANÁLISE DETALHADA DAS VENDAS HUBLA\n');
        console.log('='.repeat(60));

        // Data de hoje no Brasil (GMT-3)
        const nowBrasil = new Date();
        const offsetBrasil = -3 * 60; // -3 horas em minutos
        const nowUTC = new Date(nowBrasil.getTime() - (offsetBrasil * 60 * 1000));

        console.log(`📅 Data/Hora atual:`)
        console.log(`   - Local (seu PC): ${nowBrasil.toLocaleString('pt-BR')}`);
        console.log(`   - UTC: ${nowUTC.toISOString()}`);
        console.log(`   - Brasil (GMT-3): ${new Date(nowUTC.getTime() + (offsetBrasil * 60 * 1000)).toLocaleString('pt-BR')}`);

        // Buscar vendas de HOJE (considerando timezone)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        console.log(`\n📊 Período de busca (hoje):`)
        console.log(`   - Início: ${todayStart.toISOString()}`);
        console.log(`   - Fim: ${todayEnd.toISOString()}`);

        const todaysSales = await prisma.sale.findMany({
            where: {
                platform: 'HUBLA',
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`\n💰 Vendas HUBLA de hoje: ${todaysSales.length}`);

        if (todaysSales.length > 0) {
            console.log('\nÚltimas vendas de hoje:');
            todaysSales.forEach(sale => {
                const localTime = new Date(sale.createdAt).toLocaleString('pt-BR');
                console.log(`  📍 ${sale.createdAt.toISOString()} (${localTime})`);
                console.log(`     - ID: ${sale.externalId}`);
                console.log(`     - Valor: R$ ${sale.amount}`);
                console.log(`     - Cliente: ${sale.customerEmail}`);
                console.log('');
            });
        }

        // Buscar TODAS as vendas Hubla para ver distribuição
        const allHublaSales = await prisma.sale.findMany({
            where: { platform: 'HUBLA' },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`\n📈 ESTATÍSTICAS GERAIS HUBLA:`);
        console.log(`   - Total de vendas: ${allHublaSales.length}`);

        // Agrupar por dia
        const salesByDay = {};
        allHublaSales.forEach(sale => {
            const day = sale.createdAt.toISOString().split('T')[0];
            salesByDay[day] = (salesByDay[day] || 0) + 1;
        });

        console.log('\n📅 Distribuição por dia:');
        Object.entries(salesByDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .forEach(([day, count]) => {
                console.log(`   ${day}: ${count} vendas`);
            });

        // Verificar última venda
        const lastSale = allHublaSales[0];
        if (lastSale) {
            console.log(`\n⏰ ÚLTIMA VENDA HUBLA:`);
            console.log(`   - Data UTC: ${lastSale.createdAt.toISOString()}`);
            console.log(`   - Data Local: ${lastSale.createdAt.toLocaleString('pt-BR')}`);
            console.log(`   - Cliente: ${lastSale.customerEmail}`);
            console.log(`   - Valor: R$ ${lastSale.amount}`);

            // Calcular há quanto tempo foi
            const diff = new Date() - lastSale.createdAt;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            console.log(`   - Há ${hours}h ${minutes}min atrás`);
        }

        // Verificar se webhook está funcionando
        console.log('\n🔗 STATUS DO WEBHOOK:');
        const recentSales = allHublaSales.filter(sale => {
            const hoursSince = (new Date() - sale.createdAt) / (1000 * 60 * 60);
            return hoursSince < 24;
        });

        if (recentSales.length > 0) {
            console.log(`   ✅ Webhook aparentemente funcionando`);
            console.log(`   - ${recentSales.length} vendas nas últimas 24h`);
        } else {
            console.log(`   ⚠️ Possível problema no webhook`);
            console.log(`   - Nenhuma venda nas últimas 24h`);
        }

    } catch (error) {
        console.error('❌ Erro ao verificar vendas Hubla:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHublaSales();