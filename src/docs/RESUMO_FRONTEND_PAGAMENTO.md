# 💳 Resumo: Integração de Pagamento com Cartão - Frontend

## 🎯 O que você precisa fazer

Implementar pagamento com cartão usando **Checkout Transparente** do Mercado Pago.

---

## 📋 Passo a Passo Rápido

### 1️⃣ Configurar Mercado Pago JS

```html
<!-- No seu HTML, antes de </body> -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

```javascript
// Inicializar (use sua PUBLIC KEY de teste)
const mp = new MercadoPago('TEST-SUA_PUBLIC_KEY_AQUI', {
  locale: 'pt-BR'
});

// Criar formulário de cartão
const cardForm = mp.fields.create('card');
cardForm.mount('#card-form'); // ID do elemento onde o formulário aparecerá
```

### 2️⃣ Gerar Token Quando Usuário Clicar em "Pagar"

```javascript
// Quando usuário preencher cartão e clicar em "Pagar"
const tokenResult = await cardForm.createToken();

if (tokenResult.status === 'ready') {
  const token = tokenResult.id; // Este é o token que você vai enviar
  // Continue para passo 3
} else {
  // Erro - mostrar mensagem ao usuário
  alert('Erro ao validar cartão');
}
```

### 3️⃣ Enviar Token para o Backend

```javascript
// POST /api/purchases/:id/process
const response = await fetch(`/api/purchases/${purchaseId}/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}` // Token de autenticação do usuário
  },
  body: JSON.stringify({
    token: token, // Token gerado no passo 2
    installments: "1", // Número de parcelas
    identificationType: "CPF", // Opcional
    identificationNumber: "12345678900" // Opcional
  })
});

const result = await response.json();
```

### 4️⃣ Tratar Resposta

```javascript
if (result.payment.status === 'approved') {
  // ✅ Pagamento aprovado!
  window.location.href = '/purchase/success';
  
} else if (result.payment.status === 'pending') {
  // ⏳ Pagamento pendente
  if (result.payment.threeDSInfo) {
    // Precisa de 3D Secure - redirecionar
    window.location.href = result.payment.threeDSInfo.external_resource_url;
  } else {
    // Fazer polling para verificar status
    // Ou aguardar webhook atualizar
  }
  
} else {
  // ❌ Pagamento rejeitado
  alert('Pagamento rejeitado: ' + result.payment.statusDetail);
}
```

---

## 📝 Estrutura Completa do Request

```json
{
  "token": "ff8080814c11e237014c1ff593b57b4d",
  "installments": "1",
  "paymentMethodId": "visa",
  "identificationType": "CPF",
  "identificationNumber": "12345678900"
}
```

**Campos obrigatórios:**
- ✅ `token` - Token gerado pelo Mercado Pago JS

**Campos opcionais:**
- `installments` - Número de parcelas (padrão: 1)
- `paymentMethodId` - Bandeira (será detectado automaticamente)
- `identificationType` - Tipo de documento (ex: "CPF")
- `identificationNumber` - Número do documento

---

## 📤 Estrutura da Response

```json
{
  "purchase": {
    "id": "uuid",
    "paymentStatus": "paid",
    "paymentId": "1234567890",
    "courses": [...]
  },
  "payment": {
    "id": "1234567890",
    "status": "approved",
    "statusDetail": "accredited",
    "threeDSInfo": null
  }
}
```

**Status possíveis:**
- `approved` ✅ - Pagamento aprovado
- `pending` ⏳ - Pagamento pendente (pode precisar de 3D Secure)
- `rejected` ❌ - Pagamento rejeitado
- `cancelled` ❌ - Pagamento cancelado

---

## 🔑 Onde Obter a Public Key

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Na aba **"Credenciais de teste"**, copie a **Public Key**
4. Formato: `TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz`

---

## 🧪 Cartões de Teste

**Cartão Aprovado:**
```
Número: 5031 4332 1540 6351
Nome: APRO
Validade: 11/25
CVV: 123
```

**Cartão Rejeitado:**
```
Número: 5031 4332 1540 6351
Nome: OTHE
Validade: 11/25
CVV: 123
```

---

## ⚠️ IMPORTANTE

1. **NUNCA envie dados do cartão diretamente** para o backend
2. **SEMPRE use tokens** gerados pelo Mercado Pago JS
3. **Use Public Key de TESTE** durante desenvolvimento
4. **Troque para PRODUÇÃO** quando for ao ar

---

## 🔗 Documentação Completa

Para mais detalhes, consulte:
- **API Completa:** `API_PROCESS_PAYMENT.md`
- **Configuração MP JS:** `COMO_CONFIGURAR_MERCADOPAGO_JS.md`
- **Todas as APIs:** `API_DOCUMENTATION.md`

---

## 💡 Exemplo Completo (Vanilla JS)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Pagamento</title>
</head>
<body>
  <!-- Container do formulário -->
  <div id="card-form"></div>
  
  <select id="installments">
    <option value="1">1x</option>
    <option value="3">3x</option>
    <option value="6">6x</option>
  </select>
  
  <button id="pay-button">Pagar</button>

  <!-- Mercado Pago JS -->
  <script src="https://sdk.mercadopago.com/js/v2"></script>
  
  <script>
    // Configuração
    const PUBLIC_KEY = 'TEST-SUA_PUBLIC_KEY_AQUI';
    const purchaseId = 'uuid-da-compra';
    const userToken = 'token-de-autenticacao-do-usuario';
    
    // Inicializar
    const mp = new MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
    const cardForm = mp.fields.create('card');
    cardForm.mount('#card-form');
    
    // Processar pagamento
    document.getElementById('pay-button').addEventListener('click', async () => {
      try {
        // 1. Gerar token
        const tokenResult = await cardForm.createToken();
        
        if (tokenResult.status !== 'ready') {
          alert('Erro ao validar cartão');
          return;
        }
        
        // 2. Enviar para backend
        const response = await fetch(`/api/purchases/${purchaseId}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            token: tokenResult.id,
            installments: document.getElementById('installments').value
          })
        });
        
        const result = await response.json();
        
        // 3. Tratar resposta
        if (result.payment.status === 'approved') {
          window.location.href = '/purchase/success';
        } else {
          alert('Erro: ' + result.payment.statusDetail);
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao processar pagamento');
      }
    });
  </script>
</body>
</html>
```

---

## ❓ Dúvidas Comuns

**P: Posso enviar dados do cartão diretamente?**
R: Não. Por segurança, você DEVE usar tokens gerados pelo Mercado Pago JS.

**P: Onde obtenho a Public Key?**
R: No painel do Mercado Pago, em "Credenciais de teste" ou "Credenciais de produção".

**P: O token expira?**
R: Sim, tokens são válidos por alguns minutos. Gere um novo token a cada tentativa de pagamento.

**P: E se o pagamento precisar de 3D Secure?**
R: A resposta virá com `threeDSInfo` contendo a URL para redirecionar o usuário.

---

**Última atualização:** 02/01/2026

