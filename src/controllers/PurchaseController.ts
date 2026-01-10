import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Purchase, PaymentStatus, PaymentMethod } from '../entities/Purchase.entity';
import { PurchaseCourse } from '../entities/PurchaseCourse.entity';
import { Course } from '../entities/Course.entity';
import { User } from '../entities/User.entity';
import { Coupon } from '../entities/Coupon.entity';
import { PaymentService } from '../services/PaymentService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CheckoutDto, ConfirmPurchaseDto, ProcessPaymentDto } from '../dto/purchase.dto';
import { calculateDiscount } from '../utils/helpers';

export class PurchaseController {
  private router: Router;
  private purchaseRepository: Repository<Purchase>;
  private purchaseCourseRepository: Repository<PurchaseCourse>;
  private courseRepository: Repository<Course>;
  private couponRepository: Repository<Coupon>;
  private paymentService: PaymentService;

  constructor() {
    this.router = Router();
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.purchaseCourseRepository = AppDataSource.getRepository(PurchaseCourse);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.couponRepository = AppDataSource.getRepository(Coupon);
    this.paymentService = new PaymentService();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.post('/checkout', validateDto(CheckoutDto), this.checkout.bind(this));
    this.router.post('/validate-token', this.validateToken.bind(this));
    this.router.post('/:id/process', validateDto(ProcessPaymentDto), this.processPayment.bind(this));
    this.router.post('/:id/confirm', validateDto(ConfirmPurchaseDto), this.confirm.bind(this));
    this.router.get('/my-purchases', this.getMyPurchases.bind(this));
    this.router.get('/my-purchases/stats', this.getMyPurchasesStats.bind(this));
    this.router.get('/:id/payment-details', this.getPaymentDetails.bind(this));
    this.router.get('/:id', this.getById.bind(this));
  }

  private async checkout(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courses: courseIds, paymentMethod, couponCode } = req.body as CheckoutDto;

      // Buscar cursos
      const courses = await this.courseRepository.find({
        where: courseIds.map((id) => ({ id })),
      });

      if (courses.length !== courseIds.length) {
        return res.status(400).json({ message: 'Um ou mais cursos não encontrados' });
      }

      // ✅ Verificar se o usuário já possui algum dos cursos
      const existingPurchases = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .innerJoin('purchase.courses', 'pc')
        .where('purchase.userId = :userId', { userId: user.id })
        .andWhere('pc.courseId IN (:...courseIds)', { courseIds })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .getMany();

      if (existingPurchases.length > 0) {
        // Buscar quais cursos já foram comprados
        const purchasedCourseIds: string[] = [];
        for (const purchase of existingPurchases) {
          const purchaseCourses = await this.purchaseCourseRepository.find({
            where: { purchaseId: purchase.id },
          });
          purchaseCourses.forEach(pc => {
            if (courseIds.includes(pc.courseId) && !purchasedCourseIds.includes(pc.courseId)) {
              purchasedCourseIds.push(pc.courseId);
            }
          });
        }

        if (purchasedCourseIds.length > 0) {
          const purchasedCourses = await this.courseRepository.find({
            where: purchasedCourseIds.map(id => ({ id })),
          });
          const courseTitles = purchasedCourses.map(c => c.title).join(', ');
          return res.status(400).json({ 
            message: `Você já possui o(s) seguinte(s) curso(s): ${courseTitles}`,
            alreadyOwned: purchasedCourseIds,
          });
        }
      }

      // Calcular totais
      // Valor atual dos cursos (já com desconto do curso aplicado)
      let totalAmount = courses.reduce((sum, course) => sum + Number(course.price), 0);
      
      // Valor original dos cursos (antes de qualquer desconto)
      let totalOriginal = courses.reduce((sum, course) => {
        const originalPrice = course.originalPrice 
          ? Number(course.originalPrice) 
          : Number(course.price);
        return sum + originalPrice;
      }, 0);
      
      // Desconto do curso (diferença entre original e atual)
      // Nota: courseDiscount é usado apenas para cálculo, não precisa ser armazenado separadamente
      
      // Desconto do cupom (será calculado sobre o valor atual)
      let discountAmount = 0;
      let couponId: string | undefined = undefined;

      // ✅ SEGURANÇA: Validar e aplicar cupom no backend
      if (couponCode) {
        const coupon = await this.couponRepository.findOne({
          where: { code: couponCode.toUpperCase() },
        });

        if (coupon) {
          // Validar cupom
          const isValid = 
            coupon.active &&
            coupon.currentUses < coupon.maxUses &&
            (!coupon.expiresAt || coupon.expiresAt >= new Date());

          if (isValid) {
            // Verificar se o cupom se aplica aos cursos selecionados
            const applicableToCourses = 
              !coupon.applicableCourses || 
              coupon.applicableCourses.length === 0 ||
              courseIds.some(courseId => coupon.applicableCourses?.includes(courseId));

            if (applicableToCourses) {
              // ✅ IMPORTANTE: Calcular desconto do cupom sobre o valor JÁ COM DESCONTO DO CURSO
              discountAmount = calculateDiscount(
                totalAmount,
                Number(coupon.discount),
                coupon.type
              );
              couponId = coupon.id;
            }
          }
        }
      }

      // Total final = valor atual - desconto do cupom
      let finalAmount = totalAmount - discountAmount;
      
      // ✅ Validação: garantir que o valor final seja válido
      if (isNaN(finalAmount) || finalAmount < 0) {
        console.error('❌ Valor final inválido:', { totalAmount, discountAmount, finalAmount });
        finalAmount = Math.max(0, totalAmount - discountAmount); // Garantir que não seja negativo
      }
      
      // Garantir que o valor tenha no máximo 2 casas decimais
      finalAmount = Number(finalAmount.toFixed(2));
      
      if (finalAmount <= 0) {
        return res.status(400).json({ 
          message: 'O valor final da compra deve ser maior que zero. Verifique os descontos aplicados.' 
        });
      }

      // Calcular desconto total (curso + cupom)
      const totalDiscount = (totalOriginal - totalAmount) + discountAmount;

      // Criar compra
      const purchase = this.purchaseRepository.create({
        userId: user.id,
        totalAmount,
        discountAmount: totalDiscount, // Desconto total (curso + cupom)
        finalAmount,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        couponId: couponId,
      });

      const savedPurchase = await this.purchaseRepository.save(purchase);

      // ✅ SEGURANÇA: Incrementar uso do cupom se foi aplicado
      if (couponId) {
        await this.couponRepository.increment({ id: couponId }, 'currentUses', 1);
      }

      // Criar relacionamentos com cursos
      const purchaseCourses = courseIds.map((courseId) =>
        this.purchaseCourseRepository.create({
          purchaseId: savedPurchase.id,
          courseId,
        })
      );
      await this.purchaseCourseRepository.save(purchaseCourses);

      // Criar pagamento com informações completas para melhorar aprovação do Mercado Pago
      const payment = await this.paymentService.createPayment({
        amount: finalAmount,
        description: `Compra de ${courses.length} curso(s)`,
        purchaseId: savedPurchase.id,
        paymentMethod,
        payerEmail: user.email,
        payerName: user.name,
        // ✅ Passar informações dos cursos para melhorar detalhamento (26 pontos)
        courses: courses.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || course.subtitle || `Curso: ${course.title}`,
          price: Number(course.price),
          category: course.category,
          quantity: 1, // Cada curso tem quantidade 1
        })),
      });

      // Atualizar compra com ID do pagamento
      await this.purchaseRepository.update(savedPurchase.id, { paymentId: payment.id });

      return res.json({
        purchaseId: savedPurchase.id,
        totalAmount,
        discountAmount,
        finalAmount,
        payment: {
          method: paymentMethod,
          pixCode: payment.pixCode,
          boletoUrl: payment.boletoUrl,
          paymentLink: payment.paymentLink,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async processPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const purchase = await this.purchaseRepository.findOne({
        where: { id },
        relations: ['courses', 'courses.course'],
      });

      if (!purchase) {
        return res.status(404).json({ message: 'Compra não encontrada' });
      }

      if (purchase.userId !== user.id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (purchase.paymentMethod !== PaymentMethod.CREDIT_CARD) {
        return res.status(400).json({ message: 'Este endpoint é apenas para pagamentos com cartão de crédito' });
      }

      if (purchase.paymentStatus !== PaymentStatus.PENDING) {
        return res.status(400).json({ message: 'Esta compra já foi processada' });
      }

      const cardData = req.body as ProcessPaymentDto;

      // Validar token
      if (!cardData.token || cardData.token.trim() === '') {
        return res.status(400).json({ 
          message: 'Token do cartão é obrigatório. Certifique-se de que o Mercado Pago JS está configurado corretamente no frontend.' 
        });
      }

      console.log('💳 Iniciando processamento de pagamento:', {
        purchaseId: purchase.id,
        amount: purchase.finalAmount,
        tokenLength: cardData.token.length,
        installments: cardData.installments,
      });

      // Processar pagamento com cartão
      const paymentResult = await this.paymentService.processCardPayment({
        amount: Number(purchase.finalAmount),
        description: `Compra de ${purchase.courses.length} curso(s)`,
        purchaseId: purchase.id,
        payerEmail: user.email,
        payerName: user.name,
        token: cardData.token, // Token gerado pelo Mercado Pago JS no frontend
        installments: cardData.installments ? parseInt(cardData.installments) : 1,
        paymentMethodId: cardData.paymentMethodId,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber,
      });

      // Atualizar status da compra
      let newStatus: PaymentStatus = PaymentStatus.PENDING;
      if (paymentResult.status === 'approved') {
        newStatus = PaymentStatus.PAID;
      } else if (paymentResult.status === 'rejected' || paymentResult.status === 'cancelled') {
        newStatus = PaymentStatus.FAILED;
      }

      await this.purchaseRepository.update(purchase.id, {
        paymentStatus: newStatus,
        paymentId: paymentResult.id,
      });

      const updatedPurchase = await this.purchaseRepository.findOne({
        where: { id },
        relations: ['courses', 'courses.course'],
      });

      return res.json({
        purchase: updatedPurchase,
        payment: {
          id: paymentResult.id,
          status: paymentResult.status,
          statusDetail: paymentResult.statusDetail,
          threeDSInfo: paymentResult.threeDSInfo,
        },
      });
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      return res.status(500).json({ message: error.message || 'Erro ao processar pagamento' });
    }
  }

  private async confirm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { paymentId } = req.body as ConfirmPurchaseDto;

      const purchase = await this.purchaseRepository.findOne({
        where: { id },
        relations: ['courses', 'courses.course'],
      });

      if (!purchase) {
        return res.status(404).json({ message: 'Compra não encontrada' });
      }

      // Para pagamentos via Checkout Pro (cartão), o paymentId é na verdade um pref_id
      // O status real só é conhecido via webhook após o pagamento ser processado
      // Este endpoint serve principalmente para PIX/Boleto onde temos o payment_id direto
      
      const finalPaymentId = paymentId || purchase.paymentId || '';
      
      if (!finalPaymentId) {
        return res.status(400).json({ 
          message: 'ID do pagamento não fornecido. Para pagamentos com cartão, aguarde o processamento via webhook.' 
        });
      }

      // Verificar se é uma preferência (Checkout Pro) ou pagamento direto
      const isPreferenceId = finalPaymentId.includes('-') && finalPaymentId.split('-').length > 2;
      const isInvalidPaymentId = finalPaymentId.startsWith('payment_') && finalPaymentId.length < 20;
      
      // Para Checkout Pro (cartão), o paymentId é um pref_id
      // O status só é conhecido via webhook após o pagamento ser processado
      if (purchase.paymentMethod === PaymentMethod.CREDIT_CARD) {
        if (isPreferenceId) {
          // É um pref_id válido - não podemos consultar status diretamente
          return res.json({ 
            purchase,
            message: 'Para pagamentos com cartão via Checkout Pro, o status será atualizado automaticamente via webhook após o processamento do pagamento.',
            status: purchase.paymentStatus,
            paymentId: finalPaymentId,
          });
        } else if (isInvalidPaymentId) {
          // ID inválido ou gerado pelo frontend - não tentar consultar
          console.warn(`⚠️ ID de pagamento inválido recebido: ${finalPaymentId}. Para Checkout Pro, use o pref_id ou aguarde o webhook.`);
          return res.json({ 
            purchase,
            message: 'ID de pagamento inválido. Para pagamentos com cartão, o status será atualizado automaticamente via webhook após o processamento.',
            status: purchase.paymentStatus,
            paymentId: purchase.paymentId, // Retorna o pref_id salvo
          });
        }
      }

      // Para PIX/Boleto, podemos consultar o status diretamente
      try {
        const paymentStatus = await this.paymentService.getPaymentStatus(finalPaymentId);
        
        // Atualizar status
        const newStatus =
          paymentStatus === 'approved' ? PaymentStatus.PAID : PaymentStatus.PENDING;

        await this.purchaseRepository.update(id, {
          paymentStatus: newStatus,
          paymentId: finalPaymentId,
        });

        const updatedPurchase = await this.purchaseRepository.findOne({
          where: { id },
          relations: ['courses', 'courses.course'],
        });

        return res.json({ purchase: updatedPurchase });
      } catch (error: any) {
        // Se não conseguir consultar, mantém o status atual
        console.warn(`⚠️ Não foi possível consultar status do pagamento ${finalPaymentId}:`, error.message);
        return res.json({ 
          purchase,
          message: 'Não foi possível consultar o status do pagamento. O status será atualizado via webhook.',
          status: purchase.paymentStatus,
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMyPurchases(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const purchases = await this.purchaseRepository.find({
        where: { userId: user.id },
        relations: ['courses', 'courses.course'],
        order: { createdAt: 'DESC' },
      });

      return res.json({ purchases });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const purchase = await this.purchaseRepository.findOne({
        where: { id },
        relations: ['courses', 'courses.course', 'coupon'],
      });

      if (!purchase) {
        return res.status(404).json({ message: 'Compra não encontrada' });
      }

      if (purchase.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      return res.json({ purchase });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMyPurchasesStats(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const purchases = await this.purchaseRepository.find({
        where: { userId: user.id },
        relations: ['courses', 'courses.course'],
      });

      const totalPurchases = purchases.length;
      const totalSpent = purchases.reduce((sum, p) => sum + Number(p.finalAmount), 0);
      const paidPurchases = purchases.filter((p) => p.paymentStatus === PaymentStatus.PAID);
      const pendingPurchases = purchases.filter((p) => p.paymentStatus === PaymentStatus.PENDING);
      const totalCourses = purchases.reduce(
        (sum, p) => sum + p.courses.length,
        0
      );

      const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      return res.json({
        totalPurchases,
        totalSpent,
        totalCourses,
        paidPurchases: paidPurchases.length,
        pendingPurchases: pendingPurchases.length,
        averageTicket,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getPaymentDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const purchase = await this.purchaseRepository.findOne({
        where: { id },
      });

      if (!purchase) {
        return res.status(404).json({ message: 'Compra não encontrada' });
      }

      if (purchase.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (!purchase.paymentId) {
        return res.status(400).json({ message: 'ID do pagamento não encontrado nesta compra' });
      }

      const paymentDetails = await this.paymentService.getPaymentDetails(purchase.paymentId);

      return res.json({
        purchaseId: purchase.id,
        paymentId: purchase.paymentId,
        paymentDetails,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          valid: false,
          message: 'Token não fornecido',
        });
      }

      console.log('🔍 Validando token recebido:', {
        token: token.substring(0, 10) + '...' + token.substring(token.length - 5),
        length: token.length,
        timestamp: new Date().toISOString(),
      });

      const validation = await this.paymentService.validateToken(token);

      if (validation.valid) {
        return res.json({
          valid: true,
          message: validation.message,
          details: validation.details,
        });
      } else {
        return res.status(400).json({
          valid: false,
          message: validation.message,
          details: validation.details,
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        valid: false,
        message: `Erro ao validar token: ${error.message}`,
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

