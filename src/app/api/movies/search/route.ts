import { NextResponse, type NextRequest } from "next/server";
import { searchMovies, TmdbError } from "@/lib/tmdb";
import { movieSearchSchema, zodErrorMessage } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = {
    q: request.nextUrl.searchParams.get("q") ?? "",
    page: request.nextUrl.searchParams.get("page") ?? "1",
  };
  const parsed = movieSearchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const movies = await searchMovies(parsed.data.q, parsed.data.page);
    return NextResponse.json(movies);
  } catch (error) {
    const message =
      error instanceof TmdbError
        ? "Movie search is temporarily unavailable."
        : "Unable to search movies.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
