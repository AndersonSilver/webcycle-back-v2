import { Request, Response, Router } from 'express';
import { NotificationService } from '../services/NotificationService';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class NotificationController {
  private router: Router;
  private notificationService: NotificationService;

  constructor() {
    this.router = Router();
    this.notificationService = new NotificationService();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.get('/', this.getAll.bind(this));
    this.router.put('/:id/read', this.markAsRead.bind(this));
    this.router.put('/read-all', this.markAllAsRead.bind(this));
    this.router.delete('/:id', this.delete.bind(this));
  }

  private async getAll(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { unreadOnly, page = 1, limit = 10 } = req.query;

      const notifications = await this.notificationService.getUserNotifications(
        user.id,
        unreadOnly === 'true'
      );

      const unreadCount = await this.notificationService.getUnreadCount(user.id);

      const skip = (Number(page) - 1) * Number(limit);
      const paginatedNotifications = notifications.slice(skip, skip + Number(limit));

      return res.json({
        notifications: paginatedNotifications,
        unreadCount,
        total: notifications.length,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async markAsRead(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id, user.id);
      return res.json({ notification });
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  private async markAllAsRead(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      await this.notificationService.markAllAsRead(user.id);
      return res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { id } = req.params;
      await this.notificationService.deleteNotification(id, user.id);
      return res.json({ message: 'Notificação deletada com sucesso' });
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

