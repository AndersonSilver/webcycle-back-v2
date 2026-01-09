# ✅ Checklist: Botão "Pagar" Não Habilita

## 🔍 Verificações Rápidas

### 1. ✅ Backend Está Funcionando?

Pelos seus logs, **SIM**:
- ✅ Preferência criada: `140335646-65d4b5e2-19dd-4fea-b76a-ae2d5d401e3a`
- ✅ `sandbox_init_point` disponível
- ✅ Backend retornando `paymentLink`

### 2. ✅ Frontend Está Redirecionando Corretamente?

**Verifique no console do navegador (F12):**

Quando clicar em "Continuar para Pagamento", você deve ver:
```
🚀 Redirecionando para Checkout Pro: https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...
🔍 URL completa: https://sandbox.mercadopago.com.br/...
🔍 É sandbox? true
```

**⚠️ Se não aparecer "É sandbox? true"**, há um problema!

### 3. ✅ Está na URL Correta?

**Verifique a URL no navegador:**

Deve ser:
```
https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=140335646-65d4b5e2-19dd-4fea-b76a-ae2d5d401e3a
```

**❌ NÃO deve ser:**
```
https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...
```

### 4. ✅ Dados do Cartão Estão CORRETOS?

**Use EXATAMENTE:**

```
Número: 5031 4332 1540 6351
CVV: 123
Nome: APRO  ← EXATAMENTE "APRO" (maiúsculas, sem espaços)
Validade: 11/25
CPF: 12345678909
```

**⚠️ O nome "APRO" é CRUCIAL!** Sem ele, o botão não habilita.

### 5. ✅ Todos os Campos Estão Preenchidos?

Certifique-se de que:
- ✅ Número do cartão está completo (16 dígitos)
- ✅ CVV está preenchido (3 dígitos)
- ✅ Nome está preenchido (exatamente "APRO")
- ✅ Validade está preenchida (MM/AA)
- ✅ CPF está preenchido (11 dígitos)

### 6. ✅ Aguardou a Validação?

O Mercado Pago valida o cartão automaticamente. Pode levar alguns segundos. Aguarde até ver:
- ✅ Campos ficarem verdes (válidos)
- ✅ Mensagem de validação positiva
- ✅ Botão habilitar

## 🚨 Problemas Comuns

### Problema 1: URL Não é Sandbox

**Sintoma:** URL começa com `www.mercadopago.com.br` em vez de `sandbox.mercadopago.com.br`

**Solução:** Verifique se está usando Access Token de TESTE (`TEST-...`)

### Problema 2: Nome Não é "APRO"

**Sintoma:** Botão não habilita mesmo com cartão válido

**Solução:** Use exatamente `APRO` (maiúsculas, sem espaços)

### Problema 3: Cache do Navegador

**Sintoma:** Comportamento estranho, erros inesperados

**Solução:** 
- Use janela anônima (Ctrl+Shift+N)
- Ou limpe cache: F12 > Application > Clear site data

### Problema 4: Campos Não Validam

**Sintoma:** Campos ficam vermelhos ou com erro

**Solução:**
- Verifique formato do número (16 dígitos)
- Verifique formato do CVV (3 dígitos)
- Verifique formato da validade (MM/AA)
- Verifique formato do CPF (11 dígitos)

## 🧪 Teste Rápido

1. **Abra janela anônima** (Ctrl+Shift+N)
2. **Acesse seu site**
3. **Faça login**
4. **Vá para checkout**
5. **Selecione "Cartão de Crédito"**
6. **Clique em "Continuar para Pagamento"**
7. **Verifique URL** (deve ser sandbox)
8. **Preencha cartão** com dados exatos acima
9. **Aguarde validação**
10. **Clique em "Pagar"**

## 📋 Resumo

- ✅ Backend: Funcionando
- ✅ Preferência: Criada corretamente
- ✅ sandbox_init_point: Disponível
- ❓ Frontend: Verificar se está usando URL correta
- ❓ Cartão: Verificar se dados estão exatos
- ❓ Validação: Aguardar validação do Mercado Pago

---

**Próximo passo:** Siga o checklist acima e me diga em qual passo está falhando!

