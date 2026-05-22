import { describe, expect, it } from "vitest";
import {
  favoriteCreateSchema,
  favoriteUpdateSchema,
  movieSearchSchema,
  registerSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid username and password", () => {
    const parsed = registerSchema.parse({
      username: "movie_fan_1",
      password: "password123",
    });

    expect(parsed).toEqual({
      username: "movie_fan_1",
      password: "password123",
    });
  });

  it("rejects unsafe usernames and short passwords", () => {
    expect(() =>
      registerSchema.parse({ username: "Movie Fan", password: "short" }),
    ).toThrow();
  });

  it("trims movie search input and defaults to page 1", () => {
    const parsed = movieSearchSchema.parse({ q: "  batman  " });

    expect(parsed).toEqual({ q: "batman", page: 1 });
  });

  it("rejects empty or single-character movie searches", () => {
    expect(() => movieSearchSchema.parse({ q: "a" })).toThrow(
      "Search query must be at least 2 characters.",
    );
  });

  it("accepts favorite payloads with optional rating and note", () => {
    const parsed = favoriteCreateSchema.parse({
      movieId: 603,
      title: "The Matrix",
      posterPath: "/matrix.jpg",
      releaseDate: "1999-03-31",
      overview: "A hacker discovers the truth.",
      runtime: 136,
      rating: 5,
      note: "Still great.",
    });

    expect(parsed.rating).toBe(5);
  });

  it("rejects ratings outside 1 through 5", () => {
    expect(() => favoriteUpdateSchema.parse({ rating: 6 })).toThrow();
    expect(() => favoriteUpdateSchema.parse({ rating: 0 })).toThrow();
  });

  it("rejects notes longer than 1000 characters", () => {
    expect(() =>
      favoriteUpdateSchema.parse({ note: "x".repeat(1001) }),
    ).toThrow();
  });
});
