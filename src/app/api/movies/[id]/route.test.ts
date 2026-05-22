import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/tmdb", () => {
  class MockTmdbError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TmdbError";
    }
  }

  return {
    TmdbError: MockTmdbError,
    getMovieDetails: vi.fn(),
  };
});

import { getMovieDetails, TmdbError } from "@/lib/tmdb";
import { GET } from "./route";

function request() {
  return new Request("http://localhost/api/movies/603") as NextRequest;
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/movies/[id]", () => {
  beforeEach(() => {
    vi.mocked(getMovieDetails).mockReset();
  });

  it("returns 400 for an invalid movie id", async () => {
    const response = await GET(request(), context("abc"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid movie id.");
    expect(getMovieDetails).not.toHaveBeenCalled();
  });

  it("returns movie details under the movie key", async () => {
    vi.mocked(getMovieDetails).mockResolvedValue({
      id: 603,
      title: "The Matrix",
      overview: "Reality bends.",
      posterPath: "/matrix.jpg",
      posterUrl: "https://image.tmdb.org/t/p/w342/matrix.jpg",
      releaseDate: "1999-03-31",
      year: "1999",
      runtime: 136,
      genres: ["Action", "Science Fiction"],
    });

    const response = await GET(request(), context("603"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.movie.title).toBe("The Matrix");
    expect(body.movie.runtime).toBe(136);
    expect(body.movie.genres).toEqual(["Action", "Science Fiction"]);
    expect(getMovieDetails).toHaveBeenCalledWith(603);
  });

  it("returns 502 when TMDB details fail", async () => {
    vi.mocked(getMovieDetails).mockRejectedValue(new TmdbError("down"));

    const response = await GET(request(), context("603"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Movie details are temporarily unavailable.");
  });
});
