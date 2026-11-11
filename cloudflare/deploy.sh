#!/usr/bin/env bash
# Deploy the Cloudflare Pages copy of Go Around (preview; Netlify stays the live site, DNS untouched).
# Needs Wrangler auth once on this machine: `npx wrangler login` (browser) or CLOUDFLARE_API_TOKEN in the environment
# (Pages Edit + Workers Scripts Edit + Workers KV Storage Edit). Never commit a token.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT="${PROJECT:-go-around-aero}"
npm ci --silent
(cd .. && npm test >/dev/null && echo "npm test: ok")
npx wrangler whoami >/dev/null
# 1. companion Worker (cron every 10 min, KV go-around-wx). Idempotent.
(cd worker && npx wrangler deploy)
# 2. Pages project, once
(npx wrangler pages project list 2>/dev/null | grep -q " $PROJECT " || npx wrangler pages project create "$PROJECT" --production-branch main)
# 3. SITE_PASSWORD copied from the Netlify env without printing it (skip if already set)
if ! (npx wrangler pages secret list --project-name "$PROJECT" 2>/dev/null | grep -q SITE_PASSWORD); then
  NETLIFY_TOKEN_FILE="${NETLIFY_TOKEN_FILE:-$HOME/.netlify_token_mt}" node scripts/netlify-env.mjs SITE_PASSWORD | npx wrangler pages secret put SITE_PASSWORD --project-name "$PROJECT"
fi
# 4. site + Pages Functions
npx wrangler pages deploy --project-name "$PROJECT" --branch main --commit-dirty=true
echo "Done: https://$PROJECT.pages.dev"
