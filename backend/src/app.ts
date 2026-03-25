import express from 'express';
import { errorMiddleware } from './middleware/error.middleware.ts';
import { notFoundMiddleware } from './middleware/not-found.middleware.ts';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware.ts';
import analyticsRoutes from './routes/analytics.routes.ts';
import chatRoutes from './routes/chat.routes.ts';
import dashboardRoutes from './routes/dashboard.routes.ts';
import datasetRoutes from './routes/dataset.routes.ts';
import mapRoutes from './routes/map.routes.ts';

export function createApp() {
  const app = express();

  app.use(requestLoggerMiddleware);
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/datasets', datasetRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/map', mapRoutes);
  app.use('/api/chat', chatRoutes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
