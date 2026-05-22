import type { MovieDetails, MovieSearchResponse, MovieSearchResult } from "@/types/movie";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w342";

type TmdbSearchMovie = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

type TmdbSearchResponse = {
  page: number;
  results: TmdbSearchMovie[];
  total_pages: number;
  total_results: number;
};

type TmdbMovieDetails = TmdbSearchMovie & {
  runtime?: number | null;
  genres?: Array<{
    id: number;
    name: string;
  }>;
};

export class TmdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbError";
  }
}

function getTmdbApiKey() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new TmdbError("TMDB_API_KEY is not configured.");
  }

  return apiKey;
}

function posterUrl(path: string | null | undefined) {
  return path ? `${POSTER_BASE_URL}${path}` : null;
}

function yearFromDate(date: string | undefined) {
  return date?.slice(0, 4) || null;
}

function normalizeMovie(movie: TmdbSearchMovie): MovieSearchResult {
  const releaseDate = movie.release_date || movie.first_air_date || null;
  const title = movie.title || movie.name || "Untitled";

  return {
    id: movie.id,
    title,
    overview: movie.overview || "",
    posterPath: movie.poster_path || null,
    posterUrl: posterUrl(movie.poster_path),
    releaseDate,
    year: yearFromDate(releaseDate || undefined),
  };
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number>) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", getTmdbApiKey());

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new TmdbError("TMDB request failed.");
  }

  return response.json() as Promise<T>;
}

export async function searchMovies(query: string, page: number): Promise<MovieSearchResponse> {
  const data = await tmdbFetch<TmdbSearchResponse>("/search/movie", {
    query,
    page,
    include_adult: "false",
    language: "en-US",
  });

  return {
    query,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map(normalizeMovie),
  };
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const data = await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, {
    language: "en-US",
  });

  return {
    ...normalizeMovie(data),
    runtime: data.runtime ?? null,
    genres: data.genres?.map((genre) => genre.name).filter(Boolean) ?? [],
  };
}

export function buildPosterUrl(path: string | null) {
  return posterUrl(path);
}
