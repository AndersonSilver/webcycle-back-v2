# 🎯 Solução Final: Erro "internal_error"

## 📊 Diagnóstico Completo Realizado

### ✅ Verificado e CORRETO:
1. ✅ Credenciais da mesma aplicação
2. ✅ Token com formato válido (32 caracteres)
3. ✅ Payload estruturado corretamente
4. ✅ Timing adequado (token usado rapidamente)
5. ✅ Campos obrigatórios presentes

### ❌ Problema Identificado:
O erro `internal_error` sem detalhes (`cause: []`) indica que o **Mercado Pago está rejeitando internamente** a requisição, mas não está fornecendo detalhes do motivo.

## 🔍 Causa Mais Provável

Baseado na análise completa, as causas mais prováveis são (em ordem de probabilidade):

### 1. **Webhook Configurado com URL Inacessível** ⚠️ TESTE PRIMEIRO!
### 2. **Aplicação do Mercado Pago não totalmente configurada ou com limitações**

## ✅ Solução 1: Verificar Webhook (TESTE PRIMEIRO!)

**⚠️ IMPORTANTE:** O erro `internal_error` pode estar sendo causado pelo webhook configurado no painel do Mercado Pago.

### Teste Rápido:

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Clique em **"NOTIFICAÇÕES"** > **"Webhooks"**
4. **Remova ou desabilite** a URL do webhook temporariamente
5. **Salve** as configurações
6. **Tente fazer um pagamento** novamente
7. **Se funcionar** → ✅ **O problema era o webhook!**

### Por Que Isso Causa internal_error?

Se o webhook estiver configurado com uma URL inacessível (ex: `localhost` ou ngrok desativado), o Mercado Pago tenta notificar o webhook durante o processamento e falha, retornando `internal_error`.

### Se Funcionou Sem Webhook:

Configure o webhook corretamente usando ngrok:
- Veja o guia completo: `SOLUCAO_WEBHOOK_INTERNAL_ERROR.md`

## ✅ Solução 2: Verificar Configuração da Aplicação

### Passo 1: Acessar o Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login
3. Vá em **"Suas integrações"**
4. Clique na aplicação com Access Token `TEST-4669818375391721-...`

### Passo 2: Verificar Configurações

Na página da aplicação, verifique:

#### 1. **Credenciais**
- ✅ Access Token: `TEST-4669818375391721-...`
- ✅ Public Key: `TEST-ad96dc9a-8b11-439a-8972-3df94938d831`
- ✅ Ambas devem estar visíveis e ativas

#### 2. **Configurações da Aplicação**
- **URL do Site:** Deve estar configurada (pode ser `http://localhost:3000` para teste)
- **Categoria do Negócio:** Deve estar selecionada
- **Status da Aplicação:** Deve estar "Ativa" ou "Aprovada"

#### 3. **Permissões**
- Verifique se a aplicação tem permissão para processar pagamentos
- Verifique se há alguma pendência ou aviso

### Passo 3: Verificar Limitações da Conta de Teste

Contas de teste podem ter limitações:
- Limite de transações por dia
- Restrições em valores mínimos/máximos
- Necessidade de aprovação para certos tipos de pagamento

## 🧪 Teste Alternativo: Usar Cartão de Teste Oficial

Certifique-se de estar usando cartões de teste oficiais do Mercado Pago:

### Cartões de Teste Oficiais:

**Visa:**
- Número: `4509 9535 6623 3704`
- CVV: `123`
- Data: Qualquer data futura (ex: `12/25`)

**Mastercard:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Data: Qualquer data futura (ex: `12/25`)

**Documentação:** https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards

## 📞 Contatar Suporte do Mercado Pago

Se após verificar tudo acima o problema persistir, contate o suporte do Mercado Pago com:

### Informações para Fornecer:

1. **Credenciais (primeiros caracteres):**
   - Access Token: `TEST-4669818375391721-...`
   - Public Key: `TEST-ad96dc9a-8b11-4...`

2. **Payload sendo enviado:**
```json
{
  "transaction_amount": 25,
  "token": "a9333ba015dfa415436cea90a6a885f0",
  "description": "Compra de 1 curso(s)",
  "installments": 1,
  "payer": {
    "email": "andersonsilver18@gmail.com",
    "first_name": "Anderson",
    "last_name": "Silveira"
  }
}
```

3. **Erro recebido:**
```
{
  "message": "internal_error",
  "error": null,
  "status": 500,
  "cause": []
}
```

4. **Timestamp:** `2026-01-02T17:13:04.680Z`

5. **Ambiente:** Teste (Sandbox)

### Link do Suporte:
https://www.mercadopago.com.br/developers/pt/support

## 🔄 Alternativa: Criar Nova Aplicação

Se a aplicação atual tiver problemas, você pode:

1. Criar uma nova aplicação no painel do Mercado Pago
2. Copiar o Access Token e Public Key da nova aplicação
3. Atualizar ambos os `.env`:
   - Backend: `MERCADOPAGO_ACCESS_TOKEN`
   - Frontend: `VITE_MERCADOPAGO_PUBLIC_KEY`
4. Reiniciar ambos os servidores
5. Testar novamente

## 📋 Checklist Final

Antes de contatar o suporte, verifique:

- [ ] **TESTE PRIMEIRO:** Removi o webhook temporariamente e testei?
- [ ] Webhook está configurado com URL acessível (ngrok ativo)?
- [ ] Aplicação está ativa no painel?
- [ ] URL do site está configurada?
- [ ] Categoria do negócio está selecionada?
- [ ] Está usando cartão de teste oficial?
- [ ] Não há avisos ou pendências na aplicação?
- [ ] Tentou criar uma nova aplicação?

## 💡 Conclusão

O código está correto. O problema pode ser:

1. **Webhook configurado com URL inacessível** (mais comum - teste primeiro!)
2. **Aplicação do Mercado Pago não totalmente configurada**
3. **Limitações da conta de teste**

**Próximo passo:** 
1. **TESTE PRIMEIRO:** Remova o webhook temporariamente e teste
2. Se funcionar, configure o webhook corretamente com ngrok
3. Se não funcionar, verifique a aplicação no painel e, se necessário, crie uma nova aplicação ou contate o suporte do Mercado Pago

## 📚 Documentação Relacionada

- **Solução Webhook:** `SOLUCAO_WEBHOOK_INTERNAL_ERROR.md`
- **Guia Completo Webhook:** `WEBHOOK_CAUSANDO_INTERNAL_ERROR.md`
- **Configurar Webhook:** `CONFIGURAR_WEBHOOK_MERCADOPAGO.md`

