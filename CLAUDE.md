# CLAUDE.md

Guidance for all work on this project. Read this before making changes.

## Project

Expense tracker web app (MVP), built as a real product — not a demo. Favour correctness, security, and maintainability over shortcuts.

## Stack

- **Monorepo:** `/client` and `/server` in one Git repo
- **Frontend:** React + Vite + TypeScript, MUI (theme + `sx` props, minimal custom CSS), React Router, Axios, Recharts
- **Backend:** Node.js + Express + TypeScript, run with `tsx` in dev
- **Database:** MongoDB Atlas + Mongoose
- **Validation:** Zod on the server
- **Auth:** JWT stored in secure, HTTP-only cookies
- **Mobile:** responsive web / PWA first

## Rules

### TypeScript
- Strict mode everywhere (`"strict": true` in every `tsconfig.json`).
- No `any`. Use `unknown` and narrow, or define proper types.

### Money
- Store all money as **integers in paise** (₹250.50 = `25050`). Never store floats or rupee values.
- Convert to rupees only in the UI.
- Format with `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

### Dates
- Store dates in **UTC**.
- All monthly analytics and aggregations must use timezone **`Asia/Kolkata`** (e.g. pass `timezone: "Asia/Kolkata"` to Mongo `$dateToString` / `$month` / `$year`, and compute month boundaries in IST).

### Data ownership
- Every user-owned document has a `userId`.
- Every query is scoped by `userId` — reads, updates, deletes, and aggregations. Never fetch or modify a document by `_id` alone.

### Dev networking
- The Vite dev server proxies `/api` to `http://localhost:5000` so cookies work on one origin.
- Axios uses `withCredentials: true`.

### Secrets
- Never commit secrets. Use `.env` files (git-ignored).
- Keep `.env.example` updated whenever an env var is added, renamed, or removed.

### Folder layout

Server (`/server/src`):
```
config/        env loading, DB connection
models/        Mongoose schemas
controllers/   request handlers
routes/        Express routers
middleware/    auth, validation, error handling
services/      business logic
index.ts       app entry point
```

Client (`/client/src`):
```
components/    reusable UI components
pages/         route-level views
context/       React context providers (e.g. auth)
services/      Axios API clients
types/         shared TypeScript types
```

### API errors
All error responses use one shape:
```json
{ "error": { "message": "Human-readable message", "details": {} } }
```
`details` is optional (e.g. Zod validation issues).

### Workflow
- Keep changes small and focused — one task at a time.
- After each task, explain **what changed** and **how to test it**.

## Roadmap

- **Phase 1:** auth, accounts, categories, transactions, dashboard, monthly analytics
- **Phase 2:** CSV/PDF statement import, auto-categorisation, duplicate detection
- **Phase 3 (later):** consent-based bank sync (India Account Aggregator)
