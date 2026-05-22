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
    searchMovies: vi.fn(),
  };
});

import { searchMovies, TmdbError } from "@/lib/tmdb";
import { GET } from "./route";

function request(url: string) {
  return { nextUrl: new URL(url) } as NextRequest;
}

describe("GET /api/movies/search", () => {
  beforeEach(() => {
    vi.mocked(searchMovies).mockReset();
  });

  it("returns 400 for invalid search input", async () => {
    const response = await GET(request("http://localhost/api/movies/search?q=a"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Search query must be at least 2 characters.");
    expect(searchMovies).not.toHaveBeenCalled();
  });

  it("returns normalized movie search results", async () => {
    vi.mocked(searchMovies).mockResolvedValue({
      query: "batman",
      page: 1,
      totalPages: 1,
      totalResults: 1,
      results: [
        {
          id: 1,
          title: "Batman",
          overview: "A masked hero.",
          posterPath: "/batman.jpg",
          posterUrl: "https://image.tmdb.org/t/p/w342/batman.jpg",
          releaseDate: "1989-06-23",
          year: "1989",
        },
      ],
    });

    const response = await GET(
      request("http://localhost/api/movies/search?q=batman&page=1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(searchMovies).toHaveBeenCalledWith("batman", 1);
  });

  it("returns 502 when the TMDB client fails", async () => {
    vi.mocked(searchMovies).mockRejectedValue(new TmdbError("down"));

    const response = await GET(request("http://localhost/api/movies/search?q=batman"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("Movie search is temporarily unavailable.");
  });
});
