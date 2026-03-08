// Script para deletar vendas de teste da Kiwify
const { PrismaClient } = require('@prisma/client');

// Configurar para produção
process.env.POSTGRES_PRISMA_URL = "postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_PRISMA_URL
        }
    }
});

async function deleteTestSales() {
    console.log("=== DELETANDO VENDAS DE TESTE DA KIWIFY ===\n");

    try {
        // Primeiro, mostrar as vendas que serão deletadas
        console.log("1. VENDAS ATUAIS DA KIWIFY:");
        const kiwifySales = await prisma.sale.findMany({
            where: { platform: 'KIWIFY' },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`   Total de vendas Kiwify: ${kiwifySales.length}\n`);

        kiwifySales.forEach((sale, index) => {
            console.log(`   ${index + 1}. ID: ${sale.externalId}`);
            console.log(`      Valor: R$ ${sale.amount}`);
            console.log(`      Email: ${sale.customerEmail}`);
            console.log(`      Data: ${sale.createdAt}`);
            console.log("");
        });

        if (kiwifySales.length === 0) {
            console.log("✅ Nenhuma venda da Kiwify encontrada para deletar.");
            return;
        }

        // Deletar todas as vendas da Kiwify
        console.log("2. DELETANDO VENDAS DA KIWIFY...");
        const deleteResult = await prisma.sale.deleteMany({
            where: { platform: 'KIWIFY' }
        });

        console.log(`✅ ${deleteResult.count} vendas da Kiwify deletadas com sucesso!`);

        // Verificar se restaram vendas
        console.log("\n3. VERIFICANDO VENDAS RESTANTES:");
        const remainingSales = await prisma.sale.findMany({
            orderBy: { createdAt: 'desc' }
        });

        console.log(`   Total de vendas restantes: ${remainingSales.length}`);

        if (remainingSales.length > 0) {
            console.log("   Vendas restantes por plataforma:");
            const hublaCount = await prisma.sale.count({ where: { platform: 'HUBLA' }});
            const kiwifyCount = await prisma.sale.count({ where: { platform: 'KIWIFY' }});
            console.log(`   - HUBLA: ${hublaCount}`);
            console.log(`   - KIWIFY: ${kiwifyCount}`);
        }

        // Também deletar métricas diárias relacionadas se desejar
        console.log("\n4. LIMPANDO MÉTRICAS DIÁRIAS...");
        const dailyPerformanceResult = await prisma.dailyPerformance.deleteMany();
        console.log(`✅ ${dailyPerformanceResult.count} registros de performance diária deletados.`);

    } catch (error) {
        console.error("\n❌ ERRO ao deletar vendas:", error.message);
    } finally {
        await prisma.$disconnect();
    }

    console.log("\n=== LIMPEZA CONCLUÍDA ===");
    console.log("💡 Agora apenas vendas reais futuras serão salvas via webhooks!");
}

deleteTestSales();