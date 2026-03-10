const crypto = require('crypto');

// Simular um webhook da Kiwify
async function testKiwifyWebhook() {
  console.log('🧪 TESTANDO WEBHOOK DA KIWIFY');
  console.log('============================');

  // Payload de teste baseado na documentação
  const testPayload = {
    order_id: "da292c35-c6fc-44e7-ad19-ff7865bc2d89",
    order_ref: "TestOrder123",
    order_status: "paid",
    payment_method: "credit_card",
    store_id: "JKzixndUxOr68LJ",
    payment_merchant_id: "10869585",
    installments: 1,
    card_type: "mastercard",
    card_last4digits: "6411",
    card_rejection_reason: null,
    pix_code: null,
    pix_expiration: null,
    boleto_URL: null,
    boleto_barcode: null,
    boleto_expiry_date: null,
    sale_type: "producer",
    approved_date: "2026-03-10 15:58",
    created_at: "2026-03-10 10:46",
    updated_at: "2026-03-10 10:46",
    webhook_event_type: "order_approved",
    product_type: "digital",
    Product: {
      product_id: "acfe6050-4387-11eb-85a0-43a3ebec8277",
      product_name: "Curso de Teste Claude Code"
    },
    Customer: {
      full_name: "João da Silva",
      first_name: "João",
      email: "joao.silva@example.com",
      mobile: "+5511999887766",
      CPF: "12345678901",
      ip: "192.168.0.1",
      country: "br"
    },
    Commissions: {
      charge_amount: "19700", // R$ 197,00 em centavos
      currency: "BRL",
      product_base_price: "19700",
      product_base_price_currency: "BRL",
      kiwify_fee: "1970",
      kiwify_fee_currency: "BRL",
      commissioned_stores: [
        {
          id: "b34b0051-14c3-4998-af0c-25f0def7b4b4",
          type: "producer",
          custom_name: "Produtor Principal",
          affiliate_id: "vchuoGzH",
          email: "produtor@example.com",
          value: "17730"
        }
      ],
      my_commission: "17730",
      funds_status: null,
      estimated_deposit_date: null,
      deposit_date: null
    },
    TrackingParameters: {
      src: "facebook",
      sck: "campaign123",
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "vendas-marco-2026",
      utm_content: "video-vsl",
      utm_term: "curso-online"
    },
    checkout_link: "DHOtfJC",
    access_url: "https://dashboard.kiwify.com.br/student/password/TOXJPgwJ0NcapWz18sWsq0Nd2hk3SrLfsBxnA"
  };

  const payloadString = JSON.stringify(testPayload);

  // Gerar signature HMAC-SHA1
  const secret = 'kiwify-webhook-secret-2024';
  const signature = crypto.createHmac('sha1', secret)
    .update(payloadString)
    .digest('hex');

  console.log('📊 DADOS DO TESTE:');
  console.log(`   Order ID: ${testPayload.order_id}`);
  console.log(`   Amount: R$ ${parseFloat(testPayload.Commissions.charge_amount) / 100}`);
  console.log(`   Customer: ${testPayload.Customer.full_name}`);
  console.log(`   Product: ${testPayload.Product.product_name}`);
  console.log(`   UTM Campaign: ${testPayload.TrackingParameters.utm_campaign}`);
  console.log(`   Signature: ${signature}`);

  // Testar endpoint local
  const localUrl = 'http://localhost:3000/api/kiwify/webhook';

  try {
    console.log('\n🌐 TESTANDO ENDPOINT LOCAL...');
    console.log(`URL: ${localUrl}?signature=${signature}`);

    const response = await fetch(`${localUrl}?signature=${signature}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString
    });

    const result = await response.text();

    if (response.ok) {
      console.log('✅ LOCAL: Sucesso!');
      try {
        const jsonResult = JSON.parse(result);
        console.log('   Status:', jsonResult.status);
        console.log('   Message:', jsonResult.message);
        console.log('   Processing Time:', jsonResult.processing_time);
      } catch {
        console.log('   Response:', result);
      }
    } else {
      console.log('❌ LOCAL: Erro!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${result}`);
    }

  } catch (error) {
    console.log('❌ LOCAL: Conexão falhou');
    console.log(`   Erro: ${error.message}`);
    console.log('   ⚠️  Certifique-se que o servidor local está rodando (npm run dev)');
  }

  // Testar GET endpoint para verificar status
  try {
    console.log('\n📋 VERIFICANDO STATUS DO ENDPOINT...');

    const statusResponse = await fetch(localUrl);
    const statusResult = await statusResponse.json();

    if (statusResponse.ok) {
      console.log('✅ Endpoint ativo!');
      console.log('   Message:', statusResult.message);
      console.log('   Security:', JSON.stringify(statusResult.security, null, 2));
    }

  } catch (error) {
    console.log('❌ Falha ao verificar status:', error.message);
  }
}

// Executar teste
if (require.main === module) {
  testKiwifyWebhook()
    .then(() => {
      console.log('\n✅ Teste concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no teste:', error);
      process.exit(1);
    });
}

module.exports = { testKiwifyWebhook };