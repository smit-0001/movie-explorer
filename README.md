# Movie Explorer

A backend-focused Movie Explorer app built with Next.js, TypeScript, Prisma, Postgres, and TMDB.

## Features

- Username/password registration and login
- Password hashing before storage
- Server-side session cookie
- TMDB search proxy that keeps the API key server-side
- Movie details endpoint with runtime when available
- Authenticated favorites API
- Personal rating and note for each favorite
- Browser cache through localStorage
- Postgres persistence for logged-in users

## Required Environment Values

Create `.env.local` from `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-string"
TMDB_API_KEY="replace-with-your-tmdb-api-key"
```

Use a long random value for `AUTH_SECRET`, at least 32 characters.

## Local Setup

Install dependencies:

```bash
npm install
```

Generate the Prisma client and create the database tables:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Run the app:

```bash
npm run dev
```

Run checks before a build:

```bash
npm run typecheck
npm test
npm run build
```

Use watch mode while editing tests:

```bash
npm run test:watch
```

## Deployment Notes

For Vercel, add the same environment values in the project settings.

This app expects a hosted Postgres database. Neon or Supabase are both good fits.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/movies/search?q=title&page=1`
- `GET /api/movies/[id]`
- `GET /api/favorites`
- `POST /api/favorites`
- `PATCH /api/favorites/[movieId]`
- `DELETE /api/favorites/[movieId]`
