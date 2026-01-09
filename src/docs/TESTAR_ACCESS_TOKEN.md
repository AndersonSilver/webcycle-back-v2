# 🧪 Como Testar se o Access Token Está Funcionando

## ⚠️ Problema: `internal_error` persistente

Se você está recebendo `internal_error` mesmo com token válido, pode ser um problema com o **Access Token** do Mercado Pago.

## ✅ Teste 1: Verificar Access Token no Postman

### Endpoint de Teste

```
GET https://api.mercadopago.com/v1/payment_methods
```

### Headers

```
Authorization: Bearer TEST-SEU-ACCESS-TOKEN-AQUI
Content-Type: application/json
```

### Resposta Esperada

Se o Access Token estiver correto, você receberá uma lista de métodos de pagamento:

```json
[
  {
    "id": "visa",
    "name": "Visa",
    "payment_type_id": "credit_card",
    "status": "active",
    "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.jpg",
    "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.jpg",
    "deferred_capture": "supported",
    "settings": [...]
  },
  ...
]
```

**Se receber `401 Unauthorized`:**
- O Access Token está incorreto ou expirado
- Gere um novo Access Token no painel do Mercado Pago

**Se receber `200 OK`:**
- O Access Token está funcionando
- O problema pode estar em outro lugar

---

## ✅ Teste 2: Criar um Pagamento de Teste Simples

### Endpoint

```
POST https://api.mercadopago.com/v1/payments
```

### Headers

```
Authorization: Bearer TEST-SEU-ACCESS-TOKEN-AQUI
Content-Type: application/json
```

### Body (PIX de Teste)

```json
{
  "transaction_amount": 10.00,
  "description": "Teste de pagamento",
  "payment_method_id": "pix",
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

### Resposta Esperada

Se funcionar, você receberá:

```json
{
  "id": 1234567890,
  "status": "pending",
  "status_detail": "pending_waiting_transfer",
  "transaction_amount": 10.00,
  "point_of_interaction": {
    "transaction_data": {
      "qr_code": "00020126...",
      "qr_code_base64": "data:image/png;base64,..."
    }
  }
}
```

**Se receber `internal_error`:**
- Pode ser um problema temporário do Mercado Pago
- Tente novamente após alguns minutos
- Verifique se sua conta está ativa

---

## ✅ Teste 3: Verificar Conta do Mercado Pago

### Passos

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta
3. Vá em **"Suas integrações"**
4. Verifique se sua aplicação está **ativa**
5. Verifique se há **avisos ou restrições**

### Possíveis Problemas

- **Conta não verificada:** Verifique seu email e complete a verificação
- **Aplicação suspensa:** Entre em contato com o suporte
- **Limite de requisições excedido:** Aguarde alguns minutos

---

## ✅ Teste 4: Verificar Credenciais no .env

### Arquivo `.env`

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-123456-1234567890-1234567890
```

### Verificações

1. **Não tem espaços extras:**
   ```env
   # ❌ ERRADO
   MERCADOPAGO_ACCESS_TOKEN= TEST-1234...
   
   # ✅ CORRETO
   MERCADOPAGO_ACCESS_TOKEN=TEST-1234...
   ```

2. **Não tem aspas:**
   ```env
   # ❌ ERRADO
   MERCADOPAGO_ACCESS_TOKEN="TEST-1234..."
   
   # ✅ CORRETO
   MERCADOPAGO_ACCESS_TOKEN=TEST-1234...
   ```

3. **Começa com TEST- ou APP_USR-:**
   ```env
   # ✅ CORRETO (Sandbox)
   MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-123456-1234567890-1234567890
   
   # ✅ CORRETO (Produção)
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-123456-1234567890-1234567890
   ```

---

## ✅ Teste 5: Gerar Novo Access Token

### Passos

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em **"Suas integrações"**
3. Selecione sua aplicação
4. Clique em **"Credenciais"**
5. Copie o **Access Token** (começa com `TEST-` para sandbox)
6. Cole no arquivo `.env`
7. **Reinicie o servidor backend**

---

## 🔍 Debug no Código

Adicione este código temporariamente no `PaymentService.ts` para testar:

```typescript
// Teste de conexão com Mercado Pago
async testConnection() {
  try {
    // Tentar buscar métodos de pagamento
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${env.mercadopagoAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Access Token está funcionando!');
      const data = await response.json();
      console.log('Métodos de pagamento disponíveis:', data.length);
    } else {
      console.error('❌ Access Token inválido:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Erro:', errorText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
  }
}
```

---

## 📞 Próximos Passos

Se após todos os testes o problema persistir:

1. **Capture os logs completos:**
   - Console do backend
   - Resposta do Postman (se testou)
   - Erro completo do Mercado Pago

2. **Verifique a documentação oficial:**
   - https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

3. **Entre em contato com o suporte do Mercado Pago:**
   - https://www.mercadopago.com.br/developers/pt/support
   - Forneça o `x-request-id` (se disponível nos logs)

---

## 💡 Dicas

- **Use sempre credenciais de TESTE primeiro**
- **Não compartilhe suas credenciais de PRODUÇÃO**
- **Mantenha suas credenciais seguras**
- **Gere novos tokens periodicamente**

