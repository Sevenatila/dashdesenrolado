# Integração Hubla - Dashboard Unificado

## 📋 Visão Geral

Esta integração permite conectar seu dashboard ao Hubla para receber dados em tempo real sobre vendas, leads e métricas através de webhooks.

## 🚀 Recursos Implementados

### ✅ Endpoints da API
- **GET/POST** `/api/hubla/webhook` - Recebe webhooks da Hubla
- **GET** `/api/hubla/metrics` - Retorna métricas do dashboard
- **GET** `/api/hubla/metrics?startDate=2024-01-01&endDate=2024-12-31` - Métricas por período

### ✅ Componentes React
- **HublaDashboard** - Dashboard principal com métricas
- **HublaSalesTable** - Tabela de vendas recentes
- **Página /hubla** - Interface completa com configuração

### ✅ Tipos TypeScript
- Todos os tipos da Hubla definidos em `/types/hubla.ts`
- Eventos suportados: vendas, leads, pagamentos

### ✅ Eventos Suportados
- `sale.created` - Nova venda criada
- `sale.updated` - Venda atualizada
- `payment.approved` - Pagamento aprovado
- `lead.created` - Novo lead capturado

## 🛠️ Configuração

### 1. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```bash
HUBLA_WEBHOOK_SECRET="seu-webhook-secret-aqui"
HUBLA_API_KEY="sua-api-key-aqui"
```

### 2. Configuração na Hubla
1. Acesse **Integrações → Webhooks** na sua conta Hubla
2. Clique em **"Ativar Integração"**
3. Configure a URL do webhook: `https://seudominio.com/api/hubla/webhook`
4. Selecione os eventos que deseja receber
5. Salve a configuração

### 3. URLs de Teste Local
Durante o desenvolvimento:
- Dashboard: `http://localhost:3001/hubla`
- Webhook endpoint: `http://localhost:3001/api/hubla/webhook`
- API de métricas: `http://localhost:3001/api/hubla/metrics`

## 🧪 Testes

### Testando o Webhook
```bash
curl -X POST "http://localhost:3001/api/hubla/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_123",
    "event": "sale.created",
    "data": {
      "id": "sale_123",
      "product_name": "Produto Teste",
      "amount": 97.00
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "idempotency_key": "test_key_123"
  }'
```

### Testando as Métricas
```bash
curl -X GET "http://localhost:3001/api/hubla/metrics"
```

## 📊 Métricas Disponíveis

- **Total de Vendas** - Número total de vendas no período
- **Receita Total** - Faturamento bruto
- **Taxa de Conversão** - Porcentagem de leads convertidos
- **Total de Leads** - Leads capturados
- **Pagamentos Pendentes** - Vendas aguardando confirmação
- **Valor Reembolsado** - Total de reembolsos

## 🔒 Segurança

### Verificação de IP
A integração inclui verificação dos IPs permitidos da Hubla para garantir que apenas webhooks legítimos sejam processados.

### Headers de Segurança
- `x-hubla-idempotency` - Previne processamento duplicado
- Validação de assinatura do webhook

### Tratamento de Erros
- Logs detalhados de todos os eventos
- Retornos apropriados para tentativas de reenvio
- Validação de payload antes do processamento

## 📁 Estrutura de Arquivos

```
├── types/hubla.ts                    # Tipos TypeScript
├── lib/hubla.ts                      # Serviço principal
├── app/api/hubla/
│   ├── webhook/route.ts              # Endpoint webhook
│   └── metrics/route.ts              # Endpoint métricas
├── app/hubla/page.tsx                # Página do dashboard
├── components/hubla/
│   ├── HublaDashboard.tsx            # Dashboard principal
│   └── HublaSalesTable.tsx           # Tabela de vendas
└── .env.example                      # Exemplo de configuração
```

## 🚦 Status dos Testes

✅ **Build** - Aplicação compila sem erros
✅ **Endpoints** - Todos os endpoints funcionando
✅ **Webhooks** - Recebimento e processamento OK
✅ **Componentes** - Interface carregando corretamente

## 🔧 Desenvolvimento

### Comandos Úteis
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Testar endpoints
npm run test:api
```

### Próximos Passos
1. Conectar com banco de dados real (Prisma)
2. Implementar autenticação para dashboard
3. Adicionar gráficos e relatórios avançados
4. Configurar notificações em tempo real
5. Implementar cache para melhor performance

## 📞 Suporte

Para dúvidas sobre a integração:
1. Verifique os logs do servidor
2. Consulte a documentação oficial da Hubla
3. Teste os endpoints individualmente

---

**✅ Integração concluída e testada com sucesso!**