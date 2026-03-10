const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSales() {
    try {
        // Contar total de vendas
        const totalSales = await prisma.sale.count();
        console.log(`\n📊 Total de vendas no banco: ${totalSales}`);

        // Buscar últimas 5 vendas
        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        if (recentSales.length > 0) {
            console.log('\n🛒 Últimas vendas:');
            recentSales.forEach(sale => {
                console.log(`  - ${sale.createdAt.toISOString().split('T')[0]} | ${sale.platform} | R$ ${sale.amount} | ${sale.customerEmail}`);
                if (sale.items.length > 0) {
                    console.log(`    Order Bumps/Upsells: ${sale.items.length} items`);
                }
            });
        }

        // Verificar vendas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySales = await prisma.sale.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        console.log(`\n📅 Vendas de hoje (${today.toISOString().split('T')[0]}): ${todaySales}`);

        // Verificar vendas dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weekSales = await prisma.sale.count({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        console.log(`📅 Vendas dos últimos 7 dias: ${weekSales}`);

        // Verificar DailyPerformance
        const dailyPerf = await prisma.dailyPerformance.count();
        console.log(`\n📈 Registros em DailyPerformance: ${dailyPerf}`);

    } catch (error) {
        console.error('Erro ao verificar vendas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSales();