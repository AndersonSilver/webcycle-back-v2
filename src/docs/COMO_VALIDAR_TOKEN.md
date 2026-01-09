# 🔍 Como Validar Token do Mercado Pago

## 🎯 Novo Endpoint de Validação

Criei um endpoint para validar tokens antes de processar o pagamento!

---

## 📋 Endpoint

**POST** `/api/purchases/validate-token`

Valida se um token do Mercado Pago é válido e não expirado.

---

## 🔐 Autenticação

**Obrigatório:** Sim

**Header:**
```
Authorization: Bearer <seu_token_jwt>
```

---

## 📥 Request Body

```json
{
  "token": "7d6c60857dbb41c4866b71e7d626ef25"
}
```

---

## 📤 Response

### ✅ Token Válido

```json
{
  "valid": true,
  "message": "Token válido e não expirado",
  "details": {
    "tokenLength": 32,
    "format": "válido",
    "paymentId": "1234567890",
    "status": "pending"
  }
}
```

### ❌ Token Inválido ou Expirado

```json
{
  "valid": false,
  "message": "Token pode estar expirado ou ser de outra aplicação",
  "details": {
    "possibleCauses": [
      "Token expirado (tokens expiram em alguns segundos)",
      "Token de outra aplicação (Public Key diferente)",
      "Token gerado incorretamente"
    ]
  }
}
```

---

## 🧪 Como Usar

### 1. No Postman

```
POST http://localhost:3001/api/purchases/validate-token

Headers:
  Authorization: Bearer <seu_token_jwt>
  Content-Type: application/json

Body:
{
  "token": "7d6c60857dbb41c4866b71e7d626ef25"
}
```

### 2. No Frontend (JavaScript)

```javascript
async function validarToken(token) {
  const response = await fetch('/api/purchases/validate-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({ token })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    console.log('✅ Token válido!', result.details);
    return true;
  } else {
    console.error('❌ Token inválido:', result.message);
    console.error('Detalhes:', result.details);
    return false;
  }
}

// Usar após gerar token
const token = await cardForm.createCardToken();
const isValid = await validarToken(token.id);

if (isValid) {
  // Processar pagamento
  await processarPagamento(token.id);
} else {
  // Gerar novo token
  alert('Token inválido. Tente novamente.');
}
```

### 3. No Frontend (React)

```jsx
import { useState } from 'react';

function PaymentForm() {
  const [token, setToken] = useState(null);
  const [validating, setValidating] = useState(false);

  const validarToken = async (tokenToValidate) => {
    setValidating(true);
    try {
      const response = await fetch('/api/purchases/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ token: tokenToValidate })
      });
      
      const result = await response.json();
      
      if (result.valid) {
        console.log('✅ Token válido!');
        return true;
      } else {
        console.error('❌ Token inválido:', result.message);
        alert(`Token inválido: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handlePayment = async () => {
    // Gerar token
    const newToken = await cardForm.createCardToken();
    
    // Validar token ANTES de processar
    const isValid = await validarToken(newToken.id);
    
    if (isValid) {
      // Processar pagamento
      await processarPagamento(newToken.id);
    } else {
      // Token inválido - tentar novamente
      alert('Token inválido. Por favor, tente novamente.');
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={validating}>
        {validating ? 'Validando...' : 'Pagar'}
      </button>
    </div>
  );
}
```

---

## 🔍 O Que a Validação Verifica

1. **Formato do Token**
   - ✅ Tem 32 caracteres?
   - ✅ É hexadecimal (0-9, a-f)?

2. **Validade do Token**
   - ✅ Token não está expirado?
   - ✅ Token é válido no Mercado Pago?
   - ✅ Token foi gerado com a mesma Public Key?

3. **Teste de Pagamento**
   - Tenta criar um pagamento de teste com valor mínimo (R$ 0,01)
   - Se funcionar, o token é válido
   - Se falhar, mostra o motivo específico

---

## ⚠️ Importante

### Tokens Expirem Rapidamente!

Tokens do Mercado Pago expiram em **alguns segundos**. Por isso:

1. **Gere o token** quando o usuário clicar em "Pagar"
2. **Valide imediatamente** (ou processe diretamente)
3. **Não armazene** tokens para usar depois
4. **Não adicione delays** entre gerar e usar

### Fluxo Recomendado

```javascript
// ✅ CORRETO
async function processarPagamento() {
  // 1. Gerar token AGORA
  const token = await cardForm.createCardToken();
  
  // 2. Validar IMEDIATAMENTE (opcional, mas recomendado)
  const isValid = await validarToken(token.id);
  if (!isValid) {
    alert('Token inválido. Tente novamente.');
    return;
  }
  
  // 3. Processar pagamento IMEDIATAMENTE
  await fetch('/api/purchases/123/process', {
    method: 'POST',
    body: JSON.stringify({ token: token.id })
  });
}

// ❌ ERRADO - Qualquer delay expira o token
async function processarPagamentoERRADO() {
  const token = await cardForm.createCardToken();
  await new Promise(resolve => setTimeout(resolve, 2000)); // ❌ Token expira!
  await fetch('/api/purchases/123/process', ...);
}
```

---

## 🐛 Debug: Usar Validação para Identificar Problemas

### Problema: Token sempre inválido

**Solução:**
1. Verifique se está gerando o token corretamente
2. Verifique se Public Key está correta
3. Verifique se não há delays entre gerar e validar
4. Use cartões de teste oficiais do Mercado Pago

### Problema: Token válido mas pagamento falha

**Solução:**
1. Token pode ter expirado entre validação e processamento
2. Processe o pagamento IMEDIATAMENTE após validar
3. Ou valide e processe em uma única chamada

---

## 📞 Exemplos de Uso

### Exemplo 1: Validar Antes de Processar

```javascript
// Validar primeiro, depois processar
const token = await cardForm.createCardToken();
const validation = await validarToken(token.id);

if (validation.valid) {
  // Token válido - processar pagamento
  await processarPagamento(token.id);
} else {
  // Token inválido - mostrar erro
  alert(`Erro: ${validation.message}`);
}
```

### Exemplo 2: Validar e Processar em Sequência

```javascript
// Gerar token e processar diretamente (mais rápido)
const token = await cardForm.createCardToken();
await processarPagamento(token.id); // Validação acontece no backend
```

---

## 💡 Dica

Use a validação para **debug** quando estiver tendo problemas. Ela vai mostrar exatamente qual é o problema com o token!

Para produção, você pode processar diretamente e tratar os erros, mas a validação é útil para identificar problemas durante o desenvolvimento.

