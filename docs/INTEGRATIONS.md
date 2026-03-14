# Device Integrations

Gym Journal supports connecting popular fitness wearables and health platforms. The
integration infrastructure (API routes, database tables, Settings UI) is fully in
place. Activating live data sync for each provider requires configuring OAuth
credentials in your environment.

## Supported Providers

| Provider | Data types | OAuth flow |
|---|---|---|
| **Apple Health** | Steps, heart rate, calories, sleep, workouts | HealthKit (iOS only; requires native bridge or Shortcuts automation) |
| **Google Fit** | Steps, heart rate, calories, workouts, weight | Google OAuth 2.0 (REST API) |
| **Fitbit** | Steps, heart rate, sleep, calories, weight | Fitbit OAuth 2.0 |
| **Garmin Connect** | Steps, heart rate, sleep, workouts, stress | Garmin Health API (OAuth 1.0a) |

## Architecture

```
User clicks "Connect" in /settings/integrations
        ↓
Redirect to provider OAuth authorization URL
        ↓
Provider redirects back to /api/devices/[provider]/callback
        ↓
Access token stored in device_connections table
        ↓
User can trigger sync via UI or automated background job
        ↓
Sync route calls provider REST API → stores data in device_data table
```

## Configuration

### Environment variables

Add to `apps/web/.env.local` (and `.env` for Docker):

```env
# Google Fit
GOOGLE_FIT_CLIENT_ID="your-google-client-id"
GOOGLE_FIT_CLIENT_SECRET="your-google-client-secret"

# Fitbit
FITBIT_CLIENT_ID="your-fitbit-client-id"
FITBIT_CLIENT_SECRET="your-fitbit-client-secret"

# Garmin Connect
GARMIN_CONSUMER_KEY="your-garmin-consumer-key"
GARMIN_CONSUMER_SECRET="your-garmin-consumer-secret"
```

### Registering your app with each provider

**Google Fit**
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Fitness API**.
3. Configure OAuth 2.0 credentials; set the redirect URI to
   `https://yourdomain.com/api/devices/google_fit/callback`.
4. Add `GOOGLE_FIT_CLIENT_ID` and `GOOGLE_FIT_CLIENT_SECRET` to your env.

**Fitbit**
1. Register a new app at [dev.fitbit.com](https://dev.fitbit.com/apps/new).
2. Set the Callback URL to `https://yourdomain.com/api/devices/fitbit/callback`.
3. Add `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET` to your env.

**Garmin Connect**
1. Apply for API access at [developer.garmin.com](https://developer.garmin.com/connect-iq/sdk/).
2. Set the OAuth callback URL to `https://yourdomain.com/api/devices/garmin/callback`.
3. Add `GARMIN_CONSUMER_KEY` and `GARMIN_CONSUMER_SECRET` to your env.

**Apple Health (iOS only)**
Apple HealthKit is not available via a public REST API. Options:
- Use **iOS Shortcuts** to export health data and POST it to your app.
- Build a companion iOS app using HealthKit and call the `/api/devices/apple_health` endpoint with the exported data.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/devices` | List all providers with connection status |
| `GET` | `/api/devices/[provider]` | Status for a specific provider |
| `POST` | `/api/devices/[provider]` | Connect / upsert a device connection |
| `DELETE` | `/api/devices/[provider]` | Disconnect a provider |
| `POST` | `/api/devices/[provider]/sync` | Trigger a manual data sync |

## Database tables

- **`device_connections`** — One row per user per provider. Stores OAuth tokens, active/inactive status.
- **`device_data`** — Individual data points synced from devices (steps count, heart rate reading, sleep session, etc.).

## Implementing the OAuth callback

Create `apps/web/app/api/devices/[provider]/callback/route.ts` for each provider
that uses an OAuth redirect flow (Google Fit, Fitbit, Garmin). The callback handler
should:

1. Exchange the authorization code for an access token.
2. Call `POST /api/devices/[provider]` (or directly upsert via Prisma) with the
   real access token.
3. Redirect the user back to `/settings/integrations`.

Example skeleton:

```ts
// apps/web/app/api/devices/google_fit/callback/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect("/login");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect("/settings/integrations?error=missing_code");

  // Exchange code for tokens using your OAuth library
  const tokens = await exchangeCodeForTokens(code);

  await prisma.deviceConnection.upsert({
    where: { userId_provider: { userId: session.user.id, provider: "google_fit" } },
    create: { userId: session.user.id, provider: "google_fit", accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: new Date(Date.now() + tokens.expires_in * 1000), isActive: true },
    update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: new Date(Date.now() + tokens.expires_in * 1000), isActive: true },
  });

  return NextResponse.redirect("/settings/integrations?connected=google_fit");
}
```
