"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const seatSocket_js_1 = require("./socket/seatSocket.js");
const store_js_1 = require("./db/store.js");
const prisma_js_1 = require("./db/prisma.js");
const server = http_1.default.createServer(app_js_1.app);
// Socket.IO configuration with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [env_js_1.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
        credentials: true
    }
});
(0, seatSocket_js_1.initializeSeatSocket)(io);
// Background task: Clean up expired seat locks every 15 seconds
const lockCleanupInterval = setInterval(() => {
    const count = store_js_1.store.cleanupExpiredLocks();
    if (count > 0 && env_js_1.env.NODE_ENV === 'development') {
        console.log(`[SeatLockJob] Auto-released ${count} expired seat hold(s)`);
    }
}, 15000);
server.listen(env_js_1.env.PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`🎬 CINEMATIC Movie Ticket Platform Server running on port ${env_js_1.env.PORT}`);
    console.log(`📡 REST API: http://localhost:${env_js_1.env.PORT}/api/v1`);
    console.log(`⚡ WebSocket / Socket.IO initialized`);
    console.log(`💻 Environment: ${env_js_1.env.NODE_ENV}`);
    // Check database connectivity
    const hasPostgres = await (0, prisma_js_1.checkDatabaseConnection)();
    if (hasPostgres) {
        console.log(`🗄️  Database: Connected to PostgreSQL via Prisma ORM`);
    }
    else {
        console.log(`🗄️  Database: Operating with high-fidelity local memory store (PostgreSQL via Docker Compose ready)`);
    }
    console.log(`======================================================\n`);
});
// Graceful Shutdown
function handleShutdown(signal) {
    console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
    clearInterval(lockCleanupInterval);
    server.close(() => {
        console.log('[Server] HTTP and WebSocket connections closed.');
        process.exit(0);
    });
}
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
