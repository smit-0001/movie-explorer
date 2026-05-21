import { buildPosterUrl } from "@/lib/tmdb";
import type { FavoriteMovie } from "@/types/movie";

type FavoriteRecord = {
  id: string;
  movieId: number;
  title: string;
  posterPath: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
  overview: string | null;
  runtime: number | null;
  rating: number | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function formatFavorite(favorite: FavoriteRecord): FavoriteMovie {
  return {
    ...favorite,
    posterUrl: favorite.posterUrl ?? buildPosterUrl(favorite.posterPath),
    createdAt: favorite.createdAt.toISOString(),
    updatedAt: favorite.updatedAt.toISOString(),
  };
}
