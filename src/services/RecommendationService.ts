import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Course } from '../entities/Course.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { Favorite } from '../entities/Favorite.entity';

export class RecommendationService {
  private courseRepository: Repository<Course>;
  private purchaseRepository: Repository<Purchase>;
  private favoriteRepository: Repository<Favorite>;

  constructor() {
    this.courseRepository = AppDataSource.getRepository(Course);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    this.favoriteRepository = AppDataSource.getRepository(Favorite);
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    // Buscar cursos comprados pelo usuário
    const userPurchases = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .innerJoin('purchase.courses', 'pc')
      .where('purchase.userId = :userId', { userId })
      .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getMany();

    const purchasedCourseIds = userPurchases.flatMap((p) =>
      p.courses.map((pc) => pc.courseId)
    );

    // Buscar categorias preferidas
    const purchasedCourses = await this.courseRepository.find({
      where: purchasedCourseIds.map((id) => ({ id })),
    });

    const preferredCategories = [
      ...new Set(purchasedCourses.map((c) => c.category)),
    ];

    // Buscar cursos favoritados
    const favorites = await this.favoriteRepository.find({
      where: { userId },
    });

    const favoriteCourseIds = favorites.map((f) => f.courseId);

    // Buscar cursos relacionados
    let recommendations: Course[] = [];

    if (preferredCategories.length > 0) {
      // Recomendar cursos da mesma categoria
      const categoryCourses = await this.courseRepository
        .createQueryBuilder('course')
        .where('course.category IN (:...categories)', {
          categories: preferredCategories,
        })
        .andWhere('course.id NOT IN (:...purchasedIds)', {
          purchasedIds: purchasedCourseIds.length > 0 ? purchasedCourseIds : [''],
        })
        .andWhere('course.active = :active', { active: true })
        .orderBy('course.price', 'ASC')
        .limit(limit)
        .getMany();

      recommendations.push(...categoryCourses);
    }

    // Se não houver recomendações suficientes, buscar cursos mais bem avaliados
    if (recommendations.length < limit) {
      const topRatedCourses = await this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.reviews', 'review')
        .where('course.id NOT IN (:...excludedIds)', {
          excludedIds: [
            ...purchasedCourseIds,
            ...favoriteCourseIds,
            ...recommendations.map((c) => c.id),
          ],
        })
        .andWhere('course.active = :active', { active: true })
        .groupBy('course.id')
        .orderBy('AVG(review.rating)', 'DESC')
        .addOrderBy('course.createdAt', 'DESC')
        .limit(limit - recommendations.length)
        .getMany();

      recommendations.push(...topRatedCourses);
    }

    // Remover duplicatas
    const uniqueRecommendations = recommendations.filter(
      (course, index, self) => index === self.findIndex((c) => c.id === course.id)
    );

    return uniqueRecommendations.slice(0, limit);
  }

  async getTrendingCourses(limit: number = 10) {
    // Cursos com mais vendas nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingCourses = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .innerJoin('purchase.courses', 'pc')
      .innerJoin(Course, 'c', 'c.id = pc.courseId')
      .where('purchase.createdAt >= :date', { date: thirtyDaysAgo })
      .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
      .select('pc.courseId', 'courseId')
      .addSelect('COUNT(*)', 'salesCount')
      .groupBy('pc.courseId')
      .orderBy('salesCount', 'DESC')
      .limit(limit)
      .getRawMany();

    const courseIds = trendingCourses.map((tc) => tc.courseId);

    if (courseIds.length === 0) {
      // Se não houver vendas recentes, retornar cursos mais bem avaliados
      return this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.reviews', 'review')
        .where('course.active = :active', { active: true })
        .groupBy('course.id')
        .orderBy('AVG(review.rating)', 'DESC')
        .limit(limit)
        .getMany();
    }

    const courses = await this.courseRepository.find({
      where: courseIds.map((id) => ({ id })),
      relations: ['reviews'],
    });

    // Ordenar pela ordem de vendas
    return courseIds
      .map((id) => courses.find((c) => c.id === id))
      .filter((c) => c !== undefined) as Course[];
  }
}

