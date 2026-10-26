import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://cinematic_user:cinematic_secure_pass@localhost:5432/cinematic_db?schema=public'),
  JWT_SECRET: z.string().default('super_secret_jwt_key_at_least_32_chars_long_production'),
  JWT_REFRESH_SECRET: z.string().default('super_secret_refresh_jwt_key_at_least_32_chars_production'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_CinematicDemoKeyId'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_CinematicDemoSecretKey'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_test_CinematicWebhookSecret'),
  TMDB_API_KEY: z.string().optional().default(''),
  EMAIL_PROVIDER: z.string().default('console'),
  EMAIL_FROM: z.string().default('bookings@cinematic.example.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
