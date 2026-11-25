import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { initSocketServer } from './sockets/index.js';

async function bootstrap() {
  await prisma.$connect();

  const app = createApp();
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`ClubConnect server listening on http://0.0.0.0:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start ClubConnect server:', err);
  process.exit(1);
});
