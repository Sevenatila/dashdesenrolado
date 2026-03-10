# 📊 ANÁLISE COMPLETA - DASHBOARD UNIFICADO

## 📋 RESUMO EXECUTIVO

Dashboard analítico integrado para monitoramento de vendas e performance de campanhas digitais, com integrações em tempo real para Hubla (vendas), VTurb (analytics de vídeo) e futuras integrações com Meta Ads e UTMify.

### 🎯 Objetivo Principal
Centralizar métricas de vendas, tráfego e conversão em uma única interface, permitindo análise em tempo real do desempenho de campanhas e funis de venda.

---

## 🏗️ ARQUITETURA DO SISTEMA

### Stack Tecnológica
- **Frontend**: Next.js 16.1.6 + React 19.2.3 + TypeScript
- **Backend**: Next.js API Routes (serverless)
- **Banco de Dados**: PostgreSQL (via Prisma ORM)
- **Autenticação**: NextAuth.js
- **Estilização**: Tailwind CSS v4
- **Deploy**: Vercel

### Estrutura de Pastas
```
Dashboard Unificado/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   │   ├── analytics/     # Endpoints de métricas agregadas
│   │   ├── hubla/         # Integração Hubla (webhooks)
│   │   ├── vturb/         # Integração VTurb (analytics VSL)
│   │   └── auth/          # Autenticação NextAuth
│   ├── dashboard/         # Páginas do dashboard
│   │   ├── page.tsx       # Dashboard principal
│   │   ├── analytics/     # Página de analytics detalhado
│   │   └── settings/      # Configurações
│   └── login/             # Tela de login
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários e clientes
│   ├── prisma.ts         # Cliente Prisma
│   ├── vturb.ts          # Cliente API VTurb
│   ├── hubla.ts          # Service Hubla
│   └── auth.ts           # Configuração NextAuth
├── prisma/               # Schema e migrações do banco
├── types/                # TypeScript types
└── scripts/              # Scripts auxiliares
```

---

## 🔄 FLUXO DE DADOS

### 1. VENDAS (Hubla/Kiwify)
```mermaid
Hubla/Kiwify → Webhook → /api/hubla/webhook → Prisma → PostgreSQL
                                                ↓
                                        DailyPerformance
                                                ↓
                                        Dashboard (vendas)
```

**Processo:**
1. Plataforma envia webhook quando venda é aprovada
2. API processa e identifica se é venda principal ou order bump
3. Salva no banco com UTM tracking
4. Atualiza métricas diárias agregadas

### 2. ANALYTICS DE VSL (VTurb)
```mermaid
VTurb API → /api/analytics/metrics → Processamento → Dashboard (VSL metrics)
             ↑                           ↓
        Timer/Manual               Cache temporário
```

**Processo:**
1. Dashboard solicita métricas via API
2. Backend busca dados do VTurb em tempo real
3. Processa estatísticas de vídeo (plays, retenção, connect rate)
4. Retorna dados agregados para o frontend

### 3. TRÁFEGO E CONVERSÃO (Futuro)
- **Meta Ads**: Integração planejada para CPC, CTR, investimento
- **UTMify**: Integração planejada para tracking avançado

---

## 💾 MODELO DE DADOS

### Tabelas Principais

#### `Sale` - Vendas Registradas
- **Propósito**: Armazenar todas as vendas das plataformas
- **Campos chave**: platform, externalId, amount, customerEmail, UTMs
- **Relacionamentos**: 1:N com SaleItem (order bumps/upsells)

#### `SaleItem` - Itens Adicionais de Venda
- **Propósito**: Order bumps, upsells, downsells
- **Campos chave**: type, amount, productName
- **Relacionamento**: N:1 com Sale

#### `DailyPerformance` - Métricas Agregadas
- **Propósito**: Cache de métricas diárias para performance
- **Campos chave**: Todas as métricas do dashboard agregadas por dia
- **Uso**: Evita cálculos pesados em tempo real

#### `Settings` - Configurações do Sistema
- **Propósito**: Armazenar chaves de API e configurações
- **Campos chave**: key-value pairs flexíveis

---

## 🔌 INTEGRAÇÕES EXTERNAS

### 1. HUBLA (Vendas)
- **Endpoint**: `/api/hubla/webhook`
- **Método**: Webhook POST
- **Autenticação**: IP whitelist + idempotency key
- **Formatos suportados**: v1 (NewSale) e v2 (invoice.paid)
- **Order Bump Detection**: Identifica por `groupName` vazio

### 2. VTURB (Analytics de Vídeo)
- **Cliente**: `lib/vturb.ts`
- **Endpoints utilizados**:
  - `/players/list` - Lista VSLs disponíveis
  - `/sessions/stats` - Estatísticas agregadas
- **Autenticação**: X-Api-Token header
- **Formato de data**: "YYYY-MM-DD HH:MM:SS UTC"

### 3. META ADS (Planejado)
- Integração via API Graph
- Métricas de tráfego pago

### 4. UTMIFY (Planejado)
- Tracking avançado de conversões
- Análise de funil completa

---

## 📊 MÉTRICAS DO DASHBOARD

### Cards Principais (Tempo Real)
1. **Visualizações Únicas VSL** - Total de views do VTurb
2. **Connect Rate VSL** - Taxa de engajamento inicial
3. **Retenção VSL** - Percentual que assiste até o pitch
4. **Plays Únicos VSL** - Plays totais do vídeo
5. **Vendas** - Total de vendas (Hubla + Kiwify)
6. **Receita** - Faturamento total
7. **CPA** - Custo por aquisição
8. **Ticket Médio** - Valor médio por venda

### Métricas Secundárias
- Conversão de Order Bumps
- Taxa de Upsell/Downsell
- ROI das campanhas
- Engajamento da VSL

---

## 🚨 PONTOS DE ATENÇÃO

### 1. SEGURANÇA
- ⚠️ Autenticação desabilitada temporariamente em `/api/analytics/metrics`
- ⚠️ IPs da Hubla não configurados em produção (usando whitelist mock)
- ✅ Variáveis sensíveis em .env (não versionadas)

### 2. PERFORMANCE
- ⚠️ VTurb processando apenas 2 players (de 203) para evitar timeout
- ⚠️ Timeout de 30s pode ser insuficiente para muitos dados
- ✅ Cache via DailyPerformance reduz carga do banco

### 3. DADOS
- ⚠️ Dashboard forçado para data 09/03/2026 (hardcoded para debug)
- ⚠️ Múltiplos endpoints de teste VTurb ainda em produção
- ✅ Separação correta: VTurb (VSL) vs Banco (vendas)

---

## 🛠️ MANUTENÇÃO E EVOLUÇÃO

### TODO Prioritário
1. [ ] Reabilitar autenticação em produção
2. [ ] Remover endpoints de teste VTurb
3. [ ] Implementar date picker funcional no dashboard
4. [ ] Configurar IPs reais da Hubla para webhook
5. [ ] Otimizar processamento VTurb (batch/queue)

### Melhorias Futuras
1. [ ] Integração Meta Ads API
2. [ ] Integração UTMify
3. [ ] Sistema de alertas/notificações
4. [ ] Exportação de relatórios (PDF/Excel)
5. [ ] Dashboard mobile responsivo
6. [ ] Cache Redis para métricas

---

## 📝 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Banco de Dados
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Autenticação
NEXTAUTH_URL=https://dashdesenrolado.vercel.app
NEXTAUTH_SECRET=...

# Integrações
VTURB_API_KEY=...
HUBLA_API_KEY=... (futuro)
META_APP_ID=... (futuro)
META_APP_SECRET=... (futuro)

# Webhooks
HUBLA_WEBHOOK_SECRET=... (opcional)
```

---

## 🚀 DEPLOY E INFRAESTRUTURA

### Vercel (Produção)
- **URL**: https://dashdesenrolado.vercel.app
- **Branch**: main
- **Auto-deploy**: Ativado
- **Env vars**: Configuradas no painel Vercel

### Banco de Dados
- **Provider**: Vercel Postgres / Supabase
- **Conexão**: Pool de conexões via Prisma
- **Backup**: Configurar política de backup

---

## 📞 SUPORTE E CONTATOS

### Integrações
- **VTurb**: Documentação em `VTURB_INTEGRACAO_SUPORTE.md`
- **Hubla**: Verificar documentação oficial de webhooks

### Desenvolvimento
- **Repositório**: GitHub (configurar)
- **Issues**: Reportar bugs e melhorias

---

## ✅ STATUS ATUAL

✅ **Funcionando:**
- Dashboard com métricas em tempo real
- Integração Hubla (vendas + order bumps)
- Integração VTurb (analytics de VSL)
- Sistema de autenticação (NextAuth)
- Banco de dados PostgreSQL

⚠️ **Parcialmente Funcionando:**
- Date picker (fixado em 09/03/2026)
- Processamento VTurb (limitado a 2 players)

❌ **Pendente:**
- Integração Meta Ads
- Integração UTMify
- Sistema de notificações
- Exportação de relatórios

---

**Última atualização**: 10/03/2026
**Versão**: 0.1.0 (MVP)