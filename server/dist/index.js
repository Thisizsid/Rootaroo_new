"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const database_2 = __importDefault(require("./config/database"));
const models_1 = require("./database/models");
require("./config/redis");
const grocery_archive_1 = require("./jobs/grocery-archive");
const socket_1 = require("./shared/utils/socket");
const socketAuth_1 = require("./shared/middleware/socketAuth");
const chatSocket_1 = require("./socket/chatSocket");
const logger_1 = __importDefault(require("./shared/utils/logger"));
const server = http_1.default.createServer(app_1.default);
// ── Socket.io Setup ──
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.corsOrigins,
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
exports.io = io;
// ── Socket.io Security ──
// 1. JWT auth middleware — rejects unauthenticated connections
(0, socketAuth_1.socketAuthMiddleware)(io);
// 2. Connection handler — room joining, household access, token refresh
(0, socketAuth_1.setupSocketConnectionHandlers)(io);
// 3. Feature-specific handlers (chat, typing, presence, etc.)
(0, chatSocket_1.registerChatSocket)(io);
// Make io accessible to route handlers
app_1.default.set('io', io);
(0, socket_1.setIO)(io);
// ── Start Server ──
async function start() {
    try {
        // Connect to MySQL
        await (0, database_1.testDatabaseConnection)();
        // Set up model associations
        (0, models_1.setupAssociations)();
        // Auto-sync models in development mode
        if (env_1.env.nodeEnv === 'development') {
            await database_2.default.sync();
            logger_1.default.info('✓ Database synced (development mode)');
        }
        // Redis is already connecting (config/redis.ts handles it)
        // No need to await — it connects asynchronously
        // Start scheduled jobs
        (0, grocery_archive_1.startGroceryArchiveJob)();
        server.listen(env_1.env.port, () => {
            logger_1.default.info(`
╔══════════════════════════════════════════╗
║          Rootaroo API Server              ║
║──────────────────────────────────────────║
║  Port:    ${String(env_1.env.port).padEnd(32)}║
║  Env:     ${env_1.env.nodeEnv.padEnd(32)}║
║  DB:      ${env_1.env.db.host}:${String(env_1.env.db.port).padEnd(20)}║
║  Redis:   ${env_1.env.redis.host}:${String(env_1.env.redis.port).padEnd(20)}║
╚══════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map