# Gym Journal

A full-stack progressive web application (PWA) for personal health and fitness tracking. Built with Next.js 14+, TypeScript, Prisma, and PostgreSQL, designed to run on your home server with zero hosting costs.

> ⚠️ **WARNING**: This project is currently under active development and is a work in progress. Features may be incomplete, APIs may change, and the application may not be production-ready. Use at your own risk.

> ⚠️ **DISCLOSURE**: This is a vibe coding project — expect experimental approaches, evolving architecture, and the occasional "let's see what happens" commit. The journey for this project is more about exploration than perfection.

## Features

**Currently implemented (MVP + Phases 1–4)**

- 🔐 **Authentication**: Email/password sign up and sign in via NextAuth.js (Credentials + Prisma, JWT sessions). Protected routes and redirects.
- 🏋️ **Workout Library**: Create and manage CrossFit-style workout templates (title, description, score type, barbell lift). Card and **table views** with filters. **Log a workout** from any template to retry and beat your performance.
- 📝 **Workout Logging**: Log a workout from a template or freeform. Record date, result (time/reps/load/rounds), RX or scaled, notes, and PR. Edit or delete past sessions.
- 📅 **Calendar & History**: Monthly calendar view (RX/scaled dots). **Table view** with filters (date range, title, score type, RX/scaled) on a separate page.
- 📥 **CSV Import**: Import historical workouts from `workouts.csv` with `npm run db:import-workouts` (run `npm run db:clear-workouts` first to wipe old data; users are preserved).
- 📊 **Progress & Analytics**: Personal records (PRs) list, progress-over-time charts by workout, summary stats (total workouts, PR count, last 30 days). **Workout frequency** bar chart (by week/month, RX vs Scaled breakdown). **Body composition trends** chart (weight, body fat %, muscle mass). All charts have time-range filters.
- 📏 **Body Metrics**: Track weight, body fat %, muscle mass, BMI, and notes over time. Add/edit/delete entries; weight trend chart. **Metrics** page; respects profile preferred unit (metric/imperial).
- 📱 **PWA & Offline**: Web app manifest, service worker (via `@ducanh2912/next-pwa`), offline fallback page, offline banner when disconnected. Installable on iOS/Android. Production build uses webpack for PWA; API responses can be cached for resilience.
- 📤 **Data Export**: Export all workout sessions and body metrics as **CSV** or **JSON** directly from the Settings page (`/api/export`).
- 🔗 **Device Integrations**: Full API and UI framework for connecting wearables (Apple Health, Google Fit, Fitbit, Garmin). Connect, sync, and disconnect integrations from `/settings/integrations`. OAuth credentials must be configured per provider (see `docs/INTEGRATIONS.md`).
- ⚡ **Performance**: Next.js `loading.tsx` skeleton screens and `error.tsx` error boundaries on all major pages for instant perceived performance and graceful failure handling.
- 🧪 **Testing**: Jest unit tests (lib utilities, API helpers, analytics logic) with React Testing Library component tests. Playwright E2E tests covering authentication flows, navigation, and protected routes.
- 🚀 **CI/CD**: GitHub Actions pipelines for lint, type-check, unit tests, build verification, E2E tests (with Postgres service), and Docker image builds. Separate deployment workflow for home server via SSH.

**Planned**

- 🔐 **OAuth**: Google (and other providers) via NextAuth.js
- 🌙 **Dark Mode**: System preference detection (theme toggle exists in settings)

## Tech Stack

### Frontend

- **Next.js 16** (App Router) - Full-stack React framework
- **TypeScript** - Type safety and maintainability
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date formatting and calendar logic
- **lucide-react** - Icons
- **Recharts** - Data visualization (analytics and body metrics charts)

### Backend

- **Next.js Route Handlers** (App Router) - RESTful API routes
- **Prisma ORM** - Type-safe database access (monorepo package `@gym-journal/database`)
- **NextAuth.js v4** - Authentication (Credentials provider, JWT sessions, Prisma adapter)
- **bcryptjs** - Password hashing
- **Zod** - Request/response validation

### Database & Deployment

- **PostgreSQL 16** - Production database (Docker)
- **Docker & Docker Compose** - Containerization
- **Cloudflare Tunnel** - Secure external access
- **Let's Encrypt** - Free SSL/TLS certificates

### Development Tools

- **ESLint & Prettier** - Code quality and formatting
- **Jest & React Testing Library** - Unit and component testing
- **Playwright** - End-to-end testing
- **Husky** - Git hooks

## Prerequisites

- **Node.js** 18.17 or later
- **npm** or **pnpm** or **yarn**
- **Docker** and **Docker Compose** (for local PostgreSQL)
- **Git**

## Getting Started

To run the app locally, see **[QUICK_START.md](QUICK_START.md)** for a minimal setup guide (clone, install, env, database, dev server). The project uses **`.env`** (for Docker Compose) and **`.env.local`** (for Next.js); both should be set with the same values so that `docker-compose` and the dev server have the required variables.

## Project Structure

```text
gym-journal/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI: lint, test, build, E2E, Docker
│       └── deploy.yml          # Manual deploy to home server
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages and layouts
│       │   ├── (auth)/         # Protected routes (require sign-in)
│       │   │   ├── dashboard/
│       │   │   ├── library/    # Templates + exercises
│       │   │   ├── workouts/   # Sessions + log
│       │   │   ├── history/    # Calendar view
│       │   │   ├── metrics/    # Body metrics
│       │   │   ├── analytics/  # Progress, PRs, frequency, body composition
│       │   │   └── settings/   # Preferences + export + integrations
│       │   │       └── integrations/  # Device integration management
│       │   ├── api/            # API route handlers
│       │   │   ├── export/     # CSV/JSON data export
│       │   │   ├── devices/    # Device integration CRUD + sync
│       │   │   └── analytics/
│       │   │       ├── frequency/       # Workout frequency analytics
│       │   │       └── body-composition/ # Body composition trends
│       │   ├── login/
│       │   ├── register/
│       │   └── offline/        # PWA offline fallback page
│       ├── __tests__/          # Jest unit & component tests
│       │   ├── lib/
│       │   ├── api/
│       │   └── components/
│       ├── e2e/                # Playwright E2E tests
│       ├── components/         # React components
│       │   ├── ui/             # shadcn/ui components
│       │   ├── features/       # Feature-specific components
│       │   └── layouts/        # Layout components
│       ├── lib/                # Utilities and helpers
│       ├── hooks/              # Custom React hooks
│       ├── styles/             # Global styles
│       └── public/             # Static assets
├── packages/
│   ├── database/               # Prisma schema and migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── seed.ts
│   └── config/                 # Shared configurations
│       ├── eslint/
│       └── typescript/
├── docker/                     # Docker configuration
│   ├── docker-compose.yml
│   └── Dockerfile
└── docs/                       # Documentation
```

## Development Commands

### Development

```bash
npm run dev          # Start development server (apps/web)
npm run build        # Build for production
npm start            # Start production server
```

### Database

Run from project root (these delegate to `packages/database`):

```bash
npm run db:generate   # Generate Prisma Client
npm run db:migrate    # Create and apply migrations
npm run db:studio     # Open Prisma Studio GUI
npm run db:seed       # Seed exercises (optional)
npm run db:reset      # Reset database (dev only)
npm run db:clear-workouts   # Remove all workout sessions and templates (keeps users)
npm run db:import-workouts  # Import workouts from repo-root workouts.csv (uses first user)
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm run type-check   # Run TypeScript compiler
```

### Testing

```bash
npm test             # Run all Jest unit & component tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run Playwright end-to-end tests (requires running app)
```

### Docker

```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose up -d --build   # Rebuild and start
```

## Database Schema

### Core Tables

- **users** - User accounts and authentication
- **profiles** - Extended user information and preferences
- **exercises** - Master exercise library (optional; seed with `npm run db:seed`)
- **workout_templates** - CrossFit-style workout blueprints (title, description, score type, barbell lift)
- **workout_sessions** - Logged workouts (date, result, RX/scaled, PR, notes, optional template link)
- **body_metrics** - Weight, body fat %, measurements over time
- **device_connections** - Smart device OAuth tokens (Apple Health, Google Fit, Fitbit, Garmin)
- **device_data** - Synced data points from connected wearables (steps, heart rate, sleep, calories, etc.)

See `packages/database/prisma/schema.prisma` for complete schema definition.

## Deployment

### Home Server Deployment

1. **Set up Docker on your server**

    ```bash
    docker-compose -f docker/docker-compose.yml up -d
    ```

2. **Configure Cloudflare Tunnel**

    Follow the [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) to expose your app securely.

3. **Set up SSL/TLS with Let's Encrypt**

    Certificates are automatically managed by Cloudflare Tunnel.

### Environment Variables for Production

The app and Docker Compose read from **`.env`** in the project root. Next.js also reads **`.env.local`** when running locally. For production (e.g. Docker), set variables in `.env`. Update your production `.env` file:

```env
DATABASE_URL="postgresql://user:password@postgres:5432/gymjournal"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

## PWA Configuration

The app is configured as a Progressive Web App with:

- **Service worker** (`/sw.js`) generated at build time via `@ducanh2912/next-pwa` (webpack build only; disabled in development).
- **Web app manifest** (`/manifest.json`) for name, icons, theme colors, and installability.
- **Offline fallback**: When a route is unavailable offline, the app shows the `/offline` page.
- **Offline banner**: A sticky banner appears when the browser reports no connection.
- **Runtime caching**: API responses can be cached (NetworkFirst) for better resilience.

Production build uses `next build --webpack` so the PWA plugin can generate the service worker. To install on iOS/Android:

1. Open the app in your mobile browser (over HTTPS).
2. Tap "Add to Home Screen" or "Install App".
3. The app will launch in standalone mode.

## Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Phases

- **Phase 1 (MVP)** ✅ Done
  - Project scaffolding and **working** authentication (email/password, register + login)
  - Workout library (templates CRUD, exercise list, add exercises to templates)
  - Workout logging (start session, timer, log sets/reps/weight/duration, finish workout)
  - Calendar/history view (month view, color-coded by category, click day for sessions)

- **Phase 2** ✅ Done
  - Progress tracking and analytics (PRs, progress-by-workout charts, summary stats)
  - Body metrics (weight, body fat %, muscle mass, BMI, trend chart)
  - PWA features and offline mode (manifest, service worker, offline page, offline banner)

- **Phase 3** ✅ Done
  - **Smart device integrations**: Full API (`/api/devices`) and Settings UI (`/settings/integrations`) for connecting Apple Health, Google Fit, Fitbit, and Garmin. Connect/disconnect/sync workflows with provider-level status display. Schema-backed `DeviceConnection` and `DeviceData` tables with real sync infrastructure (configure OAuth per provider to enable live data — see `docs/INTEGRATIONS.md`).
  - **Data export**: Export workouts and body metrics as CSV or JSON from `/settings` via `/api/export`.
  - **Advanced analytics**: Workout frequency bar chart (by week/month, RX vs Scaled breakdown) and body composition trend chart (weight + body fat % + muscle mass over time) on the Analytics page.

- **Phase 4** ✅ Done
  - **Performance optimization**: `loading.tsx` skeleton screens and `error.tsx` error boundaries on all major pages (analytics, metrics, dashboard, history, workouts, library).
  - **Comprehensive testing**: Jest unit tests for lib utilities and analytics logic; React Testing Library component tests (OfflineBanner); Playwright E2E tests for auth flows and navigation across all protected routes.
  - **CI/CD pipeline**: GitHub Actions CI workflow (lint, type-check, unit tests, Next.js build, Playwright E2E with Postgres service, Docker build on main). Separate deploy workflow for home server via SSH.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [WARP.md](WARP.md) - AI agent development guidelines
- [PLAN.md](PLAN.md) - Comprehensive project plan
