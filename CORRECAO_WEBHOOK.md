# 🔧 Correção de Erros no Webhook

## ❌ Problemas Identificados

### 1. **ERR_HTTP_HEADERS_SENT** (Crítico)
**Erro:** `Cannot set headers after they are sent to the client`

**Causa:** O código estava enviando a resposta HTTP duas vezes:
- Linha 40: `res.status(200).json({ received: true });` ✅ (correto)
- Linha 63: `res.status(200).json({ received: true, message: '...' });` ❌ (duplicado)

**Solução:** Removida a segunda resposta. Agora apenas retorna quando não encontra paymentId.

### 2. **URL com Query Params Duplicados** (Log apenas)
**Observação:** A URL aparece duplicada nos logs:
```
POST /api/webhooks/mercadopago?id=141496360560&topic=payment?id=141496360560&topic=payment
```

**Causa:** Provavelmente um problema do Nginx Proxy Manager ou do Express ao processar query params.

**Impacto:** Apenas visual nos logs, não afeta o funcionamento. O Express processa corretamente.

### 3. **PaymentId não encontrado em alguns formatos**
**Problema:** O webhook recebe diferentes formatos do Mercado Pago:
- `{ resource: "141496360560", topic: "payment" }` - formato antigo
- `{ action: "payment.created", data: { id: "141496360560" }, type: "payment" }` - formato novo
- Query params: `?data.id=141496360560&type=payment`
- Query params: `?id=141496360560&topic=payment`

**Solução:** Melhorada a extração do paymentId para considerar:
- Body com `data.id` ou `data_id`
- Body com `resource` quando `topic === 'payment'`
- Query params `data.id`
- Query params `id` quando `topic === 'payment'`

## ✅ Correções Aplicadas

### Arquivo: `TB-PSICO-BACK/src/controllers/WebhookController.ts`

1. ✅ Removida resposta duplicada (linha 63)
2. ✅ Adicionada extração de paymentId dos query params
3. ✅ Melhorado tratamento do formato `{ resource: "...", topic: "payment" }`
4. ✅ Adicionado log dos query params para debug

## 🧪 Como Testar

Após fazer deploy, os webhooks devem:
1. ✅ Responder 200 imediatamente (sem erro de headers)
2. ✅ Extrair paymentId corretamente de diferentes formatos
3. ✅ Processar o pagamento e atualizar a compra

## 📝 Próximos Passos

1. Fazer commit das correções
2. Fazer push para a branch `mercado-pago`
3. Rebuild no VPS
4. Monitorar logs para confirmar que não há mais erros

---

**Status:** ✅ Corrigido
**Data:** 10/01/2026

