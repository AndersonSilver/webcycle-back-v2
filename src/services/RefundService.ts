import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Refund, RefundStatus } from '../entities/Refund.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { RequestRefundDto, RejectRefundDto } from '../dto/refund.dto';
import { PaymentService } from './PaymentService';

export class RefundService {
  private refundRepository: Repository<Refund>;
  private purchaseRepository: Repository<Purchase>;
  private paymentService: PaymentService;

  constructor() {
    this.refundRepository = AppDataSource.getRepository(Refund);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.paymentService = new PaymentService();
  }

  async requestRefund(userId: string, data: RequestRefundDto) {
    // Buscar compra
    const purchase = await this.purchaseRepository.findOne({
      where: { id: data.purchaseId, userId },
      relations: ['courses'],
    });

    if (!purchase) {
      throw new Error('Compra não encontrada');
    }

    if (purchase.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Apenas compras pagas podem ser reembolsadas');
    }

    // Verificar prazo de garantia (7 dias)
    const purchaseDate = new Date(purchase.createdAt);
    const now = new Date();
    const daysSincePurchase = Math.floor(
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase > 7) {
      throw new Error('O prazo de garantia de 7 dias expirou');
    }

    // Verificar se já existe solicitação de reembolso
    const existingRefund = await this.refundRepository.findOne({
      where: { purchaseId: data.purchaseId },
    });

    if (existingRefund) {
      if (existingRefund.status === RefundStatus.APPROVED) {
        throw new Error('Reembolso já foi aprovado');
      }
      if (existingRefund.status === RefundStatus.PENDING) {
        throw new Error('Já existe uma solicitação de reembolso pendente');
      }
    }

    // Criar solicitação de reembolso
    const refund = this.refundRepository.create({
      userId,
      purchaseId: data.purchaseId,
      reason: data.reason,
      comment: data.comment,
      status: RefundStatus.PENDING,
      requestedAt: new Date(),
    });

    return this.refundRepository.save(refund);
  }

  async getUserRefunds(userId: string) {
    return this.refundRepository.find({
      where: { userId },
      relations: ['purchase'],
      order: { requestedAt: 'DESC' },
    });
  }

  async getAllRefunds(status?: RefundStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.refundRepository.find({
      where,
      relations: ['purchase', 'user'],
      order: { requestedAt: 'DESC' },
    });
  }

  async approveRefund(refundId: string) {
    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
      relations: ['purchase'],
    });

    if (!refund) {
      throw new Error('Reembolso não encontrado');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error('Apenas reembolsos pendentes podem ser aprovados');
    }

    if (!refund.purchase.paymentId) {
      throw new Error('Compra não possui ID de pagamento');
    }

    // Processar reembolso no gateway de pagamento
    try {
      await this.paymentService.refundPayment(refund.purchase.paymentId);
    } catch (error) {
      throw new Error('Erro ao processar reembolso no gateway de pagamento');
    }

    // Atualizar status
    refund.status = RefundStatus.APPROVED;
    refund.processedAt = new Date();

    // Atualizar status da compra
    refund.purchase.paymentStatus = PaymentStatus.REFUNDED;
    await this.purchaseRepository.save(refund.purchase);

    return this.refundRepository.save(refund);
  }

  async rejectRefund(refundId: string, data: RejectRefundDto) {
    const refund = await this.refundRepository.findOne({
      where: { id: refundId },
    });

    if (!refund) {
      throw new Error('Reembolso não encontrado');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error('Apenas reembolsos pendentes podem ser rejeitados');
    }

    refund.status = RefundStatus.REJECTED;
    refund.rejectionReason = data.reason;
    refund.processedAt = new Date();

    return this.refundRepository.save(refund);
  }

  getDaysRemaining(purchaseDate: Date): number {
    const now = new Date();
    const daysSincePurchase = Math.floor(
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 7 - daysSincePurchase);
  }
}

