import type {
  FavoriteMovie,
  MovieDetails,
  MovieSearchResponse,
  MovieSearchResult,
} from "@/types/movie";

export type User = {
  id: string;
  username: string;
};

export type FavoriteInput = {
  rating?: number | null;
  note?: string | null;
};

export async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String(data.error)
        : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function getCurrentUser() {
  return readJson<{ user: User | null }>(await fetch("/api/auth/me"));
}

export async function authenticate(
  mode: "login" | "register",
  credentials: { username: string; password: string },
) {
  return readJson<{ user: User }>(
    await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    }),
  );
}

export async function logoutUser() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function searchMovies(searchTerm: string, page: number) {
  return readJson<MovieSearchResponse>(
    await fetch(
      `/api/movies/search?q=${encodeURIComponent(searchTerm)}&page=${page}`,
    ),
  );
}

export async function getMovieDetails(movieId: number) {
  return readJson<{ movie: MovieDetails }>(await fetch(`/api/movies/${movieId}`));
}

export async function getFavorites() {
  return readJson<{ favorites: FavoriteMovie[] }>(await fetch("/api/favorites"));
}

export async function createFavorite(
  movie: MovieSearchResult | MovieDetails,
  favoriteInput: FavoriteInput = {},
) {
  return readJson<{ favorite: FavoriteMovie }>(
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        posterUrl: movie.posterUrl,
        releaseDate: movie.releaseDate,
        overview: movie.overview,
        runtime: "runtime" in movie ? movie.runtime : null,
        rating: favoriteInput.rating ?? null,
        note: favoriteInput.note ?? null,
      }),
    }),
  );
}

export async function updateFavorite(favorite: FavoriteMovie) {
  return readJson<{ favorite: FavoriteMovie }>(
    await fetch(`/api/favorites/${favorite.movieId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: favorite.rating, note: favorite.note }),
    }),
  );
}

export async function deleteFavorite(movieId: number) {
  return readJson<{ ok: true }>(
    await fetch(`/api/favorites/${movieId}`, { method: "DELETE" }),
  );
}
