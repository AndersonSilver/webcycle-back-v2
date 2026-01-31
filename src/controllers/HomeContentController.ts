import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { HomePageContent } from '../entities/HomePageContent.entity';
import { UpdateHomeContentDto } from '../dto/home-content.dto';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';

export class HomeContentController {
  private router: Router;
  private homeContentRepository: Repository<HomePageContent>;

  constructor() {
    this.router = Router();
    this.homeContentRepository = AppDataSource.getRepository(HomePageContent);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Public endpoint - get home content
    this.router.get('/public', this.getPublicContent.bind(this));

    // Admin endpoints - require authentication
    this.router.get(
      '/admin',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.getAdminContent.bind(this)
    );

    this.router.put(
      '/admin',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      validateDto(UpdateHomeContentDto),
      this.updateContent.bind(this)
    );
  }

  /**
   * GET /api/home-content/public
   * Get public home page content (cached)
   */
  private async getPublicContent(_req: Request, res: Response) {
    try {
      let content = await this.homeContentRepository.findOne({
        where: {},
        order: { updatedAt: 'DESC' },
      });

      // Se não existe conteúdo, retornar valores padrão
      if (!content) {
        content = this.getDefaultContent() as any;
      }

      res.json({ content });
    } catch (error: any) {
      console.error('Erro ao buscar conteúdo público:', error);
      res.status(500).json({
        error: 'Erro ao buscar conteúdo da página inicial',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/home-content/admin
   * Get home content for admin editing
   */
  private async getAdminContent(_req: Request, res: Response) {
    try {
      let content = await this.homeContentRepository.findOne({
        where: {},
        order: { updatedAt: 'DESC' },
      });

      // Se não existe conteúdo, criar com valores padrão
      if (!content) {
        content = this.homeContentRepository.create(this.getDefaultContent());
        await this.homeContentRepository.save(content);
      }

      res.json({ content });
    } catch (error: any) {
      console.error('Erro ao buscar conteúdo admin:', error);
      res.status(500).json({
        error: 'Erro ao buscar conteúdo da página inicial',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/home-content/admin
   * Update home page content
   */
  private async updateContent(req: Request, res: Response) {
    try {
      const updateData: UpdateHomeContentDto = req.body;

      // Buscar ou criar conteúdo
      let content = await this.homeContentRepository.findOne({
        where: {},
        order: { updatedAt: 'DESC' },
      });

      if (!content) {
        content = this.homeContentRepository.create(this.getDefaultContent());
      }

      // Atualizar apenas os campos fornecidos
      if (updateData.hero !== undefined) {
        content.hero = updateData.hero;
      }
      if (updateData.carousel !== undefined) {
        // Garantir que todos os itens do carrossel tenham id
        content.carousel = updateData.carousel.map((item, index) => ({
          id: item.id || `carousel-${Date.now()}-${index}`,
          url: item.url,
          alt: item.alt,
          order: item.order,
        }));
      }
      if (updateData.whyChooseUs !== undefined) {
        content.whyChooseUs = updateData.whyChooseUs;
      }
      if (updateData.testimonials !== undefined) {
        content.testimonials = updateData.testimonials;
      }
      if (updateData.newsletter !== undefined) {
        content.newsletter = updateData.newsletter;
      }
      if (updateData.cta !== undefined) {
        content.cta = updateData.cta;
      }

      await this.homeContentRepository.save(content);

      res.json({
        message: 'Conteúdo atualizado com sucesso',
        content,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar conteúdo:', error);
      res.status(500).json({
        error: 'Erro ao atualizar conteúdo da página inicial',
        message: error.message,
      });
    }
  }

  /**
   * Get default content structure
   */
  private getDefaultContent(): Partial<HomePageContent> {
    return {
      hero: {
        badge: '🧠 Plataforma de Cursos de Psicologia',
        title: 'Transforme Sua Vida com Psicologia Aplicada',
        subtitle:
          'Descubra cursos criados por especialistas em psicologia para te ajudar a desenvolver inteligência emocional, relacionamentos saudáveis e bem-estar mental.',
        primaryButton: {
          text: 'Explorar Cursos',
          action: 'explore',
        },
        secondaryButton: {
          text: 'Podcasts',
          action: 'podcasts',
        },
      },
      carousel: [
        {
          id: '1',
          url:
            'https://images.unsplash.com/photo-1758273240360-76b908e7582a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVyYXB5JTIwc2Vzc2lvbiUyMGNvdW5zZWxpbmd8ZW58MXx8fHwxNzY2OTkyMjA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
          alt: 'Sessão de terapia',
          order: 0,
        },
        {
          id: '2',
          url:
            'https://images.unsplash.com/photo-1635373390303-cc78167278ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50YWwlMjB3ZWxsbmVzcyUyMG1lZGl0YXRpb258ZW58MXx8fHwxNzY2OTk5NTYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          alt: 'Bem-estar mental',
          order: 1,
        },
        {
          id: '3',
          url:
            'https://images.unsplash.com/photo-1729105140273-b5e886a4f999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwc3ljaG9sb2d5JTIwYnJhaW4lMjBtaW5kfGVufDF8fHx8MTc2NzA4NzE3MXww&ixlib=rb-4.1.0&q=80&w=1080',
          alt: 'Psicologia e mente',
          order: 2,
        },
      ],
      whyChooseUs: {
        badge: 'Por Que Escolher Nós?',
        title: 'Transforme Sua Vida com Conhecimento',
        subtitle:
          'Somos uma plataforma dedicada a democratizar o conhecimento em psicologia, oferecendo cursos de alta qualidade criados por especialistas renomados.',
        cards: [
          {
            icon: 'Brain',
            title: 'Baseado em Ciência',
            description:
              'Todo conteúdo é validado por pesquisas e práticas da psicologia moderna',
            gradientColors: { from: 'blue-500', to: 'blue-600' },
          },
          {
            icon: 'Award',
            title: 'Instrutores Especialistas',
            description:
              'Aprenda com psicólogos, terapeutas e professores qualificados',
            gradientColors: { from: 'teal-500', to: 'teal-600' },
          },
          {
            icon: 'TrendingUp',
            title: 'Resultados Comprovados',
            description:
              'Mais de 50.000 alunos já transformaram suas vidas com nossos cursos',
            gradientColors: { from: 'purple-500', to: 'purple-600' },
          },
        ],
      },
      testimonials: {
        badge: 'Depoimentos',
        title: 'O Que Nossos Alunos Dizem',
        subtitle:
          'Histórias reais de transformação e crescimento pessoal',
      },
      newsletter: {
        title: 'Receba Conteúdos Exclusivos',
        subtitle:
          'Cadastre-se e receba dicas, artigos e novidades sobre psicologia aplicada diretamente no seu e-mail',
        features: [
          { text: 'Sem spam' },
          { text: 'Conteúdo exclusivo' },
          { text: 'Cancelar a qualquer momento' },
        ],
      },
      cta: {
        badge: '🚀 Comece Agora',
        title: 'Pronto Para Transformar Sua Vida?',
        subtitle:
          'Escolha o curso ideal para você e comece hoje mesmo sua jornada de autoconhecimento e crescimento pessoal',
        primaryButton: {
          text: 'Explorar Todos os Cursos',
          action: 'explore',
        },
        secondaryButton: {
          text: 'Ver Aula Grátis',
          action: 'free-class',
        },
        benefitCards: [
          {
            icon: 'Heart',
            title: 'Acesso Imediato',
            subtitle: 'Comece agora',
            iconColor: 'red-400',
          },
          {
            icon: 'Shield',
            title: 'Garantia de 7 dias',
            subtitle: '100% seguro',
            iconColor: 'green-400',
          },
          {
            icon: 'MessageCircle',
            title: 'Suporte Especializado',
            subtitle: 'Sempre que precisar',
            iconColor: 'blue-400',
          },
        ],
      },
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

