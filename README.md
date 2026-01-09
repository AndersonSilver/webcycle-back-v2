# WebCycle Backend - Backend da Plataforma de Cursos

Backend completo para a plataforma de cursos online desenvolvido com Node.js, Express, TypeScript, TypeORM e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** com **Express**
- **TypeScript**
- **PostgreSQL** com **TypeORM**
- **JWT** para autenticação
- **Passport.js** com **Google OAuth 2.0** para login social
- **Mercado Pago** para pagamentos
- **Class-validator** e **Class-transformer** para validação

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd WebCycle-BACK
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`
- Outras variáveis conforme necessário

4. Configure o banco de dados:
```bash
# Criar migration inicial
npm run migration:generate -- -n InitialMigration

# Executar migrations
npm run migration:run
```

5. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (database, env, jwt, passport)
├── entities/        # Entidades TypeORM
├── dto/            # Data Transfer Objects (validação)
├── controllers/    # Controllers
├── services/        # Serviços de negócio
├── middleware/     # Middlewares
├── decorators/     # Decorators customizados
├── utils/          # Utilitários
└── app.ts          # Aplicação principal
```

## 🔐 Autenticação

### Google OAuth 2.0

1. Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Criar OAuth 2.0 Credentials
4. Configurar Redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (dev)
   - `https://seu-dominio.com/api/auth/google/callback` (prod)
5. Adicionar variáveis de ambiente no `.env`

## 🔌 Endpoints Principais

### Autenticação (`/api/auth`)
- `POST /api/auth/register` - Registro email/senha
- `POST /api/auth/login` - Login email/senha
- `GET /api/auth/google` - Iniciar OAuth Google
- `GET /api/auth/google/callback` - Callback OAuth Google
- `GET /api/auth/me` - Obter usuário autenticado

### Cursos (`/api/courses`)
- `GET /api/courses` - Listar cursos
- `GET /api/courses/:id` - Detalhes do curso
- `POST /api/courses` - Criar curso (Admin)
- `PUT /api/courses/:id` - Atualizar curso (Admin)
- `DELETE /api/courses/:id` - Deletar curso (Admin)

### Compras (`/api/purchases`)
- `POST /api/purchases/checkout` - Iniciar checkout
- `POST /api/purchases/:id/confirm` - Confirmar pagamento
- `GET /api/purchases/my-purchases` - Minhas compras

### Progresso (`/api/progress`)
- `GET /api/progress/course/:courseId` - Progresso no curso
- `POST /api/progress/lesson/:lessonId/complete` - Marcar aula concluída

### Admin (`/api/admin`)
- `GET /api/admin/dashboard` - Dashboard com estatísticas
- `GET /api/admin/students` - Listar alunos
- `GET /api/admin/purchases` - Listar compras

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor em produção
- `npm run migration:generate` - Gera nova migration
- `npm run migration:run` - Executa migrations
- `npm run migration:revert` - Reverte última migration

## 🚢 Deploy

1. Configure as variáveis de ambiente no servidor
2. Execute as migrations: `npm run migration:run`
3. Compile o projeto: `npm run build`
4. Inicie o servidor: `npm start`

## 📄 Licença

ISC
