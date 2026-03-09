#!/bin/bash

echo "Atualizando variáveis de ambiente no Vercel..."

# Remover DATABASE_URL antiga e adicionar a correta
npx vercel env rm DATABASE_URL production --yes
npx vercel env add DATABASE_URL production <<< "postgresql://neondb_owner:npg_9qefBF7jdXIP@ep-lucky-rice-adoy7qat-pooler.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"

# Adicionar HUBLA_API_KEY
npx vercel env add HUBLA_API_KEY production <<< "Gn2BEiKlEl8cwe6sk7DMlKQ3qliE3JW3Q0NsEJGRZIlbcFpZa6IYT1ZK6Vciywjt"

# Adicionar KIWIFY_TOKEN
npx vercel env add KIWIFY_TOKEN production <<< "rw40jlb46x8"

# Adicionar HUBLA_WEBHOOK_SECRET
npx vercel env add HUBLA_WEBHOOK_SECRET production <<< "hubla-webhook-secret"

echo "Variáveis atualizadas! Fazendo deploy..."

# Deploy para produção
npx vercel --prod --yes

echo "Deploy concluído!"