import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const favorite = {
  id: "favorite_1",
  userId: "user_1",
  movieId: 603,
  title: "The Matrix",
  posterPath: "/matrix.jpg",
  posterUrl: null,
  releaseDate: "1999-03-31",
  overview: "Reality bends.",
  runtime: 136,
  rating: 4,
  note: "Good.",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    favorite: {
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

function context(movieId = "603") {
  return { params: Promise.resolve({ movieId }) };
}

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/favorites/603", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("/api/favorites/[movieId]", () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "user_1", username: "neo" });
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(favorite);
    vi.mocked(prisma.favorite.update).mockResolvedValue({
      ...favorite,
      rating: 5,
    });
    vi.mocked(prisma.favorite.deleteMany).mockResolvedValue({ count: 1 });
  });

  it("requires login before updating a favorite", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const response = await PATCH(patchRequest({ rating: 5 }), context());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("You must be logged in.");
  });

  it("updates only fields supplied by the client", async () => {
    const response = await PATCH(patchRequest({ rating: 5 }), context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.favorite.rating).toBe(5);
    expect(prisma.favorite.update).toHaveBeenCalledWith({
      where: { userId_movieId: { userId: "user_1", movieId: 603 } },
      data: { rating: 5 },
    });
  });

  it("returns 404 when a favorite does not exist", async () => {
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null);

    const response = await PATCH(patchRequest({ rating: 5 }), context());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Favorite was not found.");
    expect(prisma.favorite.update).not.toHaveBeenCalled();
  });

  it("removes a favorite for the logged-in user", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/favorites/603") as NextRequest,
      context(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1", movieId: 603 },
    });
  });
});
