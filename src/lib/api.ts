import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function validationError(error: ZodError) {
  return jsonError(
    "Invalid request.",
    400,
    error.flatten().fieldErrors
  );
}
