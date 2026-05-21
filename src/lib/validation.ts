import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be 30 characters or fewer.")
  .regex(
    /^[a-z0-9_]+$/,
    "Username can only include lowercase letters, numbers, and underscores.",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const loginSchema = registerSchema;

export const movieSearchSchema = z.object({
  q: z.string().trim().min(2, "Search query must be at least 2 characters.").max(100),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export const favoriteCreateSchema = z.object({
  movieId: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  posterPath: z.string().nullable().optional(),
  posterUrl: z.string().url().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  overview: z.string().nullable().optional(),
  runtime: z.number().int().min(0).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export const favoriteUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
});

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}
