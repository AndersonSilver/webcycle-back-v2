# 🔧 Como Corrigir o Erro "internal_error"

## ❌ Problema Identificado

O erro `internal_error` está ocorrendo porque a **Public Key** usada no frontend para gerar o token **NÃO é da mesma aplicação** que o **Access Token** usado no backend.

### Situação Atual:

- **Backend Access Token:** `TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646`
- **Frontend Public Key (padrão):** `TEST-ad96dc9a-0c0b-4e0f-8b0a-8b0a8b0a8b0a` ❌ **APLICAÇÃO DIFERENTE!**

---

## ✅ Solução: Usar Public Key da Mesma Aplicação

### Passo 1: Acessar o Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta
3. Vá em **"Suas integrações"**

### Passo 2: Encontrar a Aplicação Correta

Você precisa encontrar a aplicação que tem este Access Token:
```
TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646
```

**Como encontrar:**
1. Clique em cada aplicação
2. Vá na aba **"Credenciais"** ou **"Credenciais de teste"**
3. Procure pelo Access Token que começa com `TEST-4669818375391721-...`
4. Quando encontrar, você verá a **Public Key** dessa mesma aplicação

### Passo 3: Copiar a Public Key Correta

Na mesma página onde está o Access Token `TEST-4669818375391721-...`, você verá:

- **Access Token:** `TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646` ✅
- **Public Key:** `TEST-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx` ← **COPIE ESTA!**

### Passo 4: Configurar no Frontend

**Arquivo:** `TB-PSICO-FRONT/.env`

Adicione ou atualize:
```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-SUA-PUBLIC-KEY-CORRETA-AQUI
```

**⚠️ IMPORTANTE:**
- Não use aspas
- Não use espaços
- Use a Public Key da MESMA aplicação do Access Token

### Passo 5: Reiniciar o Frontend

Após atualizar o `.env`:
1. Pare o servidor do frontend (Ctrl+C)
2. Reinicie: `npm run dev` ou `yarn dev`

---

## 🔍 Como Verificar se Está Correto

### No Console do Navegador (F12)

Quando o formulário de pagamento carregar, você deve ver:
```
[MP] Mercado Pago inicializado com sucesso!
```

### No Log do Backend

Quando processar um pagamento, você deve ver:
```
💳 Processando pagamento: {
  accessTokenPrefix: 'TEST-46698...'  ← Deve começar com TEST-46698
}
```

### Teste Final

1. Tente processar um pagamento
2. Se ainda der `internal_error`, verifique:
   - A Public Key no `.env` do frontend está correta?
   - A Public Key é da mesma aplicação do Access Token?
   - Reiniciou o servidor do frontend após atualizar o `.env`?

---

## 📋 Checklist

Antes de testar novamente:

- [ ] Acessei o painel do Mercado Pago
- [ ] Encontrei a aplicação com Access Token `TEST-4669818375391721-...`
- [ ] Copiei a Public Key dessa mesma aplicação
- [ ] Adicionei `VITE_MERCADOPAGO_PUBLIC_KEY` no `.env` do frontend
- [ ] Não usei aspas ou espaços na Public Key
- [ ] Reiniciei o servidor do frontend
- [ ] Testei novamente o pagamento

---

## ⚠️ Erros Comuns

### Erro 1: Public Key de Outra Aplicação

**Sintoma:** `internal_error` mesmo com token válido

**Solução:** Use a Public Key da mesma aplicação do Access Token

### Erro 2: Public Key Não Configurada

**Sintoma:** Usa Public Key padrão incorreta

**Solução:** Configure `VITE_MERCADOPAGO_PUBLIC_KEY` no `.env`

### Erro 3: Public Key com Aspas

**Sintoma:** Erro ao inicializar Mercado Pago

**Solução:** Remova as aspas do `.env`:
```env
# ❌ ERRADO
VITE_MERCADOPAGO_PUBLIC_KEY="TEST-..."

# ✅ CORRETO
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do backend** - devem mostrar o Access Token prefix
2. **Verifique os logs do frontend** - devem mostrar a Public Key sendo usada
3. **Confirme** que ambas são da mesma aplicação no painel do Mercado Pago
4. **Teste** gerando um novo token após corrigir a Public Key

---

**Última atualização:** 02/01/2026

