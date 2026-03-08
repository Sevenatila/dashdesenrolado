// Script para importar vendas históricas da Hubla
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

const HUBLA_API_KEY = "Gn2BEiKlEl8cwe6sk7DMlKQ3qliE3JW3Q0NsEJGRZIlbcFpZa6IYT1ZK6Vciywjt";

async function importHublaSales() {
    console.log("=== IMPORTANDO VENDAS HISTÓRICAS DA HUBLA ===\n");

    try {
        // Buscar vendas dos últimos 30 dias na API da Hubla
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        console.log("Buscando vendas desde:", thirtyDaysAgo.toISOString().split('T')[0]);

        // API da Hubla para buscar vendas
        const response = await fetch('https://api.hubla.com/v2/sales', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${HUBLA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log("Status da API Hubla:", response.status);
            const errorText = await response.text();
            console.log("Resposta:", errorText);

            console.log("\n⚠️ ALTERNATIVA: Entre no painel da Hubla e:");
            console.log("1. Exporte as vendas em CSV/Excel");
            console.log("2. Ou configure o webhook para vendas futuras");
            return;
        }

        const sales = await response.json();
        console.log(`Encontradas ${sales.length} vendas`);

        // Importar cada venda
        let imported = 0;
        let skipped = 0;

        for (const sale of sales) {
            try {
                // Verificar se já existe
                const existing = await prisma.sale.findUnique({
                    where: { externalId: sale.id.toString() }
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                // Criar venda
                await prisma.sale.create({
                    data: {
                        platform: 'HUBLA',
                        externalId: sale.id.toString(),
                        amount: sale.amount || sale.price || 0,
                        status: sale.status || 'approved',
                        customerEmail: sale.customer?.email || sale.email || 'unknown@hubla.com',
                        createdAt: sale.created_at ? new Date(sale.created_at) : new Date(),
                        utmSource: sale.utm_source,
                        utmMedium: sale.utm_medium,
                        utmCampaign: sale.utm_campaign,
                    }
                });

                imported++;
                console.log(`✅ Importada venda: ${sale.id} - R$ ${sale.amount || sale.price}`);

            } catch (error) {
                console.log(`❌ Erro ao importar venda ${sale.id}:`, error.message);
            }
        }

        console.log(`\n📊 RESUMO:`);
        console.log(`   Importadas: ${imported}`);
        console.log(`   Já existentes: ${skipped}`);
        console.log(`   Total no banco: ${await prisma.sale.count()}`);

    } catch (error) {
        console.error("\n❌ Erro ao buscar vendas da Hubla:", error.message);

        console.log("\n💡 SOLUÇÃO MANUAL:");
        console.log("1. Entre no painel da Hubla");
        console.log("2. Vá em Relatórios > Vendas");
        console.log("3. Exporte as vendas em CSV");
        console.log("4. Me envie o arquivo para importar");

        console.log("\n📝 OU configure o webhook para capturar vendas futuras:");
        console.log("   URL: https://dashdesenrolado.vercel.app/api/hubla/webhook");
    } finally {
        await prisma.$disconnect();
    }
}

// Script similar para Kiwify
async function importKiwifySales() {
    console.log("\n=== IMPORTANDO VENDAS HISTÓRICAS DA KIWIFY ===\n");

    try {
        // A Kiwify geralmente não tem API para buscar vendas históricas
        console.log("❌ Kiwify não disponibiliza API para vendas históricas");
        console.log("\n💡 SOLUÇÃO:");
        console.log("1. Entre no painel da Kiwify");
        console.log("2. Vá em Vendas/Relatórios");
        console.log("3. Exporte o relatório de vendas");
        console.log("4. Configure o webhook para vendas futuras:");
        console.log("   URL: https://dashdesenrolado.vercel.app/api/kiwify/webhook");
        console.log("   Token: rw40jlb46x8");

    } catch (error) {
        console.error("Erro:", error);
    }
}

// Executar importações
async function main() {
    await importHublaSales();
    await importKiwifySales();

    console.log("\n=== IMPORTAÇÃO CONCLUÍDA ===");
    console.log("\n✅ Vendas futuras serão capturadas automaticamente via webhook!");
    console.log("📊 Acesse o dashboard para ver os dados: https://dashdesenrolado.vercel.app");
}

main();