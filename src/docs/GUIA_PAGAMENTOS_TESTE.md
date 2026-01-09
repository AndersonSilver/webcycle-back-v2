# 💳 Guia de Pagamentos de Teste - Mercado Pago

## ✅ Boa Notícia: Você NÃO Precisa Usar Dinheiro Real!

O Mercado Pago oferece um **modo Sandbox (Teste)** que permite testar todos os tipos de pagamento **sem usar dinheiro real**.

---

## 🎯 Como Funciona o Modo Sandbox

### O que é Sandbox?

- **Ambiente de testes** do Mercado Pago
- **Não usa dinheiro real**
- Permite simular pagamentos aprovados, rejeitados, pendentes, etc.
- Usa **cartões de teste** e **credenciais de teste**

### ⚠️ Importante: URLs de Retorno

O Mercado Pago **não aceita URLs com `localhost`** nas URLs de retorno (`back_urls`) quando você usa `auto_return`. 

**Solução para Desenvolvimento:**
- O código já está configurado para **detectar localhost** e **desabilitar `auto_return`** automaticamente
- O frontend deve verificar o status do pagamento via **webhook** ou **polling** (consultar status periodicamente)
- Em produção, use uma URL pública válida no `FRONTEND_URL`

**Para usar URLs de retorno em desenvolvimento:**
- Use **ngrok** para criar uma URL pública para seu frontend também
- Configure `FRONTEND_URL` com a URL do ngrok (ex: `https://seu-frontend.ngrok.io`)

---

## 🔑 Credenciais de Teste vs Produção

### Modo Sandbox (Teste)

**Access Token:**
- Começa com `TEST-`
- Exemplo: `TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789`

**Public Key:**
- Começa com `TEST-`
- Exemplo: `TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz`

**Onde obter:**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > Sua aplicação
3. Na página inicial da aplicação, você verá:
   - **"Configure sua integração"** (seção expandida)
   - **Usuário**: Copie o valor que começa com `TEST...`
   - **Senha**: Copie o valor mostrado (ex: `fDZA3...`)
4. **OU** na aba **"Credenciais de teste"**, você verá:
   - Access Token de teste
   - Public Key de teste

**💡 Dica:** Na página inicial da aplicação, você pode copiar as credenciais diretamente usando os ícones de copiar ao lado de cada campo.

### Modo Produção

**Access Token:**
- Começa com `APP_USR-`
- Usa dinheiro real ⚠️

**Public Key:**
- Começa com `APP_USR-`
- Usa dinheiro real ⚠️

---

## 💳 Cartões de Teste para Pagamento com Cartão

### Cartões Aprovados (Pagamento Aprovado)

**Visa:**
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: APRO
Validade: 11/25
```

**Mastercard:**
```
Número: 5031 7557 3453 0604
CVV: 123
Nome: APRO
Validade: 11/25
```

**American Express:**
```
Número: 3753 651535 56885
CVV: 1234
Nome: APRO
Validade: 11/25
```

### Cartões Rejeitados (Para Testar Erros)

**Cartão Rejeitado:**
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: OTHE
Validade: 11/25
```

**Cartão com Fundos Insuficientes:**
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: CONT
Validade: 11/25
```

**Cartão Cancelado:**
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: CALL
Validade: 11/25
```

### Como Usar os Cartões de Teste

1. Use qualquer **nome** no campo nome do portador
2. Use qualquer **CPF** válido (ex: 12345678900)
3. Use qualquer **data de validade futura**
4. Use os **números de cartão** acima
5. O resultado depende do **nome** que você colocar:
   - `APRO` = Pagamento aprovado ✅
   - `CONT` = Fundos insuficientes ⚠️
   - `CALL` = Cartão cancelado ❌
   - `OTHE` = Rejeitado ❌

---

## 📱 PIX de Teste

### Como Funcionar

1. Quando você criar um pagamento PIX no modo sandbox:
   - O Mercado Pago **gera um código PIX de teste**
   - Você **NÃO precisa pagar de verdade**
   - O pagamento pode ser **simulado como aprovado**

### Simular Aprovação do PIX

**Opção 1: Via Dashboard do Mercado Pago**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > Sua aplicação
3. Procure por "Simulador de pagamentos" ou "Testes"
4. Você pode simular a aprovação de um pagamento PIX

**Opção 2: Via Webhook Manual**
- O webhook pode ser disparado manualmente no dashboard
- Ou você pode aguardar o tempo de expiração e simular

**Opção 3: Usar o Simulador**
- No dashboard do Mercado Pago, há um simulador de pagamentos
- Você pode criar um pagamento PIX e depois simular a aprovação

---

## 🧾 Boleto de Teste

### Como Funcionar

1. Quando você criar um pagamento Boleto no modo sandbox:
   - O Mercado Pago **gera um boleto de teste**
   - Você **NÃO precisa pagar de verdade**
   - O boleto tem um código de barras de teste

### Simular Aprovação do Boleto

**Via Dashboard:**
1. Acesse o dashboard do Mercado Pago
2. Vá em "Pagamentos" ou "Transações"
3. Encontre o pagamento de teste
4. Você pode simular a aprovação manualmente

---

## 🧪 Como Testar no Seu Sistema

### 1. Configure Credenciais de Teste

No seu arquivo `.env`, use as credenciais de **TESTE** que você copiou do dashboard:

**Passo a passo:**
1. No dashboard do Mercado Pago, na seção **"Configure sua integração"**
2. Clique no ícone de **copiar** ao lado de **"Usuário"** (começa com `TEST...`)
3. Cole no `.env` como `MERCADOPAGO_ACCESS_TOKEN`
4. Clique no ícone de **copiar** ao lado de **"Senha"**
5. Cole no `.env` como `MERCADOPAGO_PUBLIC_KEY` (ou pode ser o mesmo valor, dependendo da configuração)

**Exemplo no `.env`:**
```env
# Modo Sandbox (Teste) - NÃO usa dinheiro real
# Cole o valor de "Usuário" aqui:
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789

# Cole o valor de "Senha" aqui (ou o Public Key se disponível):
MERCADOPAGO_PUBLIC_KEY=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz
```

**⚠️ Importante:** 
- Use as credenciais que aparecem na seção **"Configure sua integração"**
- Elas começam com `TEST-` (modo sandbox)
- Não use credenciais de produção (começam com `APP_USR-`) para testes

### 2. Faça um Checkout de Teste

**POST** `/api/purchases/checkout`

```json
{
  "courses": ["uuid-do-curso"],
  "paymentMethod": "credit_card"
}
```

### 3. Use Cartão de Teste

Quando o frontend redirecionar para o pagamento:
- Use um dos **cartões de teste** listados acima
- Use o nome `APRO` para pagamento aprovado
- Use qualquer CPF válido
- Use qualquer data futura

### 4. Verifique o Webhook

Após o pagamento:
- O Mercado Pago enviará um webhook para sua URL do ngrok
- Você verá a notificação no console do servidor
- O status da compra será atualizado automaticamente

---

## 📋 Checklist de Teste

### Teste de Cartão de Crédito
- [ ] Use credenciais de TESTE no `.env`
- [ ] Faça checkout com `paymentMethod: "credit_card"`
- [ ] Use cartão de teste com nome `APRO`
- [ ] Verifique se o pagamento foi aprovado
- [ ] Verifique se o webhook foi recebido
- [ ] Verifique se a compra foi atualizada no banco

### Teste de PIX
- [ ] Use credenciais de TESTE no `.env`
- [ ] Faça checkout com `paymentMethod: "pix"`
- [ ] Copie o código PIX gerado
- [ ] Simule a aprovação no dashboard do Mercado Pago
- [ ] Verifique se o webhook foi recebido
- [ ] Verifique se a compra foi atualizada

### Teste de Boleto
- [ ] Use credenciais de TESTE no `.env`
- [ ] Faça checkout com `paymentMethod: "boleto"`
- [ ] Copie o código de barras do boleto
- [ ] Simule a aprovação no dashboard do Mercado Pago
- [ ] Verifique se o webhook foi recebido
- [ ] Verifique se a compra foi atualizada

---

## 🔍 Verificar Credenciais

### Como Saber se Está em Modo Teste?

**No Access Token:**
- ✅ `TEST-...` = Modo Teste (não usa dinheiro real)
- ⚠️ `APP_USR-...` = Modo Produção (usa dinheiro real!)

**No Public Key:**
- ✅ `TEST-...` = Modo Teste
- ⚠️ `APP_USR-...` = Modo Produção

---

## ⚠️ Importante

### Modo Teste (Sandbox)
- ✅ **NÃO usa dinheiro real**
- ✅ Pode testar quantas vezes quiser
- ✅ Cartões de teste funcionam
- ✅ PIX e Boleto são simulados

### Modo Produção
- ⚠️ **USA DINHEIRO REAL**
- ⚠️ Cuidado ao usar em produção
- ⚠️ Use apenas quando estiver pronto para receber pagamentos reais

---

## 🎯 Resumo Rápido

1. **Configure credenciais de TESTE** no `.env` (começam com `TEST-`)
2. **Use cartões de teste** para pagamento com cartão
3. **PIX e Boleto** são simulados - não precisa pagar de verdade
4. **Simule aprovações** no dashboard do Mercado Pago
5. **Verifique os webhooks** chegando no seu servidor

---

## 📚 Links Úteis

- **Dashboard Mercado Pago**: https://www.mercadopago.com.br/developers/panel
- **Cartões de Teste**: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards
- **Simulador de Pagamentos**: Disponível no dashboard do Mercado Pago

---

**Lembre-se:** Em modo sandbox, você pode testar tudo sem usar dinheiro real! 🎉

