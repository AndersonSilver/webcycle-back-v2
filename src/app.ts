import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { HomeContentController } from './controllers/HomeContentController';
import { ThemeController } from './controllers/ThemeController';
import { ProductController } from './controllers/ProductController';
import { ProductReviewController } from './controllers/ProductReviewController';
import { TrackingController } from './controllers/TrackingController';

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
const isProd = env.nodeEnv === 'production';

// Middlewares de segurança
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP no nginx do front; API JSON
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 800 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente em breve.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de autenticação. Aguarde e tente novamente.' },
});
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 120 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Rate limit do webhook excedido.' },
});

app.use(generalLimiter);

// CORS: allowlist explícita (sem refletir Origin arbitrário)
const allowedOrigins = (env.corsOrigin || env.frontendUrl || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Requests sem Origin (webhooks, health, curl)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (!isProd && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem CORS não permitida'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Webhooks: sem dump de headers/body; rate limit; OPTIONS simples
app.use('/api/webhooks', webhookLimiter, (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-id, x-signature');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }) as any
);
app.use(passport.initialize() as any);
app.use(passport.session() as any);

// Logging reduzido em produção (sem bodies)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  res.on('finish', () => {
    if (!isProd || res.statusCode >= 400) {
      console.log(`${method} ${url} ${res.statusCode} ${Date.now() - startTime}ms`);
    }
  });
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
const homeContentController = new HomeContentController();
const themeController = new ThemeController();
const productController = new ProductController();
const productReviewController = new ProductReviewController();
const trackingController = new TrackingController();

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
app.use('/api/auth', authLimiter, authController.getRouter());
app.use('/api/courses', courseController.getRouter());
app.use('/api/purchases', purchaseController.getRouter());
app.use('/api/progress', progressController.getRouter());
app.use('/api/admin', adminController.getRouter());
app.use('/api/coupons', couponController.getRouter());
app.use('/api/reviews', reviewController.getRouter());
app.use('/api/cart', cartController.getRouter());
app.use('/api/webhooks', webhookController.getRouter());
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
app.use('/api/home-content', homeContentController.getRouter());
app.use('/api/theme', themeController.getRouter());
app.use('/api/products', productController.getRouter());
app.use('/api/product-reviews', productReviewController.getRouter());
app.use('/api/tracking', trackingController.getRouter());

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  if (err.message === 'Origem CORS não permitida') {
    res.status(403).json({ message: 'Origem não permitida' });
    return;
  }
  res.status(500).json({
    message: isProd ? 'Erro interno do servidor' : err.message,
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
