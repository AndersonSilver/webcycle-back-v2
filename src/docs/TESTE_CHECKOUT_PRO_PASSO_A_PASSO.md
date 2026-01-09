# 🧪 Teste Checkout Pro - Passo a Passo COMPLETO

## ✅ Status Atual

Pelos logs, vejo que:
- ✅ Preferência está sendo criada corretamente
- ✅ `sandbox_init_point` está sendo retornado
- ✅ Backend está funcionando corretamente

## 🎯 Teste Passo a Passo

### Passo 1: Verificar URL de Redirecionamento

Quando você clica em "Continuar para Pagamento", verifique no console do navegador (F12):

```javascript
// Você deve ver:
🚀 Redirecionando para Checkout Pro: https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...
```

**⚠️ IMPORTANTE:** A URL deve começar com `sandbox.mercadopago.com.br` (não `www.mercadopago.com.br`)

### Passo 2: No Checkout Pro do Mercado Pago

Quando você chegar na página do Mercado Pago:

1. **Verifique se está na página correta:**
   - URL deve ser: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?...`
   - Deve ter watermark "Sandbox de Mercado Pago"

2. **Preencha o cartão EXATAMENTE assim:**

   ```
   Número: 5031 4332 1540 6351
   CVV: 123
   Nome: APRO  ← EXATAMENTE "APRO" (maiúsculas, sem espaços)
   Validade: 11/25 (ou qualquer data futura)
   CPF: 12345678909
   ```

3. **Aguarde a validação:**
   - O Mercado Pago valida o cartão automaticamente
   - Pode levar alguns segundos
   - O botão deve habilitar quando todos os campos estiverem válidos

### Passo 3: Se o Botão NÃO Habilita

#### Verificação 1: Console do Navegador

Abra o console (F12) e verifique:
- ❌ Há erros em vermelho?
- ❌ Há avisos sobre validação?
- ❌ Há erros de rede?

#### Verificação 2: Campos do Cartão

Certifique-se de que:
- ✅ Número tem 16 dígitos (sem espaços ou com espaços, ambos funcionam)
- ✅ CVV tem 3 dígitos
- ✅ Nome é exatamente `APRO` (sem espaços extras antes/depois)
- ✅ Validade está no formato MM/AA
- ✅ CPF tem 11 dígitos

#### Verificação 3: Tentar Outro Cartão

Se não funcionar, tente:

**Mastercard:**
```
Número: 5031 7557 3453 0604
CVV: 123
Nome: APRO
Validade: 11/25
CPF: 12345678909
```

**Visa:**
```
Número: 4509 9535 6623 3704
CVV: 123
Nome: APRO
Validade: 11/25
CPF: 12345678909
```

### Passo 4: Limpar Tudo e Tentar Novamente

1. **Limpe o cache:**
   - F12 > Application > Storage > Clear site data
   - Ou use janela anônima (Ctrl+Shift+N)

2. **Reinicie o backend:**
   ```bash
   # Pare (Ctrl+C) e reinicie
   npm run dev
   ```

3. **Crie um novo checkout:**
   - Vá para o checkout
   - Selecione "Cartão de Crédito"
   - Clique em "Continuar para Pagamento"

4. **Preencha o cartão novamente** com os dados exatos acima

## 🔍 Debug Avançado

### Verificar Requisições de Rede

No console do navegador (F12 > Network):

1. Filtre por "Fetch/XHR"
2. Procure por requisições relacionadas a:
   - `card_tokens`
   - `tokenization`
   - `association`
   - `review`

3. Verifique se há erros (status 4xx ou 5xx)

### Verificar Logs do Backend

Quando criar o checkout, você deve ver:

```
📦 Criando preferência Checkout Pro: {
  items: [...],
  payer: { email: '...', name: '...' },
  amount: 25,
  ...
}
✅ Preferência criada: {
  id: '...',
  sandbox_init_point: 'https://sandbox.mercadopago.com.br/...'
}
```

## 💡 Dicas Importantes

1. **Nome `APRO` é MÁGICO:** Use exatamente assim (maiúsculas, sem espaços)
2. **Aguarde a validação:** O Mercado Pago pode levar alguns segundos para validar
3. **Janela anônima:** Sempre teste em janela anônima para evitar cache
4. **URL correta:** Certifique-se de estar em `sandbox.mercadopago.com.br`

## ❌ Se NADA Funcionar

### Última Tentativa: Verificar Aplicação no Painel

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > Sua aplicação
3. Verifique:
   - ✅ Aplicação está ativa?
   - ✅ Não há avisos ou pendências?
   - ✅ Credenciais de teste estão corretas?

### Contatar Suporte do Mercado Pago

Se nada funcionar, contate o suporte com:
- ID da preferência: `140335646-65d4b5e2-19dd-4fea-b76a-ae2d5d401e3a`
- Logs do backend
- Screenshot do erro
- URL do Checkout Pro

---

**Status:** ✅ Backend funcionando. O problema pode estar na validação do cartão no Checkout Pro. Siga os passos acima!

