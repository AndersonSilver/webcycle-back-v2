import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AzureStorageService } from '../services/AzureStorageService';
import { AppDataSource } from '../config/database.config';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/Lesson.entity';
import { Course } from '../entities/Course.entity';
import { Purchase, PaymentStatus } from '../entities/Purchase.entity';
import { User } from '../entities/User.entity';

export class UploadController {
  private router: Router;
  private azureStorage: AzureStorageService;
  private upload: multer.Multer;
  private uploadDocument: multer.Multer;
  private tempDir: string;
  private lessonRepository: Repository<Lesson>;
  private courseRepository: Repository<Course>;
  private purchaseRepository: Repository<Purchase>;

  constructor() {
    this.router = Router();
    this.azureStorage = new AzureStorageService();
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.courseRepository = AppDataSource.getRepository(Course);
    this.purchaseRepository = AppDataSource.getRepository(Purchase);
    
    // Criar diretório temporário se não existir
    this.tempDir = path.join(process.cwd(), 'temp-uploads');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Configurar multer para armazenar arquivos em disco temporário
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, this.tempDir);
      },
      filename: (_req, file, cb) => {
        // Gerar nome único para o arquivo temporário
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });
    
    this.upload = multer({
      storage,
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB máximo
      },
      fileFilter: (req, file, cb) => {
        // Validar tipo de arquivo
        if (req.path === '/video') {
          const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Tipo de arquivo não permitido. Use MP4, WebM, OGG, MOV ou AVI.'));
          }
        } else if (req.path === '/image') {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.'));
          }
        } else {
          cb(new Error('Rota de upload inválida'));
        }
      },
    });

    // Multer para documentos (PDF, DOC, XLS)
    this.uploadDocument = multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (_req, file, cb) => {
        // Permitir apenas documentos
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tipo de arquivo não permitido. Apenas PDF, DOC, DOCX, XLS e XLSX são aceitos.'));
        }
      },
    });
    
    this.setupRoutes();
  }

  private setupRoutes() {
    // Upload de vídeo (apenas admin)
    this.router.post(
      '/video',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.upload.single('video') as any,
      this.uploadVideo.bind(this)
    );

    // Upload de imagem (apenas admin)
    this.router.post(
      '/image',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.upload.single('image') as any,
      this.uploadImage.bind(this)
    );

    // Upload de documento/material (apenas admin)
    this.router.post(
      '/document',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.uploadDocument.single('document') as any,
      this.uploadDocumentHandler.bind(this)
    );

    // Deletar arquivo (apenas admin)
    this.router.delete(
      '/:url(*)',
      AuthMiddleware.authenticate,
      AuthMiddleware.requireAdmin,
      this.deleteFile.bind(this)
    );

    // Streaming de vídeo (requer autenticação e verificação de acesso)
    // Usar query parameter em vez de path parameter para URLs longas
    this.router.get(
      '/stream',
      AuthMiddleware.authenticate,
      // Permitir CORS e OPTIONS para streaming
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
        if (req.method === 'OPTIONS') {
          res.status(200).end();
          return;
        }
        next();
      },
      this.streamVideo.bind(this)
    );
  }

  private async uploadVideo(req: Request, res: Response) {
    let tempFilePath: string | null = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de vídeo enviado' });
      }

      tempFilePath = req.file.path;
      
      // Upload usando streaming (não carrega arquivo inteiro na memória)
      const fileUrl = await this.azureStorage.uploadFileFromPath(
        tempFilePath,
        req.file.originalname,
        'videos'
      );

      console.log(`✅ Vídeo enviado para Azure: ${fileUrl}`);

      // Deletar arquivo temporário após upload bem-sucedido
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      return res.json({
        url: fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de vídeo:', error);
      
      // Deletar arquivo temporário em caso de erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }
      }
      
      return res.status(500).json({
        message: error.message || 'Erro ao fazer upload de vídeo',
      });
    }
  }

  private async uploadImage(req: Request, res: Response) {
    let tempFilePath: string | null = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado' });
      }

      tempFilePath = req.file.path;
      
      // Para imagens (geralmente pequenas), podemos usar upload direto
      // Mas ainda assim usamos streaming para consistência
      const fileUrl = await this.azureStorage.uploadFileFromPath(
        tempFilePath,
        req.file.originalname,
        'images'
      );

      console.log(`✅ Imagem enviada para Azure: ${fileUrl}`);

      // Deletar arquivo temporário após upload bem-sucedido
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      return res.json({
        url: fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de imagem:', error);
      
      // Deletar arquivo temporário em caso de erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }
      }
      
      return res.status(500).json({
        message: error.message || 'Erro ao fazer upload de imagem',
      });
    }
  }

  private async streamVideo(req: Request, res: Response): Promise<void> {
    try {
      // Verificar autenticação
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ message: 'Não autenticado' });
        return;
      }

      // Obter URL e lessonId do query parameter
      const encodedUrl = req.query.url as string;
      const lessonId = req.query.lessonId as string;
      
      if (!encodedUrl) {
        res.status(400).json({ message: 'URL não fornecida' });
        return;
      }

      // Decodificar URL
      const videoUrl = decodeURIComponent(encodedUrl);
      console.log('📹 Streaming vídeo:', videoUrl);
      
      // Verificar se é uma URL do Azure Blob Storage
      if (!videoUrl.includes('blob.core.windows.net')) {
        res.status(400).json({ message: 'URL inválida' });
        return;
      }

      if (lessonId) {
        const lesson = await this.lessonRepository.findOne({
          where: { id: lessonId },
          relations: ['module', 'module.course'],
        });

        if (!lesson) {
          res.status(404).json({ message: 'Aula não encontrada' });
          return;
        }

        if (lesson.videoUrl !== videoUrl) {
          res.status(403).json({ message: 'Vídeo não pertence a esta aula' });
          return;
        }

        let hasAccess = user.role === 'admin' || !!lesson.free;
        if (!hasAccess) {
          const purchase = await this.purchaseRepository
            .createQueryBuilder('purchase')
            .innerJoin('purchase.courses', 'pc')
            .where('purchase.userId = :userId', { userId: user.id })
            .andWhere('pc.courseId = :courseId', { courseId: lesson.module.courseId })
            .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.PAID })
            .getOne();

          hasAccess = !!purchase;
        }

        if (!hasAccess) {
          res.status(403).json({ message: 'Você não tem acesso a este conteúdo' });
          return;
        }
      } else {
        // Sem lessonId: só trailer oficial do curso (course.videoUrl)
        const trailerCourse = await this.courseRepository.findOne({
          where: { videoUrl, active: true },
        });
        if (!trailerCourse && user.role !== 'admin') {
          res.status(403).json({
            message: 'Streaming sem lessonId só é permitido para trailer de curso',
          });
          return;
        }
      }

      // Obter range header (importante para permitir seek no vídeo)
      const rangeHeader = req.headers.range;
      
      if (rangeHeader) {
        console.log('📹 Range request recebido:', rangeHeader);
      }

      // Fazer streaming do arquivo
      const streamData = await this.azureStorage.streamFile(videoUrl, rangeHeader);

      // Configurar headers de resposta para streaming otimizado e permitir seek
      res.setHeader('Content-Type', streamData.contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', streamData.contentLength);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate'); // Não cachear vídeos protegidos
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY'); // Prevenir embedding em iframes
      res.setHeader('Content-Disposition', 'inline'); // Não permitir download direto
      // CORS apenas para o domínio do frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.setHeader('Access-Control-Allow-Origin', frontendUrl);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
      
      if (streamData.contentRange) {
        res.setHeader('Content-Range', streamData.contentRange);
      }

      // Enviar stream
      res.status(streamData.statusCode);
      streamData.stream.pipe(res);

      streamData.stream.on('error', (error) => {
        console.error('Erro no stream:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erro ao fazer streaming do vídeo' });
        }
      });

    } catch (error: any) {
      console.error('Erro ao fazer streaming de vídeo:', error);
      if (!res.headersSent) {
        // Se for erro de range inválido, retornar 416
        if (error.message && error.message.includes('416:')) {
          res.status(416).json({
            message: 'Range solicitado não satisfazível',
          });
        } else {
          res.status(500).json({
            message: error.message || 'Erro ao fazer streaming de vídeo',
          });
        }
      }
    }
  }

  private async uploadDocumentHandler(req: Request, res: Response) {
    let tempFilePath: string | null = null;
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      // Validar tamanho do arquivo (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return res.status(400).json({ message: 'Arquivo muito grande. Tamanho máximo: 10MB' });
      }

      tempFilePath = file.path;

      // Fazer upload para Azure Blob Storage na pasta 'documents'
      const azureUrl = await this.azureStorage.uploadFileFromPath(
        tempFilePath,
        file.originalname,
        'documents'
      );

      // Deletar arquivo temporário
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        tempFilePath = null;
      }

      console.log('✅ Documento enviado para Azure:', azureUrl);

      return res.json({
        url: azureUrl,
        fileName: file.originalname,
        size: file.size,
        type: file.mimetype,
      });
    } catch (error: any) {
      // Deletar arquivo temporário em caso de erro
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }
      }

      console.error('Erro ao fazer upload de documento:', error);
      return res.status(500).json({
        message: error.message || 'Erro ao fazer upload de documento',
      });
    }
  }

  private async deleteFile(req: Request, res: Response) {
    try {
      const { url } = req.params;
      
      if (!url) {
        return res.status(400).json({ message: 'URL não fornecida' });
      }

      // Decodificar URL (pode vir codificada)
      const decodedUrl = decodeURIComponent(url);
      
      await this.azureStorage.deleteFile(decodedUrl);

      return res.json({ message: 'Arquivo deletado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      return res.status(500).json({
        message: error.message || 'Erro ao deletar arquivo',
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

