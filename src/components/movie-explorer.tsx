"use client";

import { useState } from "react";
import {
  useAuth,
  useFavorites,
  useMovieDetails,
  useMovieSearch,
} from "@/hooks/movie-explorer";
import type { FavoriteMovie, MovieDetails, MovieSearchResult } from "@/types/movie";

type AuthPanelProps = ReturnType<typeof useAuth>;
type SearchPanelProps = ReturnType<typeof useMovieSearch> & {
  favoriteIds: Set<number>;
  addFavorite: (
    movie: MovieSearchResult,
    favoriteInput?: { rating?: number | null; note?: string | null },
  ) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
  openDetails: (movieId: number) => Promise<void>;
};
type FavoritesPanelProps = ReturnType<typeof useFavorites>;
type DetailsModalProps = ReturnType<typeof useMovieDetails> & {
  favoriteIds: Set<number>;
  addFavorite: (
    movie: MovieDetails,
    favoriteInput?: { rating?: number | null; note?: string | null },
  ) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
};

export function MovieExplorer() {
  const auth = useAuth();
  const search = useMovieSearch();
  const details = useMovieDetails();
  const activeFavorites = useFavorites(auth.user);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Movie Explorer</h1>
          <p>Minimal UI, backend-first movie search and favorites.</p>
        </div>

        {auth.user ? (
          <div className="session">
            <span>{auth.user.username}</span>
            <button onClick={auth.logout}>Sign out</button>
          </div>
        ) : null}
      </header>

      {!auth.user ? <AuthPanel {...auth} /> : null}

      <section className="grid">
        <SearchPanel
          {...search}
          favoriteIds={activeFavorites.favoriteIds}
          addFavorite={activeFavorites.addFavorite}
          removeFavorite={activeFavorites.removeFavorite}
          openDetails={details.openDetails}
        />

        <FavoritesPanel {...activeFavorites} user={auth.user} />
      </section>

      <MovieDetailsModal
        {...details}
        favoriteIds={activeFavorites.favoriteIds}
        addFavorite={activeFavorites.addFavorite}
        removeFavorite={activeFavorites.removeFavorite}
      />
    </main>
  );
}

function AuthPanel({
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  authError,
  authState,
  submitAuth,
}: AuthPanelProps) {
  return (
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
          {authState === "loading"
            ? "Working..."
            : authMode === "login"
              ? "Login"
              : "Create account"}
        </button>
        {authError ? <p className="error">{authError}</p> : null}
      </form>
    </section>
  );
}

function SearchPanel({
  query,
  setQuery,
  results,
  searchPage,
  totalPages,
  searchState,
  searchError,
  runSearch,
  favoriteIds,
  addFavorite,
  removeFavorite,
  openDetails,
}: SearchPanelProps) {
  return (
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
          <MovieRow
            key={movie.id}
            movie={movie}
            isFavorite={favoriteIds.has(movie.id)}
            addFavorite={addFavorite}
            removeFavorite={removeFavorite}
            openDetails={openDetails}
          />
        ))}
      </div>

      {results.length > 0 && searchPage < totalPages ? (
        <button
          className="wide"
          onClick={() => runSearch(query.trim(), searchPage + 1, true)}
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}

function MovieRow({
  movie,
  isFavorite,
  addFavorite,
  removeFavorite,
  openDetails,
}: {
  movie: MovieSearchResult;
  isFavorite: boolean;
  addFavorite: (
    movie: MovieSearchResult,
    favoriteInput?: { rating?: number | null; note?: string | null },
  ) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
  openDetails: (movieId: number) => Promise<void>;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const showNote = rating !== null;

  async function saveFavorite() {
    await addFavorite(movie, {
      rating,
      note: note.trim() || null,
    });
  }

  return (
    <article className="movie-row">
      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt="" />
      ) : (
        <div className="poster-fallback">No poster</div>
      )}

      <div>
        <h3>{movie.title}</h3>
        <p className="muted">{movie.year ?? "Year unknown"}</p>
        <p>{movie.overview || "No description available."}</p>
        {!isFavorite ? (
          <div className="inline-controls">
            <RatingCounter value={rating} onChange={setRating} />
            {showNote ? (
              <label className="note-field">
                Note
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional personal note"
                />
              </label>
            ) : null}
          </div>
        ) : null}
        <div className="actions">
          <button onClick={() => openDetails(movie.id)}>Details</button>
          {isFavorite ? (
            <button onClick={() => removeFavorite(movie.id)}>Remove</button>
          ) : (
            <button onClick={saveFavorite}>Favorite</button>
          )}
        </div>
      </div>
    </article>
  );
}

function FavoritesPanel({
  user,
  favorites,
  favoritesError,
  removeFavorite,
  updateFavoriteDraft,
  saveFavorite,
}: FavoritesPanelProps & { user: { id: string; username: string } | null }) {
  return (
    <aside className="panel">
      <h2>Favorites</h2>
      {favoritesError ? <p className="error">{favoritesError}</p> : null}
      {!user ? <p className="muted">Log in to save favorites.</p> : null}
      {user && favorites.length === 0 ? <p className="muted">No favorites yet.</p> : null}

      <div className="favorites-list">
        {favorites.map((favorite) => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            removeFavorite={removeFavorite}
            updateFavoriteDraft={updateFavoriteDraft}
            saveFavorite={saveFavorite}
          />
        ))}
      </div>
    </aside>
  );
}

function FavoriteCard({
  favorite,
  removeFavorite,
  updateFavoriteDraft,
  saveFavorite,
}: {
  favorite: FavoriteMovie;
  removeFavorite: (movieId: number) => Promise<void>;
  updateFavoriteDraft: (movieId: number, patch: Partial<FavoriteMovie>) => void;
  saveFavorite: (favorite: FavoriteMovie) => Promise<void>;
}) {
  return (
    <article className="favorite-card">
      <div className="favorite-heading">
        <strong>{favorite.title}</strong>
      </div>

      <label>
        Rating
        <RatingCounter
          value={favorite.rating}
          onChange={(rating) => updateFavoriteDraft(favorite.movieId, { rating })}
        />
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

      <div className="favorite-actions">
        <button onClick={() => saveFavorite(favorite)}>Save</button>
        <button onClick={() => removeFavorite(favorite.movieId)}>Remove</button>
      </div>
    </article>
  );
}

function RatingCounter({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  function decrement() {
    if (!value || value <= 1) {
      onChange(null);
      return;
    }

    onChange(value - 1);
  }

  function increment() {
    onChange(Math.min((value ?? 0) + 1, 5));
  }

  return (
    <div className="rating-counter" aria-label="Personal rating">
      <button
        type="button"
        aria-label="Decrease rating"
        disabled={!value}
        onClick={decrement}
      >
        -
      </button>
      <span>{value ? `${value}/5` : "No rating"}</span>
      <button
        type="button"
        aria-label="Increase rating"
        disabled={value === 5}
        onClick={increment}
      >
        +
      </button>
    </div>
  );
}

function MovieDetailsModal({
  details,
  detailsState,
  detailsError,
  closeDetails,
  favoriteIds,
  addFavorite,
  removeFavorite,
}: DetailsModalProps) {
  if (detailsState === "idle") {
    return null;
  }

  return (
    <section className="details" role="dialog" aria-modal="true">
      <div className="details-card">
        <button className="close" onClick={closeDetails}>
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
              {details.genres.length > 0 ? (
                <p className="muted">Genres: {details.genres.join(", ")}</p>
              ) : null}
              <p>{details.overview || "No overview available."}</p>
              <div className="actions">
                {favoriteIds.has(details.id) ? (
                  <button onClick={() => removeFavorite(details.id)}>
                    Remove favorite
                  </button>
                ) : (
                  <button onClick={() => addFavorite(details)}>Add favorite</button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
