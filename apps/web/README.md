# Gym Journal Web App

Next.js (App Router) application for Gym Journal. Provides authentication, CrossFit-style workout library, session logging, calendar + table history, body metrics, advanced progress analytics, data export, device integrations, and PWA/offline support.

## Structure

- **`app/`** – Next.js App Router
  - **`(auth)/`** – Protected routes with shared layout and nav:
    - `dashboard/` – Overview and quick links
    - `library/` – Workout template CRUD
    - `workouts/` – Session logging
    - `history/` – Calendar + table views
    - `metrics/` – Body metrics tracking
    - `analytics/` – PRs, progress charts, frequency chart, body composition chart
    - `settings/` – Preferences, data export, device integrations link
    - `settings/integrations/` – Connect/sync/disconnect Apple Health, Google Fit, Fitbit, Garmin
  - **`api/`** – Route handlers:
    - `auth/[...nextauth]`, `auth/register`
    - `exercises/`, `templates/`, `sessions/`, `body-metrics/`
    - `analytics/summary`, `analytics/prs`, `analytics/progress`, `analytics/workout-titles`
    - `analytics/frequency` – Workout frequency by week/month
    - `analytics/body-composition` – Body composition trends
    - `export/` – CSV and JSON data export
    - `devices/`, `devices/[provider]/`, `devices/[provider]/sync/` – Device integration CRUD
    - `user/profile`
  - **`login/`**, **`register/`** – Public auth pages
  - **`offline/`** – PWA offline fallback page
  - **`page.tsx`** – Home (sign in / sign up or “Go to Dashboard”)
  - Each major page has `loading.tsx` (skeleton) and `error.tsx` (error boundary)
- **`__tests__/`** – Jest unit & component tests
  - `lib/` – Utility tests (theme helpers)
  - `api/` – API helper tests (CSV export, analytics bucketing)
  - `components/` – React Testing Library component tests (OfflineBanner)
- **`e2e/`** – Playwright end-to-end tests
  - `auth.spec.ts` – Registration and login flow
  - `navigation.spec.ts` – Page smoke tests for all protected routes
- **`components/`**
  - **`features/`** – Library, workouts, history, metrics, analytics
  - **`providers/`** – `SessionProvider` for NextAuth, `ThemeProvider`
  - **`auth/`** – Sign-out button
  - **`offline-banner.tsx`** – Offline status banner
  - **`ui/`** – Shared UI primitives
- **`lib/`** – `prisma` client singleton, `auth` (NextAuth config), `theme` helpers
- **`types/`** – NextAuth session type augmentation
- **`styles/`** – Global CSS and Tailwind
- **`public/`** – Static assets (logo, `manifest.json`); PWA generates `sw.js` at build time

## Development

From the **monorepo root** (recommended):

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm test             # Run Jest unit tests
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests
```

## Environment

Requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. See [QUICK_START.md](../../QUICK_START.md) in the repo root.

For device integrations, additionally set provider OAuth credentials — see [docs/INTEGRATIONS.md](../../docs/INTEGRATIONS.md).

## PWA

Production build runs `next build --webpack` so `@ducanh2912/next-pwa` can generate the service worker. The service worker and offline fallback are disabled in development.

## Testing

- **Unit tests** (`__tests__/`): Run with `npm test` (Jest + Testing Library).
- **E2E tests** (`e2e/`): Run with `npm run test:e2e` (Playwright). Requires a running app; the playwright config starts the dev server automatically when not in CI.
