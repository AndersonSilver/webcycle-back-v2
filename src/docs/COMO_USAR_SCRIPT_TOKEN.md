# 🛠️ Como Usar o Script de Geração de Token

## 🎯 Duas Opções Disponíveis

### Opção 1: Script Simples (Recomendado) ✅

Cria um servidor HTTP local com uma interface visual para gerar tokens.

#### Como Usar:

```bash
npm run test:token
```

Ou diretamente:

```bash
node src/scripts/testMercadoPagoTokenSimple.js
```

#### O que acontece:

1. Um servidor HTTP é iniciado na porta `3002`
2. Abra seu navegador em: `http://localhost:3002`
3. Uma página bonita aparece com um formulário
4. Preencha os dados do cartão de teste
5. Clique em "Gerar Token"
6. O token será gerado e copiado automaticamente para a área de transferência

#### Vantagens:

- ✅ Interface visual bonita
- ✅ Fácil de usar
- ✅ Não precisa de Puppeteer
- ✅ Token é copiado automaticamente
- ✅ Mostra erros claramente

---

### Opção 2: Script com Puppeteer (Avançado)

Tenta gerar token automaticamente usando Puppeteer (pode ter problemas).

#### Como Usar:

```bash
node src/scripts/testMercadoPagoToken.js
```

#### Requisitos:

- Puppeteer instalado (`npm install puppeteer`)
- Public Key configurada no `.env`

#### Problemas Conhecidos:

- ⚠️ Pode falhar porque o Mercado Pago usa iframes
- ⚠️ Campos não podem ser preenchidos programaticamente
- ⚠️ Requer mais configuração

---

## 📋 Configuração Necessária

### 1. Configurar Public Key no `.env`

```env
MERCADOPAGO_PUBLIC_KEY=TEST-SUA-PUBLIC-KEY-AQUI
```

### 2. Instalar Dependências (se necessário)

```bash
npm install
```

---

## 🧪 Como Testar

### Passo 1: Iniciar o Script

```bash
npm run test:token
```

### Passo 2: Abrir no Navegador

Acesse: `http://localhost:3002`

### Passo 3: Preencher Formulário

Use cartão de teste do Mercado Pago:

- **Número:** `4509 9535 6623 3704` (Visa)
- **Validade:** `12/25`
- **CVV:** `123`
- **Nome:** `Test User`
- **CPF:** `12345678909`
- **E-mail:** `test@test.com`
- **Parcelas:** `1x`

### Passo 4: Gerar Token

1. Clique em "Gerar Token"
2. Aguarde alguns segundos
3. O token será exibido e copiado automaticamente

### Passo 5: Usar o Token

1. Cole o token no Postman ou backend
2. **Use IMEDIATAMENTE** (tokens expiram em segundos!)

---

## 🔍 Validar Token Gerado

Após gerar o token, você pode validá-lo usando o endpoint:

```
POST http://localhost:3001/api/purchases/validate-token

Headers:
  Authorization: Bearer <seu_token_jwt>
  Content-Type: application/json

Body:
{
  "token": "token_gerado_aqui"
}
```

---

## 💡 Dicas

1. **Use cartões de teste oficiais** do Mercado Pago
2. **Gere o token quando precisar** (não armazene)
3. **Use imediatamente** após gerar
4. **Valide antes de processar** (opcional, mas recomendado)

---

## 🐛 Problemas Comuns

### Problema: "Cannot read properties of undefined"

**Solução:** Use o script simples (`testMercadoPagoTokenSimple.js`) em vez do Puppeteer.

### Problema: Token sempre inválido

**Solução:**
1. Verifique se a Public Key está correta no `.env`
2. Use cartões de teste oficiais
3. Use o token imediatamente após gerar

### Problema: Porta 3002 já em uso

**Solução:** Pare outros processos na porta 3002 ou altere a porta no script.

---

## 📞 Próximos Passos

1. Gere um token usando o script
2. Valide o token usando o endpoint `/api/purchases/validate-token`
3. Use o token para processar um pagamento

---

## 🎉 Resumo

**Para gerar tokens facilmente:**

```bash
npm run test:token
```

Depois acesse `http://localhost:3002` no navegador e use a interface visual!

