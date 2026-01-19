import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { NewsletterSubscriber } from '../entities/NewsletterSubscriber.entity';
import { NewsletterCampaign } from '../entities/NewsletterCampaign.entity';
import { validateDto } from '../middleware/ValidationMiddleware';
import { SubscribeNewsletterDto, SendNewsletterUpdateDto } from '../dto/newsletter.dto';
import { emailService } from '../services/EmailService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class NewsletterController {
  private router: Router;
  private newsletterRepository: Repository<NewsletterSubscriber>;
  private campaignRepository: Repository<NewsletterCampaign>;

  constructor() {
    this.router = Router();
    this.newsletterRepository = AppDataSource.getRepository(NewsletterSubscriber);
    this.campaignRepository = AppDataSource.getRepository(NewsletterCampaign);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rota pública para se inscrever na newsletter
    this.router.post('/subscribe', validateDto(SubscribeNewsletterDto), this.subscribe.bind(this));
    // Rota pública para cancelar inscrição
    this.router.post('/unsubscribe', this.unsubscribe.bind(this));
    // Rota admin para listar inscritos
    this.router.get('/subscribers', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getSubscribers.bind(this));
    // Rota admin para enviar atualização da newsletter
    this.router.post('/send-update', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, validateDto(SendNewsletterUpdateDto), this.sendUpdate.bind(this));
    // Rota admin para listar campanhas (histórico)
    this.router.get('/campaigns', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getCampaigns.bind(this));
    // Rota admin para ver detalhes de uma campanha
    this.router.get('/campaigns/:id', AuthMiddleware.authenticate, AuthMiddleware.requireAdmin, this.getCampaignDetails.bind(this));
  }

  private async subscribe(req: Request, res: Response) {
    try {
      const { email, name } = req.body as SubscribeNewsletterDto;

      // Verificar se já está inscrito
      const existing = await this.newsletterRepository.findOne({
        where: { email },
      });

      if (existing) {
        if (existing.active) {
          return res.status(400).json({
            message: 'Este email já está inscrito na newsletter',
          });
        } else {
          // Reativar inscrição
          existing.active = true;
          existing.name = name || existing.name;
          await this.newsletterRepository.save(existing);

          // Enviar email de confirmação
          try {
            await emailService.sendNewsletterConfirmationEmail(email, name);
          } catch (emailError) {
            console.error('Erro ao enviar email de confirmação:', emailError);
            // Não falhar a requisição se o email falhar
          }

          return res.json({
            message: 'Inscrição reativada com sucesso!',
            subscriber: existing,
          });
        }
      }

      // Criar nova inscrição
      const subscriber = this.newsletterRepository.create({
        email,
        name,
        active: true,
      });

      const savedSubscriber = await this.newsletterRepository.save(subscriber);

      // Enviar email de confirmação
      try {
        await emailService.sendNewsletterConfirmationEmail(email, name);
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
        // Não falhar a requisição se o email falhar
      }

      return res.status(201).json({
        message: 'Inscrição realizada com sucesso!',
        subscriber: savedSubscriber,
      });
    } catch (error: any) {
      console.error('Erro ao inscrever na newsletter:', error);
      return res.status(500).json({ message: 'Erro ao processar inscrição' });
    }
  }

  private async unsubscribe(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
      }

      const subscriber = await this.newsletterRepository.findOne({
        where: { email },
      });

      if (!subscriber) {
        return res.status(404).json({ message: 'Email não encontrado na newsletter' });
      }

      subscriber.active = false;
      await this.newsletterRepository.save(subscriber);

      return res.json({ message: 'Inscrição cancelada com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getSubscribers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, active } = req.query;

      const queryBuilder = this.newsletterRepository.createQueryBuilder('subscriber');

      if (active !== undefined) {
        queryBuilder.where('subscriber.active = :active', {
          active: active === 'true',
        });
      }

      const [subscribers, total] = await queryBuilder
        .orderBy('subscriber.subscribedAt', 'DESC')
        .skip((Number(page) - 1) * Number(limit))
        .take(Number(limit))
        .getManyAndCount();

      return res.json({
        subscribers,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async sendUpdate(req: Request, res: Response) {
    try {
      const { subject, content, ctaText, ctaLink } = req.body as SendNewsletterUpdateDto;
      const userId = (req as any).user?.id;

      // Buscar todos os inscritos ativos
      const activeSubscribers = await this.newsletterRepository.find({
        where: { active: true },
      });

      if (activeSubscribers.length === 0) {
        return res.status(400).json({
          message: 'Nenhum inscrito ativo encontrado',
        });
      }

      // Preparar lista de emails
      const subscribersList = activeSubscribers.map(sub => ({
        email: sub.email,
        name: sub.name,
      }));

      // Criar registro da campanha antes de enviar
      const campaign = this.campaignRepository.create({
        subject,
        content,
        ctaText,
        ctaLink,
        totalRecipients: activeSubscribers.length,
        sentByUserId: userId,
      });

      // Enviar emails em massa
      const result = await emailService.sendNewsletterBulkUpdate(
        subscribersList,
        subject,
        content,
        ctaText,
        ctaLink
      );

      // Atualizar campanha com resultados
      campaign.sentCount = result.sent;
      campaign.failedCount = result.failed;
      campaign.recipientEmails = result.sentEmails || [];
      campaign.failedEmails = result.failedEmails || [];

      await this.campaignRepository.save(campaign);

      return res.json({
        message: `Newsletter enviada com sucesso!`,
        campaignId: campaign.id,
        stats: {
          total: activeSubscribers.length,
          sent: result.sent,
          failed: result.failed,
        },
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (error: any) {
      console.error('Erro ao enviar newsletter:', error);
      return res.status(500).json({ message: error.message || 'Erro ao enviar newsletter' });
    }
  }

  private async getCampaigns(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const [campaigns, total] = await this.campaignRepository.findAndCount({
        order: { sentAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        relations: ['sentByUser'],
      });

      return res.json({
        campaigns,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getCampaignDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await this.campaignRepository.findOne({
        where: { id },
        relations: ['sentByUser'],
      });

      if (!campaign) {
        return res.status(404).json({ message: 'Campanha não encontrada' });
      }

      return res.json(campaign);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

