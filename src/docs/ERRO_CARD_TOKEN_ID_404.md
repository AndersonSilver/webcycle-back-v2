# 🔧 Erro: card_token_id Not Found (404)

## ⚠️ Problema Identificado

Erro no console do navegador:
```json
{
  "reason": "pool [AssociateCard]_external_api_error [method:parseResponse]",
  "status": 404,
  "details": {
    "cause": [{
      "code": 204,
      "description": "Not found 'card_token_id' with id: e4db40625e62583b3adff97aab540b58"
    }]
  }
}
```

## ✅ Boa Notícia

O botão "Pagar" está habilitado! O problema é que há uma tentativa de usar um token que não existe mais.

## 🔍 Causa Provável

No **Checkout Pro**, o Mercado Pago gera o token automaticamente quando o usuário preenche o cartão. O erro pode estar acontecendo porque:

1. **Token expirado** - Um token foi gerado anteriormente e expirou
2. **Cache do navegador** - Há tokens antigos em cache
3. **Mistura de Checkout Transparente e Pro** - Pode haver código tentando usar tokens do Checkout Transparente

## ✅ Solução

### 1. **Limpar Cache e Cookies**

1. Abra o console do navegador (F12)
2. Vá em **Application** > **Storage**
3. Clique em **Clear site data**
4. Ou use uma **janela anônima** para testar

### 2. **Verificar se Está Usando Checkout Pro Corretamente**

Certifique-se de que:
- ✅ Está sendo redirecionado para `sandbox.mercadopago.com.br/checkout/v1/redirect`
- ✅ NÃO está usando formulário de cartão no seu site
- ✅ O botão "Continuar para Pagamento" redireciona para o Mercado Pago

### 3. **Usar Dados de Teste Corretos**

No Checkout Pro, preencha:
```
Número: 5031 4332 1540 6351
CVV: 123
Nome: APRO
Validade: 11/25
CPF: 12345678909
```

### 4. **Verificar Logs do Backend**

Quando criar o checkout, verifique nos logs:
```
📦 Criando preferência Checkout Pro: {...}
✅ Preferência criada: {...}
```

Certifique-se de que:
- ✅ A preferência está sendo criada corretamente
- ✅ O `sandbox_init_point` está sendo retornado
- ✅ Não há erros na criação

## 🧪 Teste Passo a Passo

1. **Limpe o cache** do navegador
2. **Abra uma janela anônima**
3. **Crie um novo checkout** no seu sistema
4. **Clique em "Continuar para Pagamento"**
5. **Preencha o cartão** no Checkout Pro do Mercado Pago
6. **Clique em "Pagar"**

## 💡 Importante

No **Checkout Pro**, você **NÃO precisa** gerar tokens manualmente. O Mercado Pago cuida disso automaticamente quando o usuário preenche o cartão na página deles.

O erro `card_token_id not found` geralmente acontece quando:
- Há código tentando usar tokens do Checkout Transparente
- Há tokens em cache que expiraram
- Há uma mistura de implementações

## ❌ Se o Erro Persistir

1. **Verifique se não há código do Checkout Transparente** ainda ativo
2. **Verifique os logs do backend** para ver se a preferência está sendo criada corretamente
3. **Tente em outro navegador** (Chrome, Firefox, Edge)
4. **Verifique se está usando credenciais de TESTE** (`TEST-...`)

---

**Status:** ✅ Botão habilitado! O erro pode ser ignorado se o pagamento funcionar, ou pode ser resolvido limpando o cache.

