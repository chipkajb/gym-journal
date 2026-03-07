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

- **`.env`** (in the **project root**) – Read by **Docker Compose** when you run `docker-compose up`. Prevents “variable not set” warnings.
- **`.env.local`** – Must be in **`apps/web/`** (the Next.js app directory). Next.js only loads env files from the app directory, not from the monorepo root. Used when you run `npm run dev`.

Create **`apps/web/.env.local`** with at least (and optionally `.env` in the project root with the same values for Docker):

```env
DATABASE_URL="postgresql://gymjournal:changeme@localhost:5432/gymjournal"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Keep env files in `.gitignore`; do not commit secrets. If **login gets stuck on “Signing in…”**, the app is likely not loading env: ensure **`apps/web/.env.local`** exists and contains `NEXTAUTH_SECRET` and `DATABASE_URL`.

### 4. Database

```bash
npm run db:migrate
npm run db:generate
```

Optional: seed sample data:

```bash
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you’ll see

- **/** – Home. If not logged in: Sign In / Sign Up. If logged in: Go to Dashboard.
- **/login** – Sign in with email and password (fully wired to NextAuth).
- **/register** – Create an account (email, name, password). Redirects to dashboard after sign-in.
- **/dashboard** – Dashboard with links to Library, Log workout, and History; recent workouts list.
- **/library** – Workout templates list; “All exercises” and “New template”. Create and edit templates, add exercises with sets/reps.
- **/workouts** – List of workout sessions; “Start workout” to begin from a template or freeform.
- **/workouts/[id]** – Active or past session: timer, logged exercises, add exercise (sets/reps/weight/duration), “Finish workout”.
- **/history** – Monthly calendar with color-coded workout days; click a day to see sessions.

**First time:** Click Sign Up to create an account; you will land on the dashboard. Run `npm run db:seed` to add sample exercises to the library.

## Troubleshooting

**Can’t connect to PostgreSQL**

- Ensure Docker is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Confirm DB is up: `docker-compose ps`

**Migrations fail**

- Reset (dev only): `npm run db:reset`
- Check `DATABASE_URL` in `.env` / `.env.local` and that the Postgres container is running

**Port 3000 in use**

```bash
PORT=3001 npm run dev
```

**Module not found**

- From project root: `npm install`
- Regenerate Prisma client: `npm run db:generate`
- Restart the dev server

## Next

- Full project overview, structure, and commands: [README.md](README.md)
- Dev workflow: `npm run dev`, `npm run db:studio`, `npm run lint`, `npm test`
