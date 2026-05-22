import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMovieDetails, searchMovies, TmdbError } from "@/lib/tmdb";

describe("tmdb client", () => {
  beforeEach(() => {
    vi.stubEnv("TMDB_API_KEY", "test-api-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes multiple search results", async () => {
    const fetchMock = vi.fn(
      async (_url: URL, _init?: RequestInit): Promise<Response> =>
      new Response(
        JSON.stringify({
          page: 1,
          total_pages: 2,
          total_results: 3,
          results: [
            {
              id: 1,
              title: "Batman",
              overview: "A masked hero.",
              poster_path: "/batman.jpg",
              release_date: "1989-06-23",
            },
            {
              id: 2,
              title: "The Batman",
              overview: "",
              poster_path: null,
              release_date: "2022-03-04",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await searchMovies("batman", 1);

    expect(response).toEqual({
      query: "batman",
      page: 1,
      totalPages: 2,
      totalResults: 3,
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
        {
          id: 2,
          title: "The Batman",
          overview: "",
          posterPath: null,
          posterUrl: null,
          releaseDate: "2022-03-04",
          year: "2022",
        },
      ],
    });

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("api_key")).toBe("test-api-key");
    expect(calledUrl.searchParams.get("include_adult")).toBe("false");
  });

  it("normalizes movie details with runtime", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: 603,
            title: "The Matrix",
            overview: "Reality bends.",
            poster_path: "/matrix.jpg",
            release_date: "1999-03-31",
            runtime: 136,
            genres: [
              { id: 28, name: "Action" },
              { id: 878, name: "Science Fiction" },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const details = await getMovieDetails(603);

    expect(details.runtime).toBe(136);
    expect(details.genres).toEqual(["Action", "Science Fiction"]);
    expect(details.year).toBe("1999");
    expect(details.posterUrl).toBe("https://image.tmdb.org/t/p/w342/matrix.jpg");
  });

  it("throws a TMDB error when the API key is missing", async () => {
    vi.stubEnv("TMDB_API_KEY", "");

    await expect(searchMovies("batman", 1)).rejects.toBeInstanceOf(TmdbError);
  });

  it("throws a TMDB error when TMDB returns a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );

    await expect(searchMovies("batman", 1)).rejects.toBeInstanceOf(TmdbError);
  });
});
