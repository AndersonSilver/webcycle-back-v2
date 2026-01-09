# 🔐 Guia de Autenticação - Como Usar o Token

## 📋 Passo a Passo

### 1️⃣ Criar o Usuário Admin (se ainda não criou)

```bash
npm run seed:admin
```

Isso criará:
- **Email:** `admin@tb-psico.com`
- **Senha:** `admin123`

### 2️⃣ Fazer Login no Postman

1. Abra a collection **TB-PSICO-BACK**
2. Vá em **🔐 Autenticação** > **Login**
3. No body, use:
```json
{
  "email": "admin@tb-psico.com",
  "password": "admin123"
}
```
4. Clique em **Send**

### 3️⃣ Token Automático (Configurado)

A collection já está configurada para salvar o token automaticamente! 

Após fazer login com sucesso:
- ✅ O token será salvo na variável `{{token}}`
- ✅ Todas as requisições autenticadas usarão esse token automaticamente

### 4️⃣ Verificar se o Token Foi Salvo

1. No Postman, clique no ícone de **olho** (👁️) no canto superior direito
2. Ou vá em **Environments** > **TB-PSICO-BACK - Development**
3. Verifique se a variável `token` tem um valor

### 5️⃣ Usar o Token nas Requisições

#### ✅ Automático (Recomendado)
A maioria dos endpoints já está configurada com:
```
Authorization: Bearer {{token}}
```

Apenas faça login uma vez e use os endpoints normalmente!

#### 🔧 Manual (se necessário)
Se precisar configurar manualmente:

1. Vá em **Authorization** na requisição
2. Selecione **Type: Bearer Token**
3. Cole o token no campo **Token**

Ou adicione manualmente no header:
```
Authorization: Bearer seu_token_aqui
```

## 🐛 Problemas Comuns

### ❌ Erro 401 Unauthorized

**Causas possíveis:**
1. Não fez login ainda
2. Token expirado (faça login novamente)
3. Token não está sendo enviado

**Solução:**
1. Faça login novamente
2. Verifique se o environment está selecionado
3. Verifique se o header `Authorization` está presente

### ❌ Token não está sendo salvo

**Solução:**
1. Verifique se o environment **TB-PSICO-BACK - Development** está selecionado
2. Vá em **Login** > **Tests** e verifique se o script está ativo
3. Faça login novamente

### ❌ Erro 403 Forbidden (Admin)

**Causa:** Usuário não é admin

**Solução:**
1. Certifique-se de estar logado como admin (`admin@tb-psico.com`)
2. Verifique se o token contém `role: "admin"` no payload

## 📝 Exemplo Completo

### 1. Login
```
POST /api/auth/login
Body:
{
  "email": "admin@tb-psico.com",
  "password": "admin123"
}

Response:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Usar Token (Automático)
```
GET /api/auth/me
Headers:
Authorization: Bearer {{token}}  ← Preenchido automaticamente!
```

## 🔍 Verificar Token Manualmente

Para ver o conteúdo do token:

1. Copie o token retornado no login
2. Acesse: https://jwt.io
3. Cole o token
4. Veja o payload (deve conter `role: "admin"`)

## ✅ Checklist

- [ ] Admin criado (`npm run seed:admin`)
- [ ] Environment selecionado no Postman
- [ ] Login feito com sucesso
- [ ] Token salvo na variável `{{token}}`
- [ ] Endpoints autenticados funcionando

## 🎯 Endpoints que NÃO Precisam de Token

Estes endpoints são públicos:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/courses` (listar)
- `GET /api/courses/:id` (detalhes)
- `GET /api/courses/search`
- `GET /api/recommendations/trending`
- `GET /api/certificates/verify/:code`
- `GET /health`

Todos os outros endpoints **precisam** do token!

