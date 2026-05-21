"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  FavoriteMovie,
  MovieDetails,
  MovieSearchResponse,
  MovieSearchResult,
} from "@/types/movie";

type User = {
  id: string;
  username: string;
};

type RequestState = "idle" | "loading" | "error" | "success";

const FAVORITES_CACHE_KEY = "movie_explorer_favorites_cache";

async function readJson<T>(response: Response): Promise<T> {
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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authState, setAuthState] = useState<RequestState>("idle");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchState, setSearchState] = useState<RequestState>("idle");
  const [searchError, setSearchError] = useState("");

  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [detailsState, setDetailsState] = useState<RequestState>("idle");
  const [detailsError, setDetailsError] = useState("");

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

    fetch("/api/auth/me")
      .then((response) => readJson<{ user: User | null }>(response))
      .then((data) => {
        setUser(data.user);

        if (data.user) {
          loadFavorites();
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favorites));
  }, [favorites]);

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
      searchMovies(trimmed, 1, false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthState("loading");

    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await readJson<{ user: User }>(response);

      setUser(data.user);
      setUsername("");
      setPassword("");
      await loadFavorites();
      setAuthState("success");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
      setAuthState("error");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setFavorites([]);
    localStorage.removeItem(FAVORITES_CACHE_KEY);
  }

  async function searchMovies(searchTerm: string, page: number, append: boolean) {
    setSearchState("loading");
    setSearchError("");

    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchTerm)}&page=${page}`,
      );
      const data = await readJson<MovieSearchResponse>(response);

      setResults((current) => (append ? [...current, ...data.results] : data.results));
      setSearchPage(data.page);
      setTotalPages(data.totalPages);
      setSearchState("success");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Movie search failed.");
      setSearchState("error");
    }
  }

  async function openDetails(movieId: number) {
    setDetails(null);
    setDetailsError("");
    setDetailsState("loading");

    try {
      const response = await fetch(`/api/movies/${movieId}`);
      const movie = await readJson<MovieDetails>(response);

      setDetails(movie);
      setDetailsState("success");
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Movie details failed.");
      setDetailsState("error");
    }
  }

  async function loadFavorites() {
    setFavoritesError("");

    try {
      const response = await fetch("/api/favorites");
      const data = await readJson<{ favorites: FavoriteMovie[] }>(response);
      setFavorites(data.favorites);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not load favorites.");
    }
  }

  async function addFavorite(movie: MovieSearchResult | MovieDetails) {
    if (!user) {
      setFavoritesError("Log in to save favorites.");
      return;
    }

    setFavoritesError("");

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
          overview: movie.overview,
          runtime: "runtime" in movie ? movie.runtime : null,
        }),
      });
      const data = await readJson<{ favorite: FavoriteMovie }>(response);

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
      await readJson<{ ok: true }>(
        await fetch(`/api/favorites/${movieId}`, { method: "DELETE" }),
      );
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
      const response = await fetch(`/api/favorites/${favorite.movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: favorite.rating, note: favorite.note }),
      });
      const data = await readJson<{ favorite: FavoriteMovie }>(response);

      updateFavoriteDraft(favorite.movieId, data.favorite);
    } catch (error) {
      setFavoritesError(error instanceof Error ? error.message : "Could not update favorite.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Movie Explorer</h1>
          <p>Minimal UI, backend-first movie search and favorites.</p>
        </div>

        {user ? (
          <div className="session">
            <span>{user.username}</span>
            <button onClick={logout}>Sign out</button>
          </div>
        ) : null}
      </header>

      {!user ? (
        <section className="panel narrow">
          <div className="tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={submitAuth} className="stack">
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="movie_fan"
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="At least 8 characters"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />
            </label>

            <button disabled={authState === "loading"}>
              {authState === "loading" ? "Working..." : authMode === "login" ? "Login" : "Create account"}
            </button>
            {authError ? <p className="error">{authError}</p> : null}
          </form>
        </section>
      ) : null}

      <section className="grid">
        <div className="panel">
          <h2>Search</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by movie title"
          />

          {query.trim().length === 1 ? (
            <p className="muted">Type at least 2 characters.</p>
          ) : null}
          {searchState === "loading" ? <p className="muted">Searching...</p> : null}
          {searchError ? <p className="error">{searchError}</p> : null}
          {searchState === "success" && results.length === 0 ? (
            <p className="muted">No movies found.</p>
          ) : null}

          <div className="movie-list">
            {results.map((movie) => (
              <article key={movie.id} className="movie-row">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt="" />
                ) : (
                  <div className="poster-fallback">No poster</div>
                )}

                <div>
                  <h3>{movie.title}</h3>
                  <p className="muted">{movie.year ?? "Year unknown"}</p>
                  <p>{movie.overview || "No description available."}</p>
                  <div className="actions">
                    <button onClick={() => openDetails(movie.id)}>Details</button>
                    {favoriteIds.has(movie.id) ? (
                      <button onClick={() => removeFavorite(movie.id)}>Remove</button>
                    ) : (
                      <button onClick={() => addFavorite(movie)}>Favorite</button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {results.length > 0 && searchPage < totalPages ? (
            <button
              className="wide"
              onClick={() => searchMovies(query.trim(), searchPage + 1, true)}
            >
              Load more
            </button>
          ) : null}
        </div>

        <aside className="panel">
          <h2>Favorites</h2>
          {favoritesError ? <p className="error">{favoritesError}</p> : null}
          {!user ? <p className="muted">Log in to save favorites.</p> : null}
          {user && favorites.length === 0 ? <p className="muted">No favorites yet.</p> : null}

          <div className="favorites-list">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="favorite-card">
                <div className="favorite-heading">
                  <strong>{favorite.title}</strong>
                  <button onClick={() => removeFavorite(favorite.movieId)}>Remove</button>
                </div>

                <label>
                  Rating
                  <select
                    value={favorite.rating ?? ""}
                    onChange={(event) =>
                      updateFavoriteDraft(favorite.movieId, {
                        rating: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">None</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </label>

                <label>
                  Note
                  <textarea
                    value={favorite.note ?? ""}
                    onChange={(event) =>
                      updateFavoriteDraft(favorite.movieId, { note: event.target.value })
                    }
                    placeholder="Optional personal note"
                  />
                </label>

                <button onClick={() => saveFavorite(favorite)}>Save</button>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {detailsState !== "idle" ? (
        <section className="details" role="dialog" aria-modal="true">
          <div className="details-card">
            <button className="close" onClick={() => setDetailsState("idle")}>
              Close
            </button>

            {detailsState === "loading" ? <p>Loading details...</p> : null}
            {detailsError ? <p className="error">{detailsError}</p> : null}
            {details ? (
              <div className="details-content">
                {details.posterUrl ? <img src={details.posterUrl} alt="" /> : null}
                <div>
                  <h2>{details.title}</h2>
                  <p className="muted">
                    {[details.year, details.runtime ? `${details.runtime} min` : null]
                      .filter(Boolean)
                      .join(" | ") || "Details unavailable"}
                  </p>
                  <p>{details.overview || "No overview available."}</p>
                  <div className="actions">
                    {favoriteIds.has(details.id) ? (
                      <button onClick={() => removeFavorite(details.id)}>Remove favorite</button>
                    ) : (
                      <button onClick={() => addFavorite(details)}>Add favorite</button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
