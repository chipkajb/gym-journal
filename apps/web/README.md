# Gym Journal Web App

Next.js (App Router) application for Gym Journal. Provides authentication, CrossFit-style workout library, session logging, calendar + table history, body metrics, progress analytics, and PWA/offline support.

## Structure

- **`app/`** – Next.js App Router
  - **`(auth)/`** – Protected routes (dashboard, library, workouts, history, metrics, analytics) with shared layout and nav
  - **`api/`** – Route handlers: `auth/[...nextauth]`, `auth/register`, `exercises`, `templates`, `sessions`, `body-metrics`, `analytics/*`
  - **`login/`**, **`register/`** – Public auth pages
  - **`offline/`** – PWA offline fallback page
  - **`page.tsx`** – Home (sign in / sign up or “Go to Dashboard”)
- **`components/`**
  - **`features/`** – Library, workouts, history, metrics (body metric form, list, chart), analytics (charts, PR list)
  - **`providers/`** – `SessionProvider` for NextAuth
  - **`auth/`** – Sign-out button
  - **`offline-banner.tsx`** – Offline status banner
  - **`ui/`** – Shared UI (e.g. shadcn/ui when added)
- **`lib/`** – `prisma` client singleton, `auth` (NextAuth config and handlers)
- **`types/`** – NextAuth session type augmentation
- **`styles/`** – Global CSS and Tailwind
- **`public/`** – Static assets (logo, `manifest.json`); PWA generates `sw.js` at build time

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

## PWA

Production build runs `next build --webpack` so `@ducanh2912/next-pwa` can generate the service worker. The service worker and offline fallback are disabled in development.
