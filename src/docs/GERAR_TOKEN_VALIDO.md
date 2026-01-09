# 🔑 Como Gerar um Token Válido para Teste

## ⚠️ Problema: Token Expirado ou Inválido

O erro `internal_error` do Mercado Pago geralmente ocorre quando:
1. **Token expirado** (mais comum - tokens expiram em segundos)
2. **Token inválido** (gerado incorretamente)
3. **Token de outra aplicação** (Public Key diferente)

---

## ✅ Solução: Gerar Token Válido no Frontend

### Passo 1: Configurar Mercado Pago JS Corretamente

```html
<!-- No seu HTML -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

```javascript
// Inicializar com sua Public Key CORRETA
const mp = new MercadoPago('TEST-SUA-PUBLIC-KEY-AQUI', {
  locale: 'pt-BR'
});

// Criar formulário de cartão
const cardForm = mp.fields({
  amount: "100.00",
  iframe: true,
  fields: {
    cardNumber: {
      selector: '#cardNumber',
      placeholder: 'Número do cartão'
    },
    expirationDate: {
      selector: '#expirationDate',
      placeholder: 'MM/AA'
    },
    securityCode: {
      selector: '#securityCode',
      placeholder: 'CVV'
    },
    cardholderName: {
      selector: '#cardholderName',
      placeholder: 'Nome no cartão'
    },
    identificationType: {
      selector: '#identificationType',
      placeholder: 'Tipo'
    },
    identificationNumber: {
      selector: '#identificationNumber',
      placeholder: 'CPF'
    },
    cardholderEmail: {
      selector: '#cardholderEmail',
      placeholder: 'E-mail'
    },
    installments: {
      selector: '#installments',
      placeholder: 'Parcelas'
    }
  }
});
```

---

### Passo 2: Usar Cartão de Teste do Mercado Pago

**⚠️ IMPORTANTE:** Use cartões de teste oficiais do Mercado Pago!

#### Visa (Aprovado):
- **Número:** `4509 9535 6623 3704`
- **CVV:** `123`
- **Validade:** Qualquer data futura (ex: `12/25`)
- **Nome:** Qualquer nome
- **CPF:** `12345678909`

#### Mastercard (Aprovado):
- **Número:** `5031 4332 1540 6351`
- **CVV:** `123`
- **Validade:** Qualquer data futura
- **Nome:** Qualquer nome
- **CPF:** `12345678909`

#### Mais Cartões de Teste:
https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

---

### Passo 3: Gerar Token e Enviar IMEDIATAMENTE

```javascript
// Quando usuário clicar em "Pagar"
async function processarPagamento() {
  try {
    console.log('🔄 Gerando token...');
    
    // 1. Gerar token AGORA
    const tokenResult = await cardForm.createCardToken();
    
    // 2. Verificar se token foi gerado
    if (!tokenResult || !tokenResult.id) {
      console.error('❌ Token não foi gerado!');
      alert('Erro ao gerar token do cartão');
      return;
    }
    
    const token = tokenResult.id;
    console.log('✅ Token gerado:', token);
    console.log('📏 Tamanho:', token.length); // Deve ser 32
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // 3. Enviar IMEDIATAMENTE para o backend (SEM DELAYS!)
    console.log('📤 Enviando para backend...');
    const response = await fetch('/api/purchases/123/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        token: token, // ✅ Token recém-gerado
        installments: '1',
        identificationType: 'CPF',
        identificationNumber: '12345678909'
      })
    });
    
    const result = await response.json();
    console.log('📥 Resposta do backend:', result);
    
    if (response.ok) {
      console.log('✅ Pagamento processado!');
    } else {
      console.error('❌ Erro:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar:', error);
  }
}
```

---

## 🐛 Debug: Verificar Token no Console

Adicione estes logs no seu código:

```javascript
const token = await cardForm.createCardToken();

console.log('🔍 Análise do Token:', {
  token: token.id,
  length: token.id.length,
  format: /^[a-f0-9]{32}$/i.test(token.id) ? '✅ Válido' : '❌ Inválido',
  timestamp: new Date().toISOString(),
  publicKey: 'TEST-SUA-PUBLIC-KEY-AQUI'.substring(0, 20) + '...',
});
```

**O que verificar:**
- ✅ Token tem 32 caracteres
- ✅ Token é hexadecimal (0-9, a-f)
- ✅ Token foi gerado há menos de 5 segundos
- ✅ Public Key está correta

---

## ⚠️ Erros Comuns

### Erro 1: Token Expirado

**Sintoma:** `internal_error` mesmo com token válido

**Causa:** Delay entre gerar token e enviar para backend

**Solução:**
```javascript
// ❌ ERRADO - Qualquer delay expira o token
const token = await cardForm.createCardToken();
await new Promise(resolve => setTimeout(resolve, 2000)); // ❌ Token expira!
await fetch('/api/purchases/123/process', ...);

// ✅ CORRETO - Enviar imediatamente
const token = await cardForm.createCardToken();
await fetch('/api/purchases/123/process', ...); // ✅ Imediatamente!
```

---

### Erro 2: Public Key Incorreta

**Sintoma:** Token gerado mas `internal_error` no backend

**Causa:** Public Key diferente da aplicação do Access Token

**Solução:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Suas integrações"
3. Selecione a mesma aplicação que tem o Access Token
4. Copie a Public Key
5. Use no frontend

---

### Erro 3: Cartão Inválido

**Sintoma:** Token não é gerado ou `internal_error`

**Causa:** Cartão não é um cartão de teste válido

**Solução:** Use cartões de teste oficiais do Mercado Pago (veja Passo 2)

---

## 🧪 Teste Completo no Frontend

Cole este código no console do navegador para testar:

```javascript
// 1. Verificar se Mercado Pago está carregado
console.log('MercadoPago disponível?', typeof MercadoPago !== 'undefined');

// 2. Inicializar (substitua pela sua Public Key)
const mp = new MercadoPago('TEST-SUA-PUBLIC-KEY-AQUI', {
  locale: 'pt-BR'
});

// 3. Criar formulário (ajuste os seletores)
const cardForm = mp.fields({
  amount: "100.00",
  iframe: true,
  fields: {
    cardNumber: { selector: '#cardNumber' },
    expirationDate: { selector: '#expirationDate' },
    securityCode: { selector: '#securityCode' },
    cardholderName: { selector: '#cardholderName' },
    identificationType: { selector: '#identificationType' },
    identificationNumber: { selector: '#identificationNumber' },
    cardholderEmail: { selector: '#cardholderEmail' },
    installments: { selector: '#installments' }
  }
});

// 4. Preencher com cartão de teste
document.getElementById('cardNumber').value = '4509953566233704';
document.getElementById('expirationDate').value = '12/25';
document.getElementById('securityCode').value = '123';
document.getElementById('cardholderName').value = 'Test User';
document.getElementById('identificationType').value = 'CPF';
document.getElementById('identificationNumber').value = '12345678909';
document.getElementById('cardholderEmail').value = 'test@test.com';
document.getElementById('installments').value = '1';

// 5. Gerar token
const token = await cardForm.createCardToken();
console.log('Token gerado:', token.id);

// 6. Enviar para backend IMEDIATAMENTE
const response = await fetch('/api/purchases/123/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    token: token.id,
    installments: '1',
    identificationType: 'CPF',
    identificationNumber: '12345678909'
  })
});

const result = await response.json();
console.log('Resultado:', result);
```

---

## 📞 Próximos Passos

1. **Use cartões de teste oficiais** do Mercado Pago
2. **Gere o token e envie IMEDIATAMENTE** (sem delays)
3. **Verifique os logs** no console do navegador
4. **Confirme que Public Key e Access Token** são da mesma aplicação

Se ainda der erro após seguir todos os passos, pode ser um problema temporário do Mercado Pago ou alguma configuração específica da sua conta.

