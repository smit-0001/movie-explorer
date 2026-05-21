import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { formatFavorite } from "@/lib/favorites";
import { prisma } from "@/lib/prisma";
import { favoriteCreateSchema, zodErrorMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json({ favorites: favorites.map(formatFavorite) });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = favoriteCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_movieId: {
        userId: user.id,
        movieId: parsed.data.movieId,
      },
    },
    create: {
      userId: user.id,
      movieId: parsed.data.movieId,
      title: parsed.data.title,
      posterPath: parsed.data.posterPath ?? null,
      posterUrl: parsed.data.posterUrl ?? null,
      releaseDate: parsed.data.releaseDate ?? null,
      overview: parsed.data.overview ?? null,
      runtime: parsed.data.runtime ?? null,
      rating: parsed.data.rating ?? null,
      note: parsed.data.note ?? null,
    },
    update: {
      title: parsed.data.title,
      posterPath: parsed.data.posterPath ?? null,
      posterUrl: parsed.data.posterUrl ?? null,
      releaseDate: parsed.data.releaseDate ?? null,
      overview: parsed.data.overview ?? null,
      runtime: parsed.data.runtime ?? null,
    },
  });

  return NextResponse.json({ favorite: formatFavorite(favorite) }, { status: 201 });
}
