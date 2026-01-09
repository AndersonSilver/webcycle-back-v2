# 🔐 Status do Middleware de Autenticação

## ✅ Controllers com Middleware Global (Todas as rotas protegidas)

Estes controllers aplicam `router.use(AuthMiddleware.authenticate)` no início:

1. **PurchaseController** ✅
   - Todas as rotas requerem autenticação

2. **ProgressController** ✅
   - Todas as rotas requerem autenticação

3. **CartController** ✅
   - Todas as rotas requerem autenticação

4. **FavoriteController** ✅
   - Todas as rotas requerem autenticação

5. **NotificationController** ✅
   - Todas as rotas requerem autenticação

6. **AdminController** ✅
   - Todas as rotas requerem autenticação + admin

7. **CouponController** ✅
   - Rotas admin requerem autenticação + admin
   - Rota `/validate/:code` é pública (correto)

## ✅ Controllers com Rotas Mistas (Públicas + Autenticadas)

Estes controllers têm rotas públicas e autenticadas:

1. **AuthController** ✅
   - Rotas públicas: `/register`, `/login`, `/google`, `/google/callback`, `/forgot-password`, `/reset-password`
   - Rotas autenticadas: `/me`, `/profile`, `/change-password`, `/logout`

2. **CourseController** ✅
   - Rotas públicas: `GET /`, `GET /search`, `GET /:id`, `GET /:id/related`, `GET /shared/:token`
   - Rotas autenticadas: `POST /:id/share`, `GET /:courseId/modules` (agora protegida)
   - Rotas admin: `POST /`, `PUT /:id`, `DELETE /:id`, módulos CRUD

3. **ModuleController** ✅
   - Rotas autenticadas: `GET /:moduleId/lessons` (agora protegida)
   - Rotas admin: CRUD de aulas, reordenar

4. **LessonController** ✅
   - Todas as rotas requerem autenticação

5. **ReviewController** ✅
   - Rota pública: `GET /course/:courseId` (listar avaliações aprovadas)
   - Rotas autenticadas: `POST /`, `POST /:id/helpful`, `POST /:id/images`
   - Rotas admin: `GET /`, `GET /pending`, `GET /stats`, `PUT /:id/approve`, `DELETE /:id`

6. **CertificateController** ✅
   - Rota pública: `GET /verify/:code` (verificar certificado)
   - Rotas autenticadas: `GET /`, `GET /:id`, `GET /:id/download`, `POST /generate/:courseId`

7. **RecommendationController** ✅
   - Rota pública: `GET /trending` (cursos em alta)
   - Rota autenticada: `GET /` (recomendações personalizadas)

8. **RefundController** ✅
   - Rotas autenticadas: `POST /request`, `GET /my-refunds`
   - Rotas admin: `GET /`, `PUT /:id/approve`, `PUT /:id/reject`

9. **WebhookController** ✅
   - Rota pública: `POST /mercadopago` (webhook não precisa de autenticação)

## 📝 Alterações Realizadas

1. ✅ `CourseController`: Adicionado `AuthMiddleware.authenticate` em `GET /:courseId/modules`
2. ✅ `ModuleController`: Adicionado `AuthMiddleware.authenticate` em `GET /:moduleId/lessons`

## 🎯 Resumo

- **Total de Controllers:** 16
- **Controllers com middleware global:** 7
- **Controllers com rotas mistas:** 9
- **Rotas protegidas:** 100% das rotas que precisam de autenticação ✅

Todas as rotas que precisam de autenticação agora têm o middleware configurado!

