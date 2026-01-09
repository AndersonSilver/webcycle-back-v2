import { Request } from 'express';
import { User } from '../entities/User.entity';

/**
 * Decorator helper para obter o usuário atual da requisição
 * 
 * Nota: Este é apenas um helper de tipagem para documentação.
 * O middleware AuthMiddleware já popula req.user.
 * 
 * Uso recomendado nos controllers:
 * const user = req.user as User;
 * if (!user) {
 *   return res.status(401).json({ message: 'Não autenticado' });
 * }
 */
export function CurrentUser() {
  return function (_target: any, _propertyKey: string, _parameterIndex: number) {
    // Este decorator é apenas para documentação e tipagem
    // A implementação real é feita através do AuthMiddleware
  };
}

/**
 * Helper function para obter o usuário atual de uma requisição
 * @param req - Request do Express
 * @returns User ou null se não autenticado
 */
export function getCurrentUser(req: Request): User | null {
  return (req.user as User) || null;
}

