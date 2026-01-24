# Sistema de Vendas de Produtos Físicos e Digitais

## 📋 Visão Geral

Sistema completo para venda de produtos físicos e digitais com rastreamento de envios integrado com a API Linketrack.

## ✅ Funcionalidades Implementadas

### Backend

1. **Entidades Criadas:**
   - `Product` - Produtos físicos e digitais
   - `ProductPurchase` - Relacionamento entre compras e produtos
   - `ShippingTracking` - Rastreamento de envios
   - `TrackingEvent` - Eventos de rastreamento

2. **Controllers:**
   - `ProductController` - CRUD de produtos (público e admin)
   - `TrackingController` - Gerenciamento de rastreamento

3. **Serviços:**
   - `TrackingService` - Integração com API Linketrack
   - Atualização automática de status
   - Envio de emails para atualizações

4. **Integrações:**
   - `PurchaseController` atualizado para suportar produtos
   - `WebhookController` processa produtos digitais automaticamente
   - `EmailService` com templates para produtos

### Frontend

1. **Componentes Criados:**
   - `ProductCard` - Card de produto
   - `TrackingComponent` - Visualização de rastreamento

2. **API Client:**
   - Métodos para produtos e tracking adicionados

## 🚀 Como Usar

### Configuração

1. **Variáveis de Ambiente (.env):**
```env
# Tracking (Linketrack)
LINKETRACK_API_KEY=sua_chave_aqui
LINKETRACK_API_URL=https://api.linketrack.com/track/json

# Frontend URL (para links em emails)
FRONTEND_URL=http://localhost:5173
```

2. **Executar Migration:**
```bash
cd TB-PSICO-BACK
npm run migration:run
```

### Fluxo de Compra

1. **Cliente compra produto físico:**
   - Produto é adicionado ao carrinho
   - Checkout com produtos
   - Após pagamento aprovado:
     - Email enviado para cliente
     - Email enviado para admin sobre produto físico

2. **Admin posta produto:**
   - Admin acessa compra no painel
   - Adiciona código de rastreamento
   - Sistema busca dados do Linketrack automaticamente

3. **Tracking automático:**
   - Sistema atualiza status periodicamente
   - Email enviado ao cliente a cada mudança de status
   - Cliente pode ver tracking em "Minhas Compras"

### Produtos Digitais

- Após pagamento aprovado, produto digital é automaticamente adicionado à biblioteca do usuário
- Usuário pode acessar na seção "Minhas Compras"

## 📝 Endpoints da API

### Produtos

- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Detalhes do produto
- `GET /api/products/category/:category` - Por categoria
- `GET /api/products/type/:type` - Por tipo (physical/digital)
- `POST /api/products` - Criar produto (admin)
- `PUT /api/products/:id` - Atualizar produto (admin)
- `DELETE /api/products/:id` - Remover produto (admin)

### Tracking

- `GET /api/tracking/my-trackings` - Meus rastreamentos
- `GET /api/tracking/:id` - Detalhes do tracking
- `GET /api/tracking/code/:code` - Por código
- `POST /api/tracking/:id/update` - Atualizar tracking
- `POST /api/tracking/product-purchase/:productPurchaseId/add-tracking` - Adicionar código (admin)

### Compra com Produtos

- `POST /api/purchases/checkout` - Checkout (suporta produtos)
```json
{
  "courses": ["uuid1", "uuid2"],  // opcional
  "products": [                    // opcional
    { "productId": "uuid", "quantity": 1 }
  ],
  "paymentMethod": "pix",
  "couponCode": "DESCONTO10"      // opcional
}
```

## 🎨 Frontend - Próximos Passos

Para completar o frontend, você precisa criar:

1. **Página de Listagem de Produtos** (`ProductCatalog.tsx`)
   - Similar ao `CourseCatalog.tsx`
   - Filtros por tipo e categoria
   - Grid de produtos

2. **Página de Detalhes do Produto** (`ProductDetail.tsx`)
   - Informações do produto
   - Botão de compra
   - Galeria de imagens

3. **Seção Admin de Produtos**
   - Adicionar ao `AdminPanel.tsx`
   - CRUD completo de produtos
   - Gerenciamento de estoque
   - Adicionar código de rastreamento nas compras

4. **Atualizar "Minhas Compras"**
   - Mostrar produtos comprados
   - Link para tracking de produtos físicos
   - Download de produtos digitais

5. **Atualizar Checkout**
   - Suportar produtos além de cursos
   - Mostrar resumo de produtos

## 📧 Emails

O sistema envia automaticamente:

1. **Confirmação de Compra:**
   - Lista cursos e produtos comprados
   - Informações sobre envio (produtos físicos)

2. **Notificação para Admin:**
   - Quando produto físico é comprado
   - Link para adicionar código de rastreamento

3. **Atualizações de Tracking:**
   - A cada mudança de status
   - Histórico de eventos
   - Link para ver detalhes

## 🔄 Tracking Automático

O sistema busca atualizações do Linketrack:

- Quando código é adicionado
- Quando usuário clica em "Atualizar"
- Pode ser configurado para atualizar periodicamente (cron job)

## 📦 Status de Envio

- `pending` - Aguardando postagem
- `preparing` - Preparando para envio
- `shipped` - Produto postado
- `in_transit` - Em trânsito
- `out_for_delivery` - Saiu para entrega
- `delivered` - Entregue
- `returned` - Devolvido
- `exception` - Exceção

## 🛠️ Melhorias Futuras

1. **Cron Job para Tracking:**
   - Atualizar automaticamente a cada hora
   - Notificar apenas mudanças de status

2. **Biblioteca Digital:**
   - Página dedicada para produtos digitais
   - Download direto
   - Histórico de downloads

3. **Notificações Push:**
   - Notificar sobre atualizações de tracking
   - Notificar sobre novos produtos

4. **Relatórios:**
   - Vendas por produto
   - Estoque baixo
   - Tempo médio de entrega

## 📚 Documentação Adicional

- Ver `TB-PSICO-BACK/src/entities/` para modelos de dados
- Ver `TB-PSICO-BACK/src/controllers/` para endpoints
- Ver `TB-PSICO-BACK/src/services/TrackingService.ts` para integração Linketrack

