// Simular uma busca apenas de HOJE
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

console.log('🔍 TESTE DE API - VENDAS APENAS DE HOJE');
console.log('='.repeat(50));
console.log(`Início: ${today.toISOString()}`);
console.log(`Fim: ${tomorrow.toISOString()}`);

const params = new URLSearchParams({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString()
});

const url = `https://dashdesenrolado.vercel.app/api/analytics/metrics?${params}`;
console.log(`\nURL da API: ${url}`);

console.log('\n📞 Fazendo requisição...');

fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log('\n📊 RESULTADO:');
        console.log(`Total de registros: ${data.data?.length || 0}`);

        if (data.data && data.data.length > 0) {
            data.data.forEach(item => {
                if (item.platform === 'all' || item.platform === 'HUBLA') {
                    console.log(`\n💰 ${item.platform}:`);
                    console.log(`   Vendas: ${item.vendas}`);
                    console.log(`   AOV: R$ ${item.aov}`);
                    console.log(`   Observações: ${item.observacoes}`);
                }
            });
        } else {
            console.log('❌ Nenhum dado retornado');
        }
    })
    .catch(error => {
        console.error('❌ Erro na requisição:', error.message);
    });