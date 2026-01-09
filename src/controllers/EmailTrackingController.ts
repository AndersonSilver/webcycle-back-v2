import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database.config';

// Interface para tracking de emails (pode ser expandida para usar uma tabela no futuro)
interface EmailTracking {
  trackingId: string;
  email: string;
  type: string;
  openedAt?: Date;
  clickedAt?: Date;
  clickedLink?: string;
}

// Armazenamento em memória (em produção, usar banco de dados)
const emailTracking: Map<string, EmailTracking> = new Map();

export class EmailTrackingController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota para tracking de abertura (pixel de rastreamento)
    this.router.get('/open/:trackingId', this.trackOpen.bind(this));
    
    // Rota para tracking de cliques (redirecionamento)
    this.router.get('/click/:trackingId', this.trackClick.bind(this));
    
    // Rota para obter estatísticas (admin)
    this.router.get('/stats/:trackingId', this.getStats.bind(this));
  }

  /**
   * Rastreia abertura do email (pixel de rastreamento)
   */
  private async trackOpen(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;

      // Registrar abertura
      const tracking = emailTracking.get(trackingId);
      if (tracking && !tracking.openedAt) {
        tracking.openedAt = new Date();
        emailTracking.set(trackingId, tracking);
        console.log(`📧 Email aberto: ${tracking.email} (${tracking.type}) - Tracking ID: ${trackingId}`);
      }

      // Retornar pixel transparente 1x1
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );

      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(pixel);
    } catch (error: any) {
      console.error('Erro ao rastrear abertura de email:', error);
      // Retornar pixel mesmo em caso de erro
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.setHeader('Content-Type', 'image/gif');
      return res.send(pixel);
    }
  }

  /**
   * Rastreia cliques em links e redireciona
   */
  private async trackClick(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL não fornecida' });
      }

      // Registrar clique
      const tracking = emailTracking.get(trackingId);
      if (tracking) {
        tracking.clickedAt = new Date();
        tracking.clickedLink = url;
        emailTracking.set(trackingId, tracking);
        console.log(`🔗 Link clicado: ${url} - Email: ${tracking.email} - Tracking ID: ${trackingId}`);
      }

      // Redirecionar para URL original
      return res.redirect(url);
    } catch (error: any) {
      console.error('Erro ao rastrear clique:', error);
      const { url } = req.query;
      if (url && typeof url === 'string') {
        return res.redirect(url);
      }
      return res.status(500).json({ message: 'Erro ao processar clique' });
    }
  }

  /**
   * Obtém estatísticas de tracking (admin)
   */
  private async getStats(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;
      const tracking = emailTracking.get(trackingId);

      if (!tracking) {
        return res.status(404).json({ message: 'Tracking não encontrado' });
      }

      return res.json({
        trackingId: tracking.trackingId,
        email: tracking.email,
        type: tracking.type,
        opened: !!tracking.openedAt,
        openedAt: tracking.openedAt,
        clicked: !!tracking.clickedAt,
        clickedAt: tracking.clickedAt,
        clickedLink: tracking.clickedLink,
      });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({ message: 'Erro ao obter estatísticas' });
    }
  }

  /**
   * Registra um novo tracking (chamado pelo EmailService)
   */
  static registerTracking(trackingId: string, email: string, type: string) {
    emailTracking.set(trackingId, {
      trackingId,
      email,
      type,
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

