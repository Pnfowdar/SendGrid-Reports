import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildAuthCookie,
  buildClearAuthCookie,
  createSessionToken,
  validateCredentials,
} from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parseResult = loginSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { username, password, rememberMe } = parseResult.data;
  const isValid = await validateCredentials(username, password);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const cookie = buildAuthCookie(token, rememberMe ?? false);
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookie);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(buildClearAuthCookie());
  return response;
}
