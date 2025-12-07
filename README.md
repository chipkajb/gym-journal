# Gym Journal

A full-stack progressive web application (PWA) for personal health and fitness tracking. Built with Next.js 14+, TypeScript, Prisma, and PostgreSQL, designed to run on your home server with zero hosting costs.

## Features

- 🏋️ **Workout Library**: Create and manage custom workout templates with categorization and tagging
- 📝 **Workout Logging**: Quick entry interface with timer, set/rep/weight tracking, and auto-save
- 📅 **Calendar & History**: Monthly/weekly visualization with color-coded workout types and streak tracking
- 📊 **Progress Analytics**: Personal records tracking, progress charts, body metrics, and goal setting
- 📱 **PWA Support**: Install as a native-like app on iOS and Android with offline functionality
- 🔐 **Secure Authentication**: Email/password and OAuth (Google) via NextAuth.js
- 🌙 **Dark Mode**: System preference detection with modern, accessible UI
- 🔄 **Smart Device Integration** (Future): Apple HealthKit, Google Fit, Fitbit APIs

## Tech Stack

### Frontend
- **Next.js 14+** (App Router) - Full-stack React framework
- **TypeScript** - Type safety and maintainability
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **React Query** - Server state management
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - RESTful endpoints
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Authentication and session management
- **Zod** - Runtime validation

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

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/gym-journal.git
cd gym-journal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://gymjournal:your_password@localhost:5432/gymjournal"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Start PostgreSQL with Docker

```bash
docker-compose up -d postgres
```

### 5. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Seed the database (optional)

```bash
npm run db:seed
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
gym-journal/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages and layouts
│       │   ├── (auth)/         # Protected routes
│       │   │   ├── dashboard/
│       │   │   ├── workouts/
│       │   │   ├── history/
│       │   │   ├── library/
│       │   │   └── profile/
│       │   ├── api/            # API route handlers
│       │   ├── login/
│       │   └── register/
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
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

### Database

```bash
npx prisma studio              # Open Prisma Studio GUI
npx prisma generate            # Generate Prisma Client
npx prisma migrate dev         # Create and apply migration
npx prisma migrate reset       # Reset database (dev only)
npm run db:seed                # Seed database
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
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
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
- **exercises** - Master exercise library
- **workout_templates** - Saved workout blueprints
- **workout_sessions** - Individual workout instances
- **exercise_logs** - Exercise performance within sessions
- **body_metrics** - Weight, body fat %, measurements over time
- **device_connections** - Smart device OAuth tokens (future)
- **device_data** - Synced data from wearables (future)

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

Update your production `.env` file:

```env
DATABASE_URL="postgresql://user:password@postgres:5432/gymjournal"
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

## PWA Configuration

The app is configured as a Progressive Web App with:

- **Service Workers** for offline functionality
- **Web App Manifest** for installation on mobile devices
- **IndexedDB** for offline data caching
- **Background Sync** for data synchronization

To install on iOS/Android:
1. Open the app in your mobile browser
2. Tap "Add to Home Screen" or "Install App"
3. The app will launch in fullscreen mode

## Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Phases

- **Phase 1 (MVP)** ✅ In Progress
  - Project scaffolding and authentication
  - Basic workout library and logging
  - Calendar view

- **Phase 2** 🔄 Next
  - Progress tracking and analytics
  - Body metrics
  - PWA features and offline mode

- **Phase 3** 📋 Planned
  - Smart device integrations
  - Data sync and exports
  - Advanced analytics

- **Phase 4** 📋 Planned
  - Performance optimization
  - Comprehensive testing
  - CI/CD pipeline

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
