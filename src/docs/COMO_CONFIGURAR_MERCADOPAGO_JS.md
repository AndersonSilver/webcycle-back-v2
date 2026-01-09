# 🔧 Como Configurar Mercado Pago JS no Frontend

Guia rápido para configurar o Mercado Pago JS e gerar tokens de cartão no frontend.

---

## 📋 Passo a Passo

### 1. Incluir o SDK no HTML

```html
<!-- Adicione antes do fechamento da tag </body> -->
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

---

### 2. Obter sua Public Key

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Na aba **"Credenciais de teste"**, copie a **Public Key**
   - Formato: `TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz`

---

### 3. Inicializar Mercado Pago

```javascript
// Substitua 'SUA_PUBLIC_KEY' pela sua Public Key de teste
const mp = new MercadoPago('TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz', {
  locale: 'pt-BR'
});
```

---

### 4. Criar Formulário de Cartão

```javascript
// Criar campos do cartão
const cardForm = mp.fields.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#333',
      fontFamily: 'Arial, sans-serif'
    },
    invalid: {
      color: '#e74c3c'
    }
  }
});

// Montar no elemento HTML (onde o formulário aparecerá)
cardForm.mount('#card-form');
```

---

### 5. HTML do Formulário

```html
<!-- Container onde o formulário será renderizado -->
<div id="card-form"></div>

<!-- Campos adicionais (opcionais) -->
<div>
  <label>Parcelas</label>
  <select id="installments">
    <option value="1">1x sem juros</option>
    <option value="2">2x sem juros</option>
    <option value="3">3x sem juros</option>
  </select>
</div>

<button id="pay-button">Pagar</button>
```

---

### 6. Gerar Token e Processar Pagamento

```javascript
// Quando usuário clicar em "Pagar"
document.getElementById('pay-button').addEventListener('click', async () => {
  try {
    // Gerar token do cartão
    const tokenResult = await cardForm.createToken();
    
    if (tokenResult.status === 'ready') {
      const token = tokenResult.id;
      
      // Enviar token para o backend
      const response = await fetch(`/api/purchases/${purchaseId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          token: token,
          installments: document.getElementById('installments').value,
          identificationType: 'CPF',
          identificationNumber: '12345678900'
        })
      });
      
      const result = await response.json();
      
      if (result.payment.status === 'approved') {
        // ✅ Pagamento aprovado!
        window.location.href = '/purchase/success';
      } else {
        // ❌ Erro
        alert('Erro ao processar pagamento');
      }
    } else {
      // Erro ao gerar token
      alert('Erro ao validar cartão. Verifique os dados.');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao processar pagamento');
  }
});
```

---

## 📝 Exemplo Completo (React)

```jsx
import { useEffect, useRef } from 'react';

function PaymentForm({ purchaseId, publicKey }) {
  const cardFormRef = useRef(null);
  const mpRef = useRef(null);

  useEffect(() => {
    // Inicializar Mercado Pago
    if (window.MercadoPago) {
      mpRef.current = new window.MercadoPago(publicKey, {
        locale: 'pt-BR'
      });

      // Criar formulário de cartão
      const cardForm = mpRef.current.fields.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#333'
          }
        }
      });

      cardForm.mount('#card-form');
      cardFormRef.current = cardForm;
    }

    return () => {
      if (cardFormRef.current) {
        cardFormRef.current.unmount();
      }
    };
  }, [publicKey]);

  const handlePayment = async () => {
    try {
      const tokenResult = await cardFormRef.current.createToken();
      
      if (tokenResult.status === 'ready') {
        const response = await fetch(`/api/purchases/${purchaseId}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            token: tokenResult.id,
            installments: '1'
          })
        });

        const result = await response.json();
        // Tratar resultado...
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      <div id="card-form"></div>
      <button onClick={handlePayment}>Pagar</button>
    </div>
  );
}
```

---

## 🎨 Personalização do Formulário

```javascript
const cardForm = mp.fields.create('card', {
  style: {
    base: {
      fontSize: '16px',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      '::placeholder': {
        color: '#999'
      }
    },
    invalid: {
      color: '#e74c3c',
      fontWeight: 'bold'
    }
  },
  placeholders: {
    cardNumber: 'Número do cartão',
    cardholderName: 'Nome no cartão',
    expirationDate: 'MM/AA',
    securityCode: 'CVV'
  }
});
```

---

## ✅ Validação Automática

O Mercado Pago JS valida automaticamente:
- ✅ Formato do número do cartão
- ✅ Validade do cartão
- ✅ CVV correto
- ✅ Nome no cartão

Você só precisa verificar se o token foi gerado com sucesso:

```javascript
const tokenResult = await cardForm.createToken();

if (tokenResult.status === 'ready') {
  // ✅ Token válido
  const token = tokenResult.id;
} else {
  // ❌ Erro na validação
  console.error('Erro:', tokenResult);
}
```

---

## 🔗 Links Úteis

- **Documentação Oficial:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/credentials
- **SDK JS:** https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js
- **Exemplos:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

---

## ⚠️ Importante

1. **Use Public Key de TESTE** durante desenvolvimento
2. **Troque para Public Key de PRODUÇÃO** quando for ao ar
3. **Nunca exponha sua Access Token** no frontend
4. **Sempre use HTTPS** em produção

---

**Última atualização:** 02/01/2026

