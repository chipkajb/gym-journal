# Gym Journal Web App

Next.js (App Router) application for Gym Journal. Provides authentication, workout library, session logging, and calendar history.

## Structure

- **`app/`** – Next.js App Router
  - **`(auth)/`** – Protected routes (dashboard, library, workouts, history) with shared layout and nav
  - **`api/`** – Route handlers: `auth/[...nextauth]`, `auth/register`, `exercises`, `templates`, `sessions`
  - **`login/`**, **`register/`** – Public auth pages
  - **`page.tsx`** – Home (sign in / sign up or “Go to Dashboard”)
- **`components/`**
  - **`features/`** – Library (templates, exercises editor), workouts (start form, timer, log list), history (calendar)
  - **`providers/`** – `SessionProvider` for NextAuth
  - **`auth/`** – Sign-out button
  - **`ui/`** – Shared UI (e.g. shadcn/ui when added)
- **`lib/`** – `prisma` client singleton, `auth` (NextAuth config and handlers)
- **`types/`** – NextAuth session type augmentation
- **`styles/`** – Global CSS and Tailwind
- **`public/`** – Static assets (e.g. logo)

## Development

From the **monorepo root** (recommended):

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check  # TypeScript check
npm test         # Run tests
```

From this workspace:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm test
```

## Environment

Requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. See [QUICK_START.md](../../QUICK_START.md) in the repo root.
