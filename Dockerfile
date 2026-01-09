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

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["node", "--max-old-space-size=4096", "dist/app.js"]

