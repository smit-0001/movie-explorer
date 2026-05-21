export type MovieSearchResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
  year: string | null;
};

export type MovieDetails = MovieSearchResult & {
  runtime: number | null;
};

export type MovieSearchResponse = {
  query: string;
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSearchResult[];
};

export type FavoriteMovie = {
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
  createdAt: string;
  updatedAt: string;
};
