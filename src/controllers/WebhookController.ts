import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { ProductPurchase } from '../entities/ProductPurchase.entity';
import { Product, ProductType } from '../entities/Product.entity';
import { PaymentService } from '../services/PaymentService';
import { emailService } from '../services/EmailService';

export class WebhookController {
  private router: Router;
  private purchaseRepository: Repository<Purchase>;
  private productPurchaseRepository: Repository<ProductPurchase>;
  private productRepository: Repository<Product>;
  private paymentService: PaymentService;
  // Cache para evitar processar o mesmo payment_id múltiplas vezes em sequência
  private processedPayments: Set<string> = new Set();
  private lastEmailSent: number = 0;
  private readonly EMAIL_RATE_LIMIT_MS = 600; // 600ms = ~1.6 emails/segundo (abaixo do limite de 2/segundo)

  constructor() {
    this.router = Router();
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.productPurchaseRepository = AppDataSource.getRepository(ProductPurchase);
    this.productRepository = AppDataSource.getRepository(Product);
    this.paymentService = new PaymentService();
    this.setupRoutes();
    
    // Limpar cache de payments processados a cada 5 minutos
    setInterval(() => {
      this.processedPayments.clear();
    }, 5 * 60 * 1000);
  }

  private setupRoutes() {
    // Rota de teste para verificar se o webhook está acessível
    this.router.get('/test', (_req: Request, res: Response) => {
      console.log('✅ [WEBHOOK TEST] Rota de teste acessada!');
      res.json({ message: 'Webhook endpoint está funcionando!', timestamp: new Date().toISOString() });
    });
    
    this.router.post('/mercadopago', this.mercadopagoWebhook.bind(this));
  }

  private async mercadopagoWebhook(req: Request, res: Response) {
    console.log('🎯 [WEBHOOK CONTROLLER] Handler chamado');
    console.log('🎯 [WEBHOOK CONTROLLER] Method:', req.method);
    console.log('🎯 [WEBHOOK CONTROLLER] URL:', req.url);
    console.log('🎯 [WEBHOOK CONTROLLER] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🎯 [WEBHOOK CONTROLLER] Body:', JSON.stringify(req.body, null, 2));
    console.log('🎯 [WEBHOOK CONTROLLER] Query:', JSON.stringify(req.query, null, 2));
    
    try {
      // Responder imediatamente para evitar timeout do Mercado Pago
      console.log('✅ [WEBHOOK CONTROLLER] Enviando resposta 200');
      res.status(200).json({ received: true });
      
      const data = req.body;
      const query = req.query;
      
      // Log para debug
      console.log('🔔 Webhook recebido do Mercado Pago:', JSON.stringify(data, null, 2));

      // Mercado Pago pode enviar webhooks em diferentes formatos:
      // Formato 1: Body com { type: 'payment', data: { id: '123' } }
      // Formato 2: Body com { action: 'payment.created', data: { id: '123' }, type: 'payment' }
      // Formato 3: Query params com ?data.id=123&type=payment
      // Formato 4: Body com { resource: "123", topic: "payment" }
      // Formato 5: Query params com ?id=123&topic=payment
      // Formato 6: Body com { resource: "https://.../merchant_orders/123", topic: "merchant_order" }
      // Formato 7: Query params com ?id=123&topic=merchant_order
      
      // Extrair topic do body ou query params
      const topicFromBody = data.topic;
      const topicFromQuery = query.topic?.toString();
      const topic = topicFromBody || topicFromQuery;
      
      console.log(`🔍 [DEBUG] Topic detectado:`, { 
        topicFromBody, 
        topicFromQuery, 
        finalTopic: topic,
        isMerchantOrder: topic === 'merchant_order'
      });
      
      // Se for merchant_order, processar de forma diferente
      if (topic === 'merchant_order') {
        console.log('✅ [DEBUG] Entrando no bloco merchant_order');
        let merchantOrderId: string | null = null;
        
        // Extrair ID da merchant_order
        if (data.resource) {
          // Pode ser URL completa ou apenas ID
          if (typeof data.resource === 'string' && data.resource.includes('merchant_orders/')) {
            const match = data.resource.match(/merchant_orders\/(\d+)/);
            if (match) {
              merchantOrderId = match[1];
            }
          } else if (typeof data.resource === 'string' && !data.resource.includes('http')) {
            merchantOrderId = data.resource;
          }
        }
        
        // Tentar query params
        if (!merchantOrderId && query.id) {
          merchantOrderId = query.id.toString();
        }
        
        if (!merchantOrderId) {
          console.warn('⚠️ Webhook merchant_order recebido mas ID não encontrado:', { body: data, query });
          return;
        }
        
        console.log(`🔍 Processando merchant_order: ${merchantOrderId}`);
        
        try {
          // Buscar detalhes da merchant_order
          const merchantOrder = await this.paymentService.getMerchantOrderDetails(merchantOrderId);
          
          console.log(`📦 Merchant Order encontrada:`, {
            id: merchantOrder.id,
            status: merchantOrder.status,
            external_reference: merchantOrder.external_reference,
            payments: merchantOrder.payments?.length || 0,
          });
          
          // Processar cada payment_id encontrado na merchant_order
          if (merchantOrder.payments && merchantOrder.payments.length > 0) {
            // Filtrar payments únicos para evitar processamento duplicado
            const uniquePaymentIds = new Set<string>();
            for (const paymentInfo of merchantOrder.payments) {
              const paymentIdFromOrder = paymentInfo.id?.toString() || paymentInfo.toString();
              if (paymentIdFromOrder) {
                uniquePaymentIds.add(paymentIdFromOrder);
              }
            }
            
            console.log(`💳 Processando ${uniquePaymentIds.size} payment(s) único(s) da merchant_order`);
            
            for (const paymentIdFromOrder of uniquePaymentIds) {
              // Verificar se já foi processado recentemente
              if (this.processedPayments.has(paymentIdFromOrder)) {
                console.log(`⏭️  Payment ${paymentIdFromOrder} já foi processado recentemente, pulando...`);
                continue;
              }
              
              console.log(`💳 Processando payment_id da merchant_order: ${paymentIdFromOrder}`);
              await this.processPayment(paymentIdFromOrder);
              
              // Marcar como processado
              this.processedPayments.add(paymentIdFromOrder);
              
              // Delay entre processamentos para evitar rate limit (se houver múltiplos payments)
              if (uniquePaymentIds.size > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          } else {
            // Se não há payments ainda, usar external_reference para encontrar a compra
            if (merchantOrder.external_reference) {
              console.log(`🔍 Merchant order sem payments ainda, buscando compra pelo external_reference: ${merchantOrder.external_reference}`);
              const purchase = await this.purchaseRepository.findOne({
                where: { id: merchantOrder.external_reference },
              });
              
              if (purchase) {
                console.log(`✅ Compra encontrada pelo external_reference: ${purchase.id}`);
                // Atualizar status baseado no status da merchant_order
                let status: PaymentStatus = PaymentStatus.PENDING;
                if (merchantOrder.status === 'closed') {
                  status = PaymentStatus.PAID;
                } else if (merchantOrder.status === 'expired') {
                  status = PaymentStatus.FAILED;
                }
                
                await this.purchaseRepository.update(purchase.id, { paymentStatus: status });
                console.log(`✅ Status da compra ${purchase.id} atualizado para: ${status}`);
              }
            }
          }
        } catch (error: any) {
          console.error(`❌ Erro ao processar merchant_order ${merchantOrderId}:`, error.message);
        }
        
        return; // Já processamos o merchant_order, não precisa continuar
      }
      
      // Processamento normal para webhooks de payment
      let paymentId: string | null = null;
      
      // Tentar extrair paymentId do body primeiro
      if (data.type === 'payment') {
        // Formato padrão: { type: 'payment', data: { id: '123' } }
        paymentId = data.data?.id?.toString() || data.data_id?.toString();
      } else if (data.action === 'payment.updated' || data.action === 'payment.created') {
        // Formato alternativo: { action: 'payment.created', data: { id: '123' } }
        paymentId = data.data?.id?.toString();
      } else if (data.topic === 'payment' && data.resource) {
        // Formato: { resource: "123", topic: "payment" }
        paymentId = typeof data.resource === 'string' && !data.resource.includes('http') 
          ? data.resource 
          : null;
      }
      
      // Se não encontrou no body, tentar nos query params
      if (!paymentId) {
        if (query['data.id']) {
          paymentId = query['data.id']?.toString();
        } else if (query.id && query.topic === 'payment') {
          paymentId = query.id.toString();
        }
      }

      if (!paymentId) {
        console.warn('⚠️ Webhook recebido mas paymentId não encontrado:', { body: data, query });
        // Já respondemos 200 no início, então apenas retornar (não enviar resposta novamente)
        return;
      }

      console.log(`🔍 Buscando pagamento: ${paymentId}`);
      
      // Processar o pagamento
      await this.processPayment(paymentId);
    } catch (error: any) {
      console.error('❌ Erro no webhook:', error);
      // Já respondemos 200 no início, então apenas logar o erro
    }
  }

  /**
   * Processa um payment_id: busca a compra e atualiza o status
   */
  private async processPayment(paymentId: string): Promise<void> {
    // Buscar compra pelo paymentId (pode ser payment_id ou pref_id)
    let purchase = await this.purchaseRepository.findOne({
      where: { paymentId: paymentId },
    });

    // Se não encontrar, pode ser que a compra tenha um pref_id salvo mas o webhook enviou um payment_id
    // Nesse caso, precisamos buscar o pagamento no Mercado Pago para obter o external_reference (purchaseId)
    if (!purchase) {
      console.log(`⚠️ Compra não encontrada com paymentId: ${paymentId}. Buscando pagamento no Mercado Pago...`);
      
      try {
        // Buscar detalhes do pagamento no Mercado Pago
        const paymentDetails = await this.paymentService.getPaymentDetails(paymentId);
        
        // Obter external_reference (que é o purchaseId)
        const purchaseIdFromPayment = paymentDetails.external_reference || paymentDetails.metadata?.purchase_id;
        
        if (purchaseIdFromPayment) {
          console.log(`🔍 Encontrado purchaseId no pagamento: ${purchaseIdFromPayment}`);
          
          // Buscar compra pelo purchaseId
          purchase = await this.purchaseRepository.findOne({
            where: { id: purchaseIdFromPayment },
          });
          
          if (purchase) {
            console.log(`✅ Compra encontrada pelo purchaseId: ${purchase.id}`);
          } else {
            console.warn(`⚠️ Compra não encontrada com purchaseId: ${purchaseIdFromPayment}`);
          }
        } else {
          // Tentar buscar pelo metadata do pagamento (pode conter purchase_id)
          const purchaseIdFromMetadata = paymentDetails.metadata?.purchase_id;
          if (purchaseIdFromMetadata) {
            console.log(`🔍 Tentando buscar compra pelo metadata.purchase_id: ${purchaseIdFromMetadata}`);
            purchase = await this.purchaseRepository.findOne({
              where: { id: purchaseIdFromMetadata },
            });
            
            if (purchase) {
              console.log(`✅ Compra encontrada pelo metadata.purchase_id: ${purchase.id}`);
            }
          }
        }
      } catch (error: any) {
        console.error(`❌ Erro ao buscar pagamento no Mercado Pago:`, error.message);
        // Continuar mesmo se não conseguir buscar (pode ser que o pagamento ainda não exista)
      }
    }

    if (purchase) {
      console.log(`✅ Compra encontrada: ${purchase.id}`);
      
      // Buscar status atual do pagamento
      const paymentStatus = await this.paymentService.getPaymentStatus(paymentId);
      console.log(`📊 Status do pagamento: ${paymentStatus}`);

      let status: PaymentStatus = PaymentStatus.PENDING;

      if (paymentStatus === 'approved') {
        status = PaymentStatus.PAID;
      } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        status = PaymentStatus.FAILED;
      } else if (paymentStatus === 'refunded') {
        status = PaymentStatus.REFUNDED;
      }

      await this.purchaseRepository.update(purchase.id, { 
        paymentStatus: status,
        paymentId: paymentId, // Atualiza com o payment_id real se for diferente
      });

      console.log(`✅ Status da compra ${purchase.id} atualizado para: ${status}`);

      // Se pagamento foi aprovado, enviar email de confirmação
      if (status === PaymentStatus.PAID) {
        try {
          // Rate limiting para envio de emails (máximo 2 por segundo)
          const now = Date.now();
          const timeSinceLastEmail = now - this.lastEmailSent;
          
          if (timeSinceLastEmail < this.EMAIL_RATE_LIMIT_MS) {
            const waitTime = this.EMAIL_RATE_LIMIT_MS - timeSinceLastEmail;
            console.log(`⏳ Rate limit: aguardando ${waitTime}ms antes de enviar email...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          // Buscar compra completa com relacionamentos
          const completePurchase = await this.purchaseRepository.findOne({
            where: { id: purchase.id },
            relations: ['user', 'courses', 'courses.course', 'products', 'products.product'],
          });

          if (completePurchase && completePurchase.user) {
            // Verificar se já foi enviado email para esta compra recentemente
            const purchaseKey = `email_${purchase.id}`;
            if (this.processedPayments.has(purchaseKey)) {
              console.log(`⏭️  Email já foi enviado para compra ${purchase.id}, pulando...`);
              return;
            }

            // Processar produtos digitais (adicionar à biblioteca do usuário)
            if (completePurchase.products && completePurchase.products.length > 0) {
              const digitalProducts = completePurchase.products.filter(
                (pp) => pp.product && pp.product.type === ProductType.DIGITAL
              );

              if (digitalProducts.length > 0) {
                console.log(`📚 Processando ${digitalProducts.length} produto(s) digital(is)...`);
                // Produtos digitais já estão associados à compra, então estão disponíveis na biblioteca
                // Não precisa fazer nada adicional aqui, apenas logar
                for (const productPurchase of digitalProducts) {
                  console.log(`✅ Produto digital "${productPurchase.product?.title}" disponível na biblioteca do usuário`);
                }
              }
            }

            // Preparar dados para email
            const courses = completePurchase.courses
              ? completePurchase.courses
                  .filter((pc) => pc.course)
                  .map((pc) => {
                    const price = typeof pc.course!.price === 'string' 
                      ? parseFloat(pc.course!.price) 
                      : pc.course!.price;
                    return {
                      title: pc.course!.title,
                      price: price,
                    };
                  })
              : [];

            const products = completePurchase.products
              ? completePurchase.products
                  .filter((pp) => pp.product)
                  .map((pp) => {
                    const price = typeof pp.price === 'string' 
                      ? parseFloat(pp.price) 
                      : pp.price;
                    return {
                      title: pp.product!.title,
                      price: price,
                      quantity: pp.quantity,
                      type: pp.product!.type,
                    };
                  })
              : [];

            const totalAmount = completePurchase.totalAmount 
              ? (typeof completePurchase.totalAmount === 'string' 
                  ? parseFloat(completePurchase.totalAmount) 
                  : completePurchase.totalAmount)
              : courses.reduce((sum, c) => sum + c.price, 0) + 
                products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

            // Enviar email de confirmação
            await emailService.sendPurchaseConfirmationEmail(
              completePurchase.user.email,
              completePurchase.user.name,
              courses,
              totalAmount,
              products
            );

            // Enviar email para admin sobre produtos físicos
            const physicalProducts = products.filter((p) => p.type === ProductType.PHYSICAL);
            if (physicalProducts.length > 0) {
              try {
                await emailService.sendAdminPhysicalProductNotification(
                  completePurchase.user.email,
                  completePurchase.user.name,
                  physicalProducts,
                  completePurchase.id
                );
              } catch (error) {
                console.error('Erro ao enviar email para admin sobre produtos físicos:', error);
              }
            }
            
            // Marcar como enviado e atualizar timestamp
            this.processedPayments.add(purchaseKey);
            this.lastEmailSent = Date.now();
            
            console.log(`📧 Email de confirmação enviado para: ${completePurchase.user.email}`);
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de confirmação de compra:', emailError);
          // Não falhar o webhook se o email falhar
        }
      }
    } else {
      console.warn(`⚠️ Compra não encontrada para paymentId: ${paymentId}. Webhook pode ser de um pagamento não relacionado a uma compra.`);
    }

    // Já respondemos 200 no início, então apenas logar
    console.log(`✅ Webhook processado com sucesso para paymentId: ${paymentId}`);
  }

  public getRouter(): Router {
    return this.router;
  }
}

