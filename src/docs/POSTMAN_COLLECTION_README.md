# 📮 Postman Collection - TB-PSICO-BACK

Collection completa da API da Plataforma de Cursos Tiago Bonifacio.

## 📥 Como Importar

### No Postman:

1. Abra o Postman
2. Clique em **Import** (canto superior esquerdo)
3. Arraste os arquivos:
   - `TB-PSICO-BACK.postman_collection.json`
   - `TB-PSICO-BACK.postman_environment.json`
4. Ou clique em **Upload Files** e selecione os arquivos

### No Insomnia:

1. Abra o Insomnia
2. Clique em **Application** > **Preferences** > **Data** > **Import Data**
3. Selecione **From File** > **Postman v2.1**
4. Escolha o arquivo `TB-PSICO-BACK.postman_collection.json`

## 🔧 Configuração

### Variáveis de Ambiente

A collection inclui as seguintes variáveis:

- `base_url`: URL base da API (padrão: `http://localhost:3001`)
- `token`: Token JWT do usuário autenticado (preenchido automaticamente após login)
- `user_id`: ID do usuário (preenchido automaticamente após login)
- `admin_token`: Token JWT do admin (opcional)
- `course_id`: ID do curso (para testes)
- `module_id`: ID do módulo (para testes)
- `lesson_id`: ID da aula (para testes)
- `purchase_id`: ID da compra (para testes)

### Configurar Environment

1. No Postman, selecione o environment **TB-PSICO-BACK - Development**
2. Ajuste a variável `base_url` se necessário
3. Após fazer login, o `token` será preenchido automaticamente

## 🚀 Como Usar

### 1. Autenticação

1. Execute **Login** ou **Registro** em `🔐 Autenticação`
2. O token será salvo automaticamente na variável `token`
3. Todas as requisições autenticadas usarão esse token

### 2. Testar Endpoints

1. Navegue pelas pastas organizadas por funcionalidade
2. Execute os endpoints na ordem lógica:
   - Primeiro: Autenticação
   - Depois: Criar/Listar cursos
   - Em seguida: Compras, Progresso, etc.

### 3. Endpoints Admin

Para testar endpoints admin:
1. Faça login com um usuário admin
2. Ou configure manualmente a variável `admin_token`

## 📋 Estrutura da Collection

### 🔐 Autenticação (9 endpoints)
- Registro, Login, Google OAuth
- Perfil, Senha, Logout

### 📚 Cursos (12 endpoints)
- Listar, Buscar, Detalhes
- Criar, Atualizar, Deletar (Admin)
- Módulos do curso

### 📦 Módulos (5 endpoints)
- Listar aulas, Criar/Atualizar/Deletar aula
- Reordenar aulas

### 🎓 Aulas (2 endpoints)
- Detalhes da aula, Materiais

### 🛒 Carrinho (7 endpoints)
- Obter carrinho, Adicionar/Remover
- Aplicar/Remover cupom

### 💳 Compras (5 endpoints)
- Checkout, Confirmar pagamento
- Minhas compras, Estatísticas

### 📊 Progresso (7 endpoints)
- Progresso no curso, Completar aula
- Estatísticas, Histórico

### ⭐ Avaliações (9 endpoints)
- Criar avaliação, Marcar como útil
- Admin: Aprovar, Deletar, Estatísticas

### 🎟️ Cupons (8 endpoints)
- Validar cupom
- Admin: CRUD completo

### 🏆 Certificados (5 endpoints)
- Meus certificados, Gerar, Download PDF
- Verificar certificado (público)

### ❤️ Favoritos (4 endpoints)
- Listar, Adicionar/Remover
- Verificar se é favorito

### 🔔 Notificações (4 endpoints)
- Listar, Marcar como lida
- Deletar notificação

### 💰 Reembolsos (5 endpoints)
- Solicitar reembolso
- Admin: Aprovar/Rejeitar

### 🎯 Recomendações (2 endpoints)
- Recomendações personalizadas
- Cursos em alta (público)

### 👨‍💼 Admin (18 endpoints)
- Dashboard, Gráficos, Analytics
- Exportação (CSV/XLSX)
- Uploads (Vídeo, Imagem, Material)
- Gerenciar alunos e compras

### 🔗 Webhooks (1 endpoint)
- Mercado Pago webhook

### 🏥 Health Check (1 endpoint)
- Verificar saúde da API

## 🔑 Autenticação Automática

A collection inclui um script de teste no endpoint **Login** que:
- Salva automaticamente o `token` na variável de ambiente
- Salva o `user_id` na variável de ambiente

Isso permite que você faça login uma vez e todas as requisições subsequentes usem o token automaticamente.

## 📝 Notas

- **Variáveis dinâmicas**: Alguns endpoints usam variáveis como `:id`, `:courseId`, etc. Substitua pelos valores reais antes de executar.
- **Uploads**: Os endpoints de upload usam `form-data`. No Postman, selecione **form-data** e adicione o arquivo.
- **Admin**: Alguns endpoints requerem permissão de admin. Certifique-se de estar logado como admin.

## 🐛 Troubleshooting

### Token não está sendo salvo
- Verifique se o script de teste no endpoint **Login** está ativo
- Verifique se o environment está selecionado

### Erro 401 Unauthorized
- Verifique se o token está válido
- Faça login novamente

### Erro 403 Forbidden
- Verifique se o usuário tem permissão de admin
- Use um token de admin válido

## 📚 Documentação Adicional

Para mais informações sobre a API, consulte:
- `ENV_VARIABLES.md` - Variáveis de ambiente
- `README.md` - Documentação geral do projeto

