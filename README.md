# Gym Journal

A full-stack progressive web application (PWA) for personal health and fitness tracking. Built with Next.js 16, TypeScript, Prisma, and PostgreSQL — designed to run on your home server with zero hosting costs.

## Features

- 🔐 **Authentication**: Email/password sign up and sign in via NextAuth.js (Credentials + Prisma, JWT sessions). Optional Google OAuth (configure `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to enable). Protected routes and redirects.
- 🏋️ **Workout Library**: Create and manage CrossFit-style workout templates (title, description, score type, barbell lift). Card and table views with filters. Log a workout directly from any template.
- 📝 **Workout Logging**: Log a workout from a template or freeform. Record date, result (time/reps/load/rounds), RX or scaled, notes, and PR. Edit or delete past sessions.
- 🤖 **AI Workout Name Generator**: Generate creative CrossFit-style names (like Fran, Murph, DT) for your workouts using the Claude API. Get 6 name suggestions at once based on the workout description, score type, and barbell lift. Regenerate for more options. Available on new workout templates, log form, and when editing existing workouts.
- ⏱️ **Workout Timers**: Full-featured timer supporting all CrossFit formats — **For Time** (with optional time cap), **AMRAP** (count-down), **Tabata** (configurable work/rest rounds), **EMOM** (per-minute tracking), and **Free Timer**. Timers auto-stop at completion and offer a "Use this time" button to log the result. Editable after the fact. Standalone timer page (`/timer`) works without being tied to a workout.
- ❤️ **Health & Performance Metrics**: Manually log calories burned, max heart rate, average heart rate (from your smartwatch), and total workout duration (including warm-up/cool-down) per session. All data surfaces in leaderboards and analytics.
- 🎲 **WOD Picker**: Randomly select a workout from your library. Filter by score type, duration bucket (based on your past times), history (done before / never done), and RX/Scaled. Hit "Try Another" to respin.
- 📅 **Calendar & History**: Monthly calendar view with RX/scaled indicators. Table view with filters (date range, title, score type, RX/scaled).
- 📥 **CSV Import**: Import historical workouts from `workouts.csv` with `npm run db:import-workouts`.
- 📊 **Progress & Analytics**: Personal records (PRs) list, progress-over-time charts by workout, summary stats. Workout frequency bar chart (by week/month, RX vs Scaled breakdown). Body composition trends chart (weight, body fat %, muscle mass). All charts have time-range filters.
- 🏆 **Leaderboard**: Personal achievement dashboard — current streak, longest streak, RX rate, total PRs, best month ever, monthly volume chart, favorite training days chart, recent PRs, and health stats (total calories, peak heart rate, total time trained).
- 📏 **Body Metrics**: Track weight, body fat %, muscle mass, BMI, and notes over time. Add/edit/delete entries; weight trend chart. Respects profile preferred unit (metric/imperial).
- 📱 **PWA & Mobile**: Web app manifest, service worker, offline fallback page, offline banner. Installable on iOS/Android from the browser. Mobile-optimized timer and logging UX.
- 📤 **Data Export**: Export all workout sessions and body metrics as CSV or JSON from the Settings page.
- 🔗 **Device Integrations**: Full API and UI for connecting wearables (Apple Health, Google Fit, Fitbit, Garmin). Connect, sync, and disconnect from `/settings/integrations`. See [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for OAuth setup.
- 🌙 **Dark Mode**: System preference detection with manual toggle in Settings. Preference persisted per user.
- ⚡ **Performance**: Skeleton loading screens and error boundaries on all major pages.
- 🧪 **Testing**: Jest unit tests and React Testing Library component tests. Playwright E2E tests covering authentication and all protected routes.
- 🚀 **CI/CD**: GitHub Actions pipelines for lint, unit tests, build, E2E tests (with Postgres service), and Docker image builds. Separate deployment workflow for home server via SSH.

## Tech Stack

### Frontend

- **Next.js 16** (App Router) — Full-stack React framework
- **TypeScript** — Type safety and maintainability
- **Tailwind CSS** — Utility-first styling
- **date-fns** — Date formatting and calendar logic
- **lucide-react** — Icons
- **Recharts** — Data visualization (analytics and body metrics charts)

### Backend

- **Next.js Route Handlers** — RESTful API routes
- **Prisma ORM** — Type-safe database access (`@gym-journal/database`)
- **NextAuth.js v4** — Authentication (Credentials + optional Google OAuth, JWT sessions, Prisma adapter)
- **Anthropic Claude API** (`@anthropic-ai/sdk`) — AI workout name generation (claude-haiku-4-5-20251001)
- **bcryptjs** — Password hashing
- **Zod** — Request/response validation

### Database & Deployment

- **PostgreSQL 16** — Production database (Docker)
- **Docker & Docker Compose** — Containerization
- **Cloudflare Tunnel** — Secure external access
- **Let's Encrypt** — Free SSL/TLS certificates

### Development Tools

- **ESLint & Prettier** — Code quality and formatting
- **Jest & React Testing Library** — Unit and component testing
- **Playwright** — End-to-end testing
- **Husky** — Git hooks

## Getting Started

See **[QUICK_START.md](QUICK_START.md)** for a minimal setup guide (clone, install, env, database, dev server).

## Prerequisites

- **Node.js** 18.17 or later
- **npm** (or pnpm / yarn)
- **Docker** and **Docker Compose** (for local PostgreSQL)

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
│       │   │   ├── dashboard/  # Home with stats, streak, quick actions
│       │   │   ├── wod/        # WOD Picker (random workout selector)
│       │   │   ├── library/    # Templates + exercises
│       │   │   ├── workouts/   # Sessions + log
│       │   │   ├── history/    # Calendar and table views
│       │   │   ├── leaderboards/ # Personal achievements & stats
│       │   │   ├── metrics/    # Body metrics
│       │   │   ├── analytics/  # Progress, PRs, frequency, body composition
│       │   │   └── settings/   # Preferences, export, integrations
│       │   │       └── integrations/  # Device integration management
│       │   ├── api/            # API route handlers
│       │   │   ├── health/     # Health check (unauthenticated)
│       │   │   ├── export/     # CSV/JSON data export
│       │   │   ├── devices/    # Device integration CRUD + sync
│       │   │   └── analytics/
│       │   ├── login/
│       │   ├── register/
│       │   └── offline/        # PWA offline fallback page
│       ├── __tests__/          # Jest unit & component tests
│       ├── e2e/                # Playwright E2E tests
│       ├── components/         # React components
│       │   ├── ui/             # Shared UI primitives
│       │   ├── features/       # Feature-specific components
│       │   ├── nav-links.tsx   # Active-state navigation (client component)
│       │   └── providers/      # SessionProvider, ThemeProvider
│       ├── lib/                # Prisma client, auth config, utilities
│       ├── hooks/              # Custom React hooks
│       ├── styles/             # Global CSS and Tailwind
│       └── public/             # Static assets (logo, manifest.json)
├── packages/
│   ├── database/               # Prisma schema and migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── seed.ts
│   └── config/                 # Shared ESLint and TypeScript configs
├── deploy/                     # Home server deployment scripts
│   ├── setup.sh                # One-time setup (Tailscale + systemd + secrets)
│   ├── redeploy.sh             # Rebuild & restart
│   ├── backup.sh               # PostgreSQL pg_dump with 7-day rotation
│   ├── gym-journal.service     # systemd service unit
│   ├── gym-journal-backup.service
│   └── gym-journal-backup.timer  # Daily 02:00 backup timer
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # PostgreSQL + app services
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

- **users** — User accounts and authentication
- **profiles** — Extended user information and preferences (dark mode, units, etc.)
- **exercises** — Master exercise library (optional; seed with `npm run db:seed`)
- **workout_templates** — CrossFit-style workout blueprints (title, description, score type, barbell lift)
- **workout_sessions** — Logged workouts (date, result, RX/scaled, PR, notes, optional template link)
- **body_metrics** — Weight, body fat %, measurements over time
- **device_connections** — Smart device OAuth tokens (Apple Health, Google Fit, Fitbit, Garmin)
- **device_data** — Synced data points from connected wearables (steps, heart rate, sleep, calories, etc.)

See `packages/database/prisma/schema.prisma` for the complete schema.

## Deployment

### Home Server Deployment

The `deploy/` directory contains scripts for running Gym Journal on a home server with systemd and daily backups.

**One-command setup** (requires Docker and Tailscale already installed):

```bash
git clone https://github.com/yourusername/gym-journal /opt/gym-journal
cd /opt/gym-journal
sudo bash deploy/setup.sh
```

`setup.sh` auto-detects your Tailscale IP, generates secrets, writes `.env` with `chmod 600`, builds the Docker image, and installs the systemd service + daily backup timer.

**Rebuild after updates:**

```bash
sudo bash deploy/redeploy.sh
```

**Manual Docker Compose (local / dev):**

```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f app     # Stream app logs
docker-compose up -d --build   # Rebuild and start
```

See [docs/home-server-deployment.md](docs/home-server-deployment.md) for the full walkthrough including Tailscale setup, non-Starlink port forwarding, Caddy HTTPS, and security hardening.

### Environment Variables for Production

The app and Docker Compose read from **`.env`** in the project root. Next.js also reads **`.env.local`** when running locally. For production (e.g. Docker), set variables in `.env`:

```env
DATABASE_URL="postgresql://user:password@postgres:5432/gymjournal"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"

# Optional: Google OAuth (enables "Continue with Google" on login/register)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## PWA Configuration

The app is configured as a Progressive Web App with:

- **Service worker** (`/sw.js`) generated at build time via `@ducanh2912/next-pwa` (webpack build only; disabled in development).
- **Web app manifest** (`/manifest.json`) for name, icons, theme colors, and installability.
- **Offline fallback**: When a route is unavailable offline, the app shows the `/offline` page.
- **Offline banner**: A sticky banner appears when the browser reports no connection.
- **Runtime caching**: API responses are cached (NetworkFirst) for better offline resilience.

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

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Device Integrations Guide](docs/INTEGRATIONS.md)
