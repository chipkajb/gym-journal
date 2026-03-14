# Quick Start

Get the Gym Journal app running locally with minimal setup.

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9 or later (or pnpm / yarn)
- **Docker** and **Docker Compose** (for PostgreSQL)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/gym-journal.git
cd gym-journal
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d postgres
```

Wait about 10–15 seconds for the database to be ready.

### 3. Environment variables

- **`.env`** (in the **project root**) — Read by **Docker Compose** when you run `docker-compose up`.
- **`.env.local`** — Must be in **`apps/web/`** (the Next.js app directory). Next.js only loads env files from the app directory, not the monorepo root.

Create **`apps/web/.env.local`** with the required variables:

```env
DATABASE_URL="postgresql://gymjournal:changeme@localhost:5432/gymjournal"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Google OAuth (enables "Continue with Google" on login/register)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Keep env files in `.gitignore`; never commit secrets. If **login gets stuck on "Signing in…"**, ensure **`apps/web/.env.local`** exists and contains `NEXTAUTH_SECRET` and `DATABASE_URL`.

### 4. Database

```bash
npm run db:migrate
npm run db:generate
```

Optional: seed sample exercises:

```bash
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you'll see

- **`/`** — Home. Sign In / Sign Up if not logged in; Go to Dashboard if logged in.
- **`/login`** — Sign in with email and password (or Google if configured).
- **`/register`** — Create an account. Redirects to dashboard after sign-in.
- **`/dashboard`** — Overview with links to Library, Workouts, and History; recent workouts list.
- **`/library`** — Workout templates (card and table views). Create and edit templates.
- **`/workouts`** — List of workout sessions; Start a workout from a template or freeform.
- **`/workouts/[id]`** — Active or past session: timer, logged exercises, finish workout.
- **`/history`** — Monthly calendar (RX/scaled dots); click a day to see sessions. Table view for filterable history.
- **`/metrics`** — Body metrics: add weight, body fat %, muscle mass, BMI; view trend chart.
- **`/analytics`** — Progress charts: PRs, progress-over-time, workout frequency, body composition trends.
- **`/settings`** — Preferences (name, dark mode, units), data export (CSV/JSON), and device integrations link.
- **`/settings/integrations`** — Connect fitness devices (Apple Health, Google Fit, Fitbit, Garmin).

**First time:** Click Sign Up to create an account. To import past workouts from CSV, place `workouts.csv` at the repo root and run `npm run db:import-workouts` (optionally `npm run db:clear-workouts` first to remove existing workout data; users are kept).

## Troubleshooting

**Can't connect to PostgreSQL**

- Ensure Docker is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Confirm container is up: `docker-compose ps`

**Migrations fail**

- Reset (dev only): `npm run db:reset`
- Check `DATABASE_URL` in `.env.local` and that the Postgres container is running.

**Port 3000 in use**

```bash
PORT=3001 npm run dev
```

**Module not found**

- From project root: `npm install`
- Regenerate Prisma client: `npm run db:generate`
- Restart the dev server.

## Further reading

- Full project overview, API reference, and deployment guide: [README.md](README.md)
- Device integration OAuth setup: [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)
