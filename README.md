# Expense Tracker

A responsive, PWA-first expense tracker for Indian users. Track accounts, categories, and transactions, with a dashboard and monthly analytics.

## Stack

- **Client** (`/client`): React, Vite, TypeScript, MUI, React Router, Axios, Recharts
- **Server** (`/server`): Node.js, Express, TypeScript, Mongoose, Zod
- **Database:** MongoDB Atlas
- **Auth:** JWT in HTTP-only cookies

## Getting started

Requires Node.js 20+ and a MongoDB Atlas cluster.

```bash
npm run install:all                     # install root, server and client dependencies
cp server/.env.example server/.env      # then fill in MONGODB_URI and JWT_SECRET
npm run dev                             # API on :5000, web app on http://localhost:5173
```

Run one side only with `npm run dev:server` or `npm run dev:client`.

## Install as an app (PWA)

Production builds include a web manifest and a service worker, so the app can be installed from the browser (Chrome: install icon in the address bar; Android: "Add to Home screen"; iPhone Safari: Share → "Add to Home Screen"). The service worker caches only the app shell, never `/api` responses. When a new version is deployed, the app shows a "Reload" prompt.

To try it locally (the service worker is off in `npm run dev`):

```bash
npm run build --prefix client
npm run preview --prefix client   # http://localhost:4173, with the API still on :5000
```

## Tests

```bash
npm test             # server API tests (in-memory MongoDB) + client unit tests
npm run typecheck    # strict TypeScript across server, tests and client
```

The first server test run downloads a MongoDB binary for `mongodb-memory-server`; later runs use the cache.

## Roadmap

1. Auth, accounts, categories, transactions, dashboard, monthly analytics
2. CSV/PDF statement import, auto-categorisation, duplicate detection
3. Consent-based bank sync (India Account Aggregator)

See [CLAUDE.md](CLAUDE.md) for project conventions.
