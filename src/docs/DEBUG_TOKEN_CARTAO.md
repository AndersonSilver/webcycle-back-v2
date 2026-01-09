# 🔍 Debug: Token do Cartão - Como Verificar

## ⚠️ Problema: `internal_error` mesmo com Access Token correto

Se o Access Token está funcionando (confirmado pelo Postman), mas ainda dá `internal_error`, o problema provavelmente está no **token do cartão** gerado no frontend.

## ✅ Checklist: Verificar Token do Cartão

### 1. **Token está sendo gerado ANTES de enviar?**

```javascript
// ✅ CORRETO
async function processarPagamento() {
  // 1. Gerar token PRIMEIRO
  const token = await cardForm.createCardToken();
  
  // 2. Verificar se token foi gerado
  if (!token || !token.id) {
    alert('Erro ao gerar token');
    return;
  }
  
  // 3. Enviar token para backend
  await fetch('/api/purchases/123/process', {
    method: 'POST',
    body: JSON.stringify({
      token: token.id // ✅ Usar token.id
    })
  });
}

// ❌ ERRADO - Enviar sem gerar token primeiro
async function processarPagamentoERRADO() {
  await fetch('/api/purchases/123/process', {
    method: 'POST',
    body: JSON.stringify({
      token: 'token_qualquer' // ❌ Token não foi gerado
    })
  });
}
```

---

### 2. **Token tem formato correto?**

Tokens do Mercado Pago têm:
- **32 caracteres** hexadecimais (0-9, a-f)
- Exemplo: `1aca735cc083891c15a29d21898252d9`

**Verificar no Console do Navegador:**

```javascript
const token = await cardForm.createCardToken();
console.log('Token:', token.id);
console.log('Tamanho:', token.id.length); // Deve ser 32
console.log('Formato válido:', /^[a-f0-9]{32}$/i.test(token.id)); // Deve ser true
```

---

### 3. **Token está sendo usado IMEDIATAMENTE após gerado?**

⚠️ **IMPORTANTE:** Tokens do Mercado Pago expiram rapidamente (alguns segundos). Você DEVE:

1. Gerar o token
2. **Imediatamente** enviar para o backend
3. **Não** armazenar ou reutilizar tokens antigos

```javascript
// ✅ CORRETO - Usar imediatamente
const token = await cardForm.createCardToken();
await enviarParaBackend(token.id); // Imediatamente após gerar

// ❌ ERRADO - Armazenar e usar depois
const token = await cardForm.createCardToken();
await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
await enviarParaBackend(token.id); // Token pode ter expirado!
```

---

### 4. **Todos os campos do formulário estão preenchidos?**

O Mercado Pago precisa de TODOS os campos para gerar um token válido:

- ✅ Número do cartão
- ✅ Data de validade (MM/AA)
- ✅ CVV
- ✅ Nome no cartão
- ✅ Tipo de documento (CPF)
- ✅ Número do documento
- ✅ E-mail

**Verificar no Console:**

```javascript
// Verificar se todos os campos estão preenchidos
const cardNumber = document.getElementById('cardNumber').value;
const expirationDate = document.getElementById('expirationDate').value;
const securityCode = document.getElementById('securityCode').value;
const cardholderName = document.getElementById('cardholderName').value;

console.log('Campos preenchidos:', {
  cardNumber: cardNumber ? '✅' : '❌',
  expirationDate: expirationDate ? '✅' : '❌',
  securityCode: securityCode ? '✅' : '❌',
  cardholderName: cardholderName ? '✅' : '❌',
});
```

---

### 5. **Public Key está correta no frontend?**

```javascript
// ✅ CORRETO
const mp = new MercadoPago('TEST-SUA-PUBLIC-KEY-AQUI', {
  locale: 'pt-BR'
});

// ❌ ERRADO - Public Key incorreta ou vazia
const mp = new MercadoPago('', { locale: 'pt-BR' });
const mp = new MercadoPago('TEST-123', { locale: 'pt-BR' }); // Muito curta
```

**Verificar no Console:**

```javascript
const publicKey = 'TEST-SUA-PUBLIC-KEY-AQUI';
console.log('Public Key:', publicKey);
console.log('Tamanho:', publicKey.length); // Deve ser ~50 caracteres
console.log('Começa com TEST-?', publicKey.startsWith('TEST-'));
```

---

### 6. **Mercado Pago JS está carregado?**

```html
<!-- ✅ CORRETO -->
<script src="https://sdk.mercadopago.com/js/v2"></script>

<!-- ❌ ERRADO - Script não carregado ou versão antiga -->
<!-- Sem script -->
```

**Verificar no Console:**

```javascript
console.log('MercadoPago disponível?', typeof MercadoPago !== 'undefined');
// Deve retornar: true
```

---

## 🐛 Debug Passo a Passo

### Passo 1: Abrir Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Limpe o console (Ctrl+L)

### Passo 2: Adicionar Logs no Código

Adicione estes logs no seu código de pagamento:

```javascript
async function processarPagamento() {
  console.log('🔵 Iniciando processamento de pagamento...');
  
  try {
    // Verificar se Mercado Pago está disponível
    if (typeof MercadoPago === 'undefined') {
      console.error('❌ Mercado Pago JS não está carregado!');
      return;
    }
    
    console.log('✅ Mercado Pago JS está disponível');
    
    // Verificar Public Key
    const publicKey = 'TEST-SUA-PUBLIC-KEY-AQUI';
    console.log('🔑 Public Key:', publicKey.substring(0, 20) + '...');
    
    // Gerar token
    console.log('🔄 Gerando token do cartão...');
    const token = await cardForm.createCardToken();
    
    console.log('📦 Token recebido:', {
      id: token.id,
      length: token.id?.length,
      fullToken: token.id, // Mostrar token completo para debug
    });
    
    if (!token || !token.id) {
      console.error('❌ Token não foi gerado!');
      alert('Erro ao gerar token do cartão');
      return;
    }
    
    if (token.id.length !== 32) {
      console.warn('⚠️ Token tem tamanho inválido:', token.id.length);
    }
    
    // Enviar para backend
    console.log('📤 Enviando token para backend...');
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
    console.log('📥 Resposta do backend:', data);
    
    if (!response.ok) {
      console.error('❌ Erro do backend:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
  }
}
```

### Passo 3: Verificar Logs

Quando você tentar fazer o pagamento, você deve ver no console:

```
🔵 Iniciando processamento de pagamento...
✅ Mercado Pago JS está disponível
🔑 Public Key: TEST-4669818375391...
🔄 Gerando token do cartão...
📦 Token recebido: { id: '1aca735cc083891c15a29d21898252d9', length: 32 }
📤 Enviando token para backend...
📥 Resposta do backend: { ... }
```

**Se algum passo falhar, você verá onde está o problema.**

---

## 🔧 Soluções Comuns

### Problema: Token não é gerado

**Solução:**
1. Verifique se todos os campos do formulário estão preenchidos
2. Verifique se o Mercado Pago JS está carregado
3. Verifique se a Public Key está correta
4. Verifique se há erros no console do navegador

---

### Problema: Token tem formato inválido

**Solução:**
1. Certifique-se de usar `token.id` (não `token` diretamente)
2. Verifique se o token tem 32 caracteres
3. Verifique se não há espaços ou caracteres especiais

---

### Problema: Token expira antes de usar

**Solução:**
1. Gere o token imediatamente antes de enviar
2. Não armazene tokens
3. Não adicione delays entre gerar e enviar

---

### Problema: `internal_error` mesmo com token válido

**Solução:**
1. Verifique se Public Key e Access Token são da mesma aplicação
2. Verifique se ambos são do mesmo ambiente (TEST ou produção)
3. Tente gerar um novo token
4. Verifique se há problemas temporários no Mercado Pago

---

## 📞 Próximos Passos

1. **Adicione os logs acima no seu código frontend**
2. **Tente fazer um pagamento**
3. **Copie TODOS os logs do console**
4. **Envie os logs para análise**

Os logs vão mostrar exatamente onde está o problema!

