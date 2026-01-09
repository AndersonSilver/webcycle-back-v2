# Variáveis de Ambiente - Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

## 📋 Variáveis Obrigatórias

### 🗄️ Banco de Dados (PostgreSQL)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_postgres
DB_DATABASE=tb_psico
DB_SYNCHRONIZE=false  # true apenas em desenvolvimento
DB_LOGGING=false      # true para ver queries SQL
```

### 🔐 JWT (Autenticação)
```env
# IMPORTANTE: Gere chaves seguras em produção!
# Use: openssl rand -base64 32
JWT_SECRET=sua_chave_secreta_jwt_muito_segura
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=sua_chave_secreta_refresh_token
JWT_REFRESH_EXPIRES_IN=30d
```

### 🌐 Aplicação
```env
PORT=3001
NODE_ENV=development  # ou 'production'
FRONTEND_URL=http://localhost:3000  # ⚠️ OBRIGATÓRIO para pagamentos com cartão!
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=sua_chave_secreta_sessao
```

**⚠️ IMPORTANTE:** A variável `FRONTEND_URL` é **obrigatória** para pagamentos com cartão de crédito. Ela define as URLs de retorno após o pagamento:
- Sucesso: `${FRONTEND_URL}/purchase/success`
- Falha: `${FRONTEND_URL}/purchase/failure`
- Pendente: `${FRONTEND_URL}/purchase/pending`

**Em produção**, use a URL do seu frontend:
```env
FRONTEND_URL=https://seusite.com.br
```

## 📋 Variáveis Opcionais (mas recomendadas)

### 🔵 Google OAuth 2.0
```env
# Obtenha em: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=seu_client_id_google
GOOGLE_CLIENT_SECRET=seu_client_secret_google
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 💳 Mercado Pago (Gateway de Pagamento)
```env
# Obtenha em: https://www.mercadopago.com.br/developers/panel
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_mercadopago
MERCADOPAGO_PUBLIC_KEY=sua_public_key_mercadopago
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_mercadopago
```

### 📧 Email (SMTP) - OPCIONAL
```env
# NOTA: Email não será usado neste projeto
# Se quiser habilitar no futuro, descomente e configure:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seu_email@gmail.com
# SMTP_PASS=sua_senha_ou_app_password
```

### ☁️ Azure Blob Storage (Armazenamento de Arquivos)
```env
# Opcional: Para upload de vídeos e imagens
# Opção 1: Usar Connection String (recomendado)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=seu_account_name;AccountKey=sua_account_key;EndpointSuffix=core.windows.net

# Opção 2: Usar Account Name e Key separadamente
AZURE_STORAGE_ACCOUNT_NAME=seu_account_name
AZURE_STORAGE_ACCOUNT_KEY=sua_account_key
AZURE_STORAGE_CONTAINER_NAME=nome_do_seu_container
```

## 📝 Exemplo Completo de `.env`

```env
# ============================================
# BANCO DE DADOS
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=minhasenha123
DB_DATABASE=tb_psico
DB_SYNCHRONIZE=false
DB_LOGGING=false

# ============================================
# JWT
# ============================================
JWT_SECRET=minha_chave_secreta_super_segura_123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=minha_chave_refresh_secreta_987654321
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# GOOGLE OAUTH
# ============================================
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# ============================================
# MERCADO PAGO
# ============================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdefghijklmnopqrstuvwxyz-123456789
MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890-123456-abcdefghijklmnopqrstuvwxyz
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# ============================================
# EMAIL (OPCIONAL - Não será usado neste projeto)
# ============================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=meuemail@gmail.com
# SMTP_PASS=minha_app_password_gmail

# ============================================
# AZURE BLOB STORAGE (Opcional)
# ============================================
# Opção 1: Connection String (recomendado)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=meustorage;AccountKey=minha_chave_azure;EndpointSuffix=core.windows.net

# Opção 2: Account Name e Key separadamente
AZURE_STORAGE_ACCOUNT_NAME=meustorage
AZURE_STORAGE_ACCOUNT_KEY=minha_chave_azure
AZURE_STORAGE_CONTAINER_NAME=meu-container-cursos

# ============================================
# APLICAÇÃO
# ============================================
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=minha_chave_secreta_sessao_123456
```

## 🔒 Segurança em Produção

1. **Nunca commite o arquivo `.env` no Git**
2. **Use chaves diferentes para desenvolvimento e produção**
3. **Gere chaves JWT seguras**: `openssl rand -base64 32`
4. **Use variáveis de ambiente do servidor** (Heroku, Vercel, AWS, etc.)
5. **Mantenha `DB_SYNCHRONIZE=false` em produção**
6. **Use `NODE_ENV=production` em produção**

## 📚 Como Obter as Credenciais

### Google OAuth:
1. Acesse: https://console.cloud.google.com/
2. Crie um projeto
3. Vá em "APIs & Services" > "Credentials"
4. Crie "OAuth 2.0 Client ID"
5. Configure as URLs de redirecionamento

### Mercado Pago:
1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Crie uma aplicação
3. Copie o **Access Token** e **Public Key** (encontrados em "Credenciais")
4. Configure o webhook:
   - Vá em "Webhooks" ou "Notificações IPN"
   - Adicione a URL: `https://seu-dominio.com/api/webhooks/mercadopago`
   - Copie o **Webhook Secret** gerado
   - Adicione no `.env` como `MERCADOPAGO_WEBHOOK_SECRET`
5. **Nota**: Em modo Sandbox (testes), o webhook secret pode ser opcional. Use um valor temporário como `test_webhook_secret_123` para desenvolvimento.

📖 **Guia detalhado**: Veja `GUIA_MERCADOPAGO_WEBHOOK.md` para instruções passo a passo.

### Azure Blob Storage:
1. Acesse: https://portal.azure.com/
2. Crie um "Storage Account" (conta de armazenamento)
3. Vá em "Access Keys" (Chaves de acesso)
4. Copie a "Connection string" OU use "Account name" e "Key" separadamente
5. Crie um "Container" (container) dentro do Storage Account
6. Configure as permissões do container (Blob, Container ou Private)

**Nota:** Você pode usar apenas a `AZURE_STORAGE_CONNECTION_STRING` OU usar `AZURE_STORAGE_ACCOUNT_NAME` + `AZURE_STORAGE_ACCOUNT_KEY` + `AZURE_STORAGE_CONTAINER_NAME` separadamente.

### Email (SMTP) - Não será usado:
O projeto não utiliza envio de emails. O EmailService existe mas apenas loga no console quando chamado sem configuração.

