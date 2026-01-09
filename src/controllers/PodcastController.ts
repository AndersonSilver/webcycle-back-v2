import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Podcast } from '../entities/Podcast.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreatePodcastDto, UpdatePodcastDto } from '../dto/podcast.dto';

export class PodcastController {
  private router: Router;
  private podcastRepository: Repository<Podcast>;

  constructor() {
    this.router = Router();
    this.podcastRepository = AppDataSource.getRepository(Podcast);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas públicas
    this.router.get('/', this.getAll.bind(this));
    this.router.get('/:id', this.getById.bind(this));

    // Rotas administrativas
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(CreatePodcastDto),
      this.create.bind(this)
    );
    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(UpdatePodcastDto),
      this.update.bind(this)
    );
    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.delete.bind(this)
    );
    this.router.post(
      '/:id/increment-listens',
      this.incrementListens.bind(this)
    );
  }

  private async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const queryBuilder = this.podcastRepository
        .createQueryBuilder('podcast')
        .where('podcast.active = :active', { active: true })
        .orderBy('podcast.createdAt', 'DESC');

      if (search) {
        queryBuilder.andWhere(
          '(podcast.title ILIKE :search OR podcast.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [podcasts, total] = await queryBuilder
        .skip(skip)
        .take(Number(limit))
        .getManyAndCount();

      return res.json({
        podcasts,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const podcast = await this.podcastRepository.findOne({
        where: { id },
      });

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast não encontrado' });
      }

      return res.json({ podcast });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const podcast = this.podcastRepository.create(req.body);
      const savedPodcast = await this.podcastRepository.save(podcast);

      return res.status(201).json({ podcast: savedPodcast });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const podcast = await this.podcastRepository.findOne({
        where: { id },
      });

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast não encontrado' });
      }

      Object.assign(podcast, req.body);
      const updatedPodcast = await this.podcastRepository.save(podcast);

      return res.json({ podcast: updatedPodcast });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.podcastRepository.delete(id);

      return res.json({ message: 'Podcast deletado com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async incrementListens(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const podcast = await this.podcastRepository.findOne({
        where: { id },
      });

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast não encontrado' });
      }

      podcast.listens = (podcast.listens || 0) + 1;
      await this.podcastRepository.save(podcast);

      return res.json({ listens: podcast.listens });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

