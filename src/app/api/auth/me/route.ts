import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  return NextResponse.json({ user });
}
