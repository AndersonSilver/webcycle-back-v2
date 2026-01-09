import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { UserPodcast } from '../entities/UserPodcast.entity';
import { Podcast } from '../entities/Podcast.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class UserPodcastController {
  private router: Router;
  private userPodcastRepository: Repository<UserPodcast>;
  private podcastRepository: Repository<Podcast>;

  constructor() {
    this.router = Router();
    this.userPodcastRepository = AppDataSource.getRepository(UserPodcast);
    this.podcastRepository = AppDataSource.getRepository(Podcast);
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.use(AuthMiddleware.authenticate);
    this.router.post('/:podcastId', this.addToMyPodcasts.bind(this));
    this.router.delete('/:podcastId', this.removeFromMyPodcasts.bind(this));
    this.router.get('/', this.getMyPodcasts.bind(this));
    this.router.get('/check/:podcastId', this.checkIfAdded.bind(this));
  }

  private async addToMyPodcasts(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { podcastId } = req.params;

      // Verificar se o podcast existe
      const podcast = await this.podcastRepository.findOne({
        where: { id: podcastId },
      });

      if (!podcast) {
        return res.status(404).json({ message: 'Podcast não encontrado' });
      }

      // Verificar se já está adicionado
      const existing = await this.userPodcastRepository.findOne({
        where: { userId: user.id, podcastId },
      });

      if (existing) {
        return res.status(400).json({ message: 'Podcast já está nos seus cursos' });
      }

      // Adicionar aos meus podcasts
      const userPodcast = this.userPodcastRepository.create({
        userId: user.id,
        podcastId,
      });

      await this.userPodcastRepository.save(userPodcast);

      return res.json({ message: 'Podcast adicionado aos seus cursos', userPodcast });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async removeFromMyPodcasts(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { podcastId } = req.params;

      const userPodcast = await this.userPodcastRepository.findOne({
        where: { userId: user.id, podcastId },
      });

      if (!userPodcast) {
        return res.status(404).json({ message: 'Podcast não encontrado nos seus cursos' });
      }

      await this.userPodcastRepository.remove(userPodcast);

      return res.json({ message: 'Podcast removido dos seus cursos' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMyPodcasts(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const userPodcasts = await this.userPodcastRepository.find({
        where: { userId: user.id },
        relations: ['podcast'],
        order: { addedAt: 'DESC' },
      });

      const podcasts = userPodcasts.map(up => up.podcast).filter(Boolean);

      return res.json({ podcasts });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async checkIfAdded(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      const { podcastId } = req.params;

      const userPodcast = await this.userPodcastRepository.findOne({
        where: { userId: user.id, podcastId },
      });

      return res.json({ isAdded: !!userPodcast });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

