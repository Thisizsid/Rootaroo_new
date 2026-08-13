"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./shared/middleware/errorHandler");
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/household/routes"));
const routes_3 = __importDefault(require("./modules/feed/routes"));
const routes_4 = __importDefault(require("./modules/task/routes"));
const routes_5 = __importDefault(require("./modules/grocery/routes"));
const routes_6 = __importDefault(require("./modules/todo/routes"));
const routes_7 = __importDefault(require("./modules/notification/routes"));
const routes_8 = __importDefault(require("./modules/dashboard/routes"));
const routes_9 = __importDefault(require("./modules/expense/routes"));
const routes_10 = __importDefault(require("./modules/vault/routes"));
const routes_11 = __importDefault(require("./modules/chat/routes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const logger_1 = __importDefault(require("./shared/utils/logger"));
const app = (0, express_1.default)();
// ── Security Middleware ──
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigins,
    credentials: true,
}));
// ── Rate Limiting ──
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', generalLimiter);
// Strict rate limit on auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many auth attempts, please try again later.' },
});
app.use('/api/v1/auth/', authLimiter);
// ── Body Parsing ──
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Request Logging ──
app.use((0, morgan_1.default)(env_1.env.nodeEnv === 'development' ? 'dev' : 'combined', {
    stream: { write: (message) => logger_1.default.info(message.trim()) },
}));
// ── Health Check ──
app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});
// ── Static files (uploaded media) ──
app.use('/uploads', express_1.default.static(path_1.default.resolve(env_1.env.uploadDir || './uploads')));
// ── API Routes ──
app.use('/api/v1/auth', routes_1.default);
app.use('/api/v1/households', routes_2.default);
app.use('/api/v1/feed', routes_3.default);
app.use('/api/v1/tasks', routes_4.default);
app.use('/api/v1/groceries', routes_5.default);
app.use('/api/v1/todos', routes_6.default);
app.use('/api/v1/expenses', routes_9.default);
app.use('/api/v1/vault', routes_10.default);
app.use('/api/v1/notifications', routes_7.default);
app.use('/api/v1/dashboard', routes_8.default);
app.use('/api/v1/chat', routes_11.default);
// ── Swagger Docs ──
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
    res.json(swagger_1.swaggerSpec);
});
// ── 404 Handler ──
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// ── Global Error Handler ──
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map