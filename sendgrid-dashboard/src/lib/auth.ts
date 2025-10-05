import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "auth_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SHORT_SESSION_SECONDS = 60 * 60 * 12; // 12 hours

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  return username === env.DASHBOARD_USERNAME && password === env.DASHBOARD_PASSWORD;
}

async function getSecretKey(): Promise<Uint8Array> {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createSessionToken(username: string): Promise<string> {
  const secretKey = await getSecretKey();
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secretKey = await getSecretKey();
    await jwtVerify(token, secretKey);
    return true;
  } catch (error) {
    console.error("Failed to verify auth token", error);
    return false;
  }
}

type SameSite = "lax" | "strict" | "none";

export interface AuthCookieAttributes {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  path?: string;
  maxAge?: number;
}

export function buildAuthCookie(token: string, rememberMe: boolean): AuthCookieAttributes {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? TOKEN_TTL_SECONDS : SHORT_SESSION_SECONDS,
  };
}

export function buildClearAuthCookie(): AuthCookieAttributes {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}
