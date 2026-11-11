// Model weather, shard rotation (MT 6 Nov 2026; plan from ChatGPT's weather review, free-plan stopgap).
//
// Why: the old job asked Open-Meteo for 640 points x 12 variables in one 25-second burst (~768 weighted calls) against a
// free limit of 600 a minute from a shared Netlify IP, so it kept getting 429, threw the whole refresh away and backed off
// up to 12 h. The copy went stale on 3 Nov.
//
// Now:
//  - 640 points in 10 fixed shards of 64. A scheduled tick every 10 min fetches ONE shard (64 locations x 10 variables
//    = ~64 weighted calls per tick, ~9,216 a day, under 600/min and 10,000/day). See TICK_MIN below (gap fix).
//  - Each shard is stored under its own Netlify Blobs key (shard-00 ... shard-09) with its own fetchedAt. A failed fetch
//    never touches the stored shard, so the previous good data stays (and keeps its true, older fetchedAt).
//  - The tick picks the shard whose data is oldest (missing first), so a shard that failed is retried next and a full
//    rotation takes 10 ticks = 100 min (was 150). The read side still checks every point's own fetch time
//    and nothing pretends to be fresher than it is (stale guard #337 unchanged).
//  - 429: stop, keep the old shard, cool down 15 -> 30 -> 60 -> 120 min (Retry-After honoured, capped at 120 min);
//    a daily-limit 429 waits until 00:15 UTC. Any success resets it.
//  - No API key, no secrets. Paid plan later: OPEN_METEO_KEY in Netlify env only switches the host (customer-api).
import { getStore } from "@netlify/blobs";
import POINTS_JSON from "./model_points.json" with { type: "json" };   // [[ident, lat, lon], ...]

// 10 variables = weight 1.0 per location. Dropped vs the old job: weather_code (unused) and precipitation_probability
// (only the aerodrome-page rain % used it; those hourly requests now get no shared answer and go their existing way).
export const VARS = ["temperature_2m", "dew_point_2m", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility",
  "pressure_msl", "cloud_cover", "cloud_cover_low", "cloud_base"];
export const SHARD_SIZE = 64, TICK_MIN = 10, HOURS = 19, PAST = 1;
// Gap fix (MT 6 Nov 2026, feat/model-weather-no-gap): the old 15-min tick gave a 150-min rotation, so every point was
// older than the 90-min freshness line for ~60 min of each 150 (no model status). Now:
//  - free plan: 1 shard per 10-min tick -> 100-min rotation, 64 x 144 = 9,216 weighted calls/day (cap 10,000),
//    max 285,696 in a 31-day month (cap 300,000), 384/h (cap 5,000), 64/min (cap 600). Gap ~10 min per 100.
//    A full 640-point rotation inside 90 min needs >= 640 x 16 = 10,240 calls/day, which is over the free daily cap,
//    so the free plan cannot close the gap completely without fewer points or a longer freshness window (MT's call).
//  - paid key (OPEN_METEO_KEY in Netlify env): 2 shards per tick -> 50-min rotation, every point always <= 90 min.
export const shardsPerTick = (key = process.env.OPEN_METEO_KEY) => (key ? 2 : 1);
export const FRESH_MIN = 90, DEGRADED_MIN = 180;   // per-point data state on the read side; older than 180 min is not served
export const TIMEOUT_MS = 20000;
export const KEY_STATE = "shard-state";
const UA = { "User-Agent": "Wingman-aerodrome-app/1.0 (shared model copy, shard rotation)" };

export const store = () => { try { return getStore("model-weather"); } catch { return null; } };
export const shardKey = i => "shard-" + String(i).padStart(2, "0");
export const shardCount = (points = POINTS_JSON) => Math.ceil(points.length / SHARD_SIZE);
export const shardPoints = (i, points = POINTS_JSON) => points.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE);
export const weight = (locations, vars = VARS.length) => locations * Math.max(1, vars / 10);

export function url(batch, key = process.env.OPEN_METEO_KEY) {
  const host = key ? "https://customer-api.open-meteo.com" : "https://api.open-meteo.com";
  return host + "/v1/forecast?latitude=" + batch.map(p => p[1]).join(",") + "&longitude=" + batch.map(p => p[2]).join(",") +
    "&hourly=" + VARS.join(",") + "&wind_speed_unit=kn&timezone=UTC&forecast_hours=" + HOURS + "&past_hours=" + PAST +
    (key ? "&apikey=" + encodeURIComponent(key) : "");
}

/* ---- 429 handling ---- */
export function retryAfterMin(h, now = Date.now()) {
  const raw = h && typeof h.get === "function" ? h.get("Retry-After") : null; if (!raw) return null;
  if (/^\d+$/.test(raw.trim())) return Math.ceil(+raw.trim() / 60);
  const d = Date.parse(raw); return Number.isFinite(d) ? Math.max(1, Math.ceil((d - now) / 60e3)) : null;
}
export function classify429(body = "") {
  const b = String(body).toLowerCase();
  if (/minut/.test(b)) return "minute"; if (/hour/.test(b)) return "hour"; if (/daily|day/.test(b)) return "day"; return "unknown";
}
// Cool-down in minutes after the n-th 429 in a row: 15, 30, 60, then 120 max (the old job went up to 720).
export function cooldownMin(fails = 1, kind = "unknown", retryAfter = null, now = Date.now()) {
  if (kind === "day") { const d = new Date(now); return Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 15) - now) / 60e3); }
  const ladder = Math.min(120, 15 * Math.pow(2, Math.max(0, (fails || 1) - 1)));
  return retryAfter ? Math.min(120, Math.max(ladder, retryAfter)) : ladder;
}

/* ---- which shard next: missing first, then the oldest fetch ---- */
export function pickShard(shardState = {}, n = shardCount()) {
  let best = 0, bestT = Infinity;
  for (let i = 0; i < n; i++) { const s = shardState[i]; const t = s && s.lastOk ? Date.parse(s.lastOk) : -Infinity;
    if (t < bestT) { bestT = t; best = i; } }
  return best;
}

/* ---- fetch one shard ---- */
export async function fetchShard(points, { fetchFn = fetch, timeout = TIMEOUT_MS, now = () => Date.now() } = {}) {
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(new Error("timeout " + timeout + " ms")), timeout);
  let r; try { r = await fetchFn(url(points), { headers: UA, signal: ac.signal }); }
  catch (e) { return { ok: false, status: 0, error: String(e && e.message || e) }; } finally { clearTimeout(tm); }
  if (r.status === 429) { const body = (await r.text().catch(() => "")).slice(0, 200);
    return { ok: false, status: 429, error: body, kind: classify429(body), retryAfter: retryAfterMin(r.headers, now()) }; }
  if (!r.ok) return { ok: false, status: r.status, error: "HTTP " + r.status };
  let j; try { j = [].concat(await r.json()); } catch { return { ok: false, status: 200, error: "bad json" }; }
  if (j.length !== points.length) return { ok: false, status: 200, error: "count mismatch " + j.length + "/" + points.length };
  for (const o of j) if (!o || !o.hourly || !Array.isArray(o.hourly.time) || !o.hourly.time.length) return { ok: false, status: 200, error: "missing hourly" };
  const fetchedAt = new Date(now()).toISOString();
  return { ok: true, shard: { fetchedAt, gen: null /* model run time not given by the API: unknown, never the fetch time */,
    vars: VARS, units: j[0].hourly_units || {}, rows: points.map((p, k) => ({ id: p[0], lat: p[1], lon: p[2], el: j[k].elevation ?? null,
      time: j[k].hourly.time, v: Object.fromEntries(VARS.map(x => [x, j[k].hourly[x] || null])) })) } };
}

/* ---- one scheduled tick ---- */
export async function tick(s = store(), points = POINTS_JSON, opts = {}) {
  if (!s) return { ran: false, why: "no blobs" };
  const now = (opts.now || Date.now)(), iso = new Date(now).toISOString();
  const st = (await s.get(KEY_STATE, { type: "json" }).catch(() => null)) || { shards: {} };
  st.shards = st.shards || {};
  if (st.cooldownUntil && now < Date.parse(st.cooldownUntil)) {
    console.log(JSON.stringify({ job: "model-shard", skip: "cooldown", until: st.cooldownUntil })); return { ran: false, why: "cooldown" };
  }
  const n = shardCount(points), per = Math.min(n, opts.perTick || shardsPerTick()), done = [], t0 = Date.now();
  for (let k = 0; k < per; k++) {
    if (k && Date.now() - t0 > 10000) break;                       // stay well inside the 30 s scheduled-function limit
    const r = await tickOne(s, st, points, n, now, iso, opts, done.map(d => d.shard));
    done.push(r); if (!r.ok) break;                                // stop the tick on any failure (429 or other)
  }
  await s.setJSON(KEY_STATE, st);
  const last = done[done.length - 1];
  return { ...last, shards: done.map(d => d.shard), calls: done.reduce((a, d) => a + d.weight, 0) };
}

async function tickOne(s, st, points, n, now, iso, opts, skip) {
  const avail = {}; for (let j = 0; j < n; j++) avail[j] = skip.includes(j) ? { lastOk: new Date(8.64e15).toISOString() } : st.shards[j];
  const i = pickShard(avail, n), pts = shardPoints(i, points);
  const r = await fetchShard(pts, { ...opts, now: () => now });
  const sh = st.shards[i] || {};
  sh.lastTry = iso; sh.status = r.ok ? 200 : r.status; sh.error = r.ok ? null : r.error;
  if (r.ok) {
    await s.setJSON(shardKey(i), { shard: i, ...r.shard });       // atomic per-shard replace; no shared read-modify-write of data
    sh.lastOk = r.shard.fetchedAt; sh.points = pts.length;
    st.fails = 0; st.limited = false; st.cooldownUntil = null; st.lastOk = r.shard.fetchedAt;
  } else if (r.status === 429) {
    st.fails = (st.fails || 0) + 1; st.limited = true; st.kind = r.kind;
    st.cooldownUntil = new Date(now + cooldownMin(st.fails, r.kind, r.retryAfter, now) * 60e3).toISOString();
  }                                                                // other errors: no cool-down, the oldest shard is retried next tick
  st.shards[i] = sh; st.lastTry = iso; st.status = sh.status; st.error = sh.error; st.n = n; st.size = SHARD_SIZE;
  console.log(JSON.stringify({ job: "model-shard", shard: i, ok: r.ok, status: r.status, error: r.ok ? undefined : r.error, points: pts.length, weight: weight(pts.length) }));
  return { ran: true, ok: r.ok, status: r.status, error: r.error, shard: i, weight: weight(pts.length), fetchedAt: r.ok ? r.shard.fetchedAt : null };
}

/* ---- read side: compose shards, check every point's freshness ---- */
export function stateOf(fetchedMs, now) {
  if (!Number.isFinite(fetchedMs) || fetchedMs > now + 60e3) return "missing";
  const age = (now - fetchedMs) / 60e3;
  return age <= FRESH_MIN ? "fresh" : age <= DEGRADED_MIN ? "degraded" : "stale";
}
// Returns the copy in the shape site/wm-model.js already reads (pts, time, v[var][point][hour], el), plus per point:
// ft = fetch time, fs = data state, gen = model run time (null = unknown). Stale and missing points are left out,
// so they can never be read as current. One time axis covering all served shards; hours a shard lacks are null.
export function compose(shards, now = Date.now(), points = POINTS_JSON) {
  const served = [], summary = { fresh: 0, degraded: 0, stale: 0, missing: 0 }, seen = new Set(), meta = [];
  for (let i = 0; i < shardCount(points); i++) {
    const sh = shards[i], f = sh ? Date.parse(sh.fetchedAt) : NaN, state = stateOf(f, now), want = shardPoints(i, points);
    const ok = sh && Array.isArray(sh.rows) && sh.rows.length === want.length && sh.rows.every((r, k) => r.id === want[k][0]);
    const st = ok ? state : "missing";
    meta.push({ shard: i, fetchedAt: sh ? sh.fetchedAt : null, state: st, points: want.length });
    summary[st] += want.length;
    if (st === "fresh" || st === "degraded") for (const r of sh.rows) if (!seen.has(r.id)) { seen.add(r.id); served.push({ r, ft: sh.fetchedAt, fs: st, gen: sh.gen || null, units: sh.units }); }
  }
  if (!served.length) return { snap: null, summary, shards: meta };
  const hours = new Set(); for (const x of served) for (const t of x.r.time) if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) hours.add(t);
  const time = [...hours].sort(), at = Object.fromEntries(time.map((t, k) => [t, k]));
  const v = Object.fromEntries(VARS.map(k => [k, []]));
  for (const x of served) for (const k of VARS) { const row = new Array(time.length).fill(null), src = x.r.v[k] || [];
    x.r.time.forEach((t, h) => { if (t in at) row[at[t]] = src[h] ?? null; }); v[k].push(row); }
  const fts = served.map(x => Date.parse(x.ft));
  return { summary, shards: meta, snap: {
    updatedAt: new Date(Math.min(...fts)).toISOString(),   // oldest served point: never claims more freshness than the worst
    newestAt: new Date(Math.max(...fts)).toISOString(), composedAt: new Date(now).toISOString(),
    vars: VARS, units: served[0].units, pts: served.map(x => [x.r.id, x.r.lat, x.r.lon]), time,
    el: served.map(x => x.r.el), v, ft: served.map(x => x.ft), fs: served.map(x => x.fs), gen: served.map(x => x.gen),
    policy: { freshMin: FRESH_MIN, servedMaxMin: DEGRADED_MIN, shardSize: SHARD_SIZE, tickMin: TICK_MIN } } };
}
export async function readShards(s, points = POINTS_JSON) {
  return Promise.all(Array.from({ length: shardCount(points) }, (_, i) => s.get(shardKey(i), { type: "json" }).catch(() => null)));
}
