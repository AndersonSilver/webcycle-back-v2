# 🔍 Erro 500 da API do Mercado Pago

## ✅ Sim, o erro 500 vem da API do Mercado Pago

O erro `internal_error` com status `500` está vindo **diretamente do Mercado Pago**, não do nosso código. Isso é confirmado porque:

1. ✅ **SDK retorna:** `internal_error` com status 500
2. ✅ **API REST retorna:** `internal_error` com status 500
3. ✅ **Ambos retornam o mesmo erro** → Confirma que vem do Mercado Pago

## 📡 APIs do Mercado Pago

### API Principal de Pagamentos

**Existe apenas UMA API principal para criar pagamentos:**

```
POST https://api.mercadopago.com/v1/payments
```

**Não há alternativas** - esta é a única API oficial do Mercado Pago para processar pagamentos com cartão.

### Outras APIs Disponíveis (mas não para criar pagamentos)

- `GET /v1/payment_methods` - Listar métodos de pagamento
- `GET /v1/payments/:id` - Consultar pagamento existente
- `POST /v1/preferences` - Criar preferência de pagamento (Checkout Pro)
- `POST /v1/card_tokens` - Criar token do cartão (já estamos usando via SDK React)

## 🔍 Por Que o Erro 500 Pode Estar Acontecendo?

Baseado na pesquisa e documentação oficial, o erro 500 (`internal_error`) pode ser causado por:

### 1. **Webhook Inacessível** ⚠️ (Mais Comum)
- Webhook configurado com URL inválida (ex: `localhost`)
- Mercado Pago tenta notificar e falha
- Retorna `internal_error`

**Solução:** Remova o webhook temporariamente e teste

### 2. **Limitações da Conta de Teste**
- Muitas requisições em curto período
- Limite de transações atingido
- Conta não totalmente configurada

**Solução:** Aguarde alguns minutos e tente novamente

### 3. **Problemas com a Aplicação**
- Aplicação não totalmente configurada
- Credenciais com problemas
- Mudanças recentes na conta (ex: alteração de chave PIX)

**Solução:** Verifique a aplicação no painel

### 4. **Problema Temporário do Mercado Pago**
- Falha temporária nos servidores
- Manutenção em andamento

**Solução:** Aguarde e tente novamente

## 🧪 Como Obter Mais Informações do Erro

### 1. Capturar o `x-request-id`

O Mercado Pago retorna um header `x-request-id` em cada requisição. Este ID é essencial para o suporte investigar o problema.

Vamos adicionar logging para capturar este ID:

```typescript
// No PaymentService.ts, após a requisição:
const response = await fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.mercadopagoAccessToken}`,
  },
  body: JSON.stringify(paymentData),
});

// Capturar x-request-id
const requestId = response.headers.get('x-request-id');
console.log('🔍 x-request-id:', requestId);
```

### 2. Verificar Headers da Resposta

Vamos adicionar logging completo dos headers:

```typescript
console.log('📋 Headers da resposta:', {
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
});
```

## 📞 Contatar Suporte do Mercado Pago

Se o problema persistir, contate o suporte com:

### Informações Essenciais:

1. **x-request-id** (se disponível)
2. **Access Token** (primeiros 20 caracteres): `TEST-4669818375391721-...`
3. **Public Key** (primeiros 20 caracteres): `TEST-ad96dc9a-8b11-4...`
4. **Payload completo** sendo enviado
5. **Timestamp** da requisição
6. **Erro completo** recebido

### Link do Suporte:
https://www.mercadopago.com.br/developers/pt/support

## 🔄 Alternativas Temporárias

### Opção 1: Usar Checkout Pro (Redirecionamento)

Em vez de pagamento direto com cartão, você pode usar o Checkout Pro que redireciona o usuário para o Mercado Pago:

```typescript
// Criar preferência
const preference = await preference.create({
  items: [...],
  back_urls: {...}
});

// Redirecionar usuário para preference.init_point
```

**Vantagem:** Menos propenso a erros internos
**Desvantagem:** Usuário sai do seu site

### Opção 2: Usar PIX ou Boleto

Para testes, você pode usar PIX ou Boleto que geralmente funcionam melhor:

```typescript
// PIX
{
  "transaction_amount": 25,
  "payment_method_id": "pix",
  "payer": {...}
}
```

## 📋 Checklist de Diagnóstico

Antes de contatar o suporte, verifique:

- [ ] Removi o webhook e testei?
- [ ] Verifiquei se a aplicação está ativa no painel?
- [ ] Aguardei alguns minutos e tentei novamente?
- [ ] Capturei o `x-request-id` da requisição?
- [ ] Verifiquei se há avisos no painel do Mercado Pago?
- [ ] Tentei criar uma nova aplicação?

## 💡 Conclusão

**Sim, o erro 500 vem da API do Mercado Pago.** Não há outra API alternativa para criar pagamentos. O problema pode ser:

1. **Webhook inacessível** (teste primeiro!)
2. **Limitações da conta de teste**
3. **Problema temporário do Mercado Pago**
4. **Problema com a aplicação**

**Próximo passo:** 
1. Remova o webhook e teste
2. Se não funcionar, capture o `x-request-id` e contate o suporte

