import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ProductReview } from '../entities/ProductReview.entity';
import { Product } from '../entities/Product.entity';
import { User } from '../entities/User.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { CreateProductReviewDto } from '../dto/product-review.dto';

export class ProductReviewController {
  private router: Router;
  private reviewRepository: Repository<ProductReview>;
  private productRepository: Repository<Product>;

  constructor() {
    this.router = Router();
    this.reviewRepository = AppDataSource.getRepository(ProductReview);
    this.productRepository = AppDataSource.getRepository(Product);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota pública para ver avaliações (apenas aprovadas)
    this.router.get('/product/:productId', this.getByProduct.bind(this));
    // Rota para buscar avaliação do próprio usuário (mesmo não aprovada)
    this.router.get('/my-review/:productId', AuthMiddleware.authenticate, this.getMyReview.bind(this));
    this.router.post('/', AuthMiddleware.authenticate, validateDto(CreateProductReviewDto), this.create.bind(this));
    this.router.post('/:id/helpful', AuthMiddleware.authenticate, this.markHelpful.bind(this));
    this.router.get('/', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getAll.bind(this));
    this.router.get('/pending', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getPending.bind(this));
    this.router.put('/:id/approve', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.approve.bind(this));
    this.router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.delete.bind(this));
  }

  private async getByProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ error: 'ID do produto é obrigatório' });
      }

      const reviews = await this.reviewRepository.find({
        where: { productId, approved: true },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      // Calcular distribuição de estrelas
      const starDistribution = [5, 4, 3, 2, 1].map((starLevel) => {
        const count = reviews.filter((r) => r.rating === starLevel).length;
        return {
          stars: starLevel,
          count,
          percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
        };
      });

      return res.json({
        reviews: reviews.map((review) => ({
          id: review.id,
          userId: review.userId,
          userName: review.user?.name || 'Usuário',
          rating: review.rating,
          comment: review.comment,
          helpful: review.helpful || 0,
          images: review.images || [],
          createdAt: review.createdAt,
        })),
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        starDistribution,
      });
    } catch (error: any) {
      console.error('Erro ao buscar avaliações do produto:', error);
      // Retornar resposta vazia ao invés de erro 500 para não quebrar a página
      return res.json({
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        starDistribution: [5, 4, 3, 2, 1].map((starLevel) => ({
          stars: starLevel,
          count: 0,
          percentage: 0,
        })),
      });
    }
  }

  private async getMyReview(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }
      const { productId } = req.params;

      const review = await this.reviewRepository.findOne({
        where: { productId, userId: user.id },
        relations: ['user'],
      });

      if (!review) {
        return res.json({ review: null });
      }

      return res.json({
        review: {
          id: review.id,
          userId: review.userId,
          userName: review.user?.name || 'Usuário',
          rating: review.rating,
          comment: review.comment,
          helpful: review.helpful,
          images: review.images || [],
          approved: review.approved,
          createdAt: review.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Erro ao buscar avaliação do usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliação do usuário' });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const reviewData: CreateProductReviewDto = req.body;

      // Verificar se o produto existe
      const product = await this.productRepository.findOne({
        where: { id: reviewData.productId },
      });

      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar se o usuário já avaliou este produto
      const existingReview = await this.reviewRepository.findOne({
        where: { productId: reviewData.productId, userId: user.id },
      });

      if (existingReview) {
        return res.status(400).json({ error: 'Você já avaliou este produto' });
      }

      // TODO: Verificar se o usuário comprou o produto
      // Por enquanto, permitimos qualquer usuário autenticado avaliar

      const review = this.reviewRepository.create({
        productId: reviewData.productId,
        userId: user.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        images: reviewData.images,
        approved: false, // Requer aprovação do admin
      });

      const savedReview = await this.reviewRepository.save(review);

      // Atualizar rating e reviewsCount do produto quando aprovado
      // Isso será feito quando o admin aprovar a avaliação

      return res.status(201).json({
        review: {
          id: savedReview.id,
          productId: savedReview.productId,
          userId: savedReview.userId,
          rating: savedReview.rating,
          comment: savedReview.comment,
          approved: savedReview.approved,
          createdAt: savedReview.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao criar avaliação' });
    }
  }

  private async markHelpful(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await this.reviewRepository.findOne({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      review.helpful += 1;
      await this.reviewRepository.save(review);

      return res.json({
        message: 'Marcado como útil',
        review: {
          id: review.id,
          helpful: review.helpful,
        },
      });
    } catch (error: any) {
      console.error('Erro ao marcar como útil:', error);
      return res.status(500).json({ error: 'Erro ao marcar como útil' });
    }
  }

  private async getAll(_req: Request, res: Response) {
    try {
      const reviews = await this.reviewRepository.find({
        relations: ['user', 'product'],
        order: { createdAt: 'DESC' },
      });

      return res.json({
        reviews: reviews.map((review) => ({
          id: review.id,
          productId: review.productId,
          productTitle: review.product?.title || 'Produto',
          userId: review.userId,
          userName: review.user?.name || 'Usuário',
          rating: review.rating,
          comment: review.comment,
          approved: review.approved,
          helpful: review.helpful,
          createdAt: review.createdAt,
        })),
        total: reviews.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar avaliações:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
  }

  private async getPending(_req: Request, res: Response) {
    try {
      const reviews = await this.reviewRepository.find({
        where: { approved: false },
        relations: ['user', 'product'],
        order: { createdAt: 'DESC' },
      });

      return res.json({
        reviews: reviews.map((review) => ({
          id: review.id,
          productId: review.productId,
          productTitle: review.product?.title || 'Produto',
          userId: review.userId,
          userName: review.user?.name || 'Usuário',
          rating: review.rating,
          comment: review.comment,
          approved: review.approved,
          createdAt: review.createdAt,
        })),
        total: reviews.length,
      });
    } catch (error: any) {
      console.error('Erro ao buscar avaliações pendentes:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliações pendentes' });
    }
  }

  private async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!review) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      review.approved = true;
      await this.reviewRepository.save(review);

      // Atualizar rating e reviewsCount do produto
      const product = review.product;
      if (product) {
        const allApprovedReviews = await this.reviewRepository.find({
          where: { productId: product.id, approved: true },
        });

        const averageRating =
          allApprovedReviews.length > 0
            ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / allApprovedReviews.length
            : 0;

        product.rating = Math.round(averageRating * 100) / 100;
        product.reviewsCount = allApprovedReviews.length;
        await this.productRepository.save(product);
      }

      return res.json({
        message: 'Avaliação aprovada com sucesso',
        review: {
          id: review.id,
          approved: review.approved,
        },
      });
    } catch (error: any) {
      console.error('Erro ao aprovar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao aprovar avaliação' });
    }
  }

  private async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['product'],
      });

      if (!review) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      const productId = review.productId;
      await this.reviewRepository.remove(review);

      // Atualizar rating e reviewsCount do produto
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (product) {
        const allApprovedReviews = await this.reviewRepository.find({
          where: { productId: product.id, approved: true },
        });

        const averageRating =
          allApprovedReviews.length > 0
            ? allApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / allApprovedReviews.length
            : 0;

        product.rating = Math.round(averageRating * 100) / 100;
        product.reviewsCount = allApprovedReviews.length;
        await this.productRepository.save(product);
      }

      return res.json({ message: 'Avaliação removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover avaliação:', error);
      return res.status(500).json({ error: 'Erro ao remover avaliação' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

