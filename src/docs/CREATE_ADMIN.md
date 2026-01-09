# 👨‍💼 Criar Usuário Admin

Script para criar o primeiro usuário administrador da plataforma.

## 🚀 Como Usar

### Opção 1: Usando NPM Script (Recomendado)

```bash
npm run seed:admin
```

### Opção 2: Executar Diretamente

```bash
npx ts-node src/scripts/createAdmin.ts
```

### Opção 3: Com Senha Customizada

```bash
ADMIN_PASSWORD=suaSenhaSegura123 npm run seed:admin
```

## 📋 Credenciais Padrão

Após executar o script, você terá:

- **Email:** `admin@tb-psico.com`
- **Senha:** `admin123` (ou a senha definida em `ADMIN_PASSWORD`)
- **Role:** `admin`

## ⚠️ Importante

1. **Altere a senha após o primeiro login!**
2. O script verifica se já existe um admin com esse email
3. Se já existir, o script não cria um novo usuário

## 🔐 Alterar Senha do Admin

Após fazer login, use o endpoint:

```
PUT /api/auth/change-password
```

Com o body:
```json
{
  "currentPassword": "admin123",
  "newPassword": "suaNovaSenhaSegura"
}
```

## 📝 Exemplo de Uso

```bash
# Criar admin com senha padrão
npm run seed:admin

# Criar admin com senha customizada
ADMIN_PASSWORD=MinhaSenhaSuperSegura123 npm run seed:admin
```

## ✅ Verificação

Após criar o admin, você pode testar fazendo login:

```bash
POST /api/auth/login
{
  "email": "admin@tb-psico.com",
  "password": "admin123"
}
```

O token retornado terá `role: "admin"` e poderá acessar todos os endpoints administrativos.

