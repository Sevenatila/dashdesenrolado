# Migração do Banco para Neon Database

## 🎯 Status: Migração do Supabase → Neon

### ✅ O que já foi feito:
- [x] Conta Neon criada
- [x] Conectado com Vercel
- [x] Projeto deployado

### 🔄 Próximos passos:

#### 1. **Obter a URL do banco Neon**
Na Vercel Dashboard:
- Settings → Environment Variables
- Copiar o valor de `DATABASE_URL` ou `POSTGRES_URL`

#### 2. **Atualizar .env local**
```bash
# Substituir a URL antiga do Supabase por:
DATABASE_URL="postgresql://neon-user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

#### 3. **Executar migrações**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Fazer push do schema para o Neon
npx prisma db push

# Verificar se funcionou
npx prisma db seed # (se tiver seed)
```

#### 4. **Testar conexão**
```bash
# Testar APIs localmente
npm run dev
curl http://localhost:3001/api/hubla/metrics
```

#### 5. **Redeploy na Vercel**
```bash
# Para garantir que a produção está usando o Neon
npx vercel --prod
```

## 🗄️ Schema que será criado no Neon:

### Tabelas principais:
- `User` - Usuários e autenticação
- `DailyPerformance` - Métricas diárias consolidadas
- `Sale` - Vendas do Kiwify/Hubla
- `Metric` - Métricas individuais das plataformas

### APIs que vão usar o banco:
- `/api/sync` - Sincronizar dados das plataformas
- `/api/hubla/webhook` - Receber webhooks
- `/api/hubla/metrics` - Buscar métricas
- Dashboard `/hubla` - Exibir dados

## ⚠️ Importante:
- O Neon tem limite de conexões simultâneas
- Use connection pooling: `?pgbouncer=true&connection_limit=1`
- Sempre use `sslmode=require` para segurança