import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Review } from '../entities/Review.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateReviewDto } from '../dto/review.dto';

export class ReviewController {
  private router: Router;
  private reviewRepository: Repository<Review>;

  constructor() {
    this.router = Router();
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota pública para ver avaliações (apenas aprovadas)
    this.router.get('/course/:courseId', this.getByCourse.bind(this));
    // Rota pública para buscar avaliações aprovadas de todos os cursos (para depoimentos)
    this.router.get('/public', this.getPublicReviews.bind(this));
    // Rota para buscar avaliação do próprio usuário (mesmo não aprovada)
    this.router.get('/my-review/:courseId', AuthMiddleware.authenticate, this.getMyReview.bind(this));
    this.router.post('/', AuthMiddleware.authenticate, validateDto(CreateReviewDto), this.create.bind(this));
    this.router.post('/:id/helpful', AuthMiddleware.authenticate, this.markHelpful.bind(this));
    this.router.post('/:id/images', AuthMiddleware.authenticate, this.addImages.bind(this));
    this.router.get('/', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getAll.bind(this));
    this.router.get('/pending', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getPending.bind(this));
    this.router.get('/stats', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getStats.bind(this));
    this.router.put('/:id/approve', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.approve.bind(this));
    this.router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.delete.bind(this));
  }

  private async getByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      const reviews = await this.reviewRepository.find({
        where: { courseId, approved: true },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return res.json({
        reviews,
        averageRating,
        totalReviews: reviews.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getPublicReviews(req: Request, res: Response) {
    try {
      const { limit = 6 } = req.query;

      const reviews = await this.reviewRepository.find({
        where: { approved: true },
        relations: ['user', 'course'],
        order: { createdAt: 'DESC' },
        take: Number(limit),
      });

      // Formatar resposta para incluir informações do usuário e curso
      const formattedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        userName: review.user?.name || 'Usuário',
        userInitial: review.user?.name?.charAt(0).toUpperCase() || 'U',
        courseTitle: review.course?.title || 'Curso',
        createdAt: review.createdAt,
      }));

      return res.json({
        reviews: formattedReviews,
        total: formattedReviews.length,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getMyReview(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;

      const review = await this.reviewRepository.findOne({
        where: { courseId, userId: user.id },
        relations: ['user'],
      });

      if (!review) {
        return res.json({ review: null });
      }

      return res.json({ review });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId, rating, comment } = req.body;

      // Verificar se já existe uma avaliação do usuário para este curso
      const existingReview = await this.reviewRepository.findOne({
        where: { courseId, userId: user.id },
      });

      if (existingReview) {
        // Atualizar avaliação existente
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.approved = false; // Resetar aprovação ao editar
        const savedReview = await this.reviewRepository.save(existingReview);
        return res.status(200).json({ review: savedReview });
      }

      // Criar nova avaliação
      const review = this.reviewRepository.create({
        courseId,
        userId: user.id,
        rating,
        comment,
        approved: false,
      });

      const savedReview = await this.reviewRepository.save(review);
      return res.status(201).json({ review: savedReview });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getAll(_req: Request, res: Response) {
    try {
      const reviews = await this.reviewRepository.find({
        relations: ['user', 'course'],
        order: { createdAt: 'DESC' },
      });
      return res.json({ reviews });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.reviewRepository.update(id, { approved: true });
      const review = await this.reviewRepository.findOne({ where: { id } });
      return res.json({ review });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.reviewRepository.delete(id);
      return res.json({ message: 'Avaliação deletada com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getPending(_req: Request, res: Response) {
    try {
      const reviews = await this.reviewRepository.find({
        where: { approved: false },
        relations: ['user', 'course'],
        order: { createdAt: 'DESC' },
      });
      return res.json({ reviews, count: reviews.length });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getStats(_req: Request, res: Response) {
    try {
      const allReviews = await this.reviewRepository.find({
        relations: ['course'],
      });

      const totalReviews = allReviews.length;
      const approvedReviews = allReviews.filter((r) => r.approved).length;
      const pendingReviews = totalReviews - approvedReviews;
      const averageRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      // Distribuição de ratings
      const ratingDistribution = {
        5: allReviews.filter((r) => r.rating === 5).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        1: allReviews.filter((r) => r.rating === 1).length,
      };

      return res.json({
        totalReviews,
        approvedReviews,
        pendingReviews,
        averageRating: Number(averageRating.toFixed(2)),
        ratingDistribution,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async markHelpful(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const review = await this.reviewRepository.findOne({ where: { id } });
      if (!review) {
        return res.status(404).json({ message: 'Avaliação não encontrada' });
      }

      review.helpful = (review.helpful || 0) + 1;
      const updatedReview = await this.reviewRepository.save(review);

      return res.json({
        message: 'Marcado como útil',
        review: updatedReview,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async addImages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { images } = req.body; // Array de URLs de imagens

      if (!Array.isArray(images)) {
        return res.status(400).json({ message: 'images deve ser um array' });
      }

      const review = await this.reviewRepository.findOne({ where: { id } });
      if (!review) {
        return res.status(404).json({ message: 'Avaliação não encontrada' });
      }

      review.images = [...(review.images || []), ...images];
      const updatedReview = await this.reviewRepository.save(review);

      return res.json({
        message: 'Imagens adicionadas com sucesso',
        review: updatedReview,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

