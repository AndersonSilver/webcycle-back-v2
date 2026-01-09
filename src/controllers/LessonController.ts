import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Lesson } from '../entities/Lesson.entity';
import { Material } from '../entities/Material.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { Progress } from '../entities/Progress.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class LessonController {
  private router: Router;
  private lessonRepository: Repository<Lesson>;
  private materialRepository: Repository<Material>;
  private purchaseRepository: Repository<Purchase>;
  private progressRepository: Repository<Progress>;

  constructor() {
    this.router = Router();
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.materialRepository = AppDataSource.getRepository(Material);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.progressRepository = AppDataSource.getRepository(Progress);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get('/:lessonId', AuthMiddleware.authenticate, this.getById.bind(this));
    this.router.get(
      '/:lessonId/materials',
      AuthMiddleware.authenticate,
      this.getMaterials.bind(this)
    );
  }

  private async getById(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { lessonId } = req.params;

      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module', 'module.course'],
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      // Verificar acesso
      let hasAccess = false;
      if (lesson.free) {
        hasAccess = true;
      } else {
        const purchase = await this.purchaseRepository
          .createQueryBuilder('purchase')
          .innerJoin('purchase.courses', 'pc')
          .where('purchase.userId = :userId', { userId: user.id })
          .andWhere('pc.courseId = :courseId', { courseId: lesson.module.course.id })
          .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
          .getOne();

        hasAccess = !!purchase;
      }

      // Buscar progresso
      const progress = await this.progressRepository.findOne({
        where: { userId: user.id, lessonId },
      });

      return res.json({
        lesson: {
          ...lesson,
          module: {
            id: lesson.module.id,
            title: lesson.module.title,
            course: {
              id: lesson.module.course.id,
              title: lesson.module.course.title,
            },
          },
        },
        hasAccess,
        progress: progress
          ? {
              completed: progress.completed,
              watchedDuration: progress.watchedDuration,
            }
          : null,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMaterials(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { lessonId } = req.params;

      // Verificar acesso à aula
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module', 'module.course'],
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      // Verificar acesso (mesma lógica do getById)
      let hasAccess = false;
      if (lesson.free) {
        hasAccess = true;
      } else {
        const purchase = await this.purchaseRepository
          .createQueryBuilder('purchase')
          .innerJoin('purchase.courses', 'pc')
          .where('purchase.userId = :userId', { userId: user.id })
          .andWhere('pc.courseId = :courseId', { courseId: lesson.module.course.id })
          .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
          .getOne();

        hasAccess = !!purchase;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: 'Você não tem acesso a esta aula' });
      }

      const materials = await this.materialRepository.find({
        where: { lessonId },
        order: { createdAt: 'ASC' },
      });

      return res.json({ materials });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

