import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import clubRoutes from './routes/club.routes.js';
import taskRoutes from './routes/task.routes.js';
import contributionRoutes from './routes/contribution.routes.js';
import recruitmentRoutes from './routes/recruitment.routes.js';
import eventRoutes from './routes/event.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import userRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import presidentRoutes from './routes/president.routes.js';
import announcementRoutes from './routes/announcement.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Serve uploaded avatars safely
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'ClubConnect API is healthy', data: { status: 'ok' } });
  });

  app.use(csrfProtection);

  app.use('/api/auth', authRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/contributions', contributionRoutes);
  app.use('/api/recruitment', recruitmentRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/president', presidentRoutes);
  app.use('/api/announcements', announcementRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API route not found',
      errors: [],
    });
  });

  if (env.NODE_ENV === 'production') {
    const candidateDirs = [
      path.resolve(process.cwd(), 'client/dist'),
      path.resolve(process.cwd(), '../client/dist'),
    ];
    const clientDistDir = candidateDirs.find((dir) =>
      fs.existsSync(path.join(dir, 'index.html'))
    );
    if (clientDistDir) {
      app.use(express.static(clientDistDir));
      app.get('*', (req, res, next) => {
        if (
          req.path.startsWith('/api') ||
          req.path.startsWith('/uploads') ||
          req.path.startsWith('/socket.io')
        ) {
          return next();
        }
        res.sendFile(path.join(clientDistDir, 'index.html'));
      });
    }
  }

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      errors: [],
    });
  });

  app.use(errorHandler);
  return app;
}
