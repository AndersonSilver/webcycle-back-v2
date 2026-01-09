# Dockerfile para Backend
FROM node:20-alpine AS builder

# Instalar dependências do sistema necessárias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Definir variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Copiar yarn.lock apenas se existir (opcional)
COPY yarn.lock* ./

# Instalar dependências (sem --frozen-lockfile se yarn.lock não existir)
# Com retry e timeout aumentado para problemas de rede
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile --network-timeout 100000 --network-concurrency 1 || \
      yarn install --frozen-lockfile --network-timeout 100000 --network-concurrency 1; \
    else \
      yarn install --network-timeout 100000 --network-concurrency 1 || \
      yarn install --network-timeout 100000 --network-concurrency 1; \
    fi

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN yarn build

# Estágio de produção
FROM node:20-alpine AS production

# Instalar dependências do sistema necessárias para Puppeteer e wget para healthcheck
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    && rm -rf /var/cache/apk/*

# Definir variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Copiar yarn.lock apenas se existir (opcional)
COPY yarn.lock* ./

# Instalar apenas dependências de produção
# Com retry e timeout aumentado para problemas de rede
RUN if [ -f yarn.lock ]; then \
      yarn install --production --frozen-lockfile --network-timeout 100000 --network-concurrency 1 || \
      yarn install --production --frozen-lockfile --network-timeout 100000 --network-concurrency 1; \
    else \
      yarn install --production --network-timeout 100000 --network-concurrency 1 || \
      yarn install --production --network-timeout 100000 --network-concurrency 1; \
    fi

# Copiar código compilado do estágio builder
COPY --from=builder /app/dist ./dist

# Criar diretório para uploads temporários
RUN mkdir -p temp-uploads && chmod 777 temp-uploads

# Todas as variáveis de ambiente DEVEM ser passadas via docker-compose.yml
# Nenhum valor padrão hardcoded aqui por segurança
# Variáveis necessárias:
# - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_SYNCHRONIZE, DB_LOGGING
# - JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
# - MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_WEBHOOK_SECRET, MERCADOPAGO_WEBHOOK_URL
# - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
# - AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, AZURE_STORAGE_CONTAINER_NAME
# - PORT, NODE_ENV, FRONTEND_URL, CORS_ORIGIN, SESSION_SECRET

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "--max-old-space-size=4096", "dist/app.js"]

