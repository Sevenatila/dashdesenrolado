# Configuração de Domínio - Dashboard Desenrolado

## 🌐 **Domínio Principal:**
`https://dashdesenrolado.vercel.app`

## 📡 **URLs das APIs para configurar nos serviços externos:**

### **Hubla Webhook:**
```
https://dashdesenrolado.vercel.app/api/hubla/webhook
```

### **Outras APIs disponíveis:**
```
https://dashdesenrolado.vercel.app/api/hubla/metrics
https://dashdesenrolado.vercel.app/api/sync
https://dashdesenrolado.vercel.app/api/vturb/players
```

## 🎯 **Páginas principais:**

### **Dashboard Hubla:**
```
https://dashdesenrolado.vercel.app/hubla
```

### **Dashboard Principal:**
```
https://dashdesenrolado.vercel.app/dashboard
```

### **Funnel CDR:**
```
https://dashdesenrolado.vercel.app/cdr_hubla
```

## ⚙️ **Configurações necessárias:**

### **1. Hubla:**
- **Webhook URL:** `https://dashdesenrolado.vercel.app/api/hubla/webhook`
- **Eventos:** sale.created, payment.approved, lead.created

### **2. Kiwify:**
- **Webhook URL:** `https://dashdesenrolado.vercel.app/api/kiwify/webhook` (quando implementado)

### **3. Meta Ads:**
- APIs já configuradas para buscar dados automaticamente

### **4. VTurb:**
- APIs já configuradas para buscar métricas dos vídeos

## 🔐 **Variáveis de ambiente configuradas:**
- ✅ `NEXTAUTH_URL=https://dashdesenrolado.vercel.app`
- ✅ `DATABASE_URL` (Neon PostgreSQL)
- ✅ `VTURB_API_KEY`
- ✅ `UTMIFY_API_TOKEN`
- ✅ `NEXTAUTH_SECRET`

## 📊 **Status das integrações:**
- ✅ **VTurb** - Funcionando
- ✅ **Hubla** - Pronto para receber webhooks
- ✅ **Banco Neon** - Configurado e funcionando
- ✅ **UTMify** - Configurado
- ❌ **Meta Ads** - Precisa do access token
- ❌ **Kiwify** - Webhook não implementado ainda

## 🚀 **Para usar:**
1. Configure os webhooks nos serviços externos
2. Acesse o dashboard em `https://dashdesenrolado.vercel.app`
3. As métricas serão sincronizadas automaticamente