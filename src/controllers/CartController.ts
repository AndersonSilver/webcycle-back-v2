import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { CartItem } from '../entities/CartItem.entity';
import { Coupon } from '../entities/Coupon.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class CartController {
  private router: Router;
  private cartItemRepository: Repository<CartItem>;
  private couponRepository: Repository<Coupon>;

  constructor() {
    this.router = Router();
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
    this.couponRepository = AppDataSource.getRepository(Coupon);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.get('/', this.getCart.bind(this));
    this.router.get('/total', this.getTotal.bind(this));
    this.router.post('/add', this.addToCart.bind(this));
    this.router.post('/apply-coupon', this.applyCoupon.bind(this));
    this.router.delete('/remove-coupon', this.removeCoupon.bind(this));
    this.router.delete('/remove/:courseId', this.removeFromCart.bind(this));
    this.router.delete('/clear', this.clearCart.bind(this));
  }

  private async getCart(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const cartItems = await this.cartItemRepository.find({
        where: { userId: user.id },
        relations: ['course'],
        order: { createdAt: 'DESC' },
      });

      const total = cartItems.reduce((sum, item) => sum + Number(item.course.price), 0);

      return res.json({
        items: cartItems,
        total,
        count: cartItems.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async addToCart(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.body;

      // ✅ Verificar se o usuário já possui o curso
      const { AppDataSource } = await import('../config/database.config');
      const { Purchase, PaymentStatus } = await import('../entities/Purchase.entity');
      const purchaseRepository = AppDataSource.getRepository(Purchase);
      
      const existingPurchase = await purchaseRepository
        .createQueryBuilder('purchase')
        .innerJoin('purchase.courses', 'pc')
        .where('purchase.userId = :userId', { userId: user.id })
        .andWhere('pc.courseId = :courseId', { courseId })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .getOne();

      if (existingPurchase) {
        return res.status(400).json({ 
          message: 'Você já possui este curso. Acesse em "Meus Cursos".',
          alreadyOwned: true,
        });
      }

      const existingItem = await this.cartItemRepository.findOne({
        where: { userId: user.id, courseId },
      });

      if (existingItem) {
        return res.status(400).json({ message: 'Curso já está no carrinho' });
      }

      const cartItem = this.cartItemRepository.create({
        userId: user.id,
        courseId,
      });

      const savedItem = await this.cartItemRepository.save(cartItem);
      return res.status(201).json({ cartItem: savedItem });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async removeFromCart(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      await this.cartItemRepository.delete({
        userId: user.id,
        courseId,
      });

      return res.json({ message: 'Item removido do carrinho' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async clearCart(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      await this.cartItemRepository.delete({ userId: user.id });
      return res.json({ message: 'Carrinho limpo com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getTotal(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const cartItems = await this.cartItemRepository.find({
        where: { userId: user.id },
        relations: ['course'],
      });

      const subtotal = cartItems.reduce((sum, item) => sum + Number(item.course.price), 0);
      const discount = 0; // TODO: Aplicar desconto do cupom se houver
      const total = subtotal - discount;

      return res.json({
        subtotal,
        discount,
        total,
        count: cartItems.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async applyCoupon(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { code } = req.body;

      const coupon = await this.couponRepository.findOne({
        where: { code: code.toUpperCase(), active: true },
      });

      if (!coupon) {
        return res.status(404).json({ message: 'Cupom inválido' });
      }

      // TODO: Armazenar cupom aplicado no carrinho
      return res.json({ coupon, message: 'Cupom aplicado com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async removeCoupon(_req: Request, res: Response) {
    try {
      // TODO: Remover cupom do carrinho
      return res.json({ message: 'Cupom removido com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

