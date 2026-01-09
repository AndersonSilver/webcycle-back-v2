# 🔍 Como Verificar Credenciais do Mercado Pago

## ⚠️ Problema Comum: "internal_error"

O erro `internal_error` geralmente ocorre quando há **incompatibilidade entre as credenciais**.

---

## ✅ Checklist de Verificação

### 1. Access Token e Public Key Devem Ser do Mesmo Ambiente

**❌ ERRADO:**
- Frontend: Public Key de **TESTE** (`TEST-...`)
- Backend: Access Token de **PRODUÇÃO** (`APP_USR-...`)

**✅ CORRETO:**
- Frontend: Public Key de **TESTE** (`TEST-...`)
- Backend: Access Token de **TESTE** (`TEST-...`)

**OU**

- Frontend: Public Key de **PRODUÇÃO** (`APP_USR-...`)
- Backend: Access Token de **PRODUÇÃO** (`APP_USR-...`)

---

## 🔍 Como Verificar

### 1. Verificar Access Token no Backend

**Arquivo:** `.env` na raiz do projeto

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789
```

**Deve começar com:**
- `TEST-` para modo **sandbox/teste**
- `APP_USR-` para modo **produção**

---

### 2. Verificar Public Key no Frontend

**No código do frontend:**

```javascript
const mp = new MercadoPago('TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz', {
  locale: 'pt-BR'
});
```

**Deve começar com:**
- `TEST-` para modo **sandbox/teste**
- `APP_USR-` para modo **produção**

---

### 3. Verificar se São da Mesma Aplicação

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Suas integrações"** > Sua aplicação
3. Na aba **"Credenciais de teste"**, você verá:
   - **Access Token** (para backend)
   - **Public Key** (para frontend)

**IMPORTANTE:** Use as credenciais da **MESMA aplicação**!

---

## 🧪 Teste Rápido

### No Backend (Console do Servidor)

Quando você tentar processar um pagamento, verifique os logs:

```
💳 Processando pagamento: {
  ...
  accessTokenPrefix: 'TEST-1234...'
}
```

Se aparecer `TEST-...`, está usando credenciais de teste ✅

---

### No Frontend (Console do Navegador)

Quando inicializar o Mercado Pago:

```javascript
const mp = new MercadoPago('TEST-...', { locale: 'pt-BR' });
console.log('Public Key:', 'TEST-...');
```

Se começar com `TEST-`, está usando credenciais de teste ✅

---

## 🔧 Solução

### Se Estiverem Diferentes:

1. **Para desenvolvimento/teste:**
   - Use **ambas** as credenciais de **TESTE**
   - Access Token: `TEST-...`
   - Public Key: `TEST-...`

2. **Para produção:**
   - Use **ambas** as credenciais de **PRODUÇÃO**
   - Access Token: `APP_USR-...`
   - Public Key: `APP_USR-...`

---

## 📝 Exemplo Correto

### Backend (.env)
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789
```

### Frontend (código)
```javascript
const mp = new MercadoPago('TEST-1234567890-123456-abcdefghijklmnopqrstuvwxyz', {
  locale: 'pt-BR'
});
```

**Ambos começam com `TEST-`** ✅

---

## ⚠️ Outras Causas de "internal_error"

1. **Token do cartão expirado** - Gere um novo token
2. **Token inválido** - Verifique se o Mercado Pago JS está configurado corretamente
3. **Access Token incorreto** - Verifique se copiou corretamente do painel
4. **Aplicação diferente** - Use credenciais da mesma aplicação

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs detalhados** no console do servidor
2. **Copie o erro completo** que aparece
3. **Verifique** se Access Token e Public Key são da mesma aplicação
4. **Teste** gerando um novo token no frontend

---

**Última atualização:** 02/01/2026

