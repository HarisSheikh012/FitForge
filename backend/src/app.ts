import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import { notFoundHandler } from './middleware/notFound';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import gymRoutes from './routes/gym.routes';
import branchRoutes from './routes/branch.routes';
import memberRoutes from './routes/member.routes';
import trainerRoutes from './routes/trainer.routes';
import staffRoutes from './routes/staff.routes';
import membershipRoutes from './routes/membership.routes';
import attendanceRoutes from './routes/attendance.routes';
import paymentRoutes from './routes/payment.routes';
import invoiceRoutes from './routes/invoice.routes';
import classRoutes from './routes/class.routes';
import equipmentRoutes from './routes/equipment.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import subscriptionRoutes from './routes/subscription.routes';
import dashboardRoutes from './routes/dashboard.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── General Middleware ──────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── Rate Limiting ────────────────────────────────────────────
app.use('/api/', rateLimiter);

// ─── Static Files (uploads) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Swagger API Docs ─────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FitForge API Docs',
}));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: config.nodeEnv,
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
