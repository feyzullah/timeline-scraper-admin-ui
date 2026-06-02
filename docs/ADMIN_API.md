# Timeline scrapper admin HTTP

Base path: `/admin/v1`

**Auth:** `Authorization: Bearer <key>` or `X-Scrapper-Admin-Key: <key>`

Bootstrap key: `SCRAPPER_ADMIN_API_KEY` env. Additional keys: Mongo `api_keys` collection.

Implementation: `timeline-scraper` repo — `src/application/adminRoutes.js`.

## Fixtures (operator editing)

`GET /admin/v1/fixtures?appId=&team=&dataStatus=&source=session|archived|all&limit=`

`dataStatus` values: `no_data`, `pre_kickoff`, `missing_ht`, `missing_ft`, `missing_goal_timeline`, `missing_statistics`, `ready`, `live_partial`.

`PATCH /admin/v1/sessions/:appId/:matchKey` — body `{ "source": "admin:…", "patch": { "facts": { goals, score, events, statistics, fixtureStatusShort } } }` merges into `lastMergedSnapshot`, bumps cursor, notifies settler delivery.

`PATCH /admin/v1/matches/:appId/:matchKey` — same `facts` shape for archived matches.
