# 🔧 Troubleshooting: Erro "internal_error" no Pagamento

## ❌ Erro

```
Erro ao processar pagamento com cartão: internal_error
```

---

## 🔍 Possíveis Causas e Soluções

### 1. Access Token Não Configurado ou Inválido

**Sintoma:** Erro `internal_error` ao tentar processar pagamento

**Verificação:**
1. Abra o arquivo `.env` na raiz do projeto
2. Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado
3. Deve começar com `TEST-` para modo sandbox

**Solução:**
```env
# No arquivo .env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789
```

**Como obter:**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > Sua aplicação
3. Na aba "Credenciais de teste", copie o **Access Token**

---

### 2. Token do Cartão Inválido ou Expirado

**Sintoma:** Token gerado pelo frontend não é aceito

**Verificação:**
- Verifique no console do servidor se aparece: `tokenLength: X`
- Token deve ter pelo menos 20 caracteres
- Token deve ser gerado recentemente (expira em alguns minutos)

**Solução:**
1. Certifique-se de que o Mercado Pago JS está carregado corretamente
2. Gere um novo token antes de cada tentativa de pagamento
3. Verifique se a Public Key está correta no frontend

**Exemplo de token válido:**
```
ff8080814c11e237014c1ff593b57b4d
```

---

### 3. Public Key Incorreta no Frontend

**Sintoma:** Token gerado mas não aceito pelo backend

**Verificação:**
- Verifique se está usando a Public Key de TESTE durante desenvolvimento
- Public Key deve começar com `TEST-`

**Solução:**
```javascript
// No frontend
const mp = new MercadoPago('TEST-SUA_PUBLIC_KEY_AQUI', {
  locale: 'pt-BR'
});
```

**Como obter Public Key:**
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Suas integrações" > Sua aplicação
3. Na aba "Credenciais de teste", copie a **Public Key**

---

### 4. Valor do Pagamento Inválido

**Sintoma:** Erro ao processar mesmo com token válido

**Verificação:**
- Verifique no console do servidor: `amount: X`
- Valor deve ser maior que 0
- Valor deve estar em formato numérico (não string)

**Solução:**
- Certifique-se de que `purchase.finalAmount` é um número válido
- Verifique se não há valores negativos ou zero

---

### 5. Email do Pagador Inválido

**Sintoma:** Erro ao processar pagamento

**Verificação:**
- Verifique se o email do usuário está correto
- Email deve ter formato válido (contém @)

**Solução:**
- Certifique-se de que o usuário tem um email válido cadastrado
- Verifique se o email não está vazio

---

### 6. Timeout na Comunicação com Mercado Pago

**Sintoma:** Erro após alguns segundos

**Verificação:**
- Verifique sua conexão com a internet
- Verifique se o Mercado Pago está acessível

**Solução:**
- Timeout foi aumentado para 10 segundos
- Se persistir, verifique firewall/proxy

---

## 🔍 Como Debugar

### 1. Verificar Logs do Servidor

Quando você tentar processar um pagamento, verifique o console do servidor. Você deve ver:

```
💳 Iniciando processamento de pagamento: {
  purchaseId: '...',
  amount: '25.00',
  tokenLength: 32,
  installments: '1'
}

💳 Processando pagamento: {
  amount: 25,
  installments: 1,
  payerEmail: 'user@email.com',
  tokenLength: 32,
  hasIdentification: false
}
```

**Se não aparecer esses logs:**
- A requisição não está chegando ao servidor
- Verifique se o endpoint está correto: `POST /api/purchases/:id/process`

**Se aparecer erro:**
- Veja a mensagem completa do erro
- Verifique qual validação falhou

---

### 2. Verificar Request no Frontend

No console do navegador (F12), verifique:

**Request enviado:**
```javascript
// Deve conter:
{
  token: "ff8080814c11e237014c1ff593b57b4d", // Token válido
  installments: "1"
}
```

**Response recebida:**
```json
{
  "message": "Erro ao processar pagamento com cartão: [detalhes]"
}
```

---

### 3. Testar Token Manualmente

Você pode testar se o token está sendo gerado corretamente:

```javascript
// No console do navegador
const tokenResult = await cardForm.createToken();
console.log('Token result:', tokenResult);

// Deve mostrar:
// {
//   status: 'ready',
//   id: 'ff8080814c11e237014c1ff593b57b4d'
// }
```

---

## ✅ Checklist de Verificação

Antes de reportar o erro, verifique:

- [ ] `MERCADOPAGO_ACCESS_TOKEN` está configurado no `.env`?
- [ ] Access Token começa com `TEST-` (modo sandbox)?
- [ ] Public Key está correta no frontend?
- [ ] Public Key começa com `TEST-`?
- [ ] Mercado Pago JS está carregado no HTML?
- [ ] Token está sendo gerado corretamente?
- [ ] Token não está expirado (gerado recentemente)?
- [ ] Valor do pagamento é válido (> 0)?
- [ ] Email do usuário é válido?
- [ ] Servidor backend está rodando?
- [ ] Requisição está chegando ao servidor (veja logs)?

---

## 🧪 Teste Rápido

### 1. Verificar Credenciais

```bash
# No terminal do servidor, verifique se aparece:
⚠️ MERCADOPAGO_ACCESS_TOKEN não está configurado!
```

Se aparecer, configure o Access Token no `.env`.

### 2. Testar Endpoint Manualmente

```bash
# No Postman ou curl
POST http://localhost:3001/api/purchases/PURCHASE_ID/process
Authorization: Bearer USER_TOKEN
Content-Type: application/json

{
  "token": "ff8080814c11e237014c1ff593b57b4d",
  "installments": "1"
}
```

### 3. Verificar Logs Detalhados

Agora o código loga mais informações. Verifique o console do servidor para ver:
- Token recebido
- Valor do pagamento
- Email do pagador
- Erro detalhado (se houver)

---

## 📞 Próximos Passos

Se após verificar tudo acima o erro persistir:

1. **Copie os logs completos** do servidor (console)
2. **Copie a requisição** do Network tab do navegador
3. **Verifique** se o erro mudou (agora deve mostrar mais detalhes)
4. **Envie** essas informações para debug

---

## 💡 Dica

O código agora mostra **muito mais informações** nos logs. Sempre verifique o console do servidor quando houver erro - lá você encontrará detalhes específicos do que está falhando.

---

**Última atualização:** 02/01/2026

