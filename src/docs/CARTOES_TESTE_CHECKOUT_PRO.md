# 💳 Cartões de Teste para Checkout Pro

## ⚠️ Problema: Botão "Pagar" Não Habilita

Se o botão "Pagar" não está habilitando no Checkout Pro após inserir um cartão de teste, verifique:

### 1. **Cartão de Teste Correto**

Use **exatamente** estes cartões de teste do Mercado Pago:

#### ✅ Visa (Aprovado):
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: APRO
Validade: 11/25 (ou qualquer data futura)
CPF: 12345678909
```

#### ✅ Mastercard (Aprovado):
```
Número: 5031 7557 3453 0604
CVV: 123
Nome: APRO
Validade: 11/25 (ou qualquer data futura)
CPF: 12345678909
```

### 2. **Nome do Titular é IMPORTANTE**

O **nome** do titular determina o resultado do pagamento:

- **`APRO`** = Pagamento aprovado ✅
- **`CONT`** = Fundos insuficientes ⚠️
- **`CALL`** = Cartão cancelado ❌
- **`OTHE`** = Rejeitado ❌

**⚠️ IMPORTANTE:** Use exatamente `APRO` (em maiúsculas) para pagamento aprovado!

### 3. **Preencher TODOS os Campos**

Certifique-se de preencher:
- ✅ Número do cartão
- ✅ CVV
- ✅ Nome do titular (use `APRO`)
- ✅ Validade
- ✅ CPF (12345678909)

### 4. **Usar Janela Anônima**

Para evitar problemas de cache ou sessão:
- Abra uma **janela anônima/privada**
- Faça o teste novamente

### 5. **Verificar Credenciais**

Certifique-se de estar usando:
- ✅ Access Token de **TESTE** (começa com `TEST-`)
- ✅ Public Key de **TESTE** (começa com `TEST-`)
- ✅ Ambos da **mesma aplicação**

## 🔍 Verificar Configuração

### Backend

O backend já está configurado com:
- ✅ `statement_descriptor: 'TB-PSICO'`
- ✅ `external_reference` (purchaseId)
- ✅ `payment_methods` configurado
- ✅ `installments: 12` (máximo de parcelas)

### Frontend

Certifique-se de que:
- ✅ Está usando Public Key de teste
- ✅ Está redirecionando para o `init_point` correto

## 🧪 Teste Passo a Passo

1. **Crie um checkout** no seu sistema
2. **Redirecione** para o `init_point` do Mercado Pago
3. **Preencha o cartão:**
   - Número: `5031 4332 1540 6351`
   - CVV: `123`
   - Nome: `APRO` (exatamente assim!)
   - Validade: `11/25`
   - CPF: `12345678909`
4. **Aguarde validação** - O botão deve habilitar automaticamente
5. **Clique em "Pagar"**

## ❌ Se Ainda Não Funcionar

1. **Verifique o console do navegador** - Pode haver erros JavaScript
2. **Verifique os logs do backend** - Pode haver erros na criação da preferência
3. **Tente outro cartão de teste:**
   - Mastercard: `5031 7557 3453 0604`
   - Visa: `4509 9535 6623 3704`
4. **Limpe o cache** do navegador
5. **Use janela anônima**

## 📚 Documentação Oficial

- **Cartões de Teste:** https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-test/test-purchases
- **Checkout Pro:** https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing

---

**💡 Dica:** O nome `APRO` é mágico! Use exatamente assim para pagamentos aprovados em testes.

