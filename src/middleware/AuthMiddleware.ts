import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User, UserRole } from '../entities/User.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export class AuthMiddleware {
  static authenticate(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: User | false) => {
      if (err || !user) {
        res.status(401).json({ message: 'Não autenticado' });
        return;
      }
      req.user = user;
      next();
    })(req, res, next);
  }

  static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    AuthMiddleware.authenticate(req, res, () => {
      const user = req.user as User;
      if (user && user.role === UserRole.ADMIN) {
        next();
      } else {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        return;
      }
    });
  }
}

