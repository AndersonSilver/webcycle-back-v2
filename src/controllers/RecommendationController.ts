import { Request, Response, Router } from 'express';
import { RecommendationService } from '../services/RecommendationService';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class RecommendationController {
  private router: Router;
  private recommendationService: RecommendationService;

  constructor() {
    this.router = Router();
    this.recommendationService = new RecommendationService();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota autenticada para recomendações personalizadas
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      this.getPersonalized.bind(this)
    );

    // Rota pública para cursos em alta
    this.router.get('/trending', this.getTrending.bind(this));
  }

  private async getPersonalized(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { limit = 10 } = req.query;

      const recommendations = await this.recommendationService.getPersonalizedRecommendations(
        user.id,
        Number(limit)
      );

      return res.json({ recommendations });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getTrending(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const courses = await this.recommendationService.getTrendingCourses(Number(limit));

      return res.json({ courses });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

