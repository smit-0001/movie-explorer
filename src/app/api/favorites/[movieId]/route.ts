import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { formatFavorite } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import { favoriteUpdateSchema, zodErrorMessage } from "@/lib/validation";

export const runtime = "nodejs";

function parseMovieId(value: string) {
  const movieId = Number(value);
  return Number.isInteger(movieId) && movieId > 0 ? movieId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ movieId: string }> },
) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { movieId: rawMovieId } = await context.params;
  const movieId = parseMovieId(rawMovieId);

  if (!movieId) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = favoriteUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_movieId: { userId: user.id, movieId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Favorite was not found." }, { status: 404 });
  }

  const favorite = await prisma.favorite.update({
    where: { userId_movieId: { userId: user.id, movieId } },
    data: parsed.data,
  });

  return NextResponse.json({ favorite: formatFavorite(favorite) });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ movieId: string }> },
) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { movieId: rawMovieId } = await context.params;
  const movieId = parseMovieId(rawMovieId);

  if (!movieId) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: user.id, movieId },
  });

  return NextResponse.json({ ok: true });
}
