// Script para verificar dados no banco
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log("=== Verificando Banco de Dados ===\n");

    try {
        // 1. Verificar vendas
        console.log("1. Verificando vendas...");
        const salesCount = await prisma.sale.count();
        console.log(`   Total de vendas: ${salesCount}`);

        if (salesCount > 0) {
            const recentSales = await prisma.sale.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });

            console.log("\n   Últimas 5 vendas:");
            recentSales.forEach(sale => {
                console.log(`   - ID: ${sale.id}`);
                console.log(`     Plataforma: ${sale.platform}`);
                console.log(`     Valor: R$ ${sale.amount}`);
                console.log(`     Data: ${sale.createdAt}`);
            });
        }

        // 2. Verificar DailyPerformance
        console.log("\n2. Verificando DailyPerformance...");
        const performanceCount = await prisma.dailyPerformance.count();
        console.log(`   Total de registros: ${performanceCount}`);

        if (performanceCount > 0) {
            const recentPerformance = await prisma.dailyPerformance.findMany({
                take: 3,
                orderBy: { date: 'desc' }
            });

            console.log("\n   Últimos 3 registros:");
            recentPerformance.forEach(perf => {
                console.log(`   - Data: ${perf.date}`);
                console.log(`     Plays VSL: ${perf.playsUnicosVSL || 0}`);
                console.log(`     Ticket Médio: R$ ${perf.ticketMedio || 0}`);
            });
        }

        // 3. Verificar Users
        console.log("\n3. Verificando usuários...");
        const usersCount = await prisma.user.count();
        console.log(`   Total de usuários: ${usersCount}`);

    } catch (error) {
        console.error("Erro ao acessar banco:", error.message);
    } finally {
        await prisma.$disconnect();
    }

    console.log("\n=== Fim da verificação ===");
}

checkDatabase();