# Database Package

Prisma schema, migrations, and database utilities for Gym Journal.

## Commands

```bash
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Create and apply migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (dev only)
```

## Schema

See `prisma/schema.prisma` for the complete database schema.

### Core Models

- **User & Authentication**: Users, accounts, sessions
- **Profiles**: User preferences and settings
- **Exercises**: Exercise library with descriptions
- **Workout Templates**: Saved workout blueprints
- **Workout Sessions**: Logged workout instances
- **Exercise Logs**: Individual exercise performance
- **Body Metrics**: Weight, body fat, measurements
- **Device Connections**: Smart device integrations (future)
