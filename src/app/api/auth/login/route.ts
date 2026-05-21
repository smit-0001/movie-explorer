import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, zodErrorMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });
  const passwordMatches = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    user: { id: user.id, username: user.username },
  });
  setSessionCookie(response, { id: user.id, username: user.username });

  return response;
}
