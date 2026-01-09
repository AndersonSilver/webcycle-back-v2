# 🔍 Como Verificar se o Token está Sendo Gerado Corretamente no Frontend

## ⚠️ Problema: `internal_error` do Mercado Pago

Se você está recebendo `internal_error` ao processar pagamento, o problema pode estar na **geração do token no frontend**.

## ✅ Checklist: Verificar Token no Frontend

### 1. **Public Key está Configurada?**

```javascript
// ✅ CORRETO
const mp = new MercadoPago('TEST-1234567890-123456-123456-1234567890-1234567890', {
  locale: 'pt-BR'
});

// ❌ ERRADO - Public Key não configurada ou inválida
const mp = new MercadoPago('', { locale: 'pt-BR' });
```

**Onde encontrar a Public Key:**
- Acesse: https://www.mercadopago.com.br/developers/panel/app
- Vá em **"Suas integrações"** → Selecione sua aplicação
- Copie a **"Chave pública"** (começa com `TEST-` para sandbox ou `APP_USR-` para produção)

---

### 2. **Mercado Pago JS está Carregado?**

```html
<!-- ✅ CORRETO - Versão mais recente -->
<script src="https://sdk.mercadopago.com/js/v2"></script>

<!-- ❌ ERRADO - Versão antiga ou não carregada -->
<script src="https://www.mercadopago.com/v2/security.js"></script>
```

**Verificar no Console do Navegador:**
```javascript
// Abra o Console (F12) e digite:
console.log(typeof MercadoPago);
// Deve retornar: "function"
// Se retornar "undefined", o script não foi carregado
```

---

### 3. **Formulário de Cartão está Configurado?**

```javascript
// ✅ CORRETO - Formulário com todos os campos necessários
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
      placeholder: 'Tipo de documento'
    },
    identificationNumber: {
      selector: '#identificationNumber',
      placeholder: 'Número do documento'
    },
    cardholderEmail: {
      selector: '#cardholderEmail',
      placeholder: 'E-mail'
    },
    installments: {
      selector: '#installments',
      placeholder: 'Parcelas'
    },
    issuer: {
      selector: '#issuer',
      placeholder: 'Banco emissor'
    }
  }
});
```

---

### 4. **Token está Sendo Gerado ANTES de Enviar ao Backend?**

```javascript
// ✅ CORRETO - Gerar token ANTES de enviar
async function processarPagamento() {
  // 1. Gerar token primeiro
  const token = await cardForm.createCardToken();
  
  console.log('Token gerado:', token.id); // Deve aparecer no console
  
  // 2. Verificar se token foi gerado
  if (!token || !token.id) {
    alert('Erro ao gerar token do cartão');
    return;
  }
  
  // 3. Enviar token para o backend
  const response = await fetch('/api/purchases/123/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      token: token.id, // ✅ Token gerado pelo Mercado Pago JS
      installments: '1',
      identificationType: 'CPF',
      identificationNumber: '12345678909'
    })
  });
}

// ❌ ERRADO - Enviar dados do cartão diretamente
async function processarPagamentoERRADO() {
  const response = await fetch('/api/purchases/123/process', {
    method: 'POST',
    body: JSON.stringify({
      cardNumber: '1234 5678 9012 3456', // ❌ NÃO FUNCIONA
      cardholderName: 'João Silva',
      // ...
    })
  });
}
```

---

### 5. **Token Tem Formato Correto?**

Tokens do Mercado Pago geralmente têm:
- **32 caracteres** hexadecimais (0-9, a-f)
- Exemplo: `ff8080814c11e237014c1ff593b57b4d`

**Verificar no Console:**
```javascript
const token = await cardForm.createCardToken();
console.log('Token:', token.id);
console.log('Tamanho:', token.id.length); // Deve ser 32
console.log('Formato válido:', /^[a-f0-9]{32}$/i.test(token.id)); // Deve ser true
```

---

### 6. **Public Key e Access Token São do Mesmo Ambiente?**

**⚠️ CRÍTICO:** Public Key (frontend) e Access Token (backend) DEVEM ser do mesmo ambiente:

- **Sandbox (Teste):**
  - Public Key: `TEST-...`
  - Access Token: `TEST-...`

- **Produção:**
  - Public Key: `APP_USR-...`
  - Access Token: `APP_USR-...`

**❌ ERRADO:**
- Frontend: `TEST-...` (sandbox)
- Backend: `APP_USR-...` (produção)
- **Resultado:** `internal_error`

---

### 7. **Teste Completo no Console**

Cole este código no Console do Navegador (F12) para testar:

```javascript
// 1. Verificar se Mercado Pago JS está carregado
console.log('MercadoPago disponível?', typeof MercadoPago !== 'undefined');

// 2. Verificar Public Key (substitua pela sua)
const publicKey = 'TEST-1234567890-123456-123456-1234567890-1234567890';
console.log('Public Key:', publicKey);
console.log('É TEST (sandbox)?', publicKey.startsWith('TEST-'));
console.log('É APP_USR (produção)?', publicKey.startsWith('APP_USR-'));

// 3. Tentar criar instância do Mercado Pago
try {
  const mp = new MercadoPago(publicKey, { locale: 'pt-BR' });
  console.log('✅ Mercado Pago inicializado com sucesso');
  console.log('Instância:', mp);
} catch (error) {
  console.error('❌ Erro ao inicializar Mercado Pago:', error);
}
```

---

## 🐛 Debug Passo a Passo

### Passo 1: Verificar Logs do Frontend

Abra o Console do Navegador (F12) e procure por:

```javascript
// Deve aparecer quando o token é gerado
Token gerado: ff8080814c11e237014c1ff593b57b4d
```

**Se não aparecer:**
- O token não está sendo gerado
- Verifique se `cardForm.createCardToken()` está sendo chamado
- Verifique se há erros no console

---

### Passo 2: Verificar Requisição HTTP

Na aba **Network** do DevTools, procure pela requisição `POST /api/purchases/:id/process`:

**Request Body deve ter:**
```json
{
  "token": "ff8080814c11e237014c1ff593b57b4d",
  "installments": "1",
  "identificationType": "CPF",
  "identificationNumber": "12345678909"
}
```

**Se o token estiver vazio ou inválido:**
- O problema está na geração do token no frontend
- Verifique se `cardForm.createCardToken()` retornou um token válido

---

### Passo 3: Verificar Logs do Backend

No terminal do backend, você deve ver:

```
💳 Processando pagamento: {
  amount: 25,
  installments: 1,
  payerEmail: 'email@exemplo.com',
  tokenLength: 32,  // ✅ Deve ser 32
  hasIdentification: true,
  accessTokenPrefix: 'TEST-46698...'
}
```

**Se `tokenLength` não for 32:**
- O token não foi gerado corretamente no frontend
- Verifique a geração do token

---

## 📝 Exemplo Completo de Código Frontend

```html
<!DOCTYPE html>
<html>
<head>
  <title>Teste de Pagamento</title>
  <script src="https://sdk.mercadopago.com/js/v2"></script>
</head>
<body>
  <form id="paymentForm">
    <div id="cardNumber"></div>
    <div id="expirationDate"></div>
    <div id="securityCode"></div>
    <div id="cardholderName"></div>
    <div id="identificationType"></div>
    <div id="identificationNumber"></div>
    <div id="cardholderEmail"></div>
    <div id="installments"></div>
    <button type="submit">Pagar</button>
  </form>

  <script>
    // 1. Inicializar Mercado Pago
    const mp = new MercadoPago('TEST-SUA-PUBLIC-KEY-AQUI', {
      locale: 'pt-BR'
    });

    // 2. Criar formulário de cartão
    const cardForm = mp.fields({
      amount: "100.00",
      iframe: true,
      fields: {
        cardNumber: { selector: '#cardNumber', placeholder: 'Número do cartão' },
        expirationDate: { selector: '#expirationDate', placeholder: 'MM/AA' },
        securityCode: { selector: '#securityCode', placeholder: 'CVV' },
        cardholderName: { selector: '#cardholderName', placeholder: 'Nome no cartão' },
        identificationType: { selector: '#identificationType', placeholder: 'Tipo' },
        identificationNumber: { selector: '#identificationNumber', placeholder: 'CPF' },
        cardholderEmail: { selector: '#cardholderEmail', placeholder: 'E-mail' },
        installments: { selector: '#installments', placeholder: 'Parcelas' }
      }
    });

    // 3. Processar pagamento
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Gerar token
        console.log('Gerando token...');
        const token = await cardForm.createCardToken();
        
        console.log('Token gerado:', token.id);
        console.log('Tamanho do token:', token.id.length);

        if (!token || !token.id) {
          alert('Erro ao gerar token');
          return;
        }

        // Enviar para o backend
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

        const data = await response.json();
        console.log('Resposta do backend:', data);

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

## 🔧 Soluções Comuns

### Problema: Token não é gerado

**Solução:**
1. Verifique se o Mercado Pago JS está carregado
2. Verifique se a Public Key está correta
3. Verifique se todos os campos do formulário estão preenchidos
4. Verifique se `cardForm.createCardToken()` está sendo chamado corretamente

---

### Problema: Token tem formato inválido

**Solução:**
1. Certifique-se de usar `token.id` (não `token` diretamente)
2. Verifique se o token tem 32 caracteres
3. Verifique se não há espaços ou caracteres especiais

---

### Problema: `internal_error` mesmo com token válido

**Solução:**
1. Verifique se Public Key e Access Token são do mesmo ambiente
2. Verifique se o Access Token está correto no `.env`
3. Tente gerar um novo token
4. Verifique se há problemas temporários no Mercado Pago

---

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. **Capture os logs completos:**
   - Console do navegador (F12)
   - Terminal do backend
   - Network tab (requisição HTTP)

2. **Verifique a documentação oficial:**
   - https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

3. **Entre em contato com o suporte do Mercado Pago:**
   - https://www.mercadopago.com.br/developers/pt/support

