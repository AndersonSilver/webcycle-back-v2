import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { PaymentService } from '../services/PaymentService';
import { emailService } from '../services/EmailService';

export class WebhookController {
  private router: Router;
  private purchaseRepository: Repository<Purchase>;
  private paymentService: PaymentService;

  constructor() {
    this.router = Router();
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.paymentService = new PaymentService();
    this.setupRoutes();
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
    
    try {
      // Responder imediatamente para evitar timeout do Mercado Pago
      console.log('✅ [WEBHOOK CONTROLLER] Enviando resposta 200');
      res.status(200).json({ received: true });
      
      const data = req.body;
      
      // Log para debug
      console.log('🔔 Webhook recebido do Mercado Pago:', JSON.stringify(data, null, 2));

      // Mercado Pago pode enviar webhooks em diferentes formatos
      // Formato 1: { type: 'payment', data: { id: '123' } }
      // Formato 2: { action: 'payment.updated', data: { id: '123' }, type: 'payment' }
      
      let paymentId: string | null = null;
      
      if (data.type === 'payment') {
        // Formato padrão
        paymentId = data.data?.id?.toString() || data.data_id?.toString();
      } else if (data.action === 'payment.updated' || data.action === 'payment.created') {
        // Formato alternativo (simulação)
        paymentId = data.data?.id?.toString();
      }

      if (!paymentId) {
        console.warn('⚠️ Webhook recebido mas paymentId não encontrado:', data);
        res.status(200).json({ received: true, message: 'Webhook recebido mas paymentId não encontrado' });
        return;
      }

      console.log(`🔍 Buscando pagamento: ${paymentId}`);

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
            // Buscar compra completa com relacionamentos
            const completePurchase = await this.purchaseRepository.findOne({
              where: { id: purchase.id },
              relations: ['user', 'courses', 'courses.course'],
            });

            if (completePurchase && completePurchase.user && completePurchase.courses) {
              const courses = completePurchase.courses
                .filter((pc) => pc.course)
                .map((pc) => {
                  const price = typeof pc.course!.price === 'string' 
                    ? parseFloat(pc.course!.price) 
                    : pc.course!.price;
                  return {
                    title: pc.course!.title,
                    price: price,
                  };
                });

              const totalAmount = completePurchase.totalAmount 
                ? (typeof completePurchase.totalAmount === 'string' 
                    ? parseFloat(completePurchase.totalAmount) 
                    : completePurchase.totalAmount)
                : courses.reduce((sum, c) => sum + c.price, 0);

              await emailService.sendPurchaseConfirmationEmail(
                completePurchase.user.email,
                completePurchase.user.name,
                courses,
                totalAmount
              );
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
    } catch (error: any) {
      console.error('❌ Erro no webhook:', error);
      // Já respondemos 200 no início, então apenas logar o erro
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

