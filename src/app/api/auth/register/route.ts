import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema, zodErrorMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true },
  });

  const response = NextResponse.json({ user }, { status: 201 });
  setSessionCookie(response, user);

  return response;
}
