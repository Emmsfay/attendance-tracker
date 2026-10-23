# Attendance Tracker

Track when workers come to work and leave.

- **Clock in / clock out** with time and GPS location.
- **Late** = clock-in after **08:00** (no grace period).
- **Left early** = clock-out before **17:00 (5pm)**.
- **Location** recorded at every punch; checked against an office geofence (on-site vs off-site).
- **Role-based access**: workers see their own shifts; managers see everyone and can correct forgotten clock-outs.
- Built with **SvelteKit** + **Convex** (database, auth, and server functions).

## Stack

- [SvelteKit 5](https://kit.svelte.dev/) (runes)
- [Convex](https://www.convex.dev/) — database, auth, backend functions
- TypeScript

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Convex CLI](https://docs.convex.dev/cli/install): `npm install -g convex`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Initialize a Convex deployment (creates .env.local with PUBLIC_CONVEX_URL)
npx convex init

# 3. Set Convex Auth JWT keys on your deployment (both are required):
#    node scripts/generate-convex-auth-keys.mjs
#    Pipe the private key and JWKS to Convex (see script output), or use the dashboard.
#    Names: JWT_PRIVATE_KEY and JWKS

# 4. (Optional) Configure the office geofence. Edit .env.local (or set on the
#    deployment) — defaults are New York City, 200 m radius:
OFFICE_LATITUDE=40.7128
OFFICE_LONGITUDE=-74.0060
OFFICE_RADIUS_METERS=200

# 5. Start the Convex backend (in one terminal)
npx convex dev

# 6. Start the app (in another terminal)
npm run dev -- --open
```

## First-time bootstrap

The very first manager account must be bootstrapped:

```bash
npx convex run workers:createFirstManager \
  '{"email":"manager@company.com","password":"Manager123!","name":"Office Manager"}'
```

After that, sign in as the manager and use **Admin → Create worker** to add more workers.

## How it works

- `convex/schema.ts` — database tables (`workers`, `attendance`) plus Convex Auth tables.
- `convex/auth.ts` — email/password auth (Convex Auth `Password` provider).
- `convex/workers.ts` — create worker accounts (manager only), read profiles.
- `convex/attendance.ts` — clock in/out, manager corrections, attendance queries.
- `convex/utils.ts` — late/early rules (08:00 / 17:00), GPS geofence (haversine).
- `src/lib/convex/` — Convex client and auth helpers for the frontend.
- `src/routes/` — login, dashboard (worker clock in/out), attendance history, admin.

## Business rules (locked in)

| Rule | Threshold |
|------|-----------|
| Late arrival | clock-in after 08:00:00 |
| Left early   | clock-out before 17:00:00 |
| Grace period | none |
| Shifts per day | one clock-in + one clock-out |
| Work day | resets at midnight |

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run check` — TypeScript typecheck
- `npx convex dev` — run Convex backend locally
