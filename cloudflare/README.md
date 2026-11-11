# Go Around on Cloudflare Pages (preview copy)

Branch `feat/cloudflare-pages`. **Netlify stays the live site**; DNS is untouched. This folder hosts the same `site/` on
Cloudflare's **free** plan so visitors cost nothing.

| Netlify (live) | Cloudflare copy (this folder) |
| --- | --- |
| `netlify/edge-functions/gate.ts` (site password, untouched) | `functions/_middleware.js` + `lib/auth.mjs`: same Basic Auth, same realm, same open paths (`/api/*`, icons, manifest, `/admin*`), constant-time compare |
| Netlify Blobs | Workers KV namespace `go-around-wx` (binding `WX`) |
| `weather-snapshot-tick.mjs` (scheduled, every 10 min) | Companion Worker `go-around-weather` (`worker/`), Cron Trigger `*/10 * * * *`, runs the **same** `tick()` from `netlify/lib/wx_snapshot.mjs` |
| `/api/weather-snapshot` | `functions/api/weather-snapshot.js` (streams KV, ETag/304, never calls upstream) |
| `/api/model-weather` | `functions/api/model-weather.js` |
| `/api/metar`, `/api/taf` (live proxy) | `functions/api/metar.js`, `taf.js`: served from the snapshot (one live server-side fetch only if the snapshot is empty, no writes) |
| `/api/flights` | `functions/api/flights.js` (same `flights_core.mjs`) |
| `/api/ato-reviews` | `functions/api/ato-reviews.js` (KV prefix `atoreviews/`; writes still refused until a real login exists) |
| `/dashboard-data` | `functions/dashboard-data.js` (probes, source weather, uptime; visitors not counted on Cloudflare) |
| `/api/visit-beacon` | first-party beacon (`site/wm-beacon.js`) writes to D1 (`VISITORS`) when bound, else dedicated KV `VISITORS_KV` (not weather `WX`). 90-day retention. |
| `/admin`, `/api/admin/*`, `/visitor-log-data` | private traffic dashboard; guarded by `ADMIN_DASH_SECRET` session cookie, not the old site password |

## Weather schedule (unchanged)
METAR every 20 min, TAF every 40 min (persisted due times, a 10-min tick), Open-Meteo model target 80 min per point inside the
free budget (9,500 weighted calls/day, one request of ≤ 100 locations per tick, ≤ 110/min vs 600/min), 429 cool-down ladder,
90-min fresh guard / 180-min serve limit, last-good data kept. `OPEN_METEO_KEY` (paid plan later) is a Worker secret:
`cd worker && npx wrangler secret put OPEN_METEO_KEY`. Never in the repo.

## Free-plan budget
* **KV writes** (limit 1,000/day): the Worker buffers every write of a tick and saves ONE `wx/work` value + ONE `wx/snapshot`
  value → ≤ 288/day. Dashboard loads add 1 each (uptime history). Reviews: 0 until logins exist.
* **CPU** (limit 10 ms per cron run / per request): the model rows are stored pre-serialised (`lib/fast_compose.mjs`) so a
  tick splits and joins strings instead of parsing ~1 MB of JSON (~30 ms → ~7 ms measured in Node). The snapshot it writes
  parses to exactly what `compose()` returns (tests/cloudflare). Pages Functions stream or slice KV text, never parse 1 MB.
* **Requests** (Workers + Pages Functions share 100,000/day): the password middleware runs on every page and asset
  request, about 30-60 per first page view. Roughly 1,500-3,000 page views a day fit.
* **KV reads** (100,000/day): one per API call; the browser loads `/api/weather-snapshot` once per page.
* Static files (`site/`, 4,387 files, largest < 25 MiB) are free and unlimited on Pages.

## Deploy
```bash
cd cloudflare && npx wrangler login     # once, in a browser on this machine (or CLOUDFLARE_API_TOKEN)
bash deploy.sh                           # worker + Pages project go-around-aero + SITE_PASSWORD (copied from Netlify, never printed) + site
```
Local: `npx wrangler pages dev` here and `cd worker && npx wrangler dev --test-scheduled` (shared `--persist-to` dir), with
`SITE_PASSWORD=...` in `cloudflare/.dev.vars` (git-ignored).
