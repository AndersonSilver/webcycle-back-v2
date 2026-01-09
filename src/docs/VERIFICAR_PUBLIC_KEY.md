# 🔍 Como Verificar e Obter a Public Key Correta

## ⚠️ Erro: "resource not found"

Este erro geralmente significa que a **Public Key está incorreta** ou não corresponde à aplicação correta.

---

## ✅ Passo a Passo: Obter Public Key Correta

### 1. Acessar o Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta
3. Vá em **"Suas integrações"**

### 2. Selecionar a Aplicação Correta

⚠️ **IMPORTANTE:** Use a **MESMA aplicação** que tem o Access Token funcionando!

Você já confirmou que este Access Token funciona:
```
TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646
```

### 3. Copiar a Public Key

Na página da aplicação:

1. Vá na aba **"Credenciais"**
2. Você verá duas chaves:
   - **Access Token:** `TEST-4669818375391721-...` (já está funcionando)
   - **Public Key:** `TEST-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx` (copie esta!)

### 4. Atualizar o `.env`

Abra o arquivo `.env` e atualize:

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646
MERCADOPAGO_PUBLIC_KEY=TEST-SUA-PUBLIC-KEY-CORRETA-AQUI
```

⚠️ **NÃO use a Public Key que estava dando erro!**

A Public Key `TEST-ad96dc9a-8b11-439a-8972-3df94938d831` parece estar incorreta ou de outra aplicação.

---

## 🔍 Verificar se Public Key Está Correta

### Teste 1: Formato

Public Keys válidas têm:
- ✅ Começam com `TEST-` (sandbox) ou `APP_USR-` (produção)
- ✅ Têm aproximadamente 50-60 caracteres
- ✅ São da mesma aplicação que o Access Token

### Teste 2: Mesma Aplicação

**Access Token funcionando:**
```
TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646
```

**Public Key deve ser da MESMA aplicação!**

Verifique no painel do Mercado Pago se ambos estão na mesma página de credenciais.

---

## 🐛 Problemas Comuns

### Problema 1: Public Key de Outra Aplicação

**Sintoma:** `resource not found` ou `invalid_token`

**Solução:** Use a Public Key da mesma aplicação que tem o Access Token funcionando.

### Problema 2: Public Key Não Configurada no .env

**Sintoma:** Script usa Public Key padrão ou vazia

**Solução:** Configure `MERCADOPAGO_PUBLIC_KEY` no arquivo `.env`

### Problema 3: Public Key com Espaços ou Aspas

**Sintoma:** Erro ao inicializar Mercado Pago JS

**Solução:** No `.env`, não coloque aspas:
```env
# ❌ ERRADO
MERCADOPAGO_PUBLIC_KEY="TEST-123..."

# ✅ CORRETO
MERCADOPAGO_PUBLIC_KEY=TEST-123...
```

---

## 📋 Checklist

Antes de gerar tokens, verifique:

- [ ] Public Key está configurada no `.env`
- [ ] Public Key começa com `TEST-` (sandbox)
- [ ] Public Key tem aproximadamente 50-60 caracteres
- [ ] Public Key é da mesma aplicação que o Access Token
- [ ] Não há espaços ou aspas extras no `.env`
- [ ] Reiniciou o servidor após atualizar `.env`

---

## 🔧 Como Testar

### 1. Verificar Public Key no Script

Execute o script:

```bash
npm run test:token
```

Você deve ver:

```
🔑 Public Key carregada: TEST-4669818375391...
📏 Tamanho: 50 caracteres
✅ Formato: Sandbox (TEST)
```

Se aparecer "Formato inválido", a Public Key está incorreta.

### 2. Testar no Navegador

1. Acesse: `http://localhost:3002`
2. Preencha o formulário
3. Clique em "Gerar Token"

Se der erro "resource not found", a Public Key está incorreta.

---

## 💡 Dica

**Sempre use credenciais da mesma aplicação!**

- Access Token: `TEST-4669818375391721-...`
- Public Key: Deve ser da mesma aplicação!

Se você criar uma nova aplicação, precisa usar AMBAS as credenciais dessa nova aplicação.

---

## 📞 Próximos Passos

1. **Acesse o painel do Mercado Pago**
2. **Encontre a aplicação** que tem o Access Token `TEST-4669818375391721-...`
3. **Copie a Public Key** dessa mesma aplicação
4. **Atualize o `.env`** com a Public Key correta
5. **Reinicie o servidor** do script
6. **Teste novamente**

---

## 🎯 Resumo

O erro "resource not found" significa que a Public Key não existe ou não corresponde à aplicação.

**Solução:** Use a Public Key da mesma aplicação que tem o Access Token funcionando!

