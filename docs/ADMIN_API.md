# Timeline scrapper admin HTTP

Base path: `/admin/v1`

**Auth:** `Authorization: Bearer <key>` or `X-Scrapper-Admin-Key: <key>`

| Key type | Source | Admin REST | Admin UI | Settler WS |
|----------|--------|------------|----------|------------|
| Admin | `SCRAPPER_ADMIN_API_KEY` env (or `api_keys` with `role: admin`) | yes | yes | yes |
| Operator | Mongo `api_keys` with `role: operator` | no (403) | no (403) | yes |

Implementation: `timeline-scraper` — `src/middleware/apiKeyAuth.js`, `src/application/adminRoutes.js`.

## Operator keys (admin-managed)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/v1/operator-keys` | List settler keys (preview only) |
| POST | `/admin/v1/operator-keys` | Create `{ "label": "…" }` — returns full `key` once |
| DELETE | `/admin/v1/operator-keys/:id` | Revoke |

Legacy alias: `/admin/v1/api-keys` (same handlers).

## Auth probe

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/v1/auth/me` | Admin sign-in check — `{ ok, role, label, source }` |

## Fixtures (operator editing)

`GET /admin/v1/fixtures?appId=&team=&dataStatus=&source=session|archived|all&limit=`

`PATCH /admin/v1/sessions/:appId/:matchKey` — body `{ "source": "admin:…", "patch": { "facts": { … } } }`

`PATCH /admin/v1/matches/:appId/:matchKey` — same `facts` shape for archived matches.
