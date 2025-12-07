# Getting Started with Gym Journal Development

This guide will help you get the project up and running for development.

## ✅ Scaffolding Complete

The basic project structure has been created with:
- Monorepo workspace setup (apps/web, packages/database, packages/config)
- Complete Prisma database schema
- Docker configuration for PostgreSQL
- Configuration files (TypeScript, Prettier, ESLint-ready)
- Comprehensive README with documentation

## 🚀 Next Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies for the root workspace and all packages.

### 2. Start PostgreSQL Database

```bash
docker-compose up -d postgres
```

Wait for the database to be healthy (about 10-15 seconds).

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init --schema=packages/database/prisma/schema.prisma
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### 5. (Optional) Seed Database

```bash
npm run db:seed
```

This will create sample exercises in your database.

### 6. Set Up Next.js Application

You'll need to create the Next.js configuration and initial pages:

```bash
# Create next.config.js in apps/web/
# Create app/layout.tsx (root layout)
# Create app/page.tsx (home page)
# Set up Tailwind CSS configuration
# Configure NextAuth.js
```

### 7. Install shadcn/ui Components

Once Next.js is configured, initialize shadcn/ui:

```bash
cd apps/web
npx shadcn-ui@latest init
```

This will set up the components structure and Tailwind configuration.

## 📦 Workspace Structure

The project uses npm workspaces:

- **apps/web** - Next.js application
- **packages/database** - Prisma schema and database utilities
- **packages/config** - Shared configuration files

## 🔑 Key Files Created

### Configuration
- `package.json` - Root workspace configuration with scripts
- `tsconfig.json` - TypeScript configuration
- `.prettierrc` - Code formatting rules
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns

### Database
- `packages/database/prisma/schema.prisma` - Complete database schema
- `packages/database/seed.ts` - Database seeding script

### Docker
- `docker-compose.yml` - PostgreSQL service configuration
- `docker/Dockerfile` - Next.js app containerization

### Documentation
- `README.md` - Comprehensive project documentation
- `WARP.md` - AI agent development guidelines
- `PLAN.md` - Detailed project requirements

## 🎯 Development Workflow

1. **Start database**: `docker-compose up -d postgres`
2. **Start dev server**: `npm run dev`
3. **Run migrations**: `npm run db:migrate`
4. **Open Prisma Studio**: `npm run db:studio`
5. **Run tests**: `npm test`
6. **Format code**: `npm run format`
7. **Lint code**: `npm run lint`

## 🏗️ What's Next?

To complete the MVP (Phase 1), you need to:

1. **Next.js Setup**
   - Configure next.config.js
   - Set up app router structure
   - Create root layout and initial pages

2. **Tailwind CSS**
   - Configure tailwind.config.js
   - Set up global styles
   - Initialize shadcn/ui components

3. **Authentication**
   - Configure NextAuth.js
   - Create auth API routes
   - Build login/register pages

4. **Core Features**
   - Workout library pages (CRUD)
   - Workout logging interface
   - Calendar/history view
   - Dashboard layout

5. **Testing**
   - Set up Jest configuration
   - Set up Playwright for e2e tests
   - Write initial tests

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🆘 Troubleshooting

### Database Connection Issues
If you can't connect to PostgreSQL:
1. Check Docker is running: `docker ps`
2. Check logs: `docker-compose logs postgres`
3. Verify port 5432 is not in use: `lsof -i :5432`

### Migration Issues
If migrations fail:
1. Reset database: `npm run db:reset`
2. Check DATABASE_URL in .env.local
3. Ensure PostgreSQL container is running

### Module Not Found
If you get module errors:
1. Run `npm install` in root directory
2. Generate Prisma Client: `npx prisma generate --schema=packages/database/prisma/schema.prisma`
3. Restart your dev server

## 🤝 Need Help?

Refer to:
- `WARP.md` for AI agent development guidelines
- `PLAN.md` for detailed project requirements
- `README.md` for comprehensive documentation
