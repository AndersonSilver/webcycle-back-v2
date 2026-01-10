import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { AppDataSource } from './config/database.config';
import './config/passport.config';
import { env } from './config/env.config';
import { User } from './entities/User.entity';

// Routes
import { AuthController } from './controllers/AuthController';
import { CourseController } from './controllers/CourseController';
import { PurchaseController } from './controllers/PurchaseController';
import { ProgressController } from './controllers/ProgressController';
import { AdminController } from './controllers/AdminController';
import { CouponController } from './controllers/CouponController';
import { ReviewController } from './controllers/ReviewController';
import { CartController } from './controllers/CartController';
import { WebhookController } from './controllers/WebhookController';
import { CertificateController } from './controllers/CertificateController';
import { FavoriteController } from './controllers/FavoriteController';
import { NotificationController } from './controllers/NotificationController';
import { RefundController } from './controllers/RefundController';
import { RecommendationController } from './controllers/RecommendationController';
import { ModuleController } from './controllers/ModuleController';
import { LessonController } from './controllers/LessonController';
import { PodcastController } from './controllers/PodcastController';
import { UserPodcastController } from './controllers/UserPodcastController';
import { NewsletterController } from './controllers/NewsletterController';
import { EmailTrackingController } from './controllers/EmailTrackingController';
import { UploadController } from './controllers/UploadController';
import { SupportController } from './controllers/SupportController';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configurar CORS do Socket.io: suporta múltiplas origens separadas por vírgula
const socketCorsOrigin = env.corsOrigin 
  ? env.corsOrigin.includes(',') 
    ? env.corsOrigin.split(',').map((origin: string) => origin.trim())
    : env.corsOrigin
  : env.frontendUrl || 'http://localhost:5173';

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: socketCorsOrigin,
    credentials: true,
  },
});

const PORT = env.port;

// Middlewares
// Configurar CORS: suporta múltiplas origens separadas por vírgula
const corsOptions = {
  origin: env.corsOrigin 
    ? env.corsOrigin.includes(',') 
      ? env.corsOrigin.split(',').map((origin: string) => origin.trim())
      : env.corsOrigin
    : true, // Se não definido, permite qualquer origem
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware para pular página de aviso do ngrok (para webhooks)
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Adiciona header para pular página de aviso do ngrok
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Middleware específico para webhooks - deve vir ANTES do express.json()
// IMPORTANTE: Este middleware deve ser o PRIMEIRO para capturar todas as requisições de webhook
app.use('/api/webhooks', (req: Request, res: Response, next: NextFunction) => {
  console.log('\n🔍 [WEBHOOK MIDDLEWARE] ==========================================');
  console.log('🔍 [WEBHOOK MIDDLEWARE] Recebida requisição:', req.method, req.url);
  console.log('🔍 [WEBHOOK MIDDLEWARE] IP:', req.ip || req.socket.remoteAddress);
  console.log('🔍 [WEBHOOK MIDDLEWARE] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 [WEBHOOK MIDDLEWARE] ==========================================\n');
  
  // Permitir requisições do Mercado Pago sem autenticação
  // Adicionar headers CORS específicos para webhooks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-id, x-signature');
  
  // Responder OPTIONS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ [WEBHOOK MIDDLEWARE] Respondendo OPTIONS preflight');
    res.status(200).end();
    return;
  }
  
  console.log('✅ [WEBHOOK MIDDLEWARE] Passando para próximo middleware');
  next();
});

// Aumentar limite de payload para uploads grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
  }) as any
);
app.use(passport.initialize() as any);
app.use(passport.session() as any);

// Middleware de Logging - Registra todas as requisições
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleString('pt-BR');
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const hasAuth = req.headers.authorization ? '🔐' : '🔓';
  const queryParams = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query as any).toString()}` : '';
  
  // Log da requisição
  console.log(`\n📡 [${timestamp}] ${hasAuth} ${method} ${url}${queryParams}`);
  console.log(`   IP: ${ip}`);
  
  // Log do body se existir (exceto senhas)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '***';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***';
    console.log(`   Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Log do status code quando a resposta for enviada
  const startTime = Date.now();
  const originalSend = res.send;
  res.send = function (body: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                        statusCode >= 400 && statusCode < 500 ? '⚠️' : 
                        statusCode >= 500 ? '❌' : 'ℹ️';
    
    console.log(`${statusEmoji} [${timestamp}] ${method} ${url} - Status: ${statusCode} - Tempo: ${duration}ms`);
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize controllers
const authController = new AuthController();
const courseController = new CourseController();
const purchaseController = new PurchaseController();
const progressController = new ProgressController();
const adminController = new AdminController();
const couponController = new CouponController();
const reviewController = new ReviewController();
const cartController = new CartController();
const webhookController = new WebhookController();
const certificateController = new CertificateController();
const favoriteController = new FavoriteController();
const notificationController = new NotificationController();
const refundController = new RefundController();
const recommendationController = new RecommendationController();
const moduleController = new ModuleController();
const lessonController = new LessonController();
const podcastController = new PodcastController();
const userPodcastController = new UserPodcastController();
const newsletterController = new NewsletterController();
const emailTrackingController = new EmailTrackingController();
const uploadController = new UploadController();

// Socket.io Authentication Middleware (deve vir antes do SupportController usar)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next(new Error('Usuário não encontrado'));
    }

    (socket as any).data.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação Socket.io:', error);
    next(new Error('Token inválido'));
  }
});

const supportController = new SupportController(io);

// API Routes
app.use('/api/auth', authController.getRouter());
app.use('/api/courses', courseController.getRouter());
app.use('/api/purchases', purchaseController.getRouter());
app.use('/api/progress', progressController.getRouter());
app.use('/api/admin', adminController.getRouter());
app.use('/api/coupons', couponController.getRouter());
app.use('/api/reviews', reviewController.getRouter());
app.use('/api/cart', cartController.getRouter());
app.use('/api/webhooks', webhookController.getRouter());
app.use('/api/certificates', certificateController.getRouter());
app.use('/api/favorites', favoriteController.getRouter());
app.use('/api/notifications', notificationController.getRouter());
app.use('/api/refunds', refundController.getRouter());
app.use('/api/recommendations', recommendationController.getRouter());
app.use('/api/modules', moduleController.getRouter());
app.use('/api/lessons', lessonController.getRouter());
app.use('/api/podcasts', podcastController.getRouter());
app.use('/api/my-podcasts', userPodcastController.getRouter());
app.use('/api/newsletter', newsletterController.getRouter());
app.use('/api/email/track', emailTrackingController.getRouter());
app.use('/api/upload', uploadController.getRouter());
app.use('/api/support', supportController.getRouter());

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: env.nodeEnv === 'production' ? 'Erro interno do servidor' : err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${env.nodeEnv}`);
      console.log(`🌐 Frontend URL: ${env.frontendUrl}`);
      console.log(`💬 Socket.io ready for chat support`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });

export default app;
