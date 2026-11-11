// Print ONE Netlify env var value to stdout, for piping straight into `wrangler ... secret put` (never echo it to a terminal).
// Usage: NETLIFY_TOKEN_FILE=~/.netlify_token_mt node scripts/netlify-env.mjs SITE_PASSWORD | npx wrangler pages secret put SITE_PASSWORD ...
// The token is read from a file outside the repo; nothing is logged.
import fs from "node:fs";
const SITE = process.env.NETLIFY_SITE_ID || "747c809b-5c19-4c61-819f-f58b0abec9f1", key = process.argv[2];
const tokFile = (process.env.NETLIFY_TOKEN_FILE || "").replace(/^~/, process.env.HOME || "");
if (!key || !tokFile) { console.error("usage: NETLIFY_TOKEN_FILE=... node netlify-env.mjs KEY"); process.exit(2); }
if (process.stdout.isTTY) { console.error("refusing to print a secret to a terminal; pipe it into wrangler"); process.exit(2); }
const token = fs.readFileSync(tokFile, "utf8").trim(), h = { Authorization: "Bearer " + token };
const site = await (await fetch(`https://api.netlify.com/api/v1/sites/${SITE}`, { headers: h })).json();
const env = await (await fetch(`https://api.netlify.com/api/v1/accounts/${site.account_id}/env/${key}?site_id=${SITE}`, { headers: h })).json();
const v = (env.values || []).find((x) => x.context === "production") || (env.values || []).find((x) => x.context === "all");
if (!v || !v.value) { console.error(key + " not readable from Netlify (secret or missing): add it by hand"); process.exit(1); }
process.stdout.write(v.value);
