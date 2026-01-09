# 🔧 Troubleshooting: Erro 502 Bad Gateway no Webhook

## ❌ Problema

Você está recebendo erro **502 - Bad Gateway** ao testar o webhook do Mercado Pago.

## 🔍 O que significa?

O erro 502 significa que:
- ✅ O ngrok está recebendo a requisição corretamente
- ✅ A URL está configurada corretamente
- ❌ Mas o ngrok **não consegue se conectar** ao seu backend em `localhost:3001`

---

## ✅ Soluções Passo a Passo

### 1. Verifique se o Backend Está Rodando

**No terminal onde você iniciou o servidor, você deve ver:**

```
✅ Database connected
🚀 Server running on port 3001
📝 Environment: development
🌐 Frontend URL: http://localhost:3000
```

**Se não estiver rodando:**

```bash
# Pare qualquer processo anterior (Ctrl+C)
# Depois inicie novamente:
npm run dev
```

---

### 2. Teste o Health Check

Abra no navegador:

```
https://joanna-uncombining-joaquin.ngrok-free.dev/health
```

**Deve retornar:**
```json
{"status":"ok","timestamp":"2026-01-02T..."}
```

**Se retornar erro ou não carregar:**
- ❌ Backend não está rodando
- ❌ ngrok não está conectado corretamente
- ❌ Porta incorreta

---

### 3. Verifique se a Porta Está Correta

**No terminal do ngrok, verifique:**

```
Forwarding  https://joanna-uncombining-joaquin.ngrok-free.dev -> http://localhost:3001
```

**Deve apontar para `localhost:3001`**

**Se estiver diferente:**
- Ajuste o ngrok: `ngrok http 3001`
- Ou ajuste a porta do backend no `.env`: `PORT=3001`

---

### 4. Verifique os Logs do Servidor

Quando o Mercado Pago tentar enviar o webhook, você **deve ver** no console do servidor:

```
📡 [timestamp] 🔓 POST /api/webhooks/mercadopago
   IP: 181.xxx.xxx.xxx
   Body: {...}
🔔 Webhook recebido do Mercado Pago: {...}
```

**Se não aparecer NADA:**
- O backend não está recebendo a requisição
- Verifique se o backend está rodando
- Verifique se o ngrok está conectado

---

### 5. Reinicie Tudo (Solução Completa)

**Passo a passo:**

1. **Pare o backend** (Ctrl+C no terminal do servidor)
2. **Pare o ngrok** (Ctrl+C no terminal do ngrok)
3. **Aguarde 5 segundos**
4. **Inicie o backend:**
   ```bash
   npm run dev
   ```
5. **Aguarde aparecer:** `🚀 Server running on port 3001`
6. **Em outro terminal, inicie o ngrok:**
   ```bash
   ngrok http 3001
   ```
7. **Copie a nova URL** (se mudou)
8. **Atualize no Mercado Pago** se necessário
9. **Teste novamente**

---

### 6. Verifique se Há Erros no Código

**No console do servidor, procure por erros:**

```
❌ Erro no webhook: ...
❌ Database connection error: ...
❌ Error: ...
```

**Se houver erros:**
- Corrija os erros mostrados
- Reinicie o servidor

---

### 7. Teste Localmente Primeiro

Antes de testar via ngrok, teste localmente:

**No Postman ou curl:**

```bash
POST http://localhost:3001/api/webhooks/mercadopago
Content-Type: application/json

{
  "action": "payment.updated",
  "type": "payment",
  "data": { "id": "123456" }
}
```

**Deve retornar:**
```json
{
  "received": true,
  "paymentId": "123456"
}
```

**Se funcionar localmente mas não via ngrok:**
- Problema é com o ngrok, não com o código
- Tente reiniciar o ngrok

---

## 🎯 Checklist Rápido

- [ ] Backend rodando na porta 3001?
- [ ] Mensagem `🚀 Server running on port 3001` aparece?
- [ ] `/health` funciona via ngrok?
- [ ] ngrok apontando para `localhost:3001`?
- [ ] Logs aparecem no console quando testa?
- [ ] Sem erros no console do servidor?

---

## 💡 Dicas

1. **Mantenha ambos os terminais abertos:**
   - Terminal 1: Backend (`npm run dev`)
   - Terminal 2: ngrok (`ngrok http 3001`)

2. **Se o ngrok mudar a URL:**
   - Atualize no Mercado Pago
   - URLs gratuitas mudam a cada reinício

3. **Para URLs estáveis:**
   - Considere upgrade do ngrok (pago)
   - Ou use um servidor em produção

---

## 🆘 Se Nada Funcionar

1. **Verifique se a porta 3001 está livre:**
   ```powershell
   netstat -ano | findstr :3001
   ```

2. **Mate processos na porta 3001:**
   ```powershell
   # Encontre o PID do processo
   netstat -ano | findstr :3001
   # Mate o processo (substitua PID pelo número encontrado)
   taskkill /PID <PID> /F
   ```

3. **Reinicie tudo:**
   - Feche todos os terminais
   - Abra novos terminais
   - Inicie backend → depois ngrok

4. **Verifique o arquivo `.env`:**
   - `PORT=3001` está configurado?

---

**Ainda com problemas?** Verifique os logs completos do servidor e do ngrok para identificar o erro específico.

