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

## Roadmap

1. Auth, accounts, categories, transactions, dashboard, monthly analytics
2. CSV/PDF statement import, auto-categorisation, duplicate detection
3. Consent-based bank sync (India Account Aggregator)

See [CLAUDE.md](CLAUDE.md) for project conventions.
