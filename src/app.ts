import express from 'express';
import cors from 'cors';
//import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/jobs.routes';
import imageRoutes from './routes/images.routes';
import { errorHandler } from './middleware/error';

export function buildApp() {
  const app = express();
//  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.use('/v1/auth', authRoutes);
  app.use('/v1/jobs', jobRoutes);
  app.use('/v1/images', imageRoutes);

  app.use(errorHandler);
  return app;
}