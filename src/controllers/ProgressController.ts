import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Progress } from '../entities/Progress.entity';
import { Course } from '../entities/Course.entity';
import { Lesson } from '../entities/Lesson.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { calculateProgress } from '../utils/helpers';

export class ProgressController {
  private router: Router;
  private progressRepository: Repository<Progress>;
  private courseRepository: Repository<Course>;
  private lessonRepository: Repository<Lesson>;
  private purchaseRepository: Repository<Purchase>;
  private userRepository: Repository<User>;

  constructor() {
    this.router = Router();
    this.progressRepository = AppDataSource.getRepository(Progress);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.userRepository = AppDataSource.getRepository(User);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.get('/course/:courseId', this.getCourseProgress.bind(this));
    this.router.get('/my-courses', this.getMyCourses.bind(this));
    this.router.get('/lesson/:lessonId', this.getLessonProgress.bind(this));
    this.router.get('/stats', this.getStats.bind(this));
    this.router.get('/history', this.getHistory.bind(this));
    this.router.post('/lesson/:lessonId/complete', this.completeLesson.bind(this));
    this.router.put('/lesson/:lessonId/watch', this.updateWatchTime.bind(this));
  }

  private async getCourseProgress(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      // Verificar acesso através de PurchaseCourse
      const purchase = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .innerJoin('purchase.courses', 'pc')
        .where('purchase.userId = :userId', { userId: user.id })
        .andWhere('pc.courseId = :courseId', { courseId })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .getOne();

      if (!purchase) {
        return res.status(403).json({ message: 'Você não tem acesso a este curso' });
      }

      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['modules', 'modules.lessons'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      const allLessons = course.modules.flatMap((module) => module.lessons);
      const progressRecords = await this.progressRepository.find({
        where: { userId: user.id, courseId },
      });

      const completedLessons = progressRecords
        .filter((p) => p.completed)
        .map((p) => p.lessonId);

      const progressPercentage = calculateProgress(allLessons.length, completedLessons.length);

      return res.json({
        courseId,
        progress: progressPercentage,
        completedLessons,
        lessons: allLessons.map((lesson) => {
          const progress = progressRecords.find((p) => p.lessonId === lesson.id);
          return {
            lessonId: lesson.id,
            completed: progress?.completed || false,
            watchedDuration: progress?.watchedDuration || 0,
          };
        }),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async completeLesson(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { lessonId } = req.params;
      const { watchedDuration } = req.body;

      // Buscar a aula para obter o courseId
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module'],
      });

      if (!lesson || !lesson.module) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      const courseId = lesson.module.courseId;

      // Verificar se o usuário tem acesso ao curso (comprou)
      // Usar createQueryBuilder para verificar corretamente através de PurchaseCourse
      const purchase = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .innerJoin('purchase.courses', 'pc')
        .where('purchase.userId = :userId', { userId: user.id })
        .andWhere('pc.courseId = :courseId', { courseId })
        .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
        .getOne();

      // Se a aula for gratuita, permitir acesso
      if (!lesson.free && !purchase) {
        return res.status(403).json({ message: 'Você não tem acesso a este curso' });
      }

      // Buscar ou criar progresso
      let progress = await this.progressRepository.findOne({
        where: { userId: user.id, lessonId },
      });

      if (progress) {
        // Atualizar progresso existente
        progress.completed = true;
        progress.watchedDuration = watchedDuration || progress.watchedDuration || 0;
        progress.completedAt = new Date();
        progress.lastAccessed = new Date();
        await this.progressRepository.save(progress);
      } else {
        // Criar novo progresso
        progress = this.progressRepository.create({
          userId: user.id,
          courseId: courseId,
          lessonId: lessonId,
          completed: true,
          watchedDuration: watchedDuration || 0,
          completedAt: new Date(),
          lastAccessed: new Date(),
        });
        await this.progressRepository.save(progress);
      }

      // Buscar todas as aulas do curso para calcular progresso
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['modules', 'modules.lessons'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      const allLessons = course.modules.flatMap((module) => module.lessons);
      const completedLessons = await this.progressRepository.find({
        where: {
          userId: user.id,
          courseId,
          completed: true,
        },
      });

      const courseProgress = calculateProgress(
        allLessons.length,
        completedLessons.length
      );

      // Verificar se curso foi 100% concluído e enviar email
      if (courseProgress === 100 && allLessons.length === completedLessons.length) {
        try {
          const { emailService } = await import('../services/EmailService');
          const user = await this.userRepository.findOne({ where: { id: user.id } });
          if (user) {
            await emailService.sendCourseCompletionEmail(
              user.email,
              user.name,
              course.title,
              courseId
            );
            console.log(`📧 Email de conclusão de curso enviado para: ${user.email}`);
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de conclusão:', emailError);
          // Não falhar a requisição se o email falhar
        }
      }

      return res.json({
        progress: {
          id: progress.id,
          userId: progress.userId,
          courseId: progress.courseId,
          lessonId: progress.lessonId,
          completed: progress.completed,
          watchedDuration: progress.watchedDuration,
          completedAt: progress.completedAt,
        },
        courseProgress,
        message: 'Aula marcada como concluída com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao completar aula:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  private async updateWatchTime(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { lessonId } = req.params;
      const { watchedDuration } = req.body;

      // Buscar a aula para obter o courseId
      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId },
        relations: ['module'],
      });

      if (!lesson || !lesson.module) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      const courseId = lesson.module.courseId;

      let progress = await this.progressRepository.findOne({
        where: { userId: user.id, lessonId },
      });

      if (progress) {
        // Atualizar progresso existente
        progress.watchedDuration = watchedDuration || progress.watchedDuration || 0;
        progress.lastAccessed = new Date();
        await this.progressRepository.save(progress);
        console.log(`📹 [WatchTime] Atualizado: aula ${lessonId}, usuário ${user.id}, tempo: ${progress.watchedDuration}s`);
      } else {
        // Criar novo progresso se não existir
        progress = this.progressRepository.create({
          userId: user.id,
          courseId: courseId,
          lessonId: lessonId,
          completed: false,
          watchedDuration: watchedDuration || 0,
          lastAccessed: new Date(),
        });
        await this.progressRepository.save(progress);
        console.log(`📹 [WatchTime] Criado: aula ${lessonId}, usuário ${user.id}, tempo: ${progress.watchedDuration}s`);
      }

      return res.json({ progress });
    } catch (error: any) {
      console.error('❌ [WatchTime] Erro ao atualizar tempo assistido:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMyCourses(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const purchases = await this.purchaseRepository.find({
        where: { userId: user.id, paymentStatus: PaymentStatus.PAID },
        relations: ['courses', 'courses.course'],
      });

      const coursesWithProgress = await Promise.all(
        purchases.flatMap((p) =>
          p.courses.map(async (pc) => {
            const course = await this.courseRepository.findOne({
              where: { id: pc.courseId },
              relations: ['modules', 'modules.lessons'],
            });

            if (!course) return null;

            const allLessons = course.modules.flatMap((m) => m.lessons);
            const progressRecords = await this.progressRepository.find({
              where: { userId: user.id, courseId: course.id },
            });

            const completedCount = progressRecords.filter((p) => p.completed).length;
            const progressPercentage = calculateProgress(
              allLessons.length,
              completedCount
            );

            return {
              course,
              progress: progressPercentage,
              completedLessons: completedCount,
              totalLessons: allLessons.length,
            };
          })
        )
      );

      return res.json({ courses: coursesWithProgress.filter((c) => c !== null) });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getLessonProgress(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { lessonId } = req.params;

      const progress = await this.progressRepository.findOne({
        where: { userId: user.id, lessonId },
      });

      return res.json({
        lessonId,
        progress: progress || {
          completed: false,
          watchedDuration: 0,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getStats(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const totalProgress = await this.progressRepository.find({
        where: { userId: user.id },
      });

      const completedCount = totalProgress.filter((p) => p.completed).length;
      const totalWatchTime = totalProgress.reduce(
        (sum, p) => sum + (p.watchedDuration || 0),
        0
      );

      return res.json({
        totalLessons: totalProgress.length,
        completedLessons: completedCount,
        totalWatchTime,
        completionRate: totalProgress.length > 0 
          ? (completedCount / totalProgress.length) * 100 
          : 0,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getHistory(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const history = await this.progressRepository.find({
        where: { userId: user.id },
        order: { lastAccessed: 'DESC' },
        skip,
        take: Number(limit),
      });

      return res.json({ history });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

