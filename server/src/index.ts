import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { initializeSeatSocket } from './socket/seatSocket.js';
import { store } from './db/store.js';
import { checkDatabaseConnection } from './db/prisma.js';

const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

initializeSeatSocket(io);

// Background task: Clean up expired seat locks every 15 seconds
const lockCleanupInterval = setInterval(() => {
  const count = store.cleanupExpiredLocks();
  if (count > 0 && env.NODE_ENV === 'development') {
    console.log(`[SeatLockJob] Auto-released ${count} expired seat hold(s)`);
  }
}, 15000);

server.listen(env.PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🎬 CINEMATIC Movie Ticket Platform Server running on port ${env.PORT}`);
  console.log(`📡 REST API: http://localhost:${env.PORT}/api/v1`);
  console.log(`⚡ WebSocket / Socket.IO initialized`);
  console.log(`💻 Environment: ${env.NODE_ENV}`);

  // Check database connectivity
  const hasPostgres = await checkDatabaseConnection();
  if (hasPostgres) {
    console.log(`🗄️  Database: Connected to PostgreSQL via Prisma ORM`);
  } else {
    console.log(`🗄️  Database: Operating with high-fidelity local memory store (PostgreSQL via Docker Compose ready)`);
  }
  console.log(`======================================================\n`);
});

// Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
  clearInterval(lockCleanupInterval);
  server.close(() => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
