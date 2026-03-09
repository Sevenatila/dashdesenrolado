# Documentação de Integração - Dashboard Unificado com VTurb Analytics

## Resumo do Projeto
Estamos desenvolvendo um **Dashboard Unificado de Vendas e Analytics** que consolida dados de múltiplas plataformas (Hubla, Kiwify, Meta Ads, VTurb) em uma única interface para análise de performance de campanhas de marketing digital.

## Objetivo da Integração com VTurb
Queremos buscar métricas de engajamento de vídeos (VSLs) para correlacionar com dados de vendas e calcular métricas como:
- Taxa de retenção de vídeo
- Conversão de views para vendas
- Performance por VSL
- Análise de funil completo (tráfego → vídeo → checkout → venda)

## Status Atual da Integração

### ✅ O que está funcionando:
1. **Autenticação**: API Key configurada e validada
2. **Listagem de Players**: Conseguimos listar os 203 vídeos da conta
3. **Conexão com API**: Requisições chegam com sucesso em `https://analytics.vturb.net`

### ❌ Problema Encontrado:
Ao buscar eventos de qualquer player, a API retorna resposta vazia ou `{"data": null}`, mesmo para vídeos que sabemos ter visualizações.

## Detalhes Técnicos da Implementação

### Configuração
```javascript
// Ambiente: Node.js / Next.js
// API Key: a7dc52ffabfe22ff8f78a02e28e8de4ac3fc3e43e7c770d49d2f9bd3f03bea8b
// Base URL: https://analytics.vturb.net
```

### Headers Utilizados
```javascript
{
  'X-Api-Token': 'API_KEY',
  'X-Api-Version': 'v1',
  'Content-Type': 'application/json'
}
```

### Requisição de Exemplo - Listagem de Players (FUNCIONANDO ✅)
```javascript
GET https://analytics.vturb.net/players/list

// Resposta: 203 players retornados com sucesso
```

### Requisição de Exemplo - Buscar Eventos (NÃO FUNCIONANDO ❌)
```javascript
POST https://analytics.vturb.net/events/total_by_company

Body:
{
  "player_id": "69921cdd92e29505e061e647",  // MINI_VSL_REEDICAO_QUIZ_CDR_97_86b842mnp_HUBLA
  "events": ["started", "finished", "viewed"],
  "start_date": "2026-03-01",
  "end_date": "2026-03-09",
  "timezone": "America/Sao_Paulo"
}

// Resposta esperada: dados de eventos por dia
// Resposta recebida: {"data": null} ou vazio
```

## Testes Realizados
1. ✅ Diferentes períodos de data (hoje, 7 dias, 30 dias, 90 dias)
2. ✅ Com e sem parâmetro timezone
3. ✅ Diferentes combinações de eventos
4. ✅ Múltiplos players diferentes
5. ✅ Player específico com dados confirmados: `MINI_VSL_REEDICAO_QUIZ_CDR_97_86b842mnp_HUBLA`

## Perguntas para o Suporte VTurb

1. **Permissões da API Key**:
   - A API Key tem permissão para acessar dados de eventos?
   - Existe alguma configuração adicional necessária na conta?

2. **Formato da Requisição**:
   - O formato do body está correto?
   - Há algum parâmetro obrigatório faltando?
   - O formato de data está correto (YYYY-MM-DD)?

3. **Limitações**:
   - Existe algum rate limit que pode estar bloqueando?
   - Há restrição de período de dados (ex: apenas últimos 30 dias)?
   - A conta precisa de algum plano específico para acessar via API?

4. **Documentação**:
   - Existe exemplo funcional de requisição para `events/total_by_company`?
   - Há algum endpoint alternativo para buscar métricas de players?

## Informações Adicionais

### Endpoints que gostaríamos de usar:
1. `/players/list` - ✅ Funcionando
2. `/events/total_by_company` - ❌ Retornando vazio
3. `/times/user_engagement` - ❌ Não testado ainda

### Ambiente de Desenvolvimento:
- **Aplicação**: Next.js 16.1.6 (Node.js)
- **Deploy**: Vercel
- **Banco de Dados**: PostgreSQL (Neon)
- **Outras integrações**: Hubla, Kiwify (funcionando)

### Contato Técnico:
- **Projeto**: Dashboard Unificado
- **Repositório**: https://github.com/Sevenatila/dashdesenrolado
- **Ambiente de teste**: https://dashdesenrolado.vercel.app

## Como Podem Nos Ajudar?

1. **Validar se nossa implementação está correta**
2. **Fornecer exemplo funcional de requisição para buscar eventos**
3. **Verificar se há alguma configuração pendente em nossa conta**
4. **Informar se há alguma limitação que não conhecemos**

## Código de Teste Simplificado

```javascript
// Você podem testar com este código simples:
const apiKey = 'a7dc52ffabfe22ff8f78a02e28e8de4ac3fc3e43e7c770d49d2f9bd3f03bea8b';

// Teste 1: Listar players (FUNCIONA)
fetch('https://analytics.vturb.net/players/list', {
  headers: {
    'X-Api-Token': apiKey,
    'X-Api-Version': 'v1',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);

// Teste 2: Buscar eventos (NÃO FUNCIONA - retorna vazio)
fetch('https://analytics.vturb.net/events/total_by_company', {
  method: 'POST',
  headers: {
    'X-Api-Token': apiKey,
    'X-Api-Version': 'v1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    player_id: '69921cdd92e29505e061e647',
    events: ['started', 'finished', 'viewed'],
    start_date: '2026-03-01',
    end_date: '2026-03-09',
    timezone: 'America/Sao_Paulo'
  })
}).then(r => r.json()).then(console.log);
```

---

**Agradecemos antecipadamente pela ajuda!**

Estamos disponíveis para fornecer mais informações ou fazer testes específicos conforme necessário.