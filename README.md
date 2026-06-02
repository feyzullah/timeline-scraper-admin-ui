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

Open **http://localhost:5174/sports-data-admin/** and sign in with **`SCRAPPER_ADMIN_API_KEY`** (from `timeline-scraper/.env`). Operator/settler keys cannot sign in.

- **Admin UI** — bootstrap admin key only
- **Operator keys** — Mongo `api_keys` — settler WebSocket; create/revoke under **Operator keys** in the UI

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

`vite.config.ts` proxies `{VITE_APP_BASE_PATH}/api` → `http://127.0.0.1:4011`.

## Base path

Set **`VITE_APP_BASE_PATH`** (no trailing slash) at build time — default **`/sports-data-admin`**. This configures:

| Layer | Setting |
|-------|---------|
| Vite build | `base` → assets under `/sports-data-admin/` |
| React Router | `basename` |
| API default | `/sports-data-admin/api` (+ scrapper path, e.g. `/admin/v1/stats`) |
| Node server (prod) | `APP_BASE_PATH` env — must match the build value |

Docker / CI: `VITE_APP_BASE_PATH` and `APP_BASE_PATH` build args. k8s: `APP_BASE_PATH` in `k8s/deployment.yaml`.

## Stack

React 19 · Vite 6 · TypeScript · Tailwind · TanStack Query · React Router 6

## Docker (local)

```bash
docker build -t scrapper-admin-ui \
  --build-arg VITE_APP_BASE_PATH=/sports-data-admin \
  --build-arg APP_BASE_PATH=/sports-data-admin .
docker run --rm -p 8080:80 \
  -e APP_BASE_PATH=/sports-data-admin \
  -e SCRAPPER_UPSTREAM=http://host.docker.internal:4011 \
  -e ADMIN_UI_API_KEY=your-ui-key \
  -e SCRAPPER_ADMIN_API_KEY=your-scraper-key \
  scrapper-admin-ui
```

Open http://localhost:8080/sports-data-admin/

## Kubernetes (k3s, same cluster as timeline-scraper)

Deploys into namespace **`timeline-scraper`** next to the scrapper API.

| Source | What |
|--------|------|
| Secret `timeline-scraper-admin-ui-env` | `SCRAPPER_UPSTREAM` only (see `k8s/timeline-scraper-admin-ui-env.example`) |
| `k8s/service.yaml` | ClusterIP port 80 |
| `k8s/ingress.example.yaml` | Optional external host |

```bash
# One-time: apply deployment + service (image tag updated by CI via kubectl set image)
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml -n timeline-scraper
```

**GitHub Actions:** push `main` → `docker build/push` (`sha-$GITHUB_SHA` + `latest`) → `kubectl set image deployment/timeline-scraper-admin-ui …`. Uses the same `k3s` environment secrets as timeline-scraper (`REGISTRY_*`, `KUBE_CONFIG`).

**Auth:** Browser sends `SCRAPPER_ADMIN_API_KEY` as Bearer on every `/api/*` call; timeline-scraper validates admin role. Operator keys are rejected (403) on admin REST and cannot open the UI.
