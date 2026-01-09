# 🎯 Solução: Webhook Causando internal_error

## ✅ Teste Rápido

**O erro `internal_error` pode estar sendo causado pelo webhook configurado no painel do Mercado Pago.**

### Passo 1: Verificar Webhook no Painel

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Clique em **"NOTIFICAÇÕES"** > **"Webhooks"**
4. Verifique se há uma URL configurada

### Passo 2: Teste Sem Webhook

**Para testar se o webhook está causando o problema:**

1. **Remova ou desabilite** a URL do webhook no painel
2. **Salve** as configurações
3. **Tente fazer um pagamento** novamente
4. **Se funcionar** → ✅ **O problema era o webhook!**

### Passo 3: Se Funcionou, Configure Webhook Corretamente

Se o pagamento funcionou sem webhook, você precisa configurar o webhook corretamente:

#### Opção A: Usar ngrok (Recomendado para testes locais)

1. **Instale o ngrok:**
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

#### Opção B: Desabilitar Webhook Temporariamente

Se você não precisa do webhook agora:

1. Deixe o webhook desabilitado no painel
2. Você pode verificar o status do pagamento manualmente ou via polling

## 🔍 Por Que Isso Causa internal_error?

O Mercado Pago pode tentar validar ou notificar o webhook **durante** o processamento do pagamento. Se a URL não estiver acessível:

1. ❌ O Mercado Pago tenta acessar a URL do webhook
2. ❌ Falha (timeout, 404, conexão recusada, etc.)
3. ❌ Retorna `internal_error` genérico
4. ❌ O pagamento não é processado

## 📋 URLs que NÃO Funcionam

- ❌ `http://localhost:3001/api/webhooks/mercadopago` → Mercado Pago não consegue acessar localhost
- ❌ `http://127.0.0.1:3001/api/webhooks/mercadopago` → Mesmo problema
- ❌ URL do ngrok que não está mais ativa → URLs do ngrok mudam quando você reinicia
- ✅ `https://sua-url-ngrok.ngrok-free.dev/api/webhooks/mercadopago` → Funciona (se o ngrok estiver rodando)

## 🧪 Teste Agora

1. **Remova o webhook** do painel do Mercado Pago
2. **Tente fazer um pagamento**
3. **Se funcionar** → Configure o webhook corretamente com ngrok
4. **Se não funcionar** → O problema é outro (continue investigando)

## 📚 Documentação Relacionada

- **Guia Completo:** `WEBHOOK_CAUSANDO_INTERNAL_ERROR.md`
- **Configurar Webhook:** `CONFIGURAR_WEBHOOK_MERCADOPAGO.md`
- **Troubleshooting:** `TROUBLESHOOTING_WEBHOOK_502.md`

---

**🎯 Próximo passo:** Remova o webhook temporariamente e teste. Se funcionar, configure o webhook corretamente com ngrok.

