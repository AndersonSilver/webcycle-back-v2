import { Request, Response, Router } from 'express';
import passport from 'passport';
import { AuthService } from '../services/AuthService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { User } from '../entities/User.entity';
import { env } from '../config/env.config';

export class AuthController {
  private router: Router;
  private authService: AuthService;

  constructor() {
    this.router = Router();
    this.authService = new AuthService();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Registro com email/senha
    this.router.post('/register', validateDto(RegisterDto), this.register.bind(this));

    // Login com email/senha
    this.router.post('/login', validateDto(LoginDto), this.login.bind(this));

    // Google OAuth - Iniciar
    this.router.get(
      '/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    // Google OAuth - Callback
    this.router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      this.googleCallback.bind(this)
    );

    // Obter usuário autenticado
    this.router.get('/me', AuthMiddleware.authenticate, this.getMe.bind(this));

    // Atualizar perfil
    this.router.put(
      '/profile',
      AuthMiddleware.authenticate,
      validateDto(UpdateProfileDto),
      this.updateProfile.bind(this)
    );

    // Alterar senha
    this.router.put(
      '/change-password',
      AuthMiddleware.authenticate,
      validateDto(ChangePasswordDto),
      this.changePassword.bind(this)
    );

    // Recuperar senha
    this.router.post(
      '/forgot-password',
      validateDto(ForgotPasswordDto),
      this.forgotPassword.bind(this)
    );

    // Redefinir senha
    this.router.post(
      '/reset-password',
      validateDto(ResetPasswordDto),
      this.resetPassword.bind(this)
    );

    // Logout
    this.router.post('/logout', AuthMiddleware.authenticate, this.logout.bind(this));
  }

  private async register(req: Request, res: Response) {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  private async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  private async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as User;
      
      if (!user) {
        const frontendUrl = env.frontendUrl;
        return res.redirect(`${frontendUrl}/?error=user_not_found`);
      }

      const result = await this.authService.googleLogin(user);

      if (!result || !result.token) {
        const frontendUrl = env.frontendUrl;
        return res.redirect(`${frontendUrl}/?error=token_not_generated`);
      }
      
      // Redirecionar para frontend com token
      const frontendUrl = env.frontendUrl;
      res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
    } catch (error: any) {
      const frontendUrl = env.frontendUrl;
      res.redirect(`${frontendUrl}/?error=${encodeURIComponent(error.message || 'Erro desconhecido')}`);
    }
  }

  private async getMe(req: Request, res: Response) {
    try {
      const user = req.user as User;
      res.json({ user: this.authService.sanitizeUser(user) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async updateProfile(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const updatedUser = await this.authService.updateProfile(user.id, req.body);
      res.json({ user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  private async changePassword(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(user.id, currentPassword, newPassword);
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  private async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      res.json({ message: 'Email de recuperação enviado' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  private async logout(_req: Request, res: Response) {
    res.json({ message: 'Logout realizado com sucesso' });
  }

  public getRouter(): Router {
    return this.router;
  }
}

