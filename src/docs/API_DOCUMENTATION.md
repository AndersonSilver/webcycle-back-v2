# 📚 Documentação da API - Plataforma de Cursos Tiago Bonifacio

## 📋 Índice

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Base URL](#base-url)
4. [Códigos de Status HTTP](#códigos-de-status-http)
5. [Validações](#validações)
   - [Validação Dupla: Frontend + Backend](#-validação-dupla-frontend--backend)
   - [Validações por Endpoint](#-validações-por-endpoint)
   - [Funções Auxiliares Recomendadas](#-funções-auxiliares-recomendadas)
   - [Resumo das Regras de Validação](#-resumo-das-regras-de-validação)
   - [Tratamento de Erros no Frontend](#-tratamento-de-erros-no-frontend)
   - [Checklist de Validação](#-checklist-de-validação)
6. [Endpoints](#endpoints)
   - [Autenticação](#1-autenticação)
   - [Cursos](#2-cursos)
   - [Módulos e Aulas](#3-módulos-e-aulas)
   - [Carrinho](#4-carrinho)
   - [Compras](#5-compras)
   - [Progresso](#6-progresso)
   - [Avaliações](#7-avaliações)
   - [Favoritos](#8-favoritos)
   - [Certificados](#9-certificados)
   - [Cupons](#10-cupons)
   - [Reembolsos](#11-reembolsos)
   - [Notificações](#12-notificações)
   - [Recomendações](#13-recomendações)
   - [Admin](#14-admin)
7. [Estruturas de Dados](#estruturas-de-dados)
8. [Exemplos Práticos](#exemplos-práticos)

---

## Introdução

Esta é a documentação completa da API REST da Plataforma de Cursos Tiago Bonifacio. A API utiliza autenticação baseada em JWT (JSON Web Tokens) e retorna dados no formato JSON.

**Importante:** Todas as rotas (exceto login, register e webhook) requerem autenticação via token JWT.

---

## Autenticação

### Como Funciona

1. **Fazer Login ou Registro** para obter um token JWT
2. **Incluir o token** em todas as requisições subsequentes no header `Authorization`
3. **Formato do header:** `Authorization: Bearer <seu_token_aqui>`

### Exemplo de Uso

```javascript
// Após fazer login, você receberá um token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Use o token em todas as requisições
fetch('https://api.exemplo.com/api/courses', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Base URL

```
Produção: https://api.tb-psico.com
Desenvolvimento: http://localhost:3000
```

**Todas as rotas começam com:** `/api/`

---

## Códigos de Status HTTP

| Código | Significado | Quando Usar |
|--------|-------------|--------------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos na requisição |
| 401 | Unauthorized | Token ausente ou inválido |
| 403 | Forbidden | Sem permissão (não é admin) |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Endpoints

### 1. Autenticação

#### 1.1 Registrar Usuário

**POST** `/api/auth/register`

Cria uma nova conta de usuário.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Onde usar:** Tela de cadastro, formulário de registro

---

#### 1.2 Login

**POST** `/api/auth/login`

Autentica um usuário e retorna o token JWT.

**Body:**
```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "role": "student",
    "avatar": "https://..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Onde usar:** Tela de login, após logout

---

#### 1.3 Login com Google

**GET** `/api/auth/google`

Inicia o fluxo de autenticação OAuth do Google.

**Resposta:** Redireciona para o Google OAuth

**Onde usar:** Botão "Entrar com Google"

---

#### 1.4 Obter Usuário Atual

**GET** `/api/auth/me`

Retorna os dados do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "role": "student",
    "avatar": "https://...",
    "emailVerified": true
  }
}
```

**Onde usar:** Verificar se usuário está logado, carregar dados do perfil

---

#### 1.5 Atualizar Perfil

**PUT** `/api/auth/profile`

Atualiza os dados do perfil do usuário.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "João Silva Santos",
  "avatar": "https://exemplo.com/avatar.jpg"
}
```

**Resposta (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva Santos",
    "email": "joao@exemplo.com",
    "avatar": "https://exemplo.com/avatar.jpg"
  }
}
```

**Onde usar:** Página de edição de perfil

---

#### 1.6 Alterar Senha

**PUT** `/api/auth/change-password`

Altera a senha do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

**Resposta (200):**
```json
{
  "message": "Senha alterada com sucesso"
}
```

**Onde usar:** Página de configurações, alteração de senha

---

#### 1.7 Recuperar Senha

**POST** `/api/auth/forgot-password`

Envia email com link para recuperação de senha.

**Body:**
```json
{
  "email": "joao@exemplo.com"
}
```

**Resposta (200):**
```json
{
  "message": "Email de recuperação enviado"
}
```

**Onde usar:** Tela "Esqueci minha senha"

---

#### 1.8 Redefinir Senha

**POST** `/api/auth/reset-password`

Redefine a senha usando o token recebido por email.

**Body:**
```json
{
  "token": "token_recebido_por_email",
  "newPassword": "novaSenha456"
}
```

**Resposta (200):**
```json
{
  "message": "Senha redefinida com sucesso"
}
```

**Onde usar:** Página de redefinição de senha (após clicar no link do email)

---

### 2. Cursos

#### 2.1 Listar Cursos

**GET** `/api/courses`

Lista todos os cursos disponíveis.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `category` (opcional): Filtrar por categoria
- `search` (opcional): Buscar por título/descrição

**Exemplo:** `/api/courses?page=1&limit=12&category=psicologia`

**Resposta (200):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Introdução à Psicologia",
      "subtitle": "Aprenda os fundamentos",
      "description": "...",
      "price": 199.90,
      "originalPrice": 299.90,
      "category": "psicologia",
      "image": "https://...",
      "videoUrl": "https://...",
      "instructor": "Tiago Bonifacio",
      "duration": "10 horas",
      "level": "iniciante",
      "rating": 4.8,
      "totalRatings": 150,
      "totalStudents": 500,
      "published": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 12
}
```

**Onde usar:** Página inicial, catálogo de cursos, busca

---

#### 2.2 Buscar Cursos

**GET** `/api/courses/search`

Busca cursos por termo.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (obrigatório): Termo de busca
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Exemplo:** `/api/courses/search?q=ansiedade&page=1`

**Resposta (200):**
```json
{
  "courses": [...],
  "total": 5,
  "query": "ansiedade"
}
```

**Onde usar:** Barra de busca, resultados de pesquisa

---

#### 2.3 Detalhes do Curso

**GET** `/api/courses/:id`

Retorna os detalhes completos de um curso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "course": {
    "id": "uuid",
    "title": "Introdução à Psicologia",
    "subtitle": "Aprenda os fundamentos",
    "description": "Descrição completa...",
    "price": 199.90,
    "originalPrice": 299.90,
    "category": "psicologia",
    "image": "https://...",
    "videoUrl": "https://...",
    "instructor": "Tiago Bonifacio",
    "duration": "10 horas",
    "level": "iniciante",
    "rating": 4.8,
    "totalRatings": 150,
    "totalStudents": 500,
    "modules": [
      {
        "id": "uuid",
        "title": "Módulo 1: Fundamentos",
        "order": 1,
        "lessons": [
          {
            "id": "uuid",
            "title": "Aula 1: Introdução",
            "order": 1,
            "duration": 30,
            "free": false
          }
        ]
      }
    ],
    "reviews": [...]
  }
}
```

**Onde usar:** Página de detalhes do curso

---

#### 2.4 Cursos Relacionados

**GET** `/api/courses/:id/related`

Retorna cursos relacionados ao curso especificado.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "courses": [...]
}
```

**Onde usar:** Seção "Cursos Relacionados" na página de detalhes

---

#### 2.5 Compartilhar Curso

**POST** `/api/courses/:id/share`

Gera um token de compartilhamento para o curso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "shareToken": {
    "id": "uuid",
    "token": "abc123def456",
    "expiresAt": "2024-02-15T10:00:00Z"
  },
  "shareUrl": "https://frontend.com/courses/shared/abc123def456"
}
```

**Onde usar:** Botão de compartilhar curso

---

#### 2.6 Visualizar Curso Compartilhado

**GET** `/api/courses/shared/:token`

Visualiza um curso através de link de compartilhamento.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "course": {...}
}
```

**Onde usar:** Página de visualização de link compartilhado

---

#### 2.7 Criar Curso (Admin)

**POST** `/api/courses`

Cria um novo curso (apenas admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Body:**
```json
{
  "title": "Novo Curso",
  "subtitle": "Subtítulo",
  "description": "Descrição completa...",
  "price": 199.90,
  "originalPrice": 299.90,
  "category": "psicologia",
  "image": "https://...",
  "videoUrl": "https://...",
  "instructor": "Tiago Bonifacio",
  "duration": "10 horas",
  "lessons": 20,
  "aboutCourse": "Sobre o curso...",
  "benefits": [
    {
      "icon": "Heart",
      "title": "Acesso Vitalício",
      "description": "Tenha acesso ao conteúdo para sempre"
    },
    {
      "icon": "BookOpen",
      "title": "Material Completo",
      "description": "Receba todos os materiais de apoio"
    },
    {
      "icon": "Certificate",
      "title": "Certificado de Conclusão",
      "description": "Receba seu certificado ao finalizar"
    }
  ],
  "bonuses": [
    {
      "icon": "Gift",
      "title": "E-book Exclusivo",
      "description": "E-book com conteúdo complementar"
    },
    {
      "icon": "Users",
      "title": "Grupo VIP no Telegram",
      "description": "Acesso a grupo exclusivo de alunos"
    }
  ]
}
```

**Campos importantes:**
- `benefits`: Array de objetos com os benefícios do curso (opcional)
- `bonuses`: Array de objetos com os bônus do curso (opcional)
- Cada objeto deve conter:
  - `icon`: String com o nome do ícone (ex: "Heart", "BookOpen", "Certificate")
  - `title`: String com o título do benefício/bônus (obrigatório)
  - `description`: String com a descrição (opcional)

**Resposta (201):**
```json
{
  "course": {...}
}
```

**Onde usar:** Painel admin - criar curso

---

#### 2.8 Atualizar Curso (Admin)

**PUT** `/api/courses/:id`

Atualiza um curso existente (apenas admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Body:** (mesmos campos do criar, todos opcionais)

**Resposta (200):**
```json
{
  "course": {...}
}
```

**Onde usar:** Painel admin - editar curso

---

#### 2.9 Deletar Curso (Admin)

**DELETE** `/api/courses/:id`

Deleta um curso (apenas admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Resposta (200):**
```json
{
  "message": "Curso deletado com sucesso"
}
```

**Onde usar:** Painel admin - deletar curso

---

### 3. Módulos e Aulas

#### 3.1 Listar Módulos do Curso

**GET** `/api/courses/:courseId/modules`

Lista todos os módulos de um curso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "modules": [
    {
      "id": "uuid",
      "title": "Módulo 1: Fundamentos",
      "description": "...",
      "order": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "Aula 1",
          "duration": 30,
          "order": 1
        }
      ]
    }
  ]
}
```

**Onde usar:** Página de detalhes do curso, player de vídeo

---

#### 3.2 Criar Módulo (Admin)

**POST** `/api/courses/:courseId/modules`

Cria um novo módulo em um curso (apenas admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Body:**
```json
{
  "title": "Novo Módulo",
  "description": "Descrição do módulo",
  "order": 1
}
```

**Resposta (201):**
```json
{
  "module": {...}
}
```

**Onde usar:** Painel admin - criar módulo

---

#### 3.3 Listar Aulas do Módulo

**GET** `/api/modules/:moduleId/lessons`

Lista todas as aulas de um módulo.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "lessons": [
    {
      "id": "uuid",
      "title": "Aula 1: Introdução",
      "description": "...",
      "videoUrl": "https://...",
      "duration": 30,
      "order": 1,
      "free": false
    }
  ]
}
```

**Onde usar:** Lista de aulas no player

---

#### 3.4 Criar Aula (Admin)

**POST** `/api/modules/:moduleId/lessons`

Cria uma nova aula em um módulo (apenas admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Body:**
```json
{
  "title": "Nova Aula",
  "description": "Descrição da aula",
  "videoUrl": "https://...",
  "duration": 30,
  "order": 1,
  "free": false
}
```

**Resposta (201):**
```json
{
  "lesson": {...}
}
```

**Onde usar:** Painel admin - criar aula

---

#### 3.5 Detalhes da Aula

**GET** `/api/lessons/:lessonId`

Retorna os detalhes de uma aula.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "lesson": {
    "id": "uuid",
    "title": "Aula 1: Introdução",
    "description": "...",
    "videoUrl": "https://...",
    "duration": 30,
    "order": 1,
    "free": false,
    "module": {
      "id": "uuid",
      "title": "Módulo 1",
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia"
      }
    }
  },
  "hasAccess": true,
  "progress": {
    "completed": false,
    "watchedDuration": 0
  }
}
```

**Onde usar:** Player de vídeo, página da aula

---

#### 3.6 Materiais da Aula

**GET** `/api/lessons/:lessonId/materials`

Lista os materiais complementares de uma aula.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "materials": [
    {
      "id": "uuid",
      "title": "PDF - Material Complementar",
      "type": "pdf",
      "url": "https://...",
      "size": 1024000
    }
  ]
}
```

**Onde usar:** Seção de materiais no player

---

### 4. Carrinho

#### 4.1 Ver Carrinho

**GET** `/api/cart`

Retorna todos os itens do carrinho do usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia",
        "price": 199.90,
        "image": "https://..."
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 199.90,
  "count": 1
}
```

**Onde usar:** Página do carrinho

---

#### 4.2 Adicionar ao Carrinho

**POST** `/api/cart/add`

Adiciona um curso ao carrinho.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "courseId": "uuid"
}
```

**Resposta (201):**
```json
{
  "cartItem": {
    "id": "uuid",
    "courseId": "uuid",
    "userId": "uuid"
  }
}
```

**Onde usar:** Botão "Adicionar ao Carrinho" na página do curso

---

#### 4.3 Remover do Carrinho

**DELETE** `/api/cart/remove/:courseId`

Remove um curso do carrinho.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Item removido do carrinho"
}
```

**Onde usar:** Botão de remover item do carrinho

---

#### 4.4 Limpar Carrinho

**DELETE** `/api/cart/clear`

Remove todos os itens do carrinho.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Carrinho limpo com sucesso"
}
```

**Onde usar:** Botão "Limpar Carrinho"

---

#### 4.5 Total do Carrinho

**GET** `/api/cart/total`

Retorna o total do carrinho com descontos aplicados.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "subtotal": 199.90,
  "discount": 0,
  "total": 199.90,
  "count": 1
}
```

**Onde usar:** Resumo do carrinho, checkout

---

#### 4.6 Aplicar Cupom

**POST** `/api/cart/apply-coupon`

Aplica um cupom de desconto ao carrinho.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "code": "DESCONTO10"
}
```

**Resposta (200):**
```json
{
  "coupon": {
    "id": "uuid",
    "code": "DESCONTO10",
    "discount": 10,
    "type": "percentage"
  },
  "message": "Cupom aplicado com sucesso"
}
```

**Onde usar:** Campo de cupom no carrinho/checkout

---

### 5. Compras

#### 5.1 Checkout

**POST** `/api/purchases/checkout`

Inicia o processo de checkout e cria o pagamento.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "courses": ["uuid-curso-1", "uuid-curso-2"],
  "paymentMethod": "pix"
}
```

**paymentMethod:** `"pix"`, `"boleto"`, ou `"credit_card"`

**Resposta (200):**
```json
{
  "purchaseId": "uuid",
  "totalAmount": 399.80,
  "discountAmount": 0,
  "finalAmount": 399.80,
  "payment": {
    "method": "pix",
    "pixCode": "00020126360014BR...",
    "boletoUrl": null,
    "paymentLink": null
  }
}
```

**Onde usar:** Tela de checkout, após clicar em "Finalizar Compra"

---

#### 5.2 Processar Pagamento com Cartão (Checkout Transparente)

**POST** `/api/purchases/:id/process`

Processa pagamento com cartão de crédito diretamente no site, sem redirecionamento.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "cardNumber": "5031 4332 1540 6351",
  "cardholderName": "APRO",
  "expirationMonth": "11",
  "expirationYear": "25",
  "securityCode": "123",
  "installments": "1",
  "identificationType": "CPF",
  "identificationNumber": "12345678900"
}
```

**Resposta (200):**
```json
{
  "purchase": {
    "id": "uuid",
    "paymentStatus": "paid",
    "paymentId": "1234567890",
    "courses": [...]
  },
  "payment": {
    "id": "1234567890",
    "status": "approved",
    "statusDetail": "accredited",
    "threeDSInfo": null
  }
}
```

**Status possíveis:**
- `approved`: Pagamento aprovado ✅
- `pending`: Pagamento pendente (pode precisar de 3D Secure) ⏳
- `rejected`: Pagamento rejeitado ❌
- `cancelled`: Pagamento cancelado ❌

**Onde usar:** Após criar checkout, quando usuário preencher dados do cartão e clicar em "Pagar"

**📖 Documentação completa:** Veja `API_PROCESS_PAYMENT.md`

---

#### 5.3 Confirmar Compra

**POST** `/api/purchases/:id/confirm`

Confirma uma compra após pagamento.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "paymentId": "123456789"
}
```

**Resposta (200):**
```json
{
  "purchase": {
    "id": "uuid",
    "userId": "uuid",
    "totalAmount": 399.80,
    "finalAmount": 399.80,
    "paymentStatus": "paid",
    "paymentMethod": "pix",
    "courses": [...]
  }
}
```

**Onde usar:** Após pagamento confirmado, webhook de pagamento

---

#### 5.3 Minhas Compras

**GET** `/api/purchases/my-purchases`

Lista todas as compras do usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "purchases": [
    {
      "id": "uuid",
      "totalAmount": 199.90,
      "finalAmount": 199.90,
      "paymentStatus": "paid",
      "paymentMethod": "pix",
      "createdAt": "2024-01-15T10:00:00Z",
      "courses": [
        {
          "course": {
            "id": "uuid",
            "title": "Curso de Psicologia",
            "image": "https://..."
          }
        }
      ]
    }
  ]
}
```

**Onde usar:** Página "Minhas Compras", histórico

---

#### 5.4 Estatísticas de Compras

**GET** `/api/purchases/my-purchases/stats`

Retorna estatísticas das compras do usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "totalPurchases": 5,
  "totalSpent": 999.50,
  "totalCourses": 8,
  "paidPurchases": 5,
  "pendingPurchases": 0,
  "averageTicket": 199.90
}
```

**Onde usar:** Dashboard do usuário, estatísticas pessoais

---

#### 5.5 Detalhes da Compra

**GET** `/api/purchases/:id`

Retorna os detalhes de uma compra específica.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "purchase": {
    "id": "uuid",
    "totalAmount": 199.90,
    "finalAmount": 199.90,
    "paymentStatus": "paid",
    "paymentMethod": "pix",
    "courses": [...],
    "coupon": null,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Detalhes da compra, recibo

---

### 6. Progresso

#### 6.1 Progresso do Curso

**GET** `/api/progress/course/:courseId`

Retorna o progresso do usuário em um curso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "courseId": "uuid",
  "progress": 65.5,
  "completedLessons": ["uuid-1", "uuid-2"],
  "lessons": [
    {
      "lessonId": "uuid-1",
      "completed": true,
      "watchedDuration": 1800
    },
    {
      "lessonId": "uuid-2",
      "completed": false,
      "watchedDuration": 0
    }
  ]
}
```

**Onde usar:** Barra de progresso, página do curso

---

#### 6.2 Meus Cursos

**GET** `/api/progress/my-courses`

Lista todos os cursos do usuário com progresso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "courses": [
    {
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia",
        "image": "https://..."
      },
      "progress": 65.5,
      "completedLessons": 13,
      "totalLessons": 20
    }
  ]
}
```

**Onde usar:** Página "Meus Cursos", dashboard

---

#### 6.3 Completar Aula

**POST** `/api/progress/lesson/:lessonId/complete`

Marca uma aula como concluída.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "watchedDuration": 1800
}
```

**Resposta (200):**
```json
{
  "progress": {
    "id": "uuid",
    "userId": "uuid",
    "courseId": "uuid",
    "lessonId": "uuid",
    "completed": true,
    "watchedDuration": 1800,
    "completedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Após assistir aula completa, botão "Marcar como concluída"

---

#### 6.4 Atualizar Tempo Assistido

**PUT** `/api/progress/lesson/:lessonId/watch`

Atualiza o tempo assistido de uma aula.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "watchedDuration": 900
}
```

**Resposta (200):**
```json
{
  "progress": {
    "id": "uuid",
    "watchedDuration": 900,
    "lastAccessed": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Durante reprodução do vídeo (a cada X segundos)

---

#### 6.5 Progresso da Aula

**GET** `/api/progress/lesson/:lessonId`

Retorna o progresso de uma aula específica.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "lessonId": "uuid",
  "progress": {
    "completed": false,
    "watchedDuration": 900
  }
}
```

**Onde usar:** Player de vídeo, verificar se aula foi assistida

---

#### 6.6 Estatísticas de Progresso

**GET** `/api/progress/stats`

Retorna estatísticas gerais de progresso do usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "totalLessons": 50,
  "completedLessons": 32,
  "totalWatchTime": 54000,
  "completionRate": 64.0
}
```

**Onde usar:** Dashboard, estatísticas pessoais

---

#### 6.7 Histórico de Progresso

**GET** `/api/progress/history`

Retorna o histórico de aulas assistidas.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta (200):**
```json
{
  "history": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "lessonId": "uuid",
      "completed": true,
      "lastAccessed": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Onde usar:** Histórico de visualizações

---

### 7. Avaliações

#### 7.1 Avaliações do Curso

**GET** `/api/reviews/course/:courseId`

Lista todas as avaliações aprovadas de um curso.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "name": "João Silva",
        "avatar": "https://..."
      },
      "rating": 5,
      "comment": "Excelente curso!",
      "images": [],
      "helpful": 10,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "averageRating": 4.8,
  "totalReviews": 150
}
```

**Onde usar:** Seção de avaliações na página do curso

---

#### 7.2 Criar Avaliação

**POST** `/api/reviews`

Cria uma nova avaliação para um curso.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "courseId": "uuid",
  "rating": 5,
  "comment": "Excelente curso!"
}
```

**Resposta (201):**
```json
{
  "review": {
    "id": "uuid",
    "courseId": "uuid",
    "userId": "uuid",
    "rating": 5,
    "comment": "Excelente curso!",
    "approved": false
  }
}
```

**Onde usar:** Formulário de avaliação após completar curso

---

#### 7.3 Marcar como Útil

**POST** `/api/reviews/:id/helpful`

Marca uma avaliação como útil.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Marcado como útil",
  "review": {
    "id": "uuid",
    "helpful": 11
  }
}
```

**Onde usar:** Botão "Avaliação útil" nas avaliações

---

#### 7.4 Adicionar Imagens à Avaliação

**POST** `/api/reviews/:id/images`

Adiciona imagens a uma avaliação existente.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "images": [
    "https://exemplo.com/imagem1.jpg",
    "https://exemplo.com/imagem2.jpg"
  ]
}
```

**Resposta (200):**
```json
{
  "message": "Imagens adicionadas com sucesso",
  "review": {
    "id": "uuid",
    "images": ["https://...", "https://..."]
  }
}
```

**Onde usar:** Upload de imagens na avaliação

---

### 8. Favoritos

#### 8.1 Meus Favoritos

**GET** `/api/favorites`

Lista todos os cursos favoritados pelo usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "favorites": [
    {
      "id": "uuid",
      "courseId": "uuid",
      "course": {
        "id": "uuid",
        "title": "Curso de Psicologia",
        "image": "https://...",
        "price": 199.90
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Onde usar:** Página "Meus Favoritos"

---

#### 8.2 Adicionar aos Favoritos

**POST** `/api/favorites/:courseId`

Adiciona um curso aos favoritos.

**Headers:** `Authorization: Bearer <token>`

**Resposta (201):**
```json
{
  "favorite": {
    "id": "uuid",
    "courseId": "uuid",
    "userId": "uuid"
  }
}
```

**Onde usar:** Botão de favoritar (coração) na página do curso

---

#### 8.3 Remover dos Favoritos

**DELETE** `/api/favorites/:courseId`

Remove um curso dos favoritos.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Favorito removido com sucesso"
}
```

**Onde usar:** Botão de desfavoritar

---

#### 8.4 Verificar se é Favorito

**GET** `/api/favorites/check/:courseId`

Verifica se um curso está nos favoritos.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "isFavorite": true,
  "favoriteId": "uuid"
}
```

**Onde usar:** Verificar estado do botão de favorito

---

### 9. Certificados

#### 9.1 Meus Certificados

**GET** `/api/certificates`

Lista todos os certificados do usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "certificates": [
    {
      "id": "uuid",
      "userId": "uuid",
      "courseId": "uuid",
      "course": {
        "title": "Curso de Psicologia"
      },
      "verificationCode": "ABC123DEF456",
      "issuedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Onde usar:** Página "Meus Certificados"

---

#### 9.2 Detalhes do Certificado

**GET** `/api/certificates/:id`

Retorna os detalhes de um certificado específico.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "certificate": {
    "id": "uuid",
    "userId": "uuid",
    "courseId": "uuid",
    "course": {
      "title": "Curso de Psicologia"
    },
    "verificationCode": "ABC123DEF456",
    "issuedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Página de detalhes do certificado

---

#### 9.3 Baixar Certificado

**GET** `/api/certificates/:id/download`

Baixa o certificado em PDF.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):** Arquivo PDF

**Onde usar:** Botão "Baixar Certificado"

---

#### 9.4 Gerar Certificado

**POST** `/api/certificates/generate/:courseId`

Gera um certificado para um curso concluído.

**Headers:** `Authorization: Bearer <token>`

**Resposta (201):**
```json
{
  "certificate": {
    "id": "uuid",
    "verificationCode": "ABC123DEF456",
    "issuedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Após completar 100% do curso, botão "Gerar Certificado"

---

#### 9.5 Verificar Certificado

**GET** `/api/certificates/verify/:code`

Verifica a autenticidade de um certificado pelo código.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "valid": true,
  "certificate": {
    "id": "uuid",
    "course": {
      "title": "Curso de Psicologia"
    },
    "user": {
      "name": "João Silva"
    },
    "issuedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Página de verificação de certificado (pode ser pública)

---

### 10. Cupons

#### 10.1 Validar Cupom

**GET** `/api/coupons/validate/:code`

Valida um cupom de desconto.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `totalAmount` (opcional): Valor total para calcular desconto

**Exemplo:** `/api/coupons/validate/DESCONTO10?totalAmount=199.90`

**Resposta (200):**
```json
{
  "valid": true,
  "coupon": {
    "id": "uuid",
    "code": "DESCONTO10",
    "discount": 10,
    "type": "percentage"
  },
  "discountAmount": 19.99,
  "finalAmount": 179.91
}
```

**Onde usar:** Validação de cupom no carrinho/checkout

---

### 11. Reembolsos

#### 11.1 Solicitar Reembolso

**POST** `/api/refunds/request`

Solicita reembolso de uma compra (dentro de 7 dias).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "purchaseId": "uuid",
  "reason": "Não atendeu minhas expectativas"
}
```

**Resposta (201):**
```json
{
  "refund": {
    "id": "uuid",
    "purchaseId": "uuid",
    "userId": "uuid",
    "reason": "Não atendeu minhas expectativas",
    "status": "pending",
    "requestedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Onde usar:** Botão "Solicitar Reembolso" na página da compra

---

#### 11.2 Meus Reembolsos

**GET** `/api/refunds/my-refunds`

Lista todos os reembolsos solicitados pelo usuário.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "refunds": [
    {
      "id": "uuid",
      "purchaseId": "uuid",
      "reason": "...",
      "status": "approved",
      "requestedAt": "2024-01-15T10:00:00Z",
      "processedAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

**Onde usar:** Página "Meus Reembolsos"

---

### 12. Notificações

#### 12.1 Minhas Notificações

**GET** `/api/notifications`

Lista todas as notificações do usuário.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `unreadOnly` (opcional): `true` para apenas não lidas
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Exemplo:** `/api/notifications?unreadOnly=true&page=1&limit=10`

**Resposta (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Novo curso disponível",
      "message": "Um novo curso foi adicionado!",
      "type": "course",
      "read": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 20,
  "page": 1,
  "limit": 10
}
```

**Onde usar:** Centro de notificações, badge de notificações

---

#### 12.2 Marcar como Lida

**PUT** `/api/notifications/:id/read`

Marca uma notificação como lida.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "notification": {
    "id": "uuid",
    "read": true
  }
}
```

**Onde usar:** Ao clicar em uma notificação

---

#### 12.3 Marcar Todas como Lidas

**PUT** `/api/notifications/read-all`

Marca todas as notificações como lidas.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Todas as notificações foram marcadas como lidas"
}
```

**Onde usar:** Botão "Marcar todas como lidas"

---

#### 12.4 Deletar Notificação

**DELETE** `/api/notifications/:id`

Deleta uma notificação.

**Headers:** `Authorization: Bearer <token>`

**Resposta (200):**
```json
{
  "message": "Notificação deletada com sucesso"
}
```

**Onde usar:** Botão de deletar notificação

---

### 13. Recomendações

#### 13.1 Recomendações Personalizadas

**GET** `/api/recommendations`

Retorna recomendações personalizadas baseadas no histórico do usuário.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (opcional): Número de recomendações (padrão: 10)

**Resposta (200):**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "title": "Curso Recomendado",
      "image": "https://...",
      "price": 199.90,
      "rating": 4.8
    }
  ]
}
```

**Onde usar:** Seção "Recomendado para você" na homepage

---

#### 13.2 Cursos em Alta

**GET** `/api/recommendations/trending`

Retorna os cursos mais populares no momento.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (opcional): Número de cursos (padrão: 10)

**Resposta (200):**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Curso em Alta",
      "image": "https://...",
      "price": 199.90,
      "totalStudents": 1000
    }
  ]
}
```

**Onde usar:** Seção "Cursos em Alta" na homepage

---

### 14. Admin

**Todas as rotas admin requerem:** `Authorization: Bearer <token>` + usuário com role `admin`

#### 14.1 Dashboard

**GET** `/api/admin/dashboard`

Retorna dados do dashboard administrativo.

**Resposta (200):**
```json
{
  "totalRevenue": 50000.00,
  "totalSales": 250,
  "totalStudents": 500,
  "totalCourses": 20,
  "recentPurchases": [...],
  "topCourses": [...]
}
```

**Onde usar:** Dashboard principal do admin

---

#### 14.2 Gráfico de Vendas

**GET** `/api/admin/dashboard/sales-chart`

Retorna dados para gráfico de vendas.

**Query Parameters:**
- `period` (opcional): `"7d"`, `"30d"`, `"90d"`, `"1y"`

**Resposta (200):**
```json
{
  "labels": ["Jan", "Fev", "Mar"],
  "data": [10, 25, 30]
}
```

**Onde usar:** Gráfico de vendas no dashboard

---

#### 14.3 Listar Estudantes

**GET** `/api/admin/students`

Lista todos os estudantes cadastrados.

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `search` (opcional): Buscar por nome/email

**Resposta (200):**
```json
{
  "students": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "totalPurchases": 5,
      "totalSpent": 999.50
    }
  ],
  "total": 500,
  "page": 1
}
```

**Onde usar:** Página de gerenciamento de estudantes

---

#### 14.4 Listar Compras

**GET** `/api/admin/purchases`

Lista todas as compras do sistema.

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página
- `status` (opcional): Filtrar por status (`pending`, `paid`, `failed`)

**Resposta (200):**
```json
{
  "purchases": [...],
  "total": 250,
  "page": 1
}
```

**Onde usar:** Página de gerenciamento de compras

---

#### 14.5 Exportar Dados

**POST** `/api/admin/export/purchases`

Exporta compras para CSV/XLSX.

**Body:**
```json
{
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Resposta (200):** Arquivo CSV/XLSX

**Onde usar:** Botão de exportar relatórios

---

## Estruturas de Dados

### User (Usuário)
```typescript
{
  id: string;              // UUID
  name: string;
  email: string;
  password?: string;        // Nunca retornado na API
  role: "student" | "admin";
  googleId?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;        // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Course (Curso)
```typescript
{
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  videoUrl?: string;
  instructor: string;
  duration: string;
  level: "iniciante" | "intermediario" | "avancado";
  rating: number;
  totalRatings: number;
  totalStudents: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Purchase (Compra)
```typescript
{
  id: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "pix" | "boleto" | "credit_card";
  paymentId?: string;
  couponId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Progress (Progresso)
```typescript
{
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  watchedDuration: number;  // em segundos
  completedAt?: string;
  lastAccessed: string;
}
```

---

## Exemplos Práticos

### Exemplo 1: Fluxo Completo de Compra

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    password: 'senha123'
  })
});
const { token } = await loginResponse.json();

// 2. Adicionar ao carrinho
await fetch('http://localhost:3000/api/cart/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ courseId: 'uuid-curso' })
});

// 3. Aplicar cupom
await fetch('http://localhost:3000/api/cart/apply-coupon', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ code: 'DESCONTO10' })
});

// 4. Checkout
const checkoutResponse = await fetch('http://localhost:3000/api/purchases/checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courses: ['uuid-curso'],
    paymentMethod: 'pix'
  })
});
const { purchaseId, payment } = await checkoutResponse.json();

// 5. Após pagamento, confirmar compra
await fetch(`http://localhost:3000/api/purchases/${purchaseId}/confirm`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ paymentId: payment.id })
});
```

### Exemplo 2: Reproduzir Aula e Atualizar Progresso

```javascript
// 1. Obter detalhes da aula
const lessonResponse = await fetch(`http://localhost:3000/api/lessons/${lessonId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { lesson, hasAccess, progress } = await lessonResponse.json();

// 2. Verificar acesso
if (!hasAccess) {
  alert('Você precisa comprar este curso');
  return;
}

// 3. Reproduzir vídeo
// ... código do player de vídeo ...

// 4. Atualizar tempo assistido a cada 30 segundos
setInterval(async () => {
  await fetch(`http://localhost:3000/api/progress/lesson/${lessonId}/watch`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      watchedDuration: videoPlayer.currentTime
    })
  });
}, 30000);

// 5. Marcar como concluída quando terminar
await fetch(`http://localhost:3000/api/progress/lesson/${lessonId}/complete`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    watchedDuration: lesson.duration
  })
});
```

### Exemplo 3: Verificar Autenticação e Carregar Dados

```javascript
// Verificar se usuário está logado
async function checkAuth() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirecionar para login
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    const { user } = await response.json();
    // Usar dados do usuário
    console.log('Usuário logado:', user);
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
  }
}
```

---

## Validações

### ⚠️ Validação Dupla: Frontend + Backend

**IMPORTANTE:** É **OBRIGATÓRIO** implementar validação tanto no **frontend** quanto no **backend**. 

#### Por que validação dupla?

1. **Frontend (Client-side):**
   - ✅ Melhor experiência do usuário (feedback imediato)
   - ✅ Reduz requisições desnecessárias ao servidor
   - ✅ Validação em tempo real enquanto o usuário digita

2. **Backend (Server-side):**
   - ✅ **Segurança obrigatória** - nunca confie apenas no frontend
   - ✅ Previne ataques e manipulação de dados
   - ✅ Única fonte de verdade para validação

**Regra de Ouro:** O backend **SEMPRE** valida os dados. O frontend valida para melhorar a UX, mas nunca substitui a validação do backend.

---

### 📝 Validações por Endpoint

#### 1. Autenticação

##### POST `/api/auth/register`

**Validações Backend:**
- `name`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 3 caracteres
- `email`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Formato: email válido
- `password`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 6 caracteres

**Validações Frontend (Recomendadas):**
```javascript
// Exemplo de validação no frontend
const validateRegister = (data) => {
  const errors = {};
  
  // Nome
  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Nome deve ter pelo menos 3 caracteres';
  }
  
  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Email inválido';
  }
  
  // Senha
  if (!data.password || data.password.length < 6) {
    errors.password = 'Senha deve ter pelo menos 6 caracteres';
  }
  
  return errors;
};
```

**Resposta de Erro (400):**
```json
{
  "message": "Erro de validação",
  "errors": [
    {
      "property": "name",
      "constraints": {
        "minLength": "name deve ter pelo menos 3 caracteres"
      }
    },
    {
      "property": "email",
      "constraints": {
        "isEmail": "email deve ser um endereço de email válido"
      }
    }
  ]
}
```

---

##### POST `/api/auth/login`

**Validações Backend:**
- `email`: 
  - ✅ Obrigatório
  - ✅ Formato: email válido
- `password`: 
  - ✅ Obrigatório
  - ✅ Tipo: string

**Validações Frontend:**
```javascript
const validateLogin = (data) => {
  const errors = {};
  
  if (!data.email) {
    errors.email = 'Email é obrigatório';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!data.password) {
    errors.password = 'Senha é obrigatória';
  }
  
  return errors;
};
```

---

##### PUT `/api/auth/profile`

**Validações Backend:**
- `name`: 
  - ✅ Opcional
  - ✅ Se fornecido: mínimo 3 caracteres
- `avatar`: 
  - ✅ Opcional
  - ✅ Tipo: string (URL)

**Validações Frontend:**
```javascript
const validateProfile = (data) => {
  const errors = {};
  
  if (data.name && data.name.trim().length < 3) {
    errors.name = 'Nome deve ter pelo menos 3 caracteres';
  }
  
  if (data.avatar && !isValidUrl(data.avatar)) {
    errors.avatar = 'URL inválida';
  }
  
  return errors;
};
```

---

##### PUT `/api/auth/change-password`

**Validações Backend:**
- `currentPassword`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `newPassword`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 6 caracteres

**Validações Frontend:**
```javascript
const validateChangePassword = (data) => {
  const errors = {};
  
  if (!data.currentPassword) {
    errors.currentPassword = 'Senha atual é obrigatória';
  }
  
  if (!data.newPassword) {
    errors.newPassword = 'Nova senha é obrigatória';
  } else if (data.newPassword.length < 6) {
    errors.newPassword = 'Nova senha deve ter pelo menos 6 caracteres';
  }
  
  if (data.currentPassword === data.newPassword) {
    errors.newPassword = 'Nova senha deve ser diferente da atual';
  }
  
  return errors;
};
```

---

##### POST `/api/auth/reset-password`

**Validações Backend:**
- `token`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `newPassword`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 6 caracteres

**Validações Frontend:**
```javascript
const validateResetPassword = (data) => {
  const errors = {};
  
  if (!data.token) {
    errors.token = 'Token é obrigatório';
  }
  
  if (!data.newPassword) {
    errors.newPassword = 'Nova senha é obrigatória';
  } else if (data.newPassword.length < 6) {
    errors.newPassword = 'Senha deve ter pelo menos 6 caracteres';
  }
  
  return errors;
};
```

---

#### 2. Cursos

##### POST `/api/courses` (Admin)

**Validações Backend:**
- `title`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 3 caracteres
- `subtitle`: 
  - ✅ Opcional
  - ✅ Tipo: string
- `description`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 10 caracteres
- `price`: 
  - ✅ Obrigatório
  - ✅ Tipo: number
  - ✅ Mínimo: 0
- `originalPrice`: 
  - ✅ Opcional
  - ✅ Tipo: number
  - ✅ Mínimo: 0 (se fornecido)
- `category`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `image`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Formato: URL válida
- `videoUrl`: 
  - ✅ Opcional
  - ✅ Tipo: string
  - ✅ Formato: URL válida (se fornecido)
- `instructor`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `duration`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `lessons`: 
  - ✅ Opcional
  - ✅ Tipo: number
  - ✅ Mínimo: 0 (se fornecido)
- `bonuses`: 
  - ✅ Opcional
  - ✅ Tipo: array de strings

**Validações Frontend:**
```javascript
const validateCreateCourse = (data) => {
  const errors = {};
  
  // Título
  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Título deve ter pelo menos 3 caracteres';
  }
  
  // Descrição
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Descrição deve ter pelo menos 10 caracteres';
  }
  
  // Preço
  if (data.price === undefined || data.price === null) {
    errors.price = 'Preço é obrigatório';
  } else if (typeof data.price !== 'number' || data.price < 0) {
    errors.price = 'Preço deve ser um número maior ou igual a 0';
  }
  
  // Preço original
  if (data.originalPrice !== undefined && data.originalPrice !== null) {
    if (typeof data.originalPrice !== 'number' || data.originalPrice < 0) {
      errors.originalPrice = 'Preço original deve ser um número maior ou igual a 0';
    }
    if (data.originalPrice <= data.price) {
      errors.originalPrice = 'Preço original deve ser maior que o preço';
    }
  }
  
  // Categoria
  if (!data.category || !data.category.trim()) {
    errors.category = 'Categoria é obrigatória';
  }
  
  // Imagem
  if (!data.image || !isValidUrl(data.image)) {
    errors.image = 'URL da imagem é obrigatória e deve ser válida';
  }
  
  // Video URL
  if (data.videoUrl && !isValidUrl(data.videoUrl)) {
    errors.videoUrl = 'URL do vídeo deve ser válida';
  }
  
  // Instrutor
  if (!data.instructor || !data.instructor.trim()) {
    errors.instructor = 'Instrutor é obrigatório';
  }
  
  // Duração
  if (!data.duration || !data.duration.trim()) {
    errors.duration = 'Duração é obrigatória';
  }
  
  return errors;
};
```

---

##### POST `/api/courses/:courseId/modules` (Admin)

**Validações Backend:**
- `title`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 3 caracteres
- `duration`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `order`: 
  - ✅ Obrigatório
  - ✅ Tipo: number
  - ✅ Mínimo: 0

**Validações Frontend:**
```javascript
const validateCreateModule = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Título deve ter pelo menos 3 caracteres';
  }
  
  if (!data.duration || !data.duration.trim()) {
    errors.duration = 'Duração é obrigatória';
  }
  
  if (data.order === undefined || data.order === null) {
    errors.order = 'Ordem é obrigatória';
  } else if (typeof data.order !== 'number' || data.order < 0) {
    errors.order = 'Ordem deve ser um número maior ou igual a 0';
  }
  
  return errors;
};
```

---

##### POST `/api/modules/:moduleId/lessons` (Admin)

**Validações Backend:**
- `title`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 3 caracteres
- `duration`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `videoUrl`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Formato: URL válida
- `order`: 
  - ✅ Obrigatório
  - ✅ Tipo: number
  - ✅ Mínimo: 0
- `free`: 
  - ✅ Opcional
  - ✅ Tipo: boolean

**Validações Frontend:**
```javascript
const validateCreateLesson = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Título deve ter pelo menos 3 caracteres';
  }
  
  if (!data.duration || !data.duration.trim()) {
    errors.duration = 'Duração é obrigatória';
  }
  
  if (!data.videoUrl || !isValidUrl(data.videoUrl)) {
    errors.videoUrl = 'URL do vídeo é obrigatória e deve ser válida';
  }
  
  if (data.order === undefined || data.order === null) {
    errors.order = 'Ordem é obrigatória';
  } else if (typeof data.order !== 'number' || data.order < 0) {
    errors.order = 'Ordem deve ser um número maior ou igual a 0';
  }
  
  return errors;
};
```

---

#### 3. Compras

##### POST `/api/purchases/checkout`

**Validações Backend:**
- `courses`: 
  - ✅ Obrigatório
  - ✅ Tipo: array
  - ✅ Cada item deve ser UUID válido (v4)
  - ✅ Array não pode estar vazio
- `couponCode`: 
  - ✅ Opcional
  - ✅ Tipo: string
- `paymentMethod`: 
  - ✅ Obrigatório
  - ✅ Tipo: enum
  - ✅ Valores permitidos: `"pix"`, `"boleto"`, `"credit_card"`

**Validações Frontend:**
```javascript
const validateCheckout = (data) => {
  const errors = {};
  
  // Cursos
  if (!data.courses || !Array.isArray(data.courses)) {
    errors.courses = 'Cursos deve ser um array';
  } else if (data.courses.length === 0) {
    errors.courses = 'Selecione pelo menos um curso';
  } else {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidCourses = data.courses.filter(id => !uuidRegex.test(id));
    if (invalidCourses.length > 0) {
      errors.courses = 'Um ou mais IDs de curso são inválidos';
    }
  }
  
  // Método de pagamento
  const validPaymentMethods = ['pix', 'boleto', 'credit_card'];
  if (!data.paymentMethod) {
    errors.paymentMethod = 'Método de pagamento é obrigatório';
  } else if (!validPaymentMethods.includes(data.paymentMethod)) {
    errors.paymentMethod = `Método de pagamento deve ser um dos: ${validPaymentMethods.join(', ')}`;
  }
  
  return errors;
};
```

---

##### POST `/api/purchases/:id/confirm`

**Validações Backend:**
- `paymentId`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
- `paymentData`: 
  - ✅ Opcional
  - ✅ Tipo: object

**Validações Frontend:**
```javascript
const validateConfirmPurchase = (data) => {
  const errors = {};
  
  if (!data.paymentId || !data.paymentId.trim()) {
    errors.paymentId = 'ID do pagamento é obrigatório';
  }
  
  return errors;
};
```

---

#### 4. Avaliações

##### POST `/api/reviews`

**Validações Backend:**
- `courseId`: 
  - ✅ Obrigatório
  - ✅ Tipo: UUID (v4)
- `rating`: 
  - ✅ Obrigatório
  - ✅ Tipo: number
  - ✅ Mínimo: 1
  - ✅ Máximo: 5
- `comment`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 10 caracteres
- `images`: 
  - ✅ Opcional
  - ✅ Tipo: array de strings (URLs)

**Validações Frontend:**
```javascript
const validateCreateReview = (data) => {
  const errors = {};
  
  // Course ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!data.courseId || !uuidRegex.test(data.courseId)) {
    errors.courseId = 'ID do curso é obrigatório e deve ser um UUID válido';
  }
  
  // Rating
  if (data.rating === undefined || data.rating === null) {
    errors.rating = 'Avaliação é obrigatória';
  } else if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Avaliação deve ser um número entre 1 e 5';
  }
  
  // Comentário
  if (!data.comment || data.comment.trim().length < 10) {
    errors.comment = 'Comentário deve ter pelo menos 10 caracteres';
  }
  
  // Imagens
  if (data.images && Array.isArray(data.images)) {
    const invalidUrls = data.images.filter(url => !isValidUrl(url));
    if (invalidUrls.length > 0) {
      errors.images = 'Uma ou mais URLs de imagem são inválidas';
    }
  }
  
  return errors;
};
```

---

#### 5. Cupons

##### POST `/api/coupons` (Admin)

**Validações Backend:**
- `code`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 3 caracteres
- `discount`: 
  - ✅ Obrigatório
  - ✅ Tipo: number
  - ✅ Mínimo: 0
- `type`: 
  - ✅ Obrigatório
  - ✅ Tipo: enum
  - ✅ Valores: `"percentage"` ou `"fixed"`
- `expiresAt`: 
  - ✅ Opcional
  - ✅ Tipo: Date
- `maxUses`: 
  - ✅ Opcional
  - ✅ Tipo: number
  - ✅ Mínimo: 1 (se fornecido)
- `applicableCourses`: 
  - ✅ Opcional
  - ✅ Tipo: array de UUIDs (v4)
- `active`: 
  - ✅ Opcional
  - ✅ Tipo: boolean

**Validações Frontend:**
```javascript
const validateCreateCoupon = (data) => {
  const errors = {};
  
  // Código
  if (!data.code || data.code.trim().length < 3) {
    errors.code = 'Código deve ter pelo menos 3 caracteres';
  }
  
  // Desconto
  if (data.discount === undefined || data.discount === null) {
    errors.discount = 'Desconto é obrigatório';
  } else if (typeof data.discount !== 'number' || data.discount < 0) {
    errors.discount = 'Desconto deve ser um número maior ou igual a 0';
  }
  
  // Tipo
  const validTypes = ['percentage', 'fixed'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.type = `Tipo deve ser um dos: ${validTypes.join(', ')}`;
  }
  
  // Validação adicional: se tipo é percentage, desconto não pode ser > 100
  if (data.type === 'percentage' && data.discount > 100) {
    errors.discount = 'Desconto percentual não pode ser maior que 100';
  }
  
  // Max Uses
  if (data.maxUses !== undefined && data.maxUses !== null) {
    if (typeof data.maxUses !== 'number' || data.maxUses < 1) {
      errors.maxUses = 'Máximo de usos deve ser um número maior ou igual a 1';
    }
  }
  
  // Data de expiração
  if (data.expiresAt) {
    const expiryDate = new Date(data.expiresAt);
    if (isNaN(expiryDate.getTime())) {
      errors.expiresAt = 'Data de expiração inválida';
    } else if (expiryDate < new Date()) {
      errors.expiresAt = 'Data de expiração não pode ser no passado';
    }
  }
  
  // Cursos aplicáveis
  if (data.applicableCourses && Array.isArray(data.applicableCourses)) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidCourses = data.applicableCourses.filter(id => !uuidRegex.test(id));
    if (invalidCourses.length > 0) {
      errors.applicableCourses = 'Um ou mais IDs de curso são inválidos';
    }
  }
  
  return errors;
};
```

---

#### 6. Reembolsos

##### POST `/api/refunds/request`

**Validações Backend:**
- `purchaseId`: 
  - ✅ Obrigatório
  - ✅ Tipo: UUID (v4)
- `reason`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 10 caracteres
- `comment`: 
  - ✅ Opcional
  - ✅ Tipo: string

**Validações Frontend:**
```javascript
const validateRequestRefund = (data) => {
  const errors = {};
  
  // Purchase ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!data.purchaseId || !uuidRegex.test(data.purchaseId)) {
    errors.purchaseId = 'ID da compra é obrigatório e deve ser um UUID válido';
  }
  
  // Motivo
  if (!data.reason || data.reason.trim().length < 10) {
    errors.reason = 'Motivo deve ter pelo menos 10 caracteres';
  }
  
  return errors;
};
```

---

##### PUT `/api/refunds/:id/reject` (Admin)

**Validações Backend:**
- `reason`: 
  - ✅ Obrigatório
  - ✅ Tipo: string
  - ✅ Mínimo: 10 caracteres

**Validações Frontend:**
```javascript
const validateRejectRefund = (data) => {
  const errors = {};
  
  if (!data.reason || data.reason.trim().length < 10) {
    errors.reason = 'Motivo da rejeição deve ter pelo menos 10 caracteres';
  }
  
  return errors;
};
```

---

#### 7. Progresso

##### PUT `/api/progress/lesson/:lessonId/watch`

**Validações Backend:**
- `watchedDuration`: 
  - ✅ Opcional
  - ✅ Tipo: number
  - ✅ Mínimo: 0 (se fornecido)

**Validações Frontend:**
```javascript
const validateUpdateWatchTime = (data) => {
  const errors = {};
  
  if (data.watchedDuration !== undefined && data.watchedDuration !== null) {
    if (typeof data.watchedDuration !== 'number' || data.watchedDuration < 0) {
      errors.watchedDuration = 'Duração assistida deve ser um número maior ou igual a 0';
    }
  }
  
  return errors;
};
```

---

##### POST `/api/progress/lesson/:lessonId/complete`

**Validações Backend:**
- `watchedDuration`: 
  - ✅ Opcional
  - ✅ Tipo: number
  - ✅ Mínimo: 0 (se fornecido)

**Validações Frontend:**
```javascript
const validateCompleteLesson = (data) => {
  const errors = {};
  
  if (data.watchedDuration !== undefined && data.watchedDuration !== null) {
    if (typeof data.watchedDuration !== 'number' || data.watchedDuration < 0) {
      errors.watchedDuration = 'Duração assistida deve ser um número maior ou igual a 0';
    }
  }
  
  return errors;
};
```

---

### 🔧 Funções Auxiliares Recomendadas

```javascript
// Validar URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Validar UUID v4
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar array de UUIDs
function validateUUIDArray(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every(id => isValidUUID(id));
}
```

---

### 📋 Resumo das Regras de Validação

| Campo | Tipo | Regras Comuns |
|-------|------|---------------|
| **Nome** | string | Mínimo 3 caracteres |
| **Email** | string | Formato de email válido |
| **Senha** | string | Mínimo 6 caracteres |
| **UUID** | string | Formato UUID v4 |
| **URL** | string | URL válida (http/https) |
| **Preço** | number | Mínimo 0 |
| **Rating** | number | Entre 1 e 5 |
| **Texto longo** | string | Mínimo 10 caracteres |
| **Texto curto** | string | Mínimo 3 caracteres |
| **Array** | array | Não vazio (quando obrigatório) |
| **Enum** | string | Valores específicos permitidos |

---

### ⚠️ Tratamento de Erros no Frontend

**Sempre trate os erros retornados pelo backend:**

```javascript
async function submitForm(data) {
  // 1. Validação frontend primeiro
  const frontendErrors = validateData(data);
  if (Object.keys(frontendErrors).length > 0) {
    // Mostrar erros no formulário
    setErrors(frontendErrors);
    return;
  }
  
  try {
    // 2. Enviar para backend
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    // 3. Verificar resposta
    if (!response.ok) {
      const errorData = await response.json();
      
      // Se for erro de validação (400)
      if (response.status === 400 && errorData.errors) {
        // Converter erros do backend para formato do frontend
        const backendErrors = {};
        errorData.errors.forEach(error => {
          backendErrors[error.property] = Object.values(error.constraints)[0];
        });
        setErrors(backendErrors);
        return;
      }
      
      // Outros erros
      throw new Error(errorData.message || 'Erro ao processar requisição');
    }
    
    // 4. Sucesso
    const result = await response.json();
    // Processar resultado...
    
  } catch (error) {
    // Tratar erro de rede ou outros erros
    console.error('Erro:', error);
    alert('Erro ao processar requisição. Tente novamente.');
  }
}
```

---

### ✅ Checklist de Validação

Para cada formulário no frontend, certifique-se de:

- [ ] ✅ Validação client-side implementada
- [ ] ✅ Mensagens de erro claras e em português
- [ ] ✅ Validação em tempo real (onChange/onBlur)
- [ ] ✅ Validação antes de enviar (onSubmit)
- [ ] ✅ Tratamento de erros do backend
- [ ] ✅ Exibição de erros do backend no formulário
- [ ] ✅ Desabilitar botão de submit durante requisição
- [ ] ✅ Feedback visual de campos inválidos
- [ ] ✅ Mensagens de sucesso após submissão bem-sucedida

---

## Observações Importantes

1. **Todas as rotas requerem autenticação**, exceto:
   - `/api/auth/register`
   - `/api/auth/login`
   - `/api/auth/google`
   - `/api/auth/google/callback`
   - `/api/auth/forgot-password`
   - `/api/auth/reset-password`
   - `/api/webhooks/mercadopago`

2. **Rotas admin** requerem usuário com `role: "admin"`

3. **Formato de datas:** Todas as datas são retornadas em formato ISO 8601 (ex: `2024-01-15T10:00:00Z`)

4. **Paginação:** Use `page` e `limit` em rotas que retornam listas

5. **Tratamento de erros:** Sempre verifique o status HTTP e trate erros adequadamente

6. **Token JWT:** Armazene o token de forma segura (localStorage ou cookies httpOnly) e inclua em todas as requisições

---

## Suporte

Para dúvidas ou problemas, entre em contato com a equipe de backend.

**Última atualização:** Janeiro 2024

