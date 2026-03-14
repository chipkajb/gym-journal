# Gym Journal Web App

Next.js 16 (App Router) application for Gym Journal. Provides authentication (email/password + optional Google OAuth), CrossFit-style workout library, session logging, calendar and table history views, body metrics tracking, advanced progress analytics, data export, device integrations, dark mode, and PWA/offline support.

## Structure

- **`app/`** — Next.js App Router
  - **`(auth)/`** — Protected routes with shared layout and navigation:
    - `dashboard/` — Overview and quick links
    - `library/` — Workout template CRUD (card and table views)
    - `workouts/` — Session logging
    - `history/` — Calendar and table views
    - `metrics/` — Body metrics tracking
    - `analytics/` — PRs, progress charts, frequency chart, body composition chart
    - `settings/` — Preferences, dark mode toggle, data export
    - `settings/integrations/` — Connect/sync/disconnect Apple Health, Google Fit, Fitbit, Garmin
  - **`api/`** — Route handlers:
    - `auth/[...nextauth]`, `auth/register`
    - `exercises/`, `templates/`, `sessions/`, `body-metrics/`
    - `analytics/summary`, `analytics/prs`, `analytics/progress`, `analytics/workout-titles`
    - `analytics/frequency` — Workout frequency by week/month
    - `analytics/body-composition` — Body composition trends
    - `export/` — CSV and JSON data export
    - `devices/`, `devices/[provider]/`, `devices/[provider]/sync/` — Device integration CRUD
    - `user/profile`
  - **`login/`**, **`register/`** — Public auth pages (email/password + Google OAuth button)
  - **`offline/`** — PWA offline fallback page
  - Each major page has `loading.tsx` (skeleton) and `error.tsx` (error boundary)
- **`__tests__/`** — Jest unit and component tests
  - `lib/` — Utility tests (theme helpers)
  - `api/` — API helper tests (CSV export, analytics bucketing)
  - `components/` — React Testing Library component tests (OfflineBanner)
- **`e2e/`** — Playwright end-to-end tests
  - `auth.spec.ts` — Registration and login flow
  - `navigation.spec.ts` — Page smoke tests for all protected routes
- **`components/`**
  - `features/` — Library, workouts, history, metrics, analytics
  - `providers/` — `SessionProvider` (NextAuth), `ThemeProvider` (dark mode)
  - `auth/` — Sign-out button
  - `offline-banner.tsx` — Offline status banner
  - `ui/` — Shared UI primitives
- **`lib/`** — Prisma client singleton, auth config, theme helpers
- **`types/`** — NextAuth session type augmentation
- **`styles/`** — Global CSS and Tailwind (light and dark CSS variables)
- **`public/`** — Static assets (logo, `manifest.json`); PWA generates `sw.js` at build time

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

Requires `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in `apps/web/.env.local`. See [QUICK_START.md](../../QUICK_START.md) for full setup instructions.

Optional — Google OAuth (enables "Continue with Google" on login/register):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

For device integrations, set provider OAuth credentials — see [docs/INTEGRATIONS.md](../../docs/INTEGRATIONS.md).

## PWA

Production build runs `next build --webpack` so `@ducanh2912/next-pwa` can generate the service worker. The service worker and offline fallback are disabled in development.

## Testing

- **Unit tests** (`__tests__/`): Run with `npm test` (Jest + Testing Library).
- **E2E tests** (`e2e/`): Run with `npm run test:e2e` (Playwright). The Playwright config starts the dev server automatically when not in CI.
