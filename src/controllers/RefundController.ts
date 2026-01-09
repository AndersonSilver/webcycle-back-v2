import { Request, Response, Router } from 'express';
import { RefundService } from '../services/RefundService';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { RequestRefundDto, RejectRefundDto } from '../dto/refund.dto';

export class RefundController {
  private router: Router;
  private refundService: RefundService;

  constructor() {
    this.router = Router();
    this.refundService = new RefundService();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas do usuário
    this.router.post(
      '/request',
      AuthMiddleware.authenticate,
      validateDto(RequestRefundDto),
      this.requestRefund.bind(this)
    );
    this.router.get(
      '/my-refunds',
      AuthMiddleware.authenticate,
      this.getMyRefunds.bind(this)
    );

    // Rotas administrativas
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.getAll.bind(this)
    );
    this.router.put(
      '/:id/approve',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.approve.bind(this)
    );
    this.router.put(
      '/:id/reject',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(RejectRefundDto),
      this.reject.bind(this)
    );
  }

  private async requestRefund(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const refund = await this.refundService.requestRefund(user.id, req.body);
      return res.status(201).json({ refund });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  private async getMyRefunds(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const refunds = await this.refundService.getUserRefunds(user.id);
      return res.json({ refunds });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const refunds = await this.refundService.getAllRefunds(status as any);
      return res.json({ refunds });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const refund = await this.refundService.approveRefund(id);
      return res.json({ refund });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  private async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const refund = await this.refundService.rejectRefund(id, req.body);
      return res.json({ refund });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

