import { NextResponse, type NextRequest } from "next/server";
import { getMovieDetails, TmdbError } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  try {
    const movie = await getMovieDetails(movieId);
    return NextResponse.json({ movie });
  } catch (error) {
    const message =
      error instanceof TmdbError
        ? "Movie details are temporarily unavailable."
        : "Unable to load movie details.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
