import dotenv from 'dotenv';

dotenv.config();

const INSECURE_DEFAULTS = [
  'your_super_secret_jwt_key_change_in_production',
  'your_refresh_secret_key',
  'your_session_secret',
];

function assertSecureSecrets() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') return;

  const jwtSecret = process.env.JWT_SECRET || '';
  const jwtRefresh = process.env.JWT_REFRESH_SECRET || '';
  const sessionSecret = process.env.SESSION_SECRET || '';

  if (!jwtSecret || INSECURE_DEFAULTS.includes(jwtSecret) || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET inválido ou ausente em produção (mín. 32 caracteres, sem default).');
  }
  if (!jwtRefresh || INSECURE_DEFAULTS.includes(jwtRefresh) || jwtRefresh.length < 32) {
    throw new Error('JWT_REFRESH_SECRET inválido ou ausente em produção.');
  }
  if (!sessionSecret || INSECURE_DEFAULTS.includes(sessionSecret) || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET inválido ou ausente em produção.');
  }
  if (!process.env.CORS_ORIGIN && !process.env.FRONTEND_URL) {
    throw new Error('CORS_ORIGIN ou FRONTEND_URL obrigatório em produção.');
  }
}

assertSecureSecrets();

export const env = {
  // Database
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: parseInt(process.env.DB_PORT || '5432'),
  dbUsername: process.env.DB_USERNAME || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'password',
  dbDatabase: process.env.DB_DATABASE || 'tb_psico',
  dbSynchronize: process.env.DB_SYNCHRONIZE === 'true',
  dbLogging: process.env.DB_LOGGING === 'true',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',

  // Payment Gateway
  mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  mercadopagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
  mercadopagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  mercadopagoWebhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || '',

  // Storage (Azure Blob Storage)
  azureStorageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
  azureStorageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  azureStorageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || '',
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',

  // Email
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASS || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@psicoedu.com',

  // App
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'your_session_secret',

  // Tracking (Brasil Aberto)
  BRASIL_ABERTO_API_KEY: process.env.BRASIL_ABERTO_API_KEY || '',
  BRASIL_ABERTO_API_URL: process.env.BRASIL_ABERTO_API_URL || 'https://brasilaberto.com/api',
};

