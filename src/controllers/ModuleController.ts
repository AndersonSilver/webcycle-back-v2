import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Module } from '../entities/Module.entity';
import { Lesson } from '../entities/Lesson.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateLessonDto, UpdateLessonDto } from '../dto/course.dto';

export class ModuleController {
  private router: Router;
  private moduleRepository: Repository<Module>;
  private lessonRepository: Repository<Lesson>;

  constructor() {
    this.router = Router();
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas autenticadas
    this.router.get('/:moduleId/lessons', AuthMiddleware.authenticate, this.getLessons.bind(this));

    // Rotas administrativas
    this.router.post(
      '/:moduleId/lessons',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(CreateLessonDto),
      this.createLesson.bind(this)
    );
    this.router.put(
      '/:moduleId/lessons/:lessonId',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(UpdateLessonDto),
      this.updateLesson.bind(this)
    );
    this.router.delete(
      '/:moduleId/lessons/:lessonId',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.deleteLesson.bind(this)
    );
    this.router.put(
      '/:moduleId/reorder-lessons',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.reorderLessons.bind(this)
    );
  }

  private async getLessons(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const { moduleId } = req.params;

      const lessons = await this.lessonRepository.find({
        where: { moduleId },
        relations: ['module'],
        order: { order: 'ASC' },
      });

      // Se o usuário estiver autenticado, buscar progresso das aulas
      let progressMap: Map<string, { completed: boolean; watchedDuration: number }> = new Map();
      if (user && user.id) {
        const { AppDataSource } = await import('../config/database.config');
        const { Progress } = await import('../entities/Progress.entity');
        const progressRepository = AppDataSource.getRepository(Progress);
        
        const lessonIds = lessons.map(l => l.id);
        if (lessonIds.length > 0) {
          // Buscar progresso para todas as aulas do módulo usando QueryBuilder
          const progressRecords = await progressRepository
            .createQueryBuilder('progress')
            .where('progress.userId = :userId', { userId: user.id })
            .andWhere('progress.lessonId IN (:...lessonIds)', { lessonIds })
            .getMany();
          
          progressRecords.forEach(p => {
            progressMap.set(p.lessonId, {
              completed: p.completed,
              watchedDuration: p.watchedDuration,
            });
          });
        }
      }

      // Adicionar informações de progresso às aulas
      const lessonsWithProgress = lessons.map(lesson => {
        const progress = progressMap.get(lesson.id);
        return {
          ...lesson,
          completed: progress?.completed || false,
          locked: false, // Pode ser calculado baseado na ordem e progresso
        };
      });

      res.json({ lessons: lessonsWithProgress });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async createLesson(req: Request, res: Response) {
    try {
      const { moduleId } = req.params;

      // Verificar se módulo existe
      const module = await this.moduleRepository.findOne({ where: { id: moduleId } });
      if (!module) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }

      const lesson = this.lessonRepository.create({
        title: req.body.title,
        duration: req.body.duration,
        videoUrl: req.body.videoUrl || 'https://example.com/video.mp4', // URL padrão se não fornecido
        order: req.body.order,
        moduleId,
        free: req.body.free ?? false,
      });
      const savedLesson = await this.lessonRepository.save(lesson);

      return res.status(201).json({ lesson: savedLesson });
    } catch (error: any) {
      console.error('Erro ao criar aula:', error);
      return res.status(500).json({ 
        message: error.message || 'Erro ao criar aula',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  private async updateLesson(req: Request, res: Response) {
    try {
      const { moduleId, lessonId } = req.params;

      const lesson = await this.lessonRepository.findOne({
        where: { id: lessonId, moduleId },
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Aula não encontrada' });
      }

      Object.assign(lesson, req.body);
      const updatedLesson = await this.lessonRepository.save(lesson);

      return res.json({ lesson: updatedLesson });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async deleteLesson(req: Request, res: Response) {
    try {
      const { moduleId, lessonId } = req.params;

      await this.lessonRepository.delete({ id: lessonId, moduleId });

      return res.json({ message: 'Aula deletada com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async reorderLessons(req: Request, res: Response) {
    try {
      const { moduleId } = req.params;
      const { lessonIds } = req.body;

      if (!Array.isArray(lessonIds)) {
        return res.status(400).json({ message: 'lessonIds deve ser um array' });
      }

      // Atualizar ordem de cada aula
      await Promise.all(
        lessonIds.map((lessonId: string, index: number) =>
          this.lessonRepository.update(
            { id: lessonId, moduleId },
            { order: index + 1 }
          )
        )
      );

      return res.json({ message: 'Aulas reordenadas com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

