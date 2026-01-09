import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Coupon } from '../entities/Coupon.entity';
import { Purchase } from '../entities/Purchase.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import { calculateDiscount } from '../utils/helpers';

export class CouponController {
  private router: Router;
  private couponRepository: Repository<Coupon>;
  private purchaseRepository: Repository<Purchase>;

  constructor() {
    this.router = Router();
    this.couponRepository = AppDataSource.getRepository(Coupon);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota pública para validação de cupom
    this.router.get('/validate/:code', this.validate.bind(this));

    // Rotas administrativas
    this.router.use(AuthMiddleware.authenticate);
    this.router.use(AuthMiddleware.requireAdmin);
    this.router.get('/', this.getAll.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.get('/:code/usage', this.getUsage.bind(this));
    this.router.post('/', validateDto(CreateCouponDto), this.create.bind(this));
    this.router.put('/:id', validateDto(UpdateCouponDto), this.update.bind(this));
    this.router.put('/:id/toggle', this.toggle.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  private async validate(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const { totalAmount } = req.query;

      const coupon = await this.couponRepository.findOne({
        where: { code: code.toUpperCase() },
      });

      if (
        !coupon ||
        !coupon.active ||
        coupon.currentUses >= coupon.maxUses ||
        (coupon.expiresAt && coupon.expiresAt < new Date())
      ) {
        return res.json({
          valid: false,
          discountAmount: 0,
          finalAmount: Number(totalAmount),
        });
      }

      const discountAmount = calculateDiscount(
        Number(totalAmount),
        Number(coupon.discount),
        coupon.type
      );
      const finalAmount = Number(totalAmount) - discountAmount;

      return res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount: coupon.discount,
          type: coupon.type,
        },
        discountAmount,
        finalAmount,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getAll(_req: Request, res: Response) {
    try {
      const coupons = await this.couponRepository.find({
        order: { createdAt: 'DESC' },
      });
      return res.json({ coupons });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const couponData = {
        ...req.body,
        code: req.body.code.toUpperCase(),
      };
      const coupon = this.couponRepository.create(couponData);
      const savedCoupon = await this.couponRepository.save(coupon);
      res.status(201).json({ coupon: savedCoupon });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.couponRepository.update(id, req.body);
      const coupon = await this.couponRepository.findOne({ where: { id } });
      res.json({ coupon });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.couponRepository.delete(id);
      res.json({ message: 'Cupom deletado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await this.couponRepository.findOne({ where: { id } });
      if (!coupon) {
        return res.status(404).json({ message: 'Cupom não encontrado' });
      }
      return res.json({ coupon });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getUsage(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const coupon = await this.couponRepository.findOne({ where: { code } });
      if (!coupon) {
        return res.status(404).json({ message: 'Cupom não encontrado' });
      }

      // Buscar compras que usaram este cupom
      const purchases = await this.purchaseRepository.find({
        where: { couponId: coupon.id },
        relations: ['user'],
      });

      const totalUsage = purchases.length;
      const totalDiscount = purchases.reduce((sum, p) => sum + Number(p.discountAmount), 0);
      const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.finalAmount), 0);

      return res.json({
        coupon: {
          id: coupon.id,
          code: coupon.code,
          currentUses: coupon.currentUses,
          maxUses: coupon.maxUses,
        },
        usage: {
          totalUsage,
          totalDiscount,
          totalRevenue,
          purchases: purchases.map((p) => ({
            id: p.id,
            userId: p.userId,
            userName: p.user?.name,
            finalAmount: p.finalAmount,
            discountAmount: p.discountAmount,
            createdAt: p.createdAt,
          })),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async toggle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const coupon = await this.couponRepository.findOne({ where: { id } });
      if (!coupon) {
        return res.status(404).json({ message: 'Cupom não encontrado' });
      }

      coupon.active = !coupon.active;
      const updatedCoupon = await this.couponRepository.save(coupon);

      return res.json({
        coupon: updatedCoupon,
        message: `Cupom ${updatedCoupon.active ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

