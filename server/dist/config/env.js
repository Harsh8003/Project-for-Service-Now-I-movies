"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform(Number),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
    DATABASE_URL: zod_1.z.string().default('postgresql://cinematic_user:cinematic_secure_pass@localhost:5432/cinematic_db?schema=public'),
    JWT_SECRET: zod_1.z.string().default('super_secret_jwt_key_at_least_32_chars_long_production'),
    JWT_REFRESH_SECRET: zod_1.z.string().default('super_secret_refresh_jwt_key_at_least_32_chars_production'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    RAZORPAY_KEY_ID: zod_1.z.string().default('rzp_test_CinematicDemoKeyId'),
    RAZORPAY_KEY_SECRET: zod_1.z.string().default('rzp_test_CinematicDemoSecretKey'),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().default('rzp_test_CinematicWebhookSecret'),
    TMDB_API_KEY: zod_1.z.string().optional().default(''),
    EMAIL_PROVIDER: zod_1.z.string().default('console'),
    EMAIL_FROM: zod_1.z.string().default('bookings@cinematic.example.com'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
