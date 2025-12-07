# Quick Start Guide

This guide will help you get the Gym Journal app running locally with minimal setup.

## Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Docker and Docker Compose (for PostgreSQL database)

## Setup Steps

### 1. Install Dependencies

From the project root:

```bash
npm install
```

This will install all dependencies for the monorepo workspace.

### 2. Start PostgreSQL Database

```bash
docker-compose up -d postgres
```

Wait about 10-15 seconds for the database to be ready.

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://gymjournal:changeme@localhost:5432/gymjournal"

# NextAuth.js
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Important**: Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Run Database Migrations

```bash
npm run db:migrate
```

This will create all the necessary database tables.

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## What You'll See

- **Home Page** (`/`): Splash screen with logo and links to login/register
- **Login Page** (`/login`): Login form (UI only, authentication not yet implemented)
- **Register Page** (`/register`): Registration form (UI only, authentication not yet implemented)

## Troubleshooting

### Database Connection Issues

If you can't connect to PostgreSQL:

1. Check Docker is running: `docker ps`
2. Check logs: `docker-compose logs postgres`
3. Verify the database is healthy: `docker-compose ps`

### Port Already in Use

If port 3000 is already in use, you can change it:

```bash
PORT=3001 npm run dev
```

### Module Not Found Errors

If you see module errors:

1. Make sure you ran `npm install` from the project root
2. Generate Prisma Client: `npm run db:generate`
3. Restart the dev server

## Next Steps

Once the app is running, you can:

1. Implement authentication with NextAuth.js
2. Set up API routes for workout management
3. Create dashboard and other protected pages
4. Add more features from the PLAN.md

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database (development only)

