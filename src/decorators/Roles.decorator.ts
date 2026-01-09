/**
 * Decorator helper para especificar roles necessárias para acessar uma rota
 * 
 * Nota: Este é apenas um helper de tipagem para documentação.
 * O middleware AuthMiddleware.requireAdmin já verifica roles.
 * 
 * Uso recomendado nos controllers:
 * this.router.get('/admin-route', 
 *   AuthMiddleware.authenticate, 
 *   AuthMiddleware.requireAdmin, 
 *   this.handler.bind(this)
 * );
 * 
 * @param roles - Array de roles permitidas (ex: ['admin'], ['admin', 'moderator'])
 * @returns Decorator function (apenas para documentação)
 */
export function Roles(...roles: string[]) {
  return function (_target: any, _propertyKey: string, _descriptor: PropertyDescriptor) {
    // Este decorator é apenas para documentação e tipagem
    // A implementação real é feita através do AuthMiddleware.requireAdmin
    // Os roles são armazenados como metadata para referência futura
    if (!_descriptor) {
      return;
    }
    
    // Armazenar roles como metadata (opcional, para uso futuro)
    if (!_descriptor.value.__roles) {
      _descriptor.value.__roles = roles;
    }
  };
}

/**
 * Helper function para verificar se um usuário tem uma role específica
 * @param userRole - Role do usuário
 * @param allowedRoles - Array de roles permitidas
 * @returns true se o usuário tem uma das roles permitidas
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

