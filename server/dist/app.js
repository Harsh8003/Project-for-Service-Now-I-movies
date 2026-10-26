"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const api_v1_js_1 = __importDefault(require("./routes/api.v1.js"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const env_js_1 = require("./config/env.js");
exports.app = (0, express_1.default)();
// Security Headers
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Allows YouTube iframe embed & Razorpay scripts
}));
// Build allowed origins list from env
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];
// Add CLIENT_URL from env (e.g. https://cinematic.vercel.app)
if (env_js_1.env.CLIENT_URL && !allowedOrigins.includes(env_js_1.env.CLIENT_URL)) {
    allowedOrigins.push(env_js_1.env.CLIENT_URL);
}
// Allow all *.vercel.app preview URLs automatically
allowedOrigins.push(/^https:\/\/.*\.vercel\.app$/);
// CORS Configuration
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed => typeof allowed === 'string' ? allowed === origin : allowed.test(origin));
        if (isAllowed) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: origin ${origin} is not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Logging
if (env_js_1.env.NODE_ENV !== 'test') {
    exports.app.use((0, morgan_1.default)('dev'));
}
// Rate Limiting
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
exports.app.use('/api/', generalLimiter);
// Body Parsing
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
exports.app.get('/health', (_req, res) => {
    res.json({
        status: 'HEALTHY',
        service: 'CINEMATIC Backend API',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime())
    });
});
// API Routes
exports.app.use('/api/v1', api_v1_js_1.default);
// Centralized Error Handler
exports.app.use(error_middleware_js_1.errorHandler);
