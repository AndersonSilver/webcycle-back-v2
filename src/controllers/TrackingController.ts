import { Request, Response, Router } from 'express';
import { Repository } from 'typeorm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppDataSource } from '../config/database.config';
import { ShippingTracking } from '../entities/ShippingTracking.entity';
import { ProductPurchase } from '../entities/ProductPurchase.entity';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { validateDto } from '../middleware/ValidationMiddleware';
import { AddTrackingCodeDto } from '../dto/product.dto';
import { TrackingService } from '../services/TrackingService';
import { UserRole } from '../entities/User.entity';
import { AzureStorageService } from '../services/AzureStorageService';

export class TrackingController {
  private router: Router;
  private trackingRepository: Repository<ShippingTracking>;
  private productPurchaseRepository: Repository<ProductPurchase>;
  private trackingService: TrackingService;
  private azureStorage: AzureStorageService;
  private upload: multer.Multer;
  private tempDir: string;

  constructor() {
    this.router = Router();
    this.trackingRepository = AppDataSource.getRepository(ShippingTracking);
    this.productPurchaseRepository = AppDataSource.getRepository(ProductPurchase);
    this.trackingService = new TrackingService();
    this.azureStorage = new AzureStorageService();
    
    // Criar diretório temporário se não existir
    this.tempDir = path.join(process.cwd(), 'temp-uploads');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Configurar multer para documentos (PDF, imagens)
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, this.tempDir);
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });
    
    this.upload = multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.'));
        }
      }
    });
    
    this.setupRoutes();
  }

  private setupRoutes() {
    // Rotas protegidas
    this.router.use(AuthMiddleware.authenticate);

    // Cliente pode ver seus próprios trackings (apenas para comprovante)
    this.router.get('/my-trackings', this.getMyTrackings.bind(this));
    this.router.get('/:id', this.getTracking.bind(this));

    // Admin pode criar tracking (sem código) e fazer upload de comprovante
    this.router.post(
      '/product-purchase/:productPurchaseId/add-tracking',
      AuthMiddleware.requireAdmin,
      validateDto(AddTrackingCodeDto),
      this.addTrackingCode.bind(this)
    );

    // Admin pode fazer upload de comprovante de envio
    this.router.post(
      '/:id/upload-proof',
      AuthMiddleware.requireAdmin,
      this.upload.single('proof') as any,
      this.uploadProofOfDelivery.bind(this)
    );
  }

  private async getMyTrackings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const trackings = await this.trackingRepository
        .createQueryBuilder('tracking')
        .leftJoinAndSelect('tracking.productPurchase', 'productPurchase')
        .leftJoinAndSelect('productPurchase.purchase', 'purchase')
        .leftJoinAndSelect('productPurchase.product', 'product')
        .leftJoinAndSelect('tracking.events', 'events')
        .where('purchase.userId = :userId', { userId })
        .orderBy('tracking.createdAt', 'DESC')
        .addOrderBy('events.createdAt', 'DESC')
        .getMany();

      return res.json(trackings);
    } catch (error) {
      console.error('Erro ao buscar trackings:', error);
      return res.status(500).json({ error: 'Erro ao buscar trackings' });
    }
  }

  private async getTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const tracking = await this.trackingRepository.findOne({
        where: { id },
        relations: ['productPurchase', 'productPurchase.purchase', 'productPurchase.product', 'events'],
      });

      if (!tracking) {
        return res.status(404).json({ error: 'Tracking não encontrado' });
      }

      // Verificar se o usuário tem permissão
      if (userRole !== UserRole.ADMIN && tracking.productPurchase.purchase.userId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      return res.json(tracking);
    } catch (error) {
      console.error('Erro ao buscar tracking:', error);
      return res.status(500).json({ error: 'Erro ao buscar tracking' });
    }
  }

  private async getTrackingByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      const tracking = await this.trackingService.getTrackingByCode(code);

      if (!tracking) {
        return res.status(404).json({ error: 'Tracking não encontrado' });
      }

      // Verificar se o usuário tem permissão
      if (userRole !== UserRole.ADMIN && tracking.productPurchase.purchase.userId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      return res.json(tracking);
    } catch (error) {
      console.error('Erro ao buscar tracking por código:', error);
      return res.status(500).json({ error: 'Erro ao buscar tracking por código' });
    }
  }

  private async updateTracking(_req: Request, _res: Response) {
    // Método não utilizado - mantido para compatibilidade
    return;
  }

  private async addTrackingCode(req: Request, res: Response) {
    try {
      const { productPurchaseId } = req.params;
      const { trackingCode, carrier }: AddTrackingCodeDto = req.body;

      const productPurchase = await this.productPurchaseRepository.findOne({
        where: { id: productPurchaseId },
        relations: ['product'],
      });

      if (!productPurchase) {
        return res.status(404).json({ error: 'Compra de produto não encontrada' });
      }

      if (productPurchase.product.type !== 'physical') {
        return res.status(400).json({ error: 'Apenas produtos físicos podem ter tracking' });
      }

      // Criar tracking sem código (apenas para comprovante)
      const tracking = await this.trackingService.addTrackingCode(
        productPurchaseId,
        trackingCode?.trim() || undefined,
        carrier?.trim() || undefined
      );

      res.status(201).json(tracking);
    } catch (error) {
      console.error('Erro ao criar tracking:', error);
      res.status(500).json({ error: 'Erro ao criar tracking' });
    }
  }

  private async uploadProofOfDelivery(req: Request, res: Response) {
    let tempFilePath: string | null = null;
    
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const tracking = await this.trackingRepository.findOne({
        where: { id },
        relations: ['productPurchase', 'productPurchase.purchase'],
      });

      if (!tracking) {
        return res.status(404).json({ error: 'Tracking não encontrado' });
      }

      tempFilePath = file.path;

      // Fazer upload para Azure Storage
      const fileUrl = await this.azureStorage.uploadFileFromPath(
        tempFilePath,
        file.originalname,
        'documents'
      );

      // Atualizar tracking com URL do comprovante
      tracking.proofOfDeliveryUrl = fileUrl;
      await this.trackingRepository.save(tracking);

      // Deletar arquivo temporário
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      return res.json({
        tracking,
        proofUrl: fileUrl,
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload do comprovante:', error);
      
      // Deletar arquivo temporário em caso de erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }
      }
      
      return res.status(500).json({ error: 'Erro ao fazer upload do comprovante' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

