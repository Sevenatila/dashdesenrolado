// Script para verificar dados em produção
const { PrismaClient } = require('@prisma/client');

// Usar a URL de produção diretamente
process.env.POSTGRES_PRISMA_URL = "postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_PRISMA_URL
        }
    }
});

async function checkProductionData() {
    console.log("=== VERIFICANDO BANCO DE PRODUÇÃO (NEON) ===\n");

    try {
        // 1. Verificar vendas REAIS
        console.log("1. VENDAS REAIS DA HUBLA/KIWIFY:");
        const salesCount = await prisma.sale.count();
        console.log(`   Total de vendas: ${salesCount}`);

        if (salesCount > 0) {
            const recentSales = await prisma.sale.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' }
            });

            console.log("\n   Últimas vendas:");
            recentSales.forEach(sale => {
                console.log(`   - Plataforma: ${sale.platform}`);
                console.log(`     Valor: R$ ${sale.amount}`);
                console.log(`     Email: ${sale.customerEmail}`);
                console.log(`     Status: ${sale.status}`);
                console.log(`     Data: ${sale.createdAt}`);
                console.log(`     ID Externo: ${sale.externalId}`);
                console.log("");
            });

            // Agrupar por plataforma
            const hublaCount = await prisma.sale.count({ where: { platform: 'HUBLA' }});
            const kiwifyCount = await prisma.sale.count({ where: { platform: 'KIWIFY' }});

            console.log(`   Vendas por plataforma:`);
            console.log(`   - HUBLA: ${hublaCount}`);
            console.log(`   - KIWIFY: ${kiwifyCount}`);
        } else {
            console.log("\n   ⚠️ NENHUMA VENDA REAL ENCONTRADA!");
            console.log("   Configure os webhooks nas plataformas:");
            console.log("   - Hubla: https://dashdesenrolado.vercel.app/api/hubla/webhook");
            console.log("   - Kiwify: https://dashdesenrolado.vercel.app/api/kiwify/webhook (Token: rw40jlb46x8)");
        }

        // 2. Verificar DailyPerformance
        console.log("\n2. MÉTRICAS DIÁRIAS:");
        const performanceCount = await prisma.dailyPerformance.count();
        console.log(`   Total de registros: ${performanceCount}`);

        // 3. Verificar Metrics (VTurb, etc)
        console.log("\n3. MÉTRICAS DE PLATAFORMAS:");
        const metricsCount = await prisma.metric.count();
        console.log(`   Total de métricas: ${metricsCount}`);

        if (metricsCount > 0) {
            const platforms = await prisma.metric.groupBy({
                by: ['platform'],
                _count: true
            });

            console.log("   Por plataforma:");
            platforms.forEach(p => {
                console.log(`   - ${p.platform}: ${p._count} métricas`);
            });
        }

        // 4. Verificar usuários
        console.log("\n4. USUÁRIOS:");
        const users = await prisma.user.findMany({
            select: { email: true, name: true }
        });

        console.log(`   Total: ${users.length}`);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.name})`);
        });

    } catch (error) {
        console.error("\n❌ ERRO ao acessar banco de produção:", error.message);
        console.error("   Verifique se a DATABASE_URL está correta no Vercel");
    } finally {
        await prisma.$disconnect();
    }

    console.log("\n=== FIM DA VERIFICAÇÃO ===");
}

checkProductionData();