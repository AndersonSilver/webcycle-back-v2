import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Favorite } from '../entities/Favorite.entity';
import { Course } from '../entities/Course.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class FavoriteController {
  private router: Router;
  private favoriteRepository: Repository<Favorite>;
  private courseRepository: Repository<Course>;

  constructor() {
    this.router = Router();
    this.favoriteRepository = AppDataSource.getRepository(Favorite);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.get('/', this.getAll.bind(this));
    this.router.post('/:courseId', this.add.bind(this));
    this.router.delete('/:courseId', this.remove.bind(this));
    this.router.get('/check/:courseId', this.check.bind(this));
  }

  private async getAll(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const favorites = await this.favoriteRepository.find({
        where: { userId: user.id },
        relations: ['course'],
        order: { createdAt: 'DESC' },
      });

      return res.json({ favorites });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async add(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      // Verificar se curso existe
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ message: 'Curso não encontrado' });
      }

      // Verificar se já está nos favoritos
      const existing = await this.favoriteRepository.findOne({
        where: { userId: user.id, courseId },
      });

      if (existing) {
        return res.status(400).json({ message: 'Curso já está nos favoritos' });
      }

      const favorite = this.favoriteRepository.create({
        userId: user.id,
        courseId,
      });

      const savedFavorite = await this.favoriteRepository.save(favorite);
      return res.status(201).json({ favorite: savedFavorite });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async remove(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      await this.favoriteRepository.delete({
        userId: user.id,
        courseId,
      });

      return res.json({ message: 'Favorito removido com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async check(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      const favorite = await this.favoriteRepository.findOne({
        where: { userId: user.id, courseId },
      });

      return res.json({
        isFavorite: !!favorite,
        favoriteId: favorite?.id,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

