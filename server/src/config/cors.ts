import { CorsOptions } from 'cors';
import { env } from './env.js';

const allowedOrigins = Array.from(
  new Set([
    ...env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean),
    ...(env.RAILWAY_PUBLIC_DOMAIN ? [`https://${env.RAILWAY_PUBLIC_DOMAIN}`] : []),
  ])
);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
