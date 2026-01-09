# 💳 API: Processar Pagamento com Cartão (Checkout Transparente)

## 📋 Endpoint

**POST** `/api/purchases/:id/process`

Processa pagamento com cartão de crédito diretamente no site, sem redirecionamento para o Mercado Pago (Checkout Transparente).

---

## 🔐 Autenticação

**Obrigatório:** Sim

**Header:**
```
Authorization: Bearer <token>
```

---

## 📥 Request

### URL Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | string (UUID) | Sim | ID da compra (purchaseId) retornado no checkout |

### Request Body

```json
{
  "token": "ff8080814c11e237014c1ff593b57b4d",
  "installments": "1",
  "paymentMethodId": "visa",
  "identificationType": "CPF",
  "identificationNumber": "12345678900"
}
```

### Campos do Body

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `token` | string | **Sim** | Token gerado pelo Mercado Pago JS no frontend | `"ff8080814c11e237014c1ff593b57b4d"` |
| `installments` | string | Não | Número de parcelas (padrão: 1) | `"1"`, `"3"`, `"6"`, `"12"` |
| `paymentMethodId` | string | Não | Bandeira do cartão (será detectado automaticamente pelo token) | `"visa"`, `"mastercard"`, `"elo"` |
| `identificationType` | string | Não | Tipo de documento (recomendado para Brasil) | `"CPF"` |
| `identificationNumber` | string | Não | Número do documento (sem formatação) | `"12345678900"` |

### ⚠️ IMPORTANTE: Token do Cartão

**O token DEVE ser gerado no frontend usando Mercado Pago JS antes de enviar para o backend.**

O backend **NÃO aceita dados do cartão diretamente** por questões de segurança. Você precisa:

1. **Incluir o Mercado Pago JS** no seu HTML:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

2. **Gerar o token** no frontend antes de enviar:
```javascript
// Exemplo de como gerar o token
const mp = new MercadoPago('SUA_PUBLIC_KEY', {
  locale: 'pt-BR'
});

const cardForm = mp.fields.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#333'
    }
  }
});

// Quando o usuário preencher o formulário
cardForm.createToken().then((result) => {
  if (result.status === 'ready') {
    const token = result.id; // Este é o token que você envia para o backend
    // Enviar token para /api/purchases/:id/process
  }
});
```

---

## 📤 Response

### Sucesso (200 OK)

```json
{
  "purchase": {
    "id": "3899e2bc-a148-4776-b1d3-68da1848ba2c",
    "userId": "0a7a50fa-814b-4eb8-ac1d-ffd9b76fca82",
    "totalAmount": "25.00",
    "discountAmount": "0.00",
    "finalAmount": "25.00",
    "paymentMethod": "credit_card",
    "paymentStatus": "paid",
    "paymentId": "1234567890",
    "couponId": null,
    "createdAt": "2026-01-02T13:58:42.359Z",
    "updatedAt": "2026-01-02T13:58:43.189Z",
    "courses": [
      {
        "id": "e89caef8-79ac-43ae-a73e-25606ae86958",
        "purchaseId": "3899e2bc-a148-4776-b1d3-68da1848ba2c",
        "courseId": "bec0ce8b-565e-495f-8492-4b4ec0d5677a",
        "course": {
          "id": "bec0ce8b-565e-495f-8492-4b4ec0d5677a",
          "title": "Relacionamento Consciente",
          "price": "25.00",
          ...
        }
      }
    ]
  },
  "payment": {
    "id": "1234567890",
    "status": "approved",
    "statusDetail": "accredited",
    "threeDSInfo": null
  }
}
```

### Campos da Response

#### `purchase`
Objeto completo da compra atualizada, incluindo:
- `paymentStatus`: Status atualizado (`paid`, `pending`, `failed`)
- `paymentId`: ID do pagamento no Mercado Pago
- `courses`: Array com os cursos comprados

#### `payment`
Informações do pagamento processado:
- `id`: ID do pagamento no Mercado Pago
- `status`: Status do pagamento (`approved`, `pending`, `rejected`, `cancelled`)
- `statusDetail`: Detalhes do status (ex: `accredited`, `pending_contingency`)
- `threeDSInfo`: Informações do 3D Secure (se aplicável)

---

## ❌ Erros

### 401 Unauthorized
```json
{
  "message": "Não autenticado"
}
```
**Causa:** Token não enviado ou inválido.

---

### 400 Bad Request

#### Compra já processada
```json
{
  "message": "Esta compra já foi processada"
}
```

#### Método de pagamento incorreto
```json
{
  "message": "Este endpoint é apenas para pagamentos com cartão de crédito"
}
```

#### Validação de campos
```json
{
  "message": "Erro de validação",
  "errors": [
    {
      "field": "cardNumber",
      "message": "cardNumber should not be empty"
    }
  ]
}
```

---

### 403 Forbidden
```json
{
  "message": "Acesso negado"
}
```
**Causa:** Tentativa de processar compra de outro usuário.

---

### 404 Not Found
```json
{
  "message": "Compra não encontrada"
}
```
**Causa:** ID da compra inválido ou compra não existe.

---

### 500 Internal Server Error
```json
{
  "message": "Erro ao processar pagamento com cartão: [detalhes do erro]"
}
```
**Causas possíveis:**
- Dados do cartão inválidos
- Erro na comunicação com Mercado Pago
- Cartão rejeitado

---

## 📝 Exemplos de Uso

### Exemplo 1: Pagamento à vista (1x) - Completo

```html
<!-- 1. Incluir Mercado Pago JS no HTML -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

```javascript
// 2. Frontend - JavaScript/TypeScript
// Inicializar Mercado Pago (use sua PUBLIC KEY de teste)
const mp = new MercadoPago('TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz', {
  locale: 'pt-BR'
});

// Criar formulário de cartão
const cardForm = mp.fields.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#333'
    }
  }
});

// Montar o formulário no elemento HTML
cardForm.mount('#card-form');

// Função para processar pagamento
const processPayment = async (purchaseId) => {
  try {
    // 1. Gerar token do cartão
    const tokenResult = await cardForm.createToken();
    
    if (tokenResult.status !== 'ready') {
      console.error('Erro ao gerar token:', tokenResult);
      return;
    }

    const token = tokenResult.id;

    // 2. Enviar token para o backend
    const response = await fetch(
      `http://localhost:3001/api/purchases/${purchaseId}/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token, // Token gerado pelo Mercado Pago JS
          installments: "1",
          identificationType: "CPF",
          identificationNumber: "12345678900" // CPF do usuário
        })
      }
    );

    const data = await response.json();

    if (response.ok) {
      if (data.payment.status === 'approved') {
        // ✅ Pagamento aprovado!
        console.log('Pagamento aprovado!', data.purchase);
        window.location.href = '/purchase/success';
      } else if (data.payment.status === 'pending') {
        // ⏳ Pagamento pendente (pode precisar de 3D Secure)
        if (data.payment.threeDSInfo) {
          // Redirecionar para 3D Secure
          window.location.href = data.payment.threeDSInfo.external_resource_url;
        } else {
          // Fazer polling para verificar status
          checkPaymentStatus(purchaseId);
        }
      } else {
        // ❌ Pagamento rejeitado
        console.error('Pagamento rejeitado', data.payment.statusDetail);
        showError(data.payment.statusDetail);
      }
    } else {
      console.error('Erro ao processar pagamento', data.message);
      showError(data.message);
    }
  } catch (error) {
    console.error('Erro na requisição', error);
    showError('Erro ao processar pagamento. Tente novamente.');
  }
};
```

### Exemplo 2: Pagamento parcelado (3x)

```javascript
const processPayment = async (purchaseId) => {
  // Gerar token
  const tokenResult = await cardForm.createToken();
  const token = tokenResult.id;

  // Enviar para processar
  const response = await fetch(
    `http://localhost:3001/api/purchases/${purchaseId}/process`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        token: token,
        installments: "3", // 3 parcelas
        identificationType: "CPF",
        identificationNumber: "12345678900"
      })
    }
  );

  const data = await response.json();
  // ... tratamento da resposta
};
```

### Exemplo 3: Com tratamento de 3D Secure

```javascript
const processPayment = async (purchaseId) => {
  // Gerar token
  const tokenResult = await cardForm.createToken();
  const token = tokenResult.id;

  const response = await fetch(
    `http://localhost:3001/api/purchases/${purchaseId}/process`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        token: token,
        installments: "1"
      })
    }
  );

  const data = await response.json();

  if (data.payment.threeDSInfo) {
    // Pagamento requer 3D Secure
    // Redirecionar para URL do 3D Secure
    const threeDSUrl = data.payment.threeDSInfo.external_resource_url;
    window.location.href = threeDSUrl;
  } else if (data.payment.status === 'approved') {
    // Pagamento aprovado diretamente
    window.location.href = '/purchase/success';
  }
};
```

---

## 🔄 Fluxo Completo

### 1. Criar Checkout
```javascript
// POST /api/purchases/checkout
const checkoutResponse = await fetch('/api/purchases/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    courses: ["course-uuid-1"],
    paymentMethod: "credit_card"
  })
});

const checkout = await checkoutResponse.json();
// Retorna: { purchaseId: "...", payment: { method: "credit_card", paymentLink: null } }
```

### 2. Gerar Token do Cartão (Frontend)
```javascript
// Usar Mercado Pago JS para gerar token
const mp = new MercadoPago('SUA_PUBLIC_KEY', { locale: 'pt-BR' });
const cardForm = mp.fields.create('card');
cardForm.mount('#card-form');

// Quando usuário preencher e clicar em "Pagar"
const tokenResult = await cardForm.createToken();
const token = tokenResult.id; // Token seguro do cartão
```

### 3. Processar Pagamento
```javascript
// POST /api/purchases/:id/process
const processResponse = await fetch(
  `/api/purchases/${checkout.purchaseId}/process`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      token: token, // Token gerado pelo Mercado Pago JS
      installments: "1",
      identificationType: "CPF",
      identificationNumber: "12345678900"
    })
  }
);

const result = await processResponse.json();
```

### 4. Verificar Status
```javascript
if (result.payment.status === 'approved') {
  // ✅ Pagamento aprovado
  // Redirecionar para página de sucesso
  window.location.href = '/purchase/success';
} else if (result.payment.status === 'pending') {
  // ⏳ Pagamento pendente
  // Verificar se precisa de 3D Secure
  if (result.payment.threeDSInfo) {
    // Redirecionar para 3D Secure
  } else {
    // Fazer polling para verificar status
    checkPaymentStatus(checkout.purchaseId);
  }
} else {
  // ❌ Pagamento rejeitado
  // Mostrar mensagem de erro
  showError(result.payment.statusDetail);
}
```

---

## 🧪 Cartões de Teste

### Cartão Aprovado
```
Número: 5031 4332 1540 6351
Nome: APRO
Validade: 11/25
CVV: 123
```

### Cartão Rejeitado
```
Número: 5031 4332 1540 6351
Nome: OTHE
Validade: 11/25
CVV: 123
```

### Cartão com Fundos Insuficientes
```
Número: 5031 4332 1540 6351
Nome: CONT
Validade: 11/25
CVV: 123
```

**Mais cartões de teste:** Veja `GUIA_PAGAMENTOS_TESTE.md`

---

## ⚠️ Validações no Frontend

### Antes de Enviar

1. **Token do Cartão:**
   - ✅ Token deve ser gerado usando Mercado Pago JS
   - ✅ Verificar se `tokenResult.status === 'ready'`
   - ✅ Token é válido por alguns minutos apenas

2. **Formulário de Cartão:**
   - ✅ Usuário deve preencher todos os campos
   - ✅ Mercado Pago JS valida automaticamente
   - ✅ Token só é gerado se dados estiverem corretos

3. **CPF (se enviado):**
   - Remover formatação
   - Validar CPF válido

### Como Gerar o Token

```javascript
// 1. Inicializar Mercado Pago
const mp = new MercadoPago('SUA_PUBLIC_KEY', { locale: 'pt-BR' });

// 2. Criar formulário de cartão
const cardForm = mp.fields.create('card', {
  style: { /* estilos */ }
});

// 3. Montar no elemento HTML
cardForm.mount('#card-form');

// 4. Gerar token quando usuário clicar em "Pagar"
const tokenResult = await cardForm.createToken();

if (tokenResult.status === 'ready') {
  const token = tokenResult.id; // Enviar este token para o backend
} else {
  // Erro ao gerar token
  console.error('Erro:', tokenResult);
}
```

---

## 📊 Status Possíveis

| Status | Descrição | Ação |
|--------|-----------|------|
| `approved` | Pagamento aprovado | ✅ Redirecionar para sucesso |
| `pending` | Pagamento pendente | ⏳ Verificar `threeDSInfo` ou fazer polling |
| `rejected` | Pagamento rejeitado | ❌ Mostrar erro ao usuário |
| `cancelled` | Pagamento cancelado | ❌ Mostrar erro ao usuário |

---

## 🔐 Segurança

### ⚠️ IMPORTANTE

1. **Nunca envie dados do cartão diretamente para o backend**
2. **Sempre use tokens** gerados pelo Mercado Pago JS
3. **Use HTTPS** em produção
4. **Não armazene tokens** após uso
5. **Não logue tokens** ou dados sensíveis

### Por que usar Token?

- ✅ **Segurança:** Dados do cartão nunca passam pelo seu servidor
- ✅ **PCI Compliance:** Você não precisa se preocupar com certificação PCI
- ✅ **Menos responsabilidade:** Mercado Pago cuida da segurança dos dados
- ✅ **Melhor UX:** Validação automática no frontend

### Dados Sensíveis

- ✅ **Pode enviar:** Token gerado pelo Mercado Pago JS
- ❌ **NÃO envie:** Número do cartão, CVV, validade diretamente
- ❌ **NÃO armazene:** Tokens após processamento
- ❌ **NÃO logue:** Tokens ou dados do cartão

---

## 🔗 Endpoints Relacionados

- **Checkout:** `POST /api/purchases/checkout`
- **Confirmar:** `POST /api/purchases/:id/confirm` (não necessário para cartão)
- **Ver Compra:** `GET /api/purchases/:id`
- **Minhas Compras:** `GET /api/purchases/my-purchases`

---

## 📚 Documentação Adicional

- **Guia de Pagamentos de Teste:** `GUIA_PAGAMENTOS_TESTE.md`
- **Documentação Completa da API:** `API_DOCUMENTATION.md`
- **Configuração de Webhooks:** `CONFIGURAR_WEBHOOK_MERCADOPAGO.md`

---

## 💡 Dicas

1. **Use Mercado Pago JS** para gerar tokens - é obrigatório e mais seguro
2. **Trate 3D Secure** se necessário (alguns cartões exigem)
3. **Faça polling** se o status for `pending` e não houver `threeDSInfo`
4. **Mostre mensagens claras** ao usuário em caso de erro
5. **Use cartões de teste** durante desenvolvimento
6. **Configure sua PUBLIC KEY** corretamente (TEST- para desenvolvimento)

## 📚 Documentação do Mercado Pago JS

- **SDK:** https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js
- **Checkout Transparente:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/credentials
- **Gerar Token:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

---

**Última atualização:** 02/01/2026

