# 🔔 Webhook Pode Estar Causando o Erro "internal_error"

## 🎯 Problema Identificado

O erro `internal_error` pode estar sendo causado pelo **webhook configurado no painel do Mercado Pago**. Se o Mercado Pago tentar enviar uma notificação para uma URL inacessível ou inválida **antes ou durante** o processamento do pagamento, pode causar o `internal_error`.

## 🔍 Como Verificar

### Passo 1: Verificar Webhook Configurado no Painel

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Clique em **"NOTIFICAÇÕES"** > **"Webhooks"**
4. Verifique se há uma URL configurada

### Passo 2: Verificar se a URL Está Acessível

**Se a URL for:**
- ❌ `http://localhost:3001/api/webhooks/mercadopago` → **NÃO FUNCIONA!** O Mercado Pago não consegue acessar localhost
- ❌ URL com ngrok que não está mais ativa → **NÃO FUNCIONA!** URLs do ngrok mudam quando você reinicia
- ✅ `https://sua-url-ngrok.ngrok-free.dev/api/webhooks/mercadopago` → **FUNCIONA** (se o ngrok estiver rodando)

## ✅ Solução 1: Remover Webhook Temporariamente (TESTE)

Para testar se o webhook está causando o problema:

1. Acesse o painel do Mercado Pago
2. Vá em **"NOTIFICAÇÕES"** > **"Webhooks"**
3. **Remova ou desabilite** a URL do webhook temporariamente
4. Salve as configurações
5. Tente fazer um pagamento novamente
6. Se funcionar → **O problema era o webhook!**

## ✅ Solução 2: Configurar Webhook Corretamente

### Opção A: Usar ngrok (Recomendado para testes locais)

1. **Instale o ngrok** (se ainda não tiver):
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok
   
   # Ou baixe em: https://ngrok.com/download
   ```

2. **Inicie o ngrok** apontando para a porta do backend:
   ```bash
   ngrok http 3001
   ```

3. **Copie a URL HTTPS** gerada (ex: `https://abc123.ngrok-free.dev`)

4. **Configure no Mercado Pago:**
   - URL: `https://abc123.ngrok-free.dev/api/webhooks/mercadopago`
   - Eventos: Marque "Pagamentos"
   - Salve

5. **⚠️ IMPORTANTE:** Mantenha o ngrok rodando enquanto testar!

### Opção B: Desabilitar Webhook Temporariamente

Se você não precisa do webhook agora, pode desabilitá-lo:

1. No painel do Mercado Pago
2. Vá em **"NOTIFICAÇÕES"** > **"Webhooks"**
3. **Desmarque** ou **remova** a URL
4. Salve

**Nota:** Sem webhook, você precisará verificar o status do pagamento manualmente ou via polling.

## ✅ Solução 3: Adicionar notification_url no Payload (Opcional)

Se você quiser especificar uma URL de webhook específica para cada pagamento, podemos adicionar `notification_url` no payload. Isso permite ter uma URL diferente do webhook padrão configurado no painel.

**⚠️ ATENÇÃO:** Isso só funciona se você tiver uma URL pública acessível (não localhost).

## 🧪 Teste Rápido

1. **Remova o webhook** do painel do Mercado Pago
2. **Tente fazer um pagamento**
3. **Se funcionar** → O problema era o webhook!
4. **Se não funcionar** → O problema é outro (continue investigando)

## 📋 Checklist

- [ ] Verifiquei se há webhook configurado no painel
- [ ] Verifiquei se a URL do webhook está acessível
- [ ] Testei removendo o webhook temporariamente
- [ ] Configurei ngrok corretamente (se necessário)
- [ ] Mantive o ngrok rodando durante os testes

## 💡 Por Que Isso Pode Causar internal_error?

O Mercado Pago pode tentar validar ou notificar o webhook **durante** o processamento do pagamento. Se a URL não estiver acessível:

1. O Mercado Pago tenta acessar a URL
2. Falha (timeout, 404, etc.)
3. Retorna `internal_error` genérico
4. O pagamento não é processado

## 🔗 Links Úteis

- **Painel do Mercado Pago:** https://www.mercadopago.com.br/developers/panel
- **Documentação Webhooks:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **ngrok:** https://ngrok.com/

---

**Próximo passo:** Remova o webhook temporariamente e teste. Se funcionar, configure o webhook corretamente com ngrok.

