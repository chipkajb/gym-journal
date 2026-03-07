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

Create `.env.local` in the project root (or copy from `.env.example` if present). At minimum:

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

- **/** – Home with links to login/register
- **/login** – Login (UI; auth may not be wired yet)
- **/register** – Register (UI; auth may not be wired yet)

## Troubleshooting

**Can’t connect to PostgreSQL**

- Ensure Docker is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Confirm DB is up: `docker-compose ps`

**Migrations fail**

- Reset (dev only): `npm run db:reset`
- Check `DATABASE_URL` in `.env.local` and that the Postgres container is running

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
