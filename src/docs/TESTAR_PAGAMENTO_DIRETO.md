# 🧪 Testar Pagamento Direto com API REST do Mercado Pago

## 🎯 Objetivo

Testar o pagamento diretamente com a API REST do Mercado Pago para obter mais detalhes do erro `internal_error`.

## ⚠️ ATENÇÃO: Use POST, não GET!

O endpoint `/v1/payments` **só aceita o método POST** para criar pagamentos.

- ✅ **CORRETO:** `POST https://api.mercadopago.com/v1/payments`
- ❌ **ERRADO:** `GET https://api.mercadopago.com/v1/payments` (retorna 405 Method Not Allowed)

---

## 📋 Teste no Postman

### ⚠️ IMPORTANTE: Use o Método POST

O endpoint `/v1/payments` **só aceita POST**, não GET!

### Endpoint

```
POST https://api.mercadopago.com/v1/payments
```

**Método:** `POST` (não GET!)

### Headers

```
Authorization: Bearer TEST-4669818375391721-032320-6a24be12a6624124eb75faf540e2f9d7-140335646
Content-Type: application/json
```

### Body (Exemplo com Token de Teste)

```json
{
  "transaction_amount": 25.00,
  "token": "7d6c60857dbb41c4866b71e7d626ef25",
  "description": "Teste de pagamento",
  "installments": 1,
  "payer": {
    "email": "test@test.com",
    "first_name": "Test",
    "last_name": "User",
    "identification": {
      "type": "CPF",
      "number": "12345678909"
    }
  }
}
```

### ⚠️ IMPORTANTE: Token de Teste

O token `7d6c60857dbb41c4866b71e7d626ef25` que você está gerando no frontend **pode estar expirado** quando chega no backend.

**Tokens do Mercado Pago expiram em alguns segundos!**

---

## 🔍 O que Verificar

### 1. **Token está sendo usado IMEDIATAMENTE?**

No seu código frontend, verifique:

```javascript
// ✅ CORRETO - Usar imediatamente
const token = await cardForm.createCardToken();
console.log('Token gerado:', token.id);

// Enviar IMEDIATAMENTE para o backend (sem delays)
await fetch('/api/purchases/123/process', {
  method: 'POST',
  body: JSON.stringify({ token: token.id })
});

// ❌ ERRADO - Esperar antes de enviar
const token = await cardForm.createCardToken();
await new Promise(resolve => setTimeout(resolve, 1000)); // ❌ Token pode expirar!
await fetch('/api/purchases/123/process', {
  method: 'POST',
  body: JSON.stringify({ token: token.id })
});
```

### 2. **CPF de Teste está Correto?**

O Mercado Pago pode rejeitar CPFs de teste específicos. Tente usar:

- `12345678909` (11 dígitos) ✅
- `11111111111` (alternativa)
- `00000000000` (alternativa)

### 3. **Cartão de Teste está Correto?**

Use cartões de teste do Mercado Pago:

**Visa:**
- Número: `4509 9535 6623 3704`
- CVV: `123`
- Validade: Qualquer data futura (ex: `12/25`)
- Nome: Qualquer nome

**Mastercard:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: Qualquer data futura
- Nome: Qualquer nome

**Mais cartões de teste:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

---

## 🐛 Debug: Verificar Token no Backend

Adicione este log no `PaymentService.ts` para verificar se o token está chegando válido:

```typescript
console.log('🔍 Verificando token recebido:', {
  token: data.token,
  length: data.token.length,
  format: /^[a-f0-9]{32}$/i.test(data.token),
  timestamp: new Date().toISOString(), // Quando o token chegou no backend
});
```

**Se houver delay entre gerar o token no frontend e processar no backend, o token pode ter expirado!**

---

## 💡 Solução: Gerar Token no Momento Certo

### Opção 1: Gerar Token Quando Usuário Clicar em "Pagar"

```javascript
// Quando usuário clicar em "Pagar"
async function processarPagamento() {
  // 1. Gerar token AGORA
  const token = await cardForm.createCardToken();
  
  // 2. Enviar IMEDIATAMENTE
  const response = await fetch('/api/purchases/123/process', {
    method: 'POST',
    body: JSON.stringify({ token: token.id })
  });
  
  // 3. Processar resposta
  const result = await response.json();
}
```

### Opção 2: Usar Webhook para Confirmar Pagamento

Se o token expirar muito rápido, você pode:

1. Processar o pagamento no backend
2. Se der erro de token expirado, pedir para o usuário tentar novamente
3. Ou usar webhook do Mercado Pago para confirmar o pagamento

---

## 📞 Próximos Passos

1. **Teste no Postman** com o token que você está gerando
2. **Verifique o tempo** entre gerar o token e enviar para o backend
3. **Use cartões de teste** do Mercado Pago
4. **Verifique os logs** do backend para ver quando o token chega

Se o problema persistir, pode ser um problema temporário do Mercado Pago ou alguma configuração específica da sua conta.

