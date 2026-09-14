import dotenv from 'dotenv';
dotenv.config();


export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  appName: process.env.APP_NAME ?? 'FitForge',
  appUrl: process.env.APP_URL ?? 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'fallback_access_secret_change_this',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback_refresh_secret_change_this',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },

  email: {
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER ?? '',
    pass: process.env.EMAIL_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'FitForge <noreply@fitforge.io>',
  },

  upload: {
    dir: process.env.UPLOAD_DIR ?? 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    prices: {
      basic: process.env.STRIPE_PRICE_BASIC ?? '',
      pro: process.env.STRIPE_PRICE_PRO ?? '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL ?? 'debug',
    dir: process.env.LOG_DIR ?? 'logs',
  },

  otp: {
    issuer: process.env.OTP_ISSUER ?? 'FitForge',
  },
} as const;
