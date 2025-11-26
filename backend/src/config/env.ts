import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SUPABASE_URL: z.string().default('https://wbypylvyzbeglwpsrwuo.supabase.co'),
    SUPABASE_SERVICE_KEY: z.string(),
    SUPABASE_KEY: z.string().optional(),
    CLIENT_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
