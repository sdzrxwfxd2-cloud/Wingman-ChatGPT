// LEGACY (6 Nov 2026): the scheduled job and /api/model-weather now use model_shards.mjs (shard rotation).
// Kept for its tests and as reference; nothing schedules build()/refresh() any more.
// Critical 2 (31 Oct 2026): ONE shared server copy of the Open-Meteo model for every aerodrome.
// Only this job calls Open-Meteo. Pages read the copy through /api/model-weather, so visitor count never changes the call count.
//
// MT's plan: global models update about every 6 h, so the copy is refreshed every 6 HOURS (hourly tick only checks the age,
// and retries a failed run within the hour). Each copy holds 19 hourly steps (13 h forecast + 6 h so the copy still covers
// 13 h ahead when it is 6 h old). "Current" values on the lists are read from the hour that matches now.
// Call budget (free plan, 10,000/day): 641 points x 1.2 (12 variables) = ~770 calls per refresh, 4 refreshes/day = ~3,100/day.
// Paid plan later: set OPEN_METEO_KEY in Netlify env (never in the repo); the host switches to customer-api.open-meteo.com.
import { getStore } from "@netlify/blobs";
import POINTS_JSON from "./model_points.json" with { type: "json" };   // [[ident, lat, lon], ...]

export const VARS = ["temperature_2m", "dew_point_2m", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility",
  "pressure_msl", "cloud_cover", "cloud_cover_low", "cloud_base", "weather_code", "precipitation_probability"];
export const HOURS = 19;
export const REFRESH_MIN = 360;           // 6 h
export const BATCH = 150;                 // locations per request (5 requests for 641 points)
export const CONCURRENCY = 2;
export const TIMEOUT_MS = 9000, RETRIES = 1, RETRY_GAP_MS = 1500, BUDGET_MS = 25000; // inside the 30 s scheduled limit
const UA = { "User-Agent": "Wingman-aerodrome-app/1.0 (shared model copy)" };

export const store = () => { try { return getStore("model-weather"); } catch { return null; } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function batches(points, size = BATCH) { const out = []; for (let i = 0; i < points.length; i += size) out.push(points.slice(i, i + size)); return out; }

export function url(batch, key = process.env.OPEN_METEO_KEY) {
  const host = key ? "https://customer-api.open-meteo.com" : "https://api.open-meteo.com";
  return host + "/v1/forecast?latitude=" + batch.map(p => p[1]).join(",") + "&longitude=" + batch.map(p => p[2]).join(",") +
    "&hourly=" + VARS.join(",") + "&wind_speed_unit=kn&timezone=UTC&forecast_hours=" + HOURS + "&past_hours=1" +
    (key ? "&apikey=" + encodeURIComponent(key) : "");
}

// One batch with per-request timeout and retry. Throws {status,error} on failure. Verifies the returned count.
export async function fetchBatch(batch, { fetchFn = fetch, retries = RETRIES, gap = RETRY_GAP_MS, timeout = TIMEOUT_MS } = {}) {
  let last;
  for (let a = 0; a <= retries; a++) {
    if (a) await sleep(gap);
    try {
      const ac = new AbortController(), tm = setTimeout(() => ac.abort(new Error("timeout " + timeout + " ms")), timeout);
      let r; try { r = await fetchFn(url(batch), { headers: UA, signal: ac.signal }); } finally { clearTimeout(tm); }
      if (r.status === 429) { last = { status: 429, error: (await r.text()).slice(0, 200) }; break; } // limit: retrying only burns calls
      if (!r.ok) { last = { status: r.status, error: "HTTP " + r.status }; continue; }
      const j = [].concat(await r.json());
      if (j.length !== batch.length || j.some(o => !o || !o.hourly || !Array.isArray(o.hourly.time))) { last = { status: 200, error: "count mismatch " + j.length + "/" + batch.length }; continue; }
      return j;
    } catch (e) { last = { status: 0, error: String(e && e.message || e) }; }
  }
  throw last;
}

// Build the whole snapshot. All-or-nothing: returns {ok:false} on any failed batch so the caller keeps the last good copy.
export async function build(points, opts = {}) {
  const t0 = Date.now(), parts = batches(points, opts.batch || BATCH), res = new Array(parts.length);
  let next = 0, fail = null;
  async function worker() {
    while (!fail && next < parts.length) {
      const i = next++;
      if (Date.now() - t0 > (opts.budget || BUDGET_MS)) { fail = { status: 0, error: "time budget" }; return; }
      try { res[i] = await fetchBatch(parts[i], opts); } catch (e) { fail = e || { status: 0, error: "failed" }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(opts.concurrency || CONCURRENCY, parts.length) }, worker));
  if (fail) return { ok: false, ...fail, ms: Date.now() - t0 };
  const flat = res.flat();
  if (flat.length !== points.length) return { ok: false, status: 200, error: "count mismatch total", ms: Date.now() - t0 };
  const time = flat[0].hourly.time, v = Object.fromEntries(VARS.map(k => [k, []]));
  for (const o of flat) for (const k of VARS) v[k].push(o.hourly[k] || null);
  return { ok: true, snap: { updatedAt: new Date().toISOString(), vars: VARS, units: flat[0].hourly_units, pts: points, time,
    el: flat.map(o => o.elevation ?? null), v }, ms: Date.now() - t0 };
}

export async function refresh(s = store(), points = POINTS_JSON, opts = {}) {
  if (!s) return { ok: false, error: "no blobs" };
  const r = await build(points, opts), now = new Date().toISOString();
  const prev = (await s.get("state", { type: "json" }).catch(() => null)) || {};
  if (r.ok) await s.setJSON("snapshot", r.snap);           // only a complete snapshot is ever published
  // Free plan, no key needed. On 429 the wait before the next try doubles (1 h, 2 h, 4 h ... max 12 h); any success resets it.
  const lim = !r.ok && r.status === 429, fails = lim ? (prev.fails || 0) + 1 : 0;
  await s.setJSON("state", { lastTry: now, lastOk: r.ok ? r.snap.updatedAt : prev.lastOk || null, status: r.ok ? 200 : r.status, error: r.ok ? null : r.error, limited: lim, fails });
  console.log(JSON.stringify({ job: "model-weather-refresh", ok: r.ok, status: r.status, error: r.error, ms: r.ms, points: points.length }));
  return r;
}

// Should the hourly tick call Open-Meteo? Copy older than 6 h (minus 10 min slack), or never filled; a failed try waits 55 min.
export function due(state, nowMs = Date.now()) {
  const age = state && state.lastOk ? (nowMs - Date.parse(state.lastOk)) / 60e3 : Infinity;
  const wait = state && state.limited ? backoffMin(state.fails) : 55;
  const failedRecently = state && state.error && state.lastTry && nowMs - Date.parse(state.lastTry) < wait * 60e3;
  return age >= REFRESH_MIN - 10 && !failedRecently;
}

// 429 backoff in minutes: 60, 120, 240, 480, then 720 (12 h) cap.
export function backoffMin(fails = 1) { return Math.min(720, 60 * Math.pow(2, Math.max(0, (fails || 1) - 1))); }
