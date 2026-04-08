# Documentation

This directory contains additional project documentation.

## Root docs

- **[../README.md](../README.md)** — Project overview, features, tech stack, structure, API reference, and deployment.
- **[../QUICK_START.md](../QUICK_START.md)** — Minimal setup guide to run the app locally (clone → install → env → db → dev server).

## Guides

- **[INTEGRATIONS.md](INTEGRATIONS.md)** — How to configure OAuth credentials for each supported device provider (Apple Health, Google Fit, Fitbit, Garmin).
- **[home-server-deployment.md](home-server-deployment.md)** — Full guide for deploying on a home server with Tailscale, Docker, systemd, and automated backups.

## Key environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte secret for JWT signing |
| `NEXTAUTH_URL` | Yes | Public URL of the app |
| `ANTHROPIC_API_KEY` | Optional | Claude API key for AI workout name generator |
| `POSTGRES_PASSWORD` | Docker only | Postgres password used by docker-compose |
| `TAILSCALE_IP` | Docker only | Tailscale IP for home server binding |

## New features (April 2026)

### AI Workout Name Generator
Uses `claude-haiku-4-5-20251001` via the Anthropic API to suggest CrossFit-style names (like Fran, Murph, or Avalanche) based on workout description and metadata. Available on:
- New template form (`/library/templates/new`)
- Edit template form
- Log workout form (`/workouts/new`)
- Edit workout form

Set `ANTHROPIC_API_KEY` in your `.env.local` to enable. The rest of the app functions normally without it.

### Workout Timers (`/timer`)
Five timer modes available from the nav and embedded in the log workout form:
- **For Time** — counts up, optional time cap
- **AMRAP** — counts down from target duration
- **Tabata** — configurable work/rest intervals with round tracking
- **EMOM** — every-minute-on-the-minute with per-round countdown
- **Free Timer** — simple stopwatch

Timer results can be used directly as the workout result when logging, or discarded. Editable after the fact in the edit form.

### Health & Performance Metrics
Per-session tracking (manual entry from your smartwatch):
- **Calories burned** (kcal)
- **Max heart rate** (bpm)
- **Average heart rate** (bpm)
- **Total workout duration** (seconds, including warm-up/cool-down)
- **Timer result** (seconds, from in-app timer)

All fields are optional. Data surfaces in:
- Workout session detail page
- Leaderboards (total calories, peak HR, avg HR, total time trained)
- Edit form for retroactive entry
