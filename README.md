# Go Around: Cloudflare Pages copy

An exact copy of the Go Around site that is live on Netlify, hosted on Cloudflare Pages at https://go-around-aero.pages.dev.

## Source
- `site/` holds the live Netlify static files: Netlify site 747c809b-5c19-4c61-819f-f58b0abec9f1, deploy `6aee0301b3f4b72aedb66367`, built from Wingmam main `bc2a532f` (#354). All 4,384 deployed files match the deploy's SHA1 list. Files are unedited, including gate/auth/wm-pin.js/wm-core.js. The only file left out is `site/c/ato/.build-manifest.json`, a dotfile Netlify does not publish.
- `cloudflare/` and `netlify/lib/` are copied from Wingmam branch `feat/cloudflare-pages` at `6b9ca39bc`. They provide the Pages Functions (password middleware, /api/metar, /api/taf, /api/model-weather, flights, ato-reviews, ops, and stubs) and the cron weather Worker `go-around-weather` (KV `go-around-wx`).

## Deploy
```
cd cloudflare && npm ci && npx wrangler pages deploy --project-name go-around-aero --branch main
```
Wrangler reads `pages_build_output_dir = "../site"`. Auth uses `CLOUDFLARE_API_TOKEN` from the environment. Never commit a token or the password, which is the `SITE_PASSWORD` Pages secret.

Edits go in Wingmam first, then get copied here. Don't edit `site/` by hand.
