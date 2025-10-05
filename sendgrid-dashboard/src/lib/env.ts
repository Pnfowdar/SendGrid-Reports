import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DASHBOARD_USERNAME: z.string().min(1, "DASHBOARD_USERNAME is required"),
  DASHBOARD_PASSWORD: z.string().min(1, "DASHBOARD_PASSWORD is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL").optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE: z.string().min(1).optional(),
});

const parsedEnv = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DASHBOARD_USERNAME: process.env.DASHBOARD_USERNAME,
  DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
});

export const env = parsedEnv;

export type Env = typeof env;
