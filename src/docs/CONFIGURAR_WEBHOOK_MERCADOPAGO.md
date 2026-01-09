# 🔔 Como Configurar Webhook do Mercado Pago

Guia passo a passo para configurar o webhook e receber notificações de pagamento.

---

## 📋 Pré-requisitos

1. ✅ Backend rodando na porta 3001
2. ✅ ngrok instalado e configurado
3. ✅ ngrok rodando e expondo a porta 3001

---

## 🚀 Passo a Passo

### 1. Inicie o ngrok

Abra um terminal e execute:

```bash
ngrok http 3001
```

Você verá algo como:
```
Forwarding  https://abc123.ngrok-free.dev -> http://localhost:3001
```

**⚠️ IMPORTANTE:** Copie a URL HTTPS (não HTTP)!

---

### 2. Acesse o Dashboard do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login
3. Vá em **"Suas integrações"** > Sua aplicação
4. No menu lateral, clique em **"NOTIFICAÇÕES"** > **"Webhooks"**

---

### 3. Configure a URL do Webhook

Na seção **"Outros eventos"**:

1. **Marque a opção "Pagamentos"** (já deve estar marcada)
2. **URL do Webhook:**
   ```
   https://SUA-URL-NGROK.ngrok-free.dev/api/webhooks/mercadopago
   ```
   
   **Exemplo:**
   ```
   https://abc123.ngrok-free.dev/api/webhooks/mercadopago
   ```

3. **Assinatura secreta (opcional):**
   - Você pode deixar em branco para testes
   - Em produção, configure uma chave secreta para validação

4. Clique em **"Salvar configurações"**

---

### 4. Teste o Webhook

Na mesma página, você verá um painel **"Simular notificações"**:

1. Clique em **"Novo teste"**
2. O Mercado Pago tentará enviar uma notificação de teste
3. **Verifique o console do seu servidor** - você deve ver:
   ```
   🔔 Webhook recebido do Mercado Pago: {...}
   ✅ Status da compra atualizado
   ```

4. Se aparecer **"404 - Not Found"**, verifique:
   - ✅ ngrok está rodando?
   - ✅ A URL está correta?
   - ✅ O backend está rodando na porta 3001?
   - ✅ A rota `/api/webhooks/mercadopago` está registrada?

---

## 🔍 Verificar se Está Funcionando

### No Console do Servidor:

Quando o webhook funcionar, você verá:

```
📡 [2026-01-02 14:00:00] 🔓 POST /api/webhooks/mercadopago
   IP: 181.xxx.xxx.xxx
   Body: {
     "action": "payment.updated",
     "type": "payment",
     "data": { "id": "1234567890" }
   }
🔔 Webhook recebido do Mercado Pago: {...}
🔍 Buscando pagamento: 1234567890
✅ Compra encontrada: c7d263c3-8277-401f-8a30-216fa48942e9
📊 Status do pagamento: approved
✅ Status da compra atualizado para: paid
✅ [2026-01-02 14:00:01] POST /api/webhooks/mercadopago - Status: 200 - Tempo: 500ms
```

---

## ⚠️ Problemas Comuns

### Erro: "404 - Not Found"

**Causas possíveis:**
1. ngrok não está rodando
2. URL incorreta no Mercado Pago
3. Backend não está rodando
4. Rota não está registrada

**Solução:**
1. Verifique se o ngrok está rodando: `ngrok http 3001`
2. Copie a URL HTTPS completa
3. Verifique se o backend está rodando: `npm run dev`
4. Teste a URL manualmente no navegador: `https://sua-url.ngrok-free.dev/health`
   - Deve retornar: `{"status":"ok"}`

### Erro: "Timeout" ou "Connection Refused"

**Causas:**
- ngrok parou de funcionar
- URL do ngrok mudou (gratuito muda a cada reinício)

**Solução:**
- Reinicie o ngrok
- Atualize a URL no Mercado Pago

### Erro: "403 - Request failed with status code 403"

**Causas:**
- URL com `https://` duplicado
- ngrok mostrando página de aviso (gratuito)

**Solução:**
1. **Remova o `https://` duplicado** na URL do Mercado Pago
2. O código já adiciona o header `ngrok-skip-browser-warning` automaticamente
3. Reinicie o servidor backend se necessário
4. Teste novamente

### Webhook Recebido mas Compra Não Atualizada

**Causas:**
- `paymentId` do webhook não corresponde ao `paymentId` salvo na compra
- Para Checkout Pro, o webhook pode vir com `payment_id` mas a compra tem `pref_id`

**Solução:**
- Verifique os logs do servidor
- O código já tenta buscar de diferentes formas
- Em caso de Checkout Pro, o webhook pode demorar alguns segundos após o pagamento

---

## 🎯 Como Funciona

### Fluxo Completo:

1. **Checkout criado** → Compra criada com `pref_id` (para cartão) ou `payment_id` (PIX/Boleto)
2. **Usuário paga** → No checkout do Mercado Pago
3. **Mercado Pago processa** → Pagamento aprovado/rejeitado
4. **Webhook enviado** → Mercado Pago envia notificação para sua URL
5. **Backend recebe** → WebhookController processa a notificação
6. **Status atualizado** → Compra atualizada automaticamente no banco

---

## 📝 Formato do Webhook

O Mercado Pago pode enviar webhooks em diferentes formatos:

### Formato 1 (Padrão):
```json
{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

### Formato 2 (Simulação):
```json
{
  "action": "payment.updated",
  "api_version": "v1",
  "data": { "id": "1234567890" },
  "date_created": "2026-01-02T14:00:00Z",
  "id": "123456",
  "live_mode": false,
  "type": "payment",
  "user_id": 140335646
}
```

O código já está preparado para lidar com ambos os formatos! ✅

---

## 🔗 Links Úteis

- **Dashboard:** https://www.mercadopago.com.br/developers/panel
- **Documentação Webhooks:** https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **ngrok:** https://ngrok.com/

---

## ✅ Checklist Final

- [ ] ngrok rodando na porta 3001
- [ ] URL HTTPS copiada do ngrok
- [ ] URL configurada no Mercado Pago: `https://sua-url.ngrok-free.dev/api/webhooks/mercadopago`
- [ ] "Pagamentos" marcado nos eventos
- [ ] Configurações salvas
- [ ] Teste executado com sucesso
- [ ] Logs aparecendo no console do servidor

---

**Dica:** Mantenha o ngrok rodando enquanto estiver testando. Em produção, você usará uma URL pública real do seu servidor.

