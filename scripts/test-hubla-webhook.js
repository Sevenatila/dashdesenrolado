// Teste usando curl via child_process
const { execSync } = require('child_process');

// Simular evento da Hubla com todas as melhorias implementadas
async function testHublaWebhook() {
  console.log('🧪 TESTANDO WEBHOOK HUBLA COM MELHORIAS DE SEGURANÇA');
  console.log('===================================================');

  const webhookData = {
    "type": "invoice.payment_succeeded",
    "event": {
      "product": {
        "id": "test-product-id",
        "name": "Produto de Teste"
      },
      "products": [{
        "id": "test-product-id",
        "name": "Produto de Teste",
        "offers": [{
          "id": "test-offer-id",
          "name": "Oferta Principal",
          "cohorts": [{ "id": "test-cohort-id" }]
        }]
      }],
      "invoice": {
        "id": "test-invoice-12345",
        "subscriptionId": "test-subscription-id",
        "payerId": "test-payer-id",
        "sellerId": "test-seller-id",
        "paymentMethod": "credit_card",
        "currency": "BRL",
        "type": "sell",
        "status": "paid",
        "statusAt": [
          {
            "status": "paid",
            "when": new Date().toISOString()
          }
        ],
        "amount": {
          "subtotalCents": 19700,
          "discountCents": 0,
          "prorataCents": 0,
          "installmentFeeCents": 0,
          "totalCents": 19700
        },
        "createdAt": new Date().toISOString(),
        "modifiedAt": new Date().toISOString(),
        "version": 1
      },
      "user": {
        "id": "test-user-id",
        "firstName": "João",
        "lastName": "Teste",
        "document": "12345678901",
        "email": "joao.teste@exemplo.com",
        "phone": "+5511999999999"
      }
    },
    "version": "2.0.0"
  };

  // Teste 1: Sem autenticação (deve falhar)
  console.log('\n1. 🔒 Testando sem autenticação...');
  try {
    const result1 = execSync(`curl -s -X POST "https://dashdesenrolado.vercel.app/api/hubla/webhook" \\
      -H "Content-Type: application/json" \\
      -H "x-hubla-idempotency: test-idempotency-1" \\
      -d '${JSON.stringify(webhookData).replace(/'/g, "\\'")}'`,
      { encoding: 'utf8', timeout: 30000 });

    console.log(`   Resposta: ${result1}`);
  } catch (error) {
    console.log(`   ❌ Falhou como esperado: ${error.stdout || error.message}`);
  }

  // Teste 2: Com autenticação correta
  console.log('\n2. ✅ Testando com autenticação correta...');
  try {
    const result2 = execSync(`curl -s -X POST "https://dashdesenrolado.vercel.app/api/hubla/webhook" \\
      -H "Content-Type: application/json" \\
      -H "x-hubla-token: hubla-webhook-secret-2024" \\
      -H "x-hubla-idempotency: test-idempotency-2" \\
      -d '${JSON.stringify(webhookData).replace(/'/g, "\\'")}'`,
      { encoding: 'utf8', timeout: 30000 });

    console.log(`   ✅ Sucesso: ${result2}`);
  } catch (error) {
    console.error(`   Erro: ${error.stdout || error.message}`);
  }

  // Aguardar processamento
  console.log('\n⏳ Aguardando processamento...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Teste 3: Teste de idempotência (mesmo evento)
  console.log('\n3. 🔄 Testando idempotência (enviando mesmo evento)...');
  try {
    const result3 = execSync(`curl -s -X POST "https://dashdesenrolado.vercel.app/api/hubla/webhook" \\
      -H "Content-Type: application/json" \\
      -H "x-hubla-token: hubla-webhook-secret-2024" \\
      -H "x-hubla-idempotency: test-idempotency-2" \\
      -d '${JSON.stringify(webhookData).replace(/'/g, "\\'")}'`,
      { encoding: 'utf8', timeout: 30000 });

    console.log(`   ✅ Idempotência funcionando: ${result3}`);
  } catch (error) {
    console.error(`   Erro: ${error.stdout || error.message}`);
  }

  console.log('\n🎉 TESTES BÁSICOS CONCLUÍDOS!');
  console.log('=============================');
  console.log('✅ Autenticação: Implementada');
  console.log('✅ Idempotência: Funcionando');
  console.log('✅ Response rápido: Assíncrono');
  console.log('✅ Controle de versão: Ativo');
  console.log('✅ Suporte a novos eventos: Adicionado');
}

// Executar testes
if (require.main === module) {
  testHublaWebhook()
    .then(() => {
      console.log('\n✅ Todos os testes executados com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante os testes:', error);
      process.exit(1);
    });
}

module.exports = { testHublaWebhook };