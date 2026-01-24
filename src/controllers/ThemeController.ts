import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Theme } from '../entities/Theme.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { UpdateThemeDto } from '../dto/theme.dto';

export class ThemeController {
  public router: Router;
  private themeRepository: Repository<Theme>;

  constructor() {
    this.router = Router();
    this.themeRepository = AppDataSource.getRepository(Theme);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota pública para obter o tema ativo
    this.router.get('/public', this.getPublicTheme.bind(this));

    // Rotas admin para gerenciar tema
    this.router.get(
      '/admin',
      AuthMiddleware.authenticate,
      this.getAdminTheme.bind(this)
    );
    this.router.put(
      '/admin',
      AuthMiddleware.authenticate,
      validateDto(UpdateThemeDto),
      this.updateTheme.bind(this)
    );
  }

  /**
   * GET /api/theme/public
   * Obter tema ativo (público)
   */
  private async getPublicTheme(_req: Request, res: Response) {
    try {
      let theme = await this.themeRepository.findOne({
        where: { active: true },
        order: { updatedAt: 'DESC' },
      });

      // Se não existe tema, criar um padrão
      if (!theme) {
        theme = this.themeRepository.create(this.getDefaultTheme());
        theme.active = true;
        await this.themeRepository.save(theme);
      }

      res.json(theme);
    } catch (error: any) {
      console.error('Erro ao buscar tema público:', error);
      res.status(500).json({
        error: 'Erro ao buscar tema',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/theme/admin
   * Obter tema para edição (admin)
   */
  private async getAdminTheme(_req: Request, res: Response) {
    try {
      let theme = await this.themeRepository.findOne({
        where: { active: true },
        order: { updatedAt: 'DESC' },
      });

      // Se não existe tema, criar um padrão
      if (!theme) {
        theme = this.themeRepository.create(this.getDefaultTheme());
        theme.active = true;
        await this.themeRepository.save(theme);
      }

      res.json(theme);
    } catch (error: any) {
      console.error('Erro ao buscar tema admin:', error);
      res.status(500).json({
        error: 'Erro ao buscar tema',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/theme/admin
   * Atualizar tema
   */
  private async updateTheme(req: Request, res: Response) {
    try {
      const updateData: UpdateThemeDto = req.body;

      // Buscar ou criar tema ativo
      let theme = await this.themeRepository.findOne({
        where: { active: true },
        order: { updatedAt: 'DESC' },
      });

      if (!theme) {
        theme = this.themeRepository.create(this.getDefaultTheme());
        theme.active = true;
      }

      // Atualizar apenas os campos fornecidos
      Object.assign(theme, updateData);

      await this.themeRepository.save(theme);

      res.json({
        message: 'Tema atualizado com sucesso',
        theme,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar tema:', error);
      res.status(500).json({
        error: 'Erro ao atualizar tema',
        message: error.message,
      });
    }
  }

  /**
   * Obter tema padrão
   */
  private getDefaultTheme(): Partial<Theme> {
    return {
      active: true,
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      primaryLight: '#60A5FA',
      secondary: '#10B981',
      secondaryDark: '#059669',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      background: '#FFFFFF',
      backgroundSecondary: '#F9FAFB',
      border: '#E5E7EB',
      accent: '#F59E0B',
      danger: '#EF4444',
      success: '#10B981',
      info: '#6366F1',
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

