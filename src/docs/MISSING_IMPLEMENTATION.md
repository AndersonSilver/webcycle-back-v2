# 📋 Itens Faltantes na Implementação

## 🔴 Controllers Faltantes

### 1. **CertificateController** ❌
Endpoints necessários:
- `GET /api/certificates/my-certificates` - Listar certificados do usuário
- `GET /api/certificates/:id` - Detalhes do certificado
- `GET /api/certificates/:id/download` - Download PDF
- `GET /api/certificates/verify/:code` - Verificar certificado (público)
- `POST /api/certificates/generate/:courseId` - Gerar certificado

### 2. **FavoriteController** ❌
Endpoints necessários:
- `GET /api/favorites` - Listar favoritos
- `POST /api/favorites/:courseId` - Adicionar favorito
- `DELETE /api/favorites/:courseId` - Remover favorito
- `GET /api/favorites/check/:courseId` - Verificar se é favorito

### 3. **NotificationController** ❌
Endpoints necessários:
- `GET /api/notifications` - Listar notificações do usuário
- `PUT /api/notifications/:id/read` - Marcar como lida
- `PUT /api/notifications/read-all` - Marcar todas como lidas
- `DELETE /api/notifications/:id` - Deletar notificação

### 4. **RefundController** ❌
Endpoints necessários:
- `POST /api/refunds/request` - Solicitar reembolso
- `GET /api/refunds/my-refunds` - Meus reembolsos
- `GET /api/refunds` - Listar reembolsos (Admin)
- `PUT /api/refunds/:id/approve` - Aprovar reembolso (Admin)
- `PUT /api/refunds/:id/reject` - Rejeitar reembolso (Admin)

### 5. **RecommendationController** ❌
Endpoints necessários:
- `GET /api/recommendations` - Recomendações personalizadas
- `GET /api/recommendations/trending` - Cursos em alta (público)

### 6. **ModuleController** ❌
Endpoints necessários:
- `POST /api/modules/:moduleId/lessons` - Criar aula (Admin)
- `PUT /api/modules/:moduleId/lessons/:lessonId` - Atualizar aula (Admin)
- `DELETE /api/modules/:moduleId/lessons/:lessonId` - Deletar aula (Admin)
- `GET /api/modules/:moduleId/lessons` - Listar aulas
- `PUT /api/admin/modules/:moduleId/reorder-lessons` - Reordenar aulas (Admin)

### 7. **LessonController** ❌
Endpoints necessários:
- `GET /api/lessons/:lessonId` - Detalhes da aula (com verificação de acesso)
- `GET /api/lessons/:lessonId/materials` - Materiais da aula

## 🟡 Endpoints Faltantes em Controllers Existentes

### AuthController
- [ ] `PUT /api/auth/profile` - Atualizar perfil
- [ ] `PUT /api/auth/change-password` - Alterar senha
- [ ] `POST /api/auth/forgot-password` - Recuperar senha
- [ ] `POST /api/auth/reset-password` - Redefinir senha

### CourseController
- [ ] `GET /api/courses/search` - Busca avançada de cursos
- [ ] `GET /api/courses/:id/related` - Cursos relacionados
- [ ] `POST /api/courses/:id/share` - Gerar link de compartilhamento
- [ ] `GET /api/courses/shared/:token` - Acessar via link compartilhado
- [ ] `POST /api/courses/:courseId/modules` - Criar módulo (Admin)
- [ ] `PUT /api/courses/:courseId/modules/:moduleId` - Atualizar módulo (Admin)
- [ ] `DELETE /api/courses/:courseId/modules/:moduleId` - Deletar módulo (Admin)
- [ ] `GET /api/courses/:courseId/modules` - Listar módulos de um curso

### CartController
- [ ] `GET /api/cart/total` - Obter total do carrinho
- [ ] `POST /api/cart/apply-coupon` - Aplicar cupom ao carrinho
- [ ] `DELETE /api/cart/remove-coupon` - Remover cupom do carrinho

### PurchaseController
- [ ] `GET /api/purchases/my-purchases/stats` - Estatísticas de compras

### ProgressController
- [ ] `GET /api/progress/my-courses` - Progresso em todos os cursos
- [ ] `GET /api/progress/lesson/:lessonId` - Progresso específico de uma aula
- [ ] `GET /api/progress/stats` - Estatísticas gerais de progresso
- [ ] `GET /api/progress/history` - Histórico de atividades

### CouponController
- [ ] `GET /api/coupons/:id` - Detalhes do cupom (Admin)
- [ ] `GET /api/coupons/:code/usage` - Estatísticas de uso (Admin)
- [ ] `PUT /api/coupons/:id/toggle` - Ativar/Desativar cupom (Admin)

### ReviewController
- [ ] `GET /api/reviews/pending` - Avaliações pendentes (Admin)
- [ ] `GET /api/reviews/stats` - Estatísticas de avaliações (Admin)
- [ ] `POST /api/reviews/:id/helpful` - Marcar avaliação como útil
- [ ] `POST /api/reviews/:id/images` - Anexar imagens à avaliação

### AdminController
- [ ] `GET /api/admin/dashboard/sales-chart` - Gráfico de vendas
- [ ] `GET /api/admin/dashboard/revenue-chart` - Gráfico de receita
- [ ] `GET /api/admin/dashboard/students-chart` - Gráfico de alunos
- [ ] `GET /api/admin/dashboard/payment-methods-chart` - Gráfico métodos pagamento
- [ ] `GET /api/admin/revenue` - Análise detalhada de faturamento
- [ ] `GET /api/admin/analytics/overview` - Visão geral analytics
- [ ] `GET /api/admin/analytics/student-progress` - Progresso dos alunos
- [ ] `POST /api/admin/export/purchases` - Exportar compras (CSV/XLSX)
- [ ] `POST /api/admin/export/students` - Exportar alunos (CSV/XLSX)
- [ ] `POST /api/admin/export/courses` - Exportar cursos (CSV/XLSX)
- [ ] `POST /api/admin/courses/:courseId/upload-video` - Upload vídeo
- [ ] `POST /api/admin/courses/:courseId/upload-image` - Upload imagem
- [ ] `POST /api/admin/courses/:courseId/upload-material` - Upload material
- [ ] `GET /api/admin/courses/:courseId/materials` - Listar materiais
- [ ] `DELETE /api/admin/courses/:courseId/materials/:materialId` - Deletar material
- [ ] `PUT /api/admin/courses/:courseId/reorder-modules` - Reordenar módulos
- [ ] `POST /api/admin/courses/:courseId/duplicate` - Duplicar curso
- [ ] `GET /api/admin/notifications` - Notificações do sistema
- [ ] `PUT /api/admin/notifications/:id/read` - Marcar como lida
- [ ] `PUT /api/admin/notifications/read-all` - Marcar todas como lidas

## 🟠 Services Faltantes

### 1. **CertificateService** ❌
- Gerar certificado PDF
- Verificar código de certificado
- Download de PDF

### 2. **EmailService** ⚠️ (Existe mas incompleto)
- Enviar email de boas-vindas
- Enviar confirmação de compra
- Enviar email de recuperação de senha
- Enviar notificações

### 3. **StorageService** ⚠️ (Existe mas incompleto)
- Upload de vídeos
- Upload de imagens
- Upload de materiais PDF
- Geração de thumbnails

### 4. **NotificationService** ❌
- Criar notificações
- Enviar notificações push
- Marcar como lida

### 5. **RecommendationService** ❌
- Algoritmo de recomendações baseado em:
  - Cursos anteriores do usuário
  - Categoria preferida
  - Avaliações
  - Trending (vendas recentes)

### 6. **RefundService** ❌
- Validar prazo de garantia (7 dias)
- Processar reembolso
- Integração com gateway de pagamento para estorno

## 🔵 DTOs Faltantes

### auth.dto.ts
- [ ] `UpdateProfileDto` (parcialmente existe)
- [ ] `ChangePasswordDto` (existe mas não usado)
- [ ] `ForgotPasswordDto` (existe mas não usado)
- [ ] `ResetPasswordDto` (existe mas não usado)

### certificate.dto.ts ❌
- [ ] `GenerateCertificateDto`
- [ ] `VerifyCertificateDto`

### favorite.dto.ts ❌
- Não necessário (apenas courseId)

### notification.dto.ts ❌
- [ ] `CreateNotificationDto`
- [ ] `UpdateNotificationDto`

### refund.dto.ts ❌
- [ ] `RequestRefundDto`
- [ ] `RejectRefundDto`

### recommendation.dto.ts ❌
- Não necessário (apenas query params)

## 🟣 Funcionalidades Específicas Faltantes

### 1. **Sistema de Compartilhamento** ❌
- Gerar token de compartilhamento
- Armazenar tokens com expiração
- Rastrear cliques em links compartilhados
- Entidade ShareToken recomendada (opcional)

### 2. **Sistema de Materiais de Apoio** ❌
- Entidade Material (não existe)
- Upload de PDFs/DOCs
- Download de materiais
- Associar materiais a aulas

### 3. **Sistema de Exportação** ❌
- Exportar para CSV
- Exportar para Excel/XLSX
- Formatação de dados

### 4. **Sistema de Upload de Arquivos** ❌
- Multer configurado
- Validação de tipos de arquivo
- Redimensionamento de imagens
- Processamento de vídeo (thumbnails, duração)

### 5. **Sistema de Gráficos e Analytics** ❌
- Agregação de dados por período
- Cálculo de métricas
- Formatação de dados para gráficos

### 6. **Sistema de Histórico de Atividades** ❌
- Registrar ações do usuário
- Histórico de visualizações
- Histórico de conclusões

### 7. **Validação de Garantia (7 dias)** ❌
- Verificar data da compra
- Calcular dias restantes
- Bloquear reembolso após 7 dias

## 🟢 Entidades Faltantes

### Material.entity.ts ❌
```typescript
@Entity('materials')
export class Material {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  url: string;
  type: string; // pdf, doc, etc
  size: number;
  createdAt: Date;
}
```

## 📊 Resumo

### Controllers: 7 faltantes
- CertificateController
- FavoriteController
- NotificationController
- RefundController
- RecommendationController
- ModuleController
- LessonController

### Endpoints Faltantes: ~60+ endpoints
- AuthController: 4 endpoints
- CourseController: 8 endpoints (inclui /shared/:token)
- CartController: 3 endpoints
- PurchaseController: 1 endpoint
- ProgressController: 4 endpoints
- CouponController: 3 endpoints
- ReviewController: 4 endpoints
- AdminController: ~20 endpoints
- Novos controllers: ~20 endpoints

### Services: 6 faltantes/incompletos
- CertificateService
- EmailService (incompleto)
- StorageService (incompleto)
- NotificationService
- RecommendationService
- RefundService

### DTOs: Vários faltantes
- certificate.dto.ts
- notification.dto.ts
- refund.dto.ts

### Entidades: 1 faltante + 1 recomendada
- Material.entity.ts (obrigatória)
- ShareToken.entity.ts (recomendada, opcional)

## 🎯 Prioridade de Implementação

### Alta Prioridade (Core Features)
1. ✅ AuthController - endpoints de perfil e senha
2. ✅ ModuleController e LessonController - CRUD completo
3. ✅ FavoriteController - funcionalidade básica
4. ✅ NotificationController - sistema de notificações
5. ✅ EmailService - completo

### Média Prioridade (Important Features)
6. ✅ CertificateController - geração de certificados
7. ✅ RefundController - sistema de reembolsos
8. ✅ StorageService - upload completo
9. ✅ RecommendationController - recomendações básicas

### Baixa Prioridade (Nice to Have)
10. ✅ AdminController - endpoints avançados de analytics
11. ✅ Sistema de exportação
12. ✅ Sistema de compartilhamento
13. ✅ Histórico detalhado

