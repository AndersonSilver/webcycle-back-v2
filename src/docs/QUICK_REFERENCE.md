# 📚 Referência Rápida - O que Falta Implementar

## 🎯 Resumo Executivo

**Status:** ~40% implementado | ~60% faltante

**Prioridade:** 7 controllers completos + ~60 endpoints adicionais

---

## 🔴 Controllers Faltantes (7)

| Controller | Endpoints | Prioridade |
|------------|-----------|------------|
| CertificateController | 5 | Alta |
| FavoriteController | 4 | Alta |
| NotificationController | 4 | Alta |
| ModuleController | 5 | Alta |
| LessonController | 2 | Alta |
| RefundController | 5 | Média |
| RecommendationController | 2 | Média |

---

## 🟡 Endpoints Faltantes por Controller

### AuthController (4)
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### CourseController (8)
- `GET /api/courses/search`
- `GET /api/courses/:id/related`
- `POST /api/courses/:id/share`
- `GET /api/courses/shared/:token` ⚠️
- `POST /api/courses/:courseId/modules`
- `PUT /api/courses/:courseId/modules/:moduleId`
- `DELETE /api/courses/:courseId/modules/:moduleId`
- `GET /api/courses/:courseId/modules`

### CartController (3)
- `GET /api/cart/total`
- `POST /api/cart/apply-coupon`
- `DELETE /api/cart/remove-coupon`

### PurchaseController (1)
- `GET /api/purchases/my-purchases/stats`

### ProgressController (4)
- `GET /api/progress/my-courses`
- `GET /api/progress/lesson/:lessonId`
- `GET /api/progress/stats`
- `GET /api/progress/history`

### CouponController (3)
- `GET /api/coupons/:id`
- `GET /api/coupons/:code/usage`
- `PUT /api/coupons/:id/toggle`

### ReviewController (4)
- `GET /api/reviews/pending`
- `GET /api/reviews/stats`
- `POST /api/reviews/:id/helpful`
- `POST /api/reviews/:id/images`

### AdminController (~20)
- Gráficos (4 endpoints)
- Analytics (2 endpoints)
- Exportação (3 endpoints)
- Uploads (3 endpoints)
- Materiais (2 endpoints)
- Utilitários (6 endpoints)

---

## 🟠 Services Faltantes/Incompletos

| Service | Status | Prioridade |
|---------|--------|------------|
| CertificateService | ❌ Não existe | Alta |
| NotificationService | ❌ Não existe | Alta |
| EmailService | ⚠️ Incompleto | Alta |
| StorageService | ⚠️ Incompleto | Média |
| RecommendationService | ❌ Não existe | Média |
| RefundService | ❌ Não existe | Média |

---

## 🟣 Entidades Faltantes

| Entidade | Status | Prioridade |
|----------|--------|------------|
| Material.entity.ts | ❌ Não existe | **OBRIGATÓRIA** |
| ShareToken.entity.ts | ❌ Não existe | Opcional |

---

## 📦 Dependências Adicionais Necessárias

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",           // Certificados PDF
    "puppeteer": "^21.0.0",         // Alternativa para PDFs
    "exceljs": "^4.4.0",            // Exportação Excel
    "csv-writer": "^1.6.0",         // Exportação CSV
    "aws-sdk": "^2.1500.0",        // AWS S3
    "sharp": "^0.32.0",            // Processamento de imagens
    "multer": "^1.4.5-lts.1"       // Upload de arquivos (já existe)
  }
}
```

---

## 🚀 Ordem de Implementação Sugerida

### Sprint 1 (Core Features)
1. ✅ Material.entity.ts
2. ✅ ModuleController + LessonController
3. ✅ FavoriteController
4. ✅ NotificationController + NotificationService
5. ✅ AuthController - Perfil e Senha

### Sprint 2 (Important Features)
6. ✅ CertificateController + CertificateService
7. ✅ RefundController + RefundService
8. ✅ StorageService completo
9. ✅ EmailService completo

### Sprint 3 (Advanced Features)
10. ✅ RecommendationController + RecommendationService
11. ✅ AdminController - Analytics avançados
12. ✅ Sistema de exportação
13. ✅ Sistema de compartilhamento (ShareToken)

---

## 📊 Métricas

- **Total de Endpoints:** 100+
- **Implementados:** ~40 (~40%)
- **Faltantes:** ~60+ (~60%)
- **Controllers:** 9/16 (56%)
- **Services:** 2/6 (33%)
- **Entidades:** 14/15 obrigatórias (93%)

---

## ✅ Checklist Rápido

- [ ] Material.entity.ts
- [ ] 7 Controllers faltantes
- [ ] ~60 endpoints adicionais
- [ ] 4-6 Services completos
- [ ] DTOs faltantes
- [ ] Configurar Multer
- [ ] Integrar AWS S3/Cloudinary
- [ ] Biblioteca de PDFs
- [ ] Biblioteca de exportação

---

**Última atualização:** Análise completa e verificada ✅

