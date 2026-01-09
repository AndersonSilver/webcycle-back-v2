import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { CertificateService } from '../services/CertificateService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { User } from '../entities/User.entity';
import { Course } from '../entities/Course.entity';

export class CertificateController {
  private router: Router;
  private certificateService: CertificateService;
  private courseRepository: Repository<Course>;

  constructor() {
    this.router = Router();
    this.certificateService = new CertificateService();
    this.courseRepository = AppDataSource.getRepository(Course);
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas autenticadas
    this.router.get('/', AuthMiddleware.authenticate, this.getMyCertificates.bind(this));
    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      this.getById.bind(this)
    );
    this.router.get(
      '/:id/download',
      AuthMiddleware.authenticate,
      this.download.bind(this)
    );
    this.router.post(
      '/generate/:courseId',
      AuthMiddleware.authenticate,
      this.generate.bind(this)
    );

    // Rota autenticada para verificação
    this.router.get('/verify/:code', AuthMiddleware.authenticate, this.verify.bind(this));
  }

  private async getMyCertificates(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const certificates = await this.certificateService.getUserCertificates(user.id);
      return res.json({ certificates });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { id } = req.params;
      const certificate = await this.certificateService.getCertificateById(id, user.id);
      return res.json({ certificate });
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  private async download(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { id } = req.params;
      const pdfBuffer = await this.certificateService.generatePDF(id, user.id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  private async generate(req: Request, res: Response) {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }
      const { courseId } = req.params;
      const certificate = await this.certificateService.generateCertificate(user.id, courseId);
      
      // Enviar email de certificado gerado
      try {
        const { emailService } = await import('../services/EmailService');
        const course = await this.courseRepository.findOne({ 
          where: { id: courseId } 
        });
        if (course) {
          await emailService.sendCertificateEmail(
            user.email,
            user.name,
            course.title,
            certificate.certificateNumber,
            certificate.id,
            certificate.verificationCode
          );
          console.log(`📧 Email de certificado enviado para: ${user.email}`);
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de certificado:', emailError);
        // Não falhar a requisição se o email falhar
      }
      
      return res.status(201).json({ certificate });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  private async verify(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const result = await this.certificateService.verifyCertificate(code);
      return res.json(result);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

