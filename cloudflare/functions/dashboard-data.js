// /dashboard-data (Cloudflare port of netlify/functions/dashboard-data.mjs). Behind the site password (middleware) and checks it
// again itself. Probes, source weather (aviationweather.gov fetched server-side) and uptime history work as on Netlify.
// Proxy health comes from the shared snapshot state. Visitors are not counted on the Cloudflare copy (KV free plan writes).
import { authorised } from "../lib/auth.mjs";
import { KV_KEYS } from "../lib/keys.mjs";
import { readSnap } from "../lib/snap_read.mjs";
const J = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const BB = "bbox=-35.5,16,-22,33.5&format=json";
const UP = { metar: `https://aviationweather.gov/api/data/metar?${BB}&hours=3`, taf: `https://aviationweather.gov/api/data/taf?${BB}` };
const probe = async (url, init = {}) => { const t = Date.now(); try { const r = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(6000) }); await r.body?.cancel(); return { s: r.status, ms: Date.now() - t }; } catch (e) { return { s: 0, ms: Date.now() - t, e: String(e).slice(0, 120) }; } };
async function source(kind) {
  const t = Date.now();
  try {
    const r = await fetch(UP[kind], { headers: { "User-Agent": "GoAround-dashboard/1.0" }, signal: AbortSignal.timeout(7000) });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {}
    const rows = Array.isArray(j) ? j.map((x) => kind === "metar" ? { icaoId: x.icaoId, rawOb: x.rawOb, obsTime: x.obsTime } : { icaoId: x.icaoId, rawTAF: x.rawTAF, issueTime: x.issueTime, validTimeTo: x.validTimeTo }) : [];
    return { s: r.status, ms: Date.now() - t, n: rows.length, rows, e: r.ok ? (rows.length ? null : "empty") : txt.slice(0, 120), cachedSec: 0 };
  } catch (e) { return { s: 0, ms: Date.now() - t, n: 0, rows: [], e: String(e).slice(0, 120), cachedSec: 0 }; }
}
export async function onRequestGet({ request, env }) {
  if (!env.SITE_PASSWORD) return new Response(JSON.stringify({ error: "SITE_PASSWORD not set" }), { status: 503, headers: J });
  if (!(await authorised(request.headers.get("authorization"), env.SITE_PASSWORD))) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: { ...J, "WWW-Authenticate": 'Basic realm="Wingman demo", charset="UTF-8"' } });
  const o = new URL(request.url).origin, now = new Date(), auth = request.headers.get("authorization") || "";
  const [pSite, pMetar, pTaf, pFlights, pMain, upM, upT, snap] = await Promise.all([probe(o + "/"), probe(o + "/api/metar"), probe(o + "/api/taf"),
    probe(o + "/api/flights?icao=FAOR&lat=-26.13&lon=28.24"), probe(o + "/main", { headers: { authorization: auth, "User-Agent": "GoAround-dashboard/1.0" } }), source("metar"), source("taf"), readSnap(env)]);
  const up = pSite.s === 401 || pSite.s === 200;
  const depId = env.CF_PAGES_COMMIT_SHA ? env.CF_PAGES_COMMIT_SHA.slice(0, 12) : (env.DEPLOY_ID || null);
  let hist = [];
  try { hist = (await env.WX.get(KV_KEYS.probes, "json")) || []; hist.push({ t: now.toISOString(), up, ms: pSite.ms, wx: pMetar.s === 200, d: depId }); hist = hist.slice(-600); await env.WX.put(KV_KEYS.probes, JSON.stringify(hist)); } catch {}
  const mine = hist.filter((x) => x.d === depId);
  const uptime = { checks: mine.length, ok: mine.filter((x) => x.up).length, first: mine[0]?.t || null, all: hist.length, allOk: hist.filter((x) => x.up).length, allFirst: hist[0]?.t || null,
    downs: hist.filter((x) => !x.up).slice(-10).map((x) => x.t), wxDowns: hist.filter((x) => x.wx === false).slice(-10).map((x) => x.t) };
  let st = null; try { st = snap && (snap.part("state") != null ? snap.json("state") : snap.full().state); } catch {}
  const h = (x) => x && x.lastTry ? { t: x.lastTry, status: x.status, error: x.error || null, lastOk: x.lastOk || null } : null;
  const hm = h(st && st.metar), ht = h(st && st.taf);
  const errors = [];
  const chk = (n, p, ok) => { if (!ok.includes(p.s)) errors.push({ t: now.toISOString(), what: n, detail: "HTTP " + p.s + (p.e ? " · " + p.e : "") + " in " + p.ms + " ms" }); };
  chk("Site (password gate)", pSite, [200, 401]); chk("METAR function /api/metar", pMetar, [200]); chk("TAF function /api/taf", pTaf, [200]); chk("Flights function", pFlights, [200]); chk("Aerodrome page /main", pMain, [200]);
  if (upM.s !== 200 || upM.e) errors.push({ t: now.toISOString(), what: "Source METAR (aviationweather.gov)", detail: "HTTP " + upM.s + (upM.e ? " · " + upM.e : "") });
  if (upT.s !== 200 || upT.e) errors.push({ t: now.toISOString(), what: "Source TAF (aviationweather.gov)", detail: "HTTP " + upT.s + (upT.e ? " · " + upT.e : "") });
  [["METAR snapshot", hm], ["TAF snapshot", ht]].forEach(([n, x]) => { if (x && x.status !== 200) errors.push({ t: x.t, what: n + " last upstream fetch", detail: "HTTP " + x.status + (x.error ? " · " + String(x.error).slice(0, 120) : "") + (x.lastOk ? " · last good " + x.lastOk : "") }); });
  uptime.downs.forEach((t) => errors.push({ t, what: "Site down at a recorded check", detail: "site probe failed" }));
  return new Response(JSON.stringify({ now: now.toISOString(), deploy: { id: depId, context: env.CF_PAGES_BRANCH ? "cloudflare-pages:" + env.CF_PAGES_BRANCH : "cloudflare-pages" },
    probes: { site: pSite, metar: pMetar, taf: pTaf, flights: pFlights, main: pMain }, up, uptime, source: { metar: upM, taf: upT }, health: { metar: hm, taf: ht },
    visitors: { error: "visitor counting is not on the Cloudflare copy yet (Workers KV free plan: 1,000 writes a day, kept for the weather snapshot)" }, errors,
    notConnected: ["Cloudflare Workers logs (view them in the Cloudflare dashboard; not wired into this page)", "Browser JavaScript errors (no error reporter on the site yet)", "Visitor counting (not ported to Cloudflare yet)"] }), { headers: J });
}
