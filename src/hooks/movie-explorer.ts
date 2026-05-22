"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  authenticate,
  createFavorite,
  deleteFavorite,
  getCurrentUser,
  getFavorites,
  getMovieDetails,
  logoutUser,
  searchMovies,
  updateFavorite,
  type FavoriteInput,
  type User,
} from "@/lib/client-api";
import type {
  FavoriteMovie,
  MovieDetails,
  MovieSearchResult,
} from "@/types/movie";

export type RequestState = "idle" | "loading" | "error" | "success";

const FAVORITES_CACHE_KEY = "movie_explorer_favorites_cache";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authState, setAuthState] = useState<RequestState>("idle");

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => undefined);
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthState("loading");

    try {
      const data = await authenticate(authMode, { username, password });

      setUser(data.user);
      setUsername("");
      setPassword("");
      setAuthState("success");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
      setAuthState("error");
    }
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  return {
    user,
    authMode,
    setAuthMode,
    username,
    setUsername,
    password,
    setPassword,
    authError,
    authState,
    submitAuth,
    logout,
  };
}

export function useMovieSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchState, setSearchState] = useState<RequestState>("idle");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setSearchPage(1);
      setTotalPages(0);
      setSearchState("idle");
      setSearchError("");
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed, 1, false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function runSearch(searchTerm: string, page: number, append: boolean) {
    setSearchState("loading");
    setSearchError("");

    try {
      const data = await searchMovies(searchTerm, page);

      setResults((current) => (append ? [...current, ...data.results] : data.results));
      setSearchPage(data.page);
      setTotalPages(data.totalPages);
      setSearchState("success");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Movie search failed.");
      setSearchState("error");
    }
  }

  return {
    query,
    setQuery,
    results,
    searchPage,
    totalPages,
    searchState,
    searchError,
    runSearch,
  };
}

export function useMovieDetails() {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [detailsState, setDetailsState] = useState<RequestState>("idle");
  const [detailsError, setDetailsError] = useState("");

  async function openDetails(movieId: number) {
    setDetails(null);
    setDetailsError("");
    setDetailsState("loading");

    try {
      const { movie } = await getMovieDetails(movieId);

      setDetails(movie);
      setDetailsState("success");
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Movie details failed.");
      setDetailsState("error");
    }
  }

  function closeDetails() {
    setDetailsState("idle");
  }

  return {
    details,
    detailsState,
    detailsError,
    openDetails,
    closeDetails,
  };
}

export function useFavorites(user: User | null) {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [favoritesError, setFavoritesError] = useState("");

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.movieId)),
    [favorites],
  );

  useEffect(() => {
    const cached = localStorage.getItem(FAVORITES_CACHE_KEY);

    if (cached) {
      try {
        setFavorites(JSON.parse(cached));
      } catch {
        localStorage.removeItem(FAVORITES_CACHE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (user) {
      void loadFavorites();
    } else {
      clearFavorites();
    }
  }, [user]);

  async function loadFavorites() {
    setFavoritesError("");

    try {
      const data = await getFavorites();
      setFavorites(data.favorites);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not load favorites.");
    }
  }

  function clearFavorites() {
    setFavorites([]);
    localStorage.removeItem(FAVORITES_CACHE_KEY);
  }

  async function addFavorite(
    movie: MovieSearchResult | MovieDetails,
    favoriteInput?: FavoriteInput,
  ) {
    if (!user) {
      setFavoritesError("Log in to save favorites.");
      return;
    }

    setFavoritesError("");

    try {
      const data = await createFavorite(movie, favoriteInput);

      setFavorites((current) => [
        data.favorite,
        ...current.filter((favorite) => favorite.movieId !== data.favorite.movieId),
      ]);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not save favorite.");
    }
  }

  async function removeFavorite(movieId: number) {
    setFavoritesError("");

    try {
      await deleteFavorite(movieId);
      setFavorites((current) => current.filter((favorite) => favorite.movieId !== movieId));
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not remove favorite.");
    }
  }

  function updateFavoriteDraft(movieId: number, patch: Partial<FavoriteMovie>) {
    setFavorites((current) =>
      current.map((favorite) =>
        favorite.movieId === movieId ? { ...favorite, ...patch } : favorite,
      ),
    );
  }

  async function saveFavorite(favorite: FavoriteMovie) {
    setFavoritesError("");

    try {
      const data = await updateFavorite(favorite);
      updateFavoriteDraft(favorite.movieId, data.favorite);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not update favorite.");
    }
  }

  return {
    favorites,
    favoritesError,
    favoriteIds,
    loadFavorites,
    clearFavorites,
    addFavorite,
    removeFavorite,
    updateFavoriteDraft,
    saveFavorite,
  };
}
