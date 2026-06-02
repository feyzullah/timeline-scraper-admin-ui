# Scrapper Admin UI

React (Vite + TypeScript) dashboard for **timeline-scraper** admin HTTP (`/admin/v1/*`). Separate repo from the scrapper service; clone [timeline-scraper](https://github.com/feyzullah/timeline-scraper) beside this workspace.

```text
settler/
  timeline-scraper/    # scrapper API (port 4011) — separate git repo
  scrapper-admin-ui/   # this app (port 5174)
  settler/             # settler API
  settler-admin-ui/    # settler dashboard
```

## Quick start

```bash
npm install
npm run bootstrap:env   # writes .env from timeline-scraper/.env (or cp .env.example .env)
npm run dev
```

Open **http://localhost:5174**. Defaults come from `.env` (`VITE_SCRAPPER_*`); **Settings** can override (stored in localStorage).

- **API base URL** — use `/scrapper-api` in dev (same-origin; Vite proxy → scrapper `:4011`)
- **Admin API key** — same as `SCRAPPER_ADMIN_API_KEY` on timeline-scraper

Start timeline-scraper first (`npm start` in `timeline-scraper/`).

## Admin API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/v1/health/detail` | Mongo + WS delivery health |
| GET | `/admin/v1/stats` | Session / request / delivery counts |
| GET | `/admin/v1/sessions` | List sessions (summary) |
| GET | `/admin/v1/sessions/:appId/:matchKey` | Full session document |
| DELETE | `/admin/v1/sessions/:appId/:matchKey` | Stop worker + remove session |
| GET | `/admin/v1/requests` | Active tracked legs (flattened) |
| GET | `/admin/v1/requests/delivery-pending` | Unacked `match_update` queue |
| GET | `/admin/v1/connections` | Settler + gateway WebSockets |
| GET/PATCH/PUT | `/admin/v1/matches/...` | Archived match book |
| GET/POST/DELETE | `/admin/v1/api-keys` | API key CRUD |

See `docs/ADMIN_API.md` and `timeline-scrapper/src/application/adminRoutes.js`.

## Vite dev proxy

`vite.config.ts` proxies `/scrapper-api` → `http://127.0.0.1:4011`. For same-origin dev, set base URL to `http://localhost:5174/scrapper-api`.

## Stack

React 19 · Vite 6 · TypeScript · Tailwind · TanStack Query · React Router 6
