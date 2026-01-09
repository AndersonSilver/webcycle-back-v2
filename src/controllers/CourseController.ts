import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { Module } from '../entities/Module.entity';
import { ShareToken } from '../entities/ShareToken.entity';
import { User } from '../entities/User.entity';
import { Review } from '../entities/Review.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
} from '../dto/course.dto';
import { v4 as uuidv4 } from 'uuid';

export class CourseController {
  private router: Router;
  private courseRepository: Repository<Course>;
  private moduleRepository: Repository<Module>;
  private shareTokenRepository: Repository<ShareToken>;
  private reviewRepository: Repository<Review>;

  constructor() {
    this.router = Router();
    this.courseRepository = AppDataSource.getRepository(Course);
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.shareTokenRepository = AppDataSource.getRepository(ShareToken);
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas públicas (visitantes podem ver o catálogo)
    this.router.get('/stats/public', this.getPublicStats.bind(this));
    this.router.get('/', this.getAll.bind(this));
    this.router.get('/search', this.search.bind(this));
    this.router.get('/:id', this.getById.bind(this));
    this.router.get('/:id/related', this.getRelated.bind(this));
    this.router.get('/shared/:token', this.getByShareToken.bind(this));

    // Compartilhamento
    this.router.post(
      '/:id/share',
      AuthMiddleware.authenticate,
      this.createShareToken.bind(this)
    );

    // Módulos
    this.router.get('/:courseId/modules', AuthMiddleware.authenticate, this.getModules.bind(this));
    this.router.post(
      '/:courseId/modules',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(CreateModuleDto),
      this.createModule.bind(this)
    );
    this.router.put(
      '/:courseId/modules/:moduleId',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(UpdateModuleDto),
      this.updateModule.bind(this)
    );
    this.router.delete(
      '/:courseId/modules/:moduleId',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.deleteModule.bind(this)
    );

    // Rotas administrativas
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(CreateCourseDto),
      this.create.bind(this)
    );
    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(UpdateCourseDto),
      this.update.bind(this)
    );
    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.delete.bind(this)
    );
  }

  private async getAll(req: Request, res: Response) {
    try {
      const { category, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.courseRepository
        .createQueryBuilder('course')
        .where('course.active = :active', { active: true })
        .leftJoinAndSelect('course.modules', 'modules')
        .leftJoinAndSelect('modules.lessons', 'lessons')
        .orderBy('course.createdAt', 'DESC');

      if (category) {
        queryBuilder.andWhere('course.category = :category', { category });
      }

      const [courses, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .getManyAndCount();

      return res.json({
        courses,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async search(req: Request, res: Response) {
    try {
      const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.courseRepository
        .createQueryBuilder('course')
        .where('course.active = :active', { active: true })
        .leftJoinAndSelect('course.modules', 'modules')
        .leftJoinAndSelect('modules.lessons', 'lessons')
        .leftJoinAndSelect('course.reviews', 'reviews');

      if (q) {
        queryBuilder.andWhere(
          '(course.title ILIKE :search OR course.description ILIKE :search OR course.subtitle ILIKE :search)',
          { search: `%${q}%` }
        );
      }

      if (category) {
        queryBuilder.andWhere('course.category = :category', { category });
      }

      if (minPrice) {
        queryBuilder.andWhere('course.price >= :minPrice', { minPrice });
      }

      if (maxPrice) {
        queryBuilder.andWhere('course.price <= :maxPrice', { maxPrice });
      }

      queryBuilder.orderBy('course.createdAt', 'DESC');

      const [courses, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .getManyAndCount();

      return res.json({
        courses,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getRelated(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const course = await this.courseRepository.findOne({ where: { id } });
      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      const relatedCourses = await this.courseRepository
        .createQueryBuilder('course')
        .where('course.category = :category', { category: course.category })
        .andWhere('course.id != :id', { id })
        .andWhere('course.active = :active', { active: true })
        .orderBy('course.createdAt', 'DESC')
        .limit(6)
        .getMany();

      return res.json({ courses: relatedCourses });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async createShareToken(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      // Verificar se curso existe
      const course = await this.courseRepository.findOne({ where: { id } });
      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      // Gerar token único
      const token = uuidv4().replace(/-/g, '');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expira em 30 dias

      const shareToken = this.shareTokenRepository.create({
        userId: user.id,
        courseId: id,
        token,
        expiresAt,
      });

      const savedToken = await this.shareTokenRepository.save(shareToken);

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/shared/${token}`;

      return res.json({
        shareToken: savedToken,
        shareUrl,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getByShareToken(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const shareToken = await this.shareTokenRepository.findOne({
        where: { token },
        relations: ['course'],
      });

      if (!shareToken) {
        return res.status(404).json({ message: 'Link de compartilhamento inválido' });
      }

      // Verificar expiração
      if (shareToken.expiresAt && new Date() > shareToken.expiresAt) {
        return res.status(410).json({ message: 'Link de compartilhamento expirado' });
      }

      // Incrementar contador de visualizações
      shareToken.views += 1;
      await this.shareTokenRepository.save(shareToken);

      return res.json({ course: shareToken.course });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getModules(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      const modules = await this.moduleRepository.find({
        where: { courseId },
        relations: ['lessons'],
        order: { order: 'ASC' },
      });

      return res.json({ modules });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async createModule(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      // Verificar se curso existe
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      const module = this.moduleRepository.create({
        ...req.body,
        courseId,
      });

      const savedModule = await this.moduleRepository.save(module);
      return res.status(201).json({ module: savedModule });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async updateModule(req: Request, res: Response) {
    try {
      const { courseId, moduleId } = req.params;

      const module = await this.moduleRepository.findOne({
        where: { id: moduleId, courseId },
      });

      if (!module) {
        return res.status(404).json({ message: 'Módulo não encontrado' });
      }

      Object.assign(module, req.body);
      const updatedModule = await this.moduleRepository.save(module);

      return res.json({ module: updatedModule });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async deleteModule(req: Request, res: Response) {
    try {
      const { courseId, moduleId } = req.params;

      await this.moduleRepository.delete({ id: moduleId, courseId });

      return res.json({ message: 'Módulo deletado com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['modules', 'modules.lessons', 'reviews', 'reviews.user'],
      });

      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      return res.json({ course });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const course = this.courseRepository.create(req.body);
      const savedCourse = await this.courseRepository.save(course);
      
      // TypeORM save retorna Course quando passa um único objeto
      // Converter através de unknown para evitar erro de tipo
      const courseEntity = (savedCourse as unknown) as Course;
      
      // Buscar o curso com módulos e aulas para retornar completo
      const courseWithRelations = await this.courseRepository.findOne({
        where: { id: courseEntity.id },
        relations: ['modules', 'modules.lessons'],
      });
      
      res.status(201).json({ course: courseWithRelations || courseEntity });
    } catch (error: any) {
      console.error('Erro ao criar curso:', error);
      res.status(500).json({ message: error.message });
    }
  }

  private async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.courseRepository.update(id, req.body);
      const course = await this.courseRepository.findOne({ where: { id } });
      res.json({ course });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.courseRepository.delete(id);
      res.json({ message: 'Curso deletado com sucesso' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async getPublicStats(_req: Request, res: Response) {
    try {
      // Contar cursos ativos
      const totalCourses = await this.courseRepository.count({
        where: { active: true },
      });

      // Buscar todos os cursos ativos para calcular horas
      const courses = await this.courseRepository.find({
        where: { active: true },
        select: ['duration'],
      });

      // Calcular total de horas
      let totalHours = 0;
      courses.forEach((course) => {
        if (course.duration) {
          const hourMatch = course.duration.match(/(\d+(?:\.\d+)?)\s*h/i);
          const minuteMatch = course.duration.match(/(\d+)\s*m/i);
          
          if (hourMatch) {
            totalHours += parseFloat(hourMatch[1]);
          }
          if (minuteMatch) {
            totalHours += parseFloat(minuteMatch[1]) / 60;
          }
        }
      });

      // Buscar todas as avaliações aprovadas para calcular média
      const approvedReviews = await this.reviewRepository.find({
        where: { approved: true },
        select: ['rating'],
      });

      let averageRating = 0;
      if (approvedReviews.length > 0) {
        const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = sum / approvedReviews.length;
      }

      return res.json({
        totalCourses,
        totalHours: Math.round(totalHours),
        averageRating: Number(averageRating.toFixed(1)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

