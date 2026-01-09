# 👀 Como Ver Transações no Mercado Pago

Existem várias formas de visualizar as transações/pagamentos criados através da sua aplicação:

---

## 1. 📊 Dashboard do Mercado Pago (Mais Fácil)

### Acessar o Dashboard:

1. **Acesse:** https://www.mercadopago.com.br/developers/panel
2. **Faça login** com sua conta do Mercado Pago
3. Vá em **"Suas integrações"** > Sua aplicação

### Onde Ver as Transações:

#### **Modo Sandbox (Teste):**
- Na página da aplicação, procure pela aba **"Atividades"** ou **"Transações de teste"**
- Você verá todas as transações de teste criadas
- Filtre por data, status, valor, etc.

#### **Modo Produção:**
- Acesse: https://www.mercadopago.com.br/activities
- Ou vá em **"Vendas"** > **"Suas vendas"** no menu principal
- Todas as transações reais aparecerão aqui

### Informações Disponíveis:
- ✅ ID da transação (`payment_id` ou `pref_id`)
- ✅ Status do pagamento (aprovado, pendente, rejeitado)
- ✅ Valor e moeda
- ✅ Método de pagamento (cartão, PIX, boleto)
- ✅ Dados do comprador
- ✅ Data e hora
- ✅ Detalhes completos da transação

---

## 2. 🔌 Via API do Backend (Programático)

### Endpoint Criado:

**GET** `/api/purchases/:id/payment-details`

Busca detalhes completos da transação do Mercado Pago associada a uma compra.

**Headers:**
```
Authorization: Bearer <seu_token>
```

**Exemplo de Requisição:**
```bash
GET http://localhost:3001/api/purchases/1c13172d-fff4-4f66-802e-ae8e54e1626f/payment-details
```

**Resposta (200):**
```json
{
  "purchaseId": "1c13172d-fff4-4f66-802e-ae8e54e1626f",
  "paymentId": "140335646-21f49b23-dbad-4e56-b6b6-95d4f349c918",
  "paymentDetails": {
    "type": "preference",
    "id": "140335646-21f49b23-dbad-4e56-b6b6-95d4f349c918",
    "status": "pending",
    "initPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
    "items": [
      {
        "id": "1c13172d-fff4-4f66-802e-ae8e54e1626f",
        "title": "Compra de 1 curso(s)",
        "quantity": 1,
        "unit_price": 25
      }
    ],
    "payer": {
      "email": "usuario@email.com",
      "name": "Nome do Usuário"
    },
    "metadata": {
      "purchase_id": "1c13172d-fff4-4f66-802e-ae8e54e1626f"
    }
  }
}
```

**Para Pagamentos Processados (PIX/Boleto):**
```json
{
  "purchaseId": "1c13172d-fff4-4f66-802e-ae8e54e1626f",
  "paymentId": "1234567890",
  "paymentDetails": {
    "type": "payment",
    "id": "1234567890",
    "status": "approved",
    "statusDetail": "accredited",
    "transactionAmount": 25,
    "currencyId": "BRL",
    "paymentMethodId": "pix",
    "dateCreated": "2026-01-02T10:30:00.000-04:00",
    "dateApproved": "2026-01-02T10:31:00.000-04:00",
    "payer": {
      "email": "usuario@email.com",
      "identification": {
        "type": "CPF",
        "number": "12345678900"
      }
    },
    "pointOfInteraction": {
      "transactionData": {
        "qrCode": "00020126360014BR...",
        "qrCodeBase64": "..."
      }
    }
  }
}
```

---

## 3. 📋 Via Endpoint de Compras

### Ver Todas as Compras:

**GET** `/api/purchases/my-purchases`

Retorna todas as compras do usuário com o `paymentId` salvo.

**Resposta:**
```json
{
  "purchases": [
    {
      "id": "1c13172d-fff4-4f66-802e-ae8e54e1626f",
      "paymentId": "140335646-21f49b23-dbad-4e56-b6b6-95d4f349c918",
      "paymentStatus": "pending",
      "paymentMethod": "credit_card",
      "finalAmount": 25,
      ...
    }
  ]
}
```

### Ver Detalhes de uma Compra:

**GET** `/api/purchases/:id`

Retorna os detalhes completos da compra, incluindo o `paymentId`.

---

## 4. 🔍 Buscar no Banco de Dados

### Via SQL:

```sql
-- Ver todas as compras com seus paymentIds
SELECT 
  id,
  "paymentId",
  "paymentStatus",
  "paymentMethod",
  "finalAmount",
  "createdAt"
FROM purchases
ORDER BY "createdAt" DESC;

-- Ver compras de um usuário específico
SELECT * FROM purchases 
WHERE "userId" = 'uuid-do-usuario';

-- Ver compras por status
SELECT * FROM purchases 
WHERE "paymentStatus" = 'paid';
```

---

## 5. 📝 Logs do Console

O backend já está configurado para logar informações importantes:

### No Console do Servidor:

Quando um pagamento é criado, você verá:
```
📡 [2026-01-02 10:30:00] 🔐 POST /api/purchases/checkout
   IP: ::1
   Body: {...}
✅ [2026-01-02 10:30:01] POST /api/purchases/checkout - Status: 200 - Tempo: 500ms
```

Quando o webhook recebe uma atualização:
```
📡 [2026-01-02 10:35:00] 🔓 POST /api/webhooks/mercadopago
   IP: 181.xxx.xxx.xxx
✅ [2026-01-02 10:35:01] POST /api/webhooks/mercadopago - Status: 200 - Tempo: 200ms
```

---

## 🎯 Resumo das Formas de Visualizar

| Método | Quando Usar | Facilidade |
|--------|-------------|------------|
| **Dashboard MP** | Ver todas as transações, debug visual | ⭐⭐⭐⭐⭐ |
| **API `/payment-details`** | Integrar no frontend/admin | ⭐⭐⭐⭐ |
| **API `/my-purchases`** | Listar compras do usuário | ⭐⭐⭐⭐ |
| **Banco de Dados** | Análise profunda, relatórios | ⭐⭐⭐ |
| **Logs Console** | Debug em tempo real | ⭐⭐⭐ |

---

## 💡 Dicas

1. **Para desenvolvimento/teste:** Use o Dashboard do Mercado Pago em modo Sandbox
2. **Para produção:** Configure alertas no Dashboard para monitorar transações
3. **Para integração:** Use o endpoint `/payment-details` para mostrar informações no frontend
4. **Para análise:** Exporte dados do banco ou use a API do Mercado Pago

---

## 🔗 Links Úteis

- **Dashboard:** https://www.mercadopago.com.br/developers/panel
- **Atividades de Teste:** https://www.mercadopago.com.br/developers/panel/app/{app_id}/activities
- **Documentação API:** https://www.mercadopago.com.br/developers/pt/docs

