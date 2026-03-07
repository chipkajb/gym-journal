# Database Package

Prisma schema, migrations, and seed for Gym Journal. The generated Prisma client is used by `apps/web` (and any other apps that depend on `@prisma/client` from the monorepo).

## Commands

Run from the **monorepo root** (they delegate to this package):

```bash
npm run db:generate   # Generate Prisma Client
npm run db:migrate    # Create and apply migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed exercises (and optional data)
npm run db:reset      # Reset database (dev only)
```

Or from this package directory:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed
npm run db:reset
```

## Schema

See **`prisma/schema.prisma`** for the full schema.

### Core models

- **User & auth** – Users, accounts, sessions, verification tokens (NextAuth)
- **Profile** – User preferences and settings
- **Exercise** – Exercise library (optional; seed with `db:seed`)
- **WorkoutTemplate** – CrossFit-style workout blueprints (title, description, scoreType, barbellLift; user-scoped)
- **WorkoutSession** – Logged workouts (workoutDate, title, result, scoreType, rxOrScaled, isPr, notes; optional template link)
- **BodyMetric** – Weight, body fat, measurements (for future use)
- **DeviceConnection / DeviceData** – Smart device integrations (future)

### Scripts

- **`scripts/clear-workout-data.ts`** – Deletes all workout sessions and templates (keeps users). Run before re-importing.
- **`scripts/import-workouts.ts`** – Imports from `workouts.csv` at repo root (or `WORKOUTS_CSV`). Uses first user unless `WORKOUT_USER_ID` is set.

## Environment

Set `DATABASE_URL` (e.g. in repo root `.env.local` or this package’s `.env`) before running migrate or seed.
