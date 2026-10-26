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
// CORS Configuration
exports.app.use((0, cors_1.default)({
    origin: [env_js_1.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Logging
if (env_js_1.env.NODE_ENV !== 'test') {
    exports.app.use((0, morgan_1.default)('dev'));
}
// Rate Limiting (100 reqs per 15 min for general endpoints)
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
exports.app.get('/health', (req, res) => {
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
