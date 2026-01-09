# 🔐 Como Obter o MERCADOPAGO_WEBHOOK_SECRET

## 📋 O que é o Webhook Secret?

O `MERCADOPAGO_WEBHOOK_SECRET` é uma chave secreta usada para **validar** que as notificações de webhook realmente vêm do Mercado Pago e não de fontes maliciosas. É uma medida de segurança importante.

---

## 🚀 Passo a Passo para Obter o Webhook Secret

### 1. Acesse o Painel do Mercado Pago

1. Acesse: **https://www.mercadopago.com.br/developers/panel**
2. Faça login com sua conta do Mercado Pago

### 2. Crie ou Acesse sua Aplicação

1. No menu lateral, clique em **"Suas integrações"** ou **"Aplicações"**
2. Se você já tem uma aplicação, clique nela
3. Se não tem, clique em **"Criar aplicação"** e preencha:
   - **Nome da aplicação**: Ex: "Plataforma de Cursos TB-PSICO"
   - **Plataforma**: Web
   - **URL de produção**: Sua URL de produção (ex: `https://api.tb-psico.com`)

### 3. Configure o Webhook

1. Dentro da sua aplicação, procure pela seção **"Webhooks"** ou **"Notificações IPN"**
2. Clique em **"Configurar webhooks"** ou **"Adicionar webhook"**

### 4. Adicione a URL do Webhook

**⚠️ IMPORTANTE:** O Mercado Pago **NÃO aceita** URLs com `localhost` diretamente. Você precisa usar uma das opções abaixo:

**Opção 1: Usar ngrok (Recomendado para testes locais)**
1. Instale o ngrok: https://ngrok.com/download
2. Execute: `ngrok http 3001`
3. Copie a URL HTTPS gerada (ex: `https://abc123.ngrok.io`)
4. Use no webhook: `https://abc123.ngrok.io/api/webhooks/mercadopago`

**Opção 2: Usar HTTP (Apenas para testes iniciais)**
```
http://localhost:3001/api/webhooks/mercadopago
```
⚠️ Nota: Algumas configurações do Mercado Pago podem não aceitar HTTP, apenas HTTPS.

**Para Produção:**
```
https://seu-dominio.com/api/webhooks/mercadopago
```

### 5. Obtenha o Webhook Secret

Após configurar o webhook, o Mercado Pago irá gerar um **Webhook Secret** ou **Chave de Segurança**. Você pode encontrá-lo em:

1. Na página de configuração do webhook
2. Na seção **"Credenciais"** da sua aplicação
3. Procure por **"Webhook Secret"**, **"IPN Secret"** ou **"Chave de Segurança"**

**Formato típico:**
- Pode ser uma string longa (ex: `abc123def456ghi789...`)
- Ou um token gerado automaticamente

### 6. Copie e Cole no `.env`

```env
MERCADOPAGO_WEBHOOK_SECRET=sua_chave_secreta_aqui
```

---

## ⚠️ Importante

### Modo Sandbox (Testes)

Se você estiver usando o **modo sandbox** (testes), o webhook secret pode ser diferente ou não estar disponível. Nesse caso:

1. Use o **Access Token de teste** (começa com `TEST-`)
2. O webhook secret pode ser opcional em sandbox
3. Para testes locais, você pode usar um valor temporário:
   ```env
   MERCADOPAGO_WEBHOOK_SECRET=test_webhook_secret_123
   ```

### Modo Produção

1. **Sempre use HTTPS** na URL do webhook em produção
2. O webhook secret é **obrigatório** para validar notificações
3. Mantenha o secret **seguro** e nunca compartilhe publicamente

---

## 🔍 Onde Encontrar no Painel

### Opção 1: Na Configuração do Webhook
```
Painel > Suas Integrações > [Sua Aplicação] > Webhooks > [Seu Webhook] > Secret
```

### Opção 2: Nas Credenciais da Aplicação
```
Painel > Suas Integrações > [Sua Aplicação] > Credenciais > Webhook Secret
```

### Opção 3: Ao Criar o Webhook
Quando você cria um novo webhook, o Mercado Pago pode mostrar o secret imediatamente após a criação.

---

## 🧪 Como Testar

### 1. Configure o Webhook no Mercado Pago
- URL: `https://seu-dominio.com/api/webhooks/mercadopago`
- Eventos: Selecione "Pagamentos" ou "Todos os eventos"

### 2. Adicione no `.env`
```env
MERCADOPAGO_WEBHOOK_SECRET=seu_secret_aqui
```

### 3. Teste com um Pagamento
1. Crie um pagamento de teste
2. O Mercado Pago enviará uma notificação para seu webhook
3. Verifique os logs do servidor para ver se a validação funcionou

---

## 📝 Nota sobre Validação

O código atual do `WebhookController` não está validando o webhook secret. Se você quiser adicionar essa validação (recomendado), você precisaria:

1. Receber o header `x-signature` ou `x-request-id` do Mercado Pago
2. Validar usando o webhook secret
3. Comparar com o hash esperado

**Exemplo de validação (opcional):**
```typescript
// No WebhookController
const signature = req.headers['x-signature'];
const webhookSecret = env.mercadopagoWebhookSecret;

if (webhookSecret && signature) {
  // Validar assinatura aqui
  // Implementar lógica de validação do Mercado Pago
}
```

---

## 🆘 Problemas Comuns

### "Não encontro o Webhook Secret"
- **Solução**: Verifique se você está no modo **Produção** e não **Sandbox**
- Algumas contas podem precisar de verificação adicional

### "O Webhook não está funcionando"
- **Erro "Revise a URL inserida"**: 
  - ❌ Não use `https://localhost` - não funciona!
  - ✅ Use ngrok para testes locais: `https://seu-id.ngrok.io/api/webhooks/mercadopago`
  - ✅ Ou use HTTP: `http://localhost:3001/api/webhooks/mercadopago` (pode não funcionar em todas as configurações)
- Verifique se a URL está acessível publicamente (use ngrok para testes locais)
- Verifique se está usando HTTPS em produção
- Confirme que o servidor está rodando e acessível
- Teste a URL manualmente no navegador para ver se retorna algo

### "Como testar localmente?"
**Solução:** Use **ngrok** para expor seu localhost com HTTPS:

1. **Instale o ngrok:**
   - Baixe em: https://ngrok.com/download
   - Extraia o `ngrok.exe`
   - Adicione ao PATH do Windows OU use o caminho completo
   - 📖 **Guia completo de instalação**: Veja `INSTALAR_NGROK.md`

2. **Execute no terminal:**
   ```powershell
   ngrok http 3001
   ```
   Ou se não estiver no PATH:
   ```powershell
   C:\caminho\para\ngrok.exe http 3001
   ```

3. **Copie a URL HTTPS gerada** (ex: `https://abc123def456.ngrok-free.app`)

4. **Use essa URL no webhook do Mercado Pago:**
   ```
   https://abc123def456.ngrok-free.app/api/webhooks/mercadopago
   ```

**⚠️ Erro comum:** Não use `https://localhost:3001` - isso não funciona! O Mercado Pago precisa de uma URL pública acessível via HTTPS.

**💡 Dica:** Mantenha o ngrok rodando enquanto testa. Se fechar, a URL muda.

---

## 📚 Links Úteis

- **Painel do Mercado Pago**: https://www.mercadopago.com.br/developers/panel
- **Documentação de Webhooks**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- **Documentação de IPN**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/ipn

---

## ✅ Checklist

- [ ] Acessei o painel do Mercado Pago
- [ ] Criei/configurei minha aplicação
- [ ] Configurei o webhook com a URL correta
- [ ] Copiei o Webhook Secret
- [ ] Adicionei no arquivo `.env`
- [ ] Testei o webhook com um pagamento de teste

---

**Última atualização:** Janeiro 2024

