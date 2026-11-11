// Shared weather snapshot (MT t2349-t2351, 7 Nov 2026). ONE server-side copy of METAR, TAF and Open-Meteo model weather.
//
// Why: the old Wingman archive (wingman-v1-archive, 29 Oct) let every visitor's browser call Open-Meteo directly, and the
// refresh button cache-busted /api/metar past the CDN. That only worked because each phone had its own Open-Meteo quota.
// Since 31 Oct a server copy existed, but browsers still went direct for the freezing level, for anything the copy could not
// answer, and on every refresh. Now nothing in a browser calls aviationweather.gov or Open-Meteo for aerodrome weather:
//
//  - One scheduled tick every 10 min (netlify/functions/weather-snapshot-tick.mjs). Each source has a PERSISTED due time
//    (no */40 cron): METAR every 20 min, TAF every 40 min, Open-Meteo model target 80 min per point.
//  - Model: 10 variables + freezing_level_height (11 vars = weight 1.1 per location on Open-Meteo's counter).
//    Free plan: a daily budget (DAILY_CAP, under the 10,000/day limit) paced evenly over the UTC day, ONE request of at most
//    100 locations per tick (<= 110 weighted calls a minute, limit 600). 640 points every 80 min would need 640 x 1.1 x 18
//    = 12,672 a day, which is over the free limit, so points are picked by priority:
//      1. "urgent": any point about to fall out of the 180-min serve window,
//      2. core set (the 63 AIP aerodromes the app treats as core), target 80 min,
//      3. aerodromes with no recent METAR (the model IS their current weather), target 80 min, oldest first,
//      4. aerodromes with a METAR (they only need the freezing level), target 160 min.
//    Paid key (OPEN_METEO_KEY, Netlify env only, never in the repo): customer-api host, bigger budget, up to 3 requests per tick,
//    so every point is refreshed every 80 min.
//  - Last-good data per source stays in Netlify Blobs (store "wx-snapshot"). A failed fetch never replaces good data, and
//    every item keeps its TRUE time (METAR obsTime, TAF issueTime, model per-point fetch time "ft").
//  - After each tick the composed snapshot is written to one blob and served by /api/weather-snapshot (CDN cached).
//  - 429 from Open-Meteo: stop, keep the old data, cool down 15 -> 30 -> 60 -> 120 min (Retry-After honoured);
//    a daily-limit 429 waits until 00:15 UTC. Same ladder as model_shards.mjs.
import { getStore } from "@netlify/blobs";
import POINTS_JSON from "./model_points.json" with { type: "json" };   // [[ident, lat, lon], ...] 640 aerodromes
import CORE_JSON from "./wx_core.json" with { type: "json" };          // core set: [[ident, lat, lon]] the 65 AIP aerodromes of site/wst/wst-data.js
import { latestPerStation } from "./wx_latest.mjs";
import { classify429, retryAfterMin, cooldownMin, store as shardStore, readShards } from "./model_shards.mjs";

export const TICK_MIN = 10;
export const EVERY_MIN = { metar: 20, taf: 40, model: 80 };
export const SLACK_MIN = 2;                       // a tick a little early (cron jitter) still counts as due
export const VARS = ["temperature_2m", "dew_point_2m", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "visibility",
  "pressure_msl", "cloud_cover", "cloud_cover_low", "cloud_base", "freezing_level_height"];
export const W_LOC = Math.max(1, VARS.length / 10);            // Open-Meteo weight per location (1.1)
export const HOURS = 19, PAST = 1;
export const FRESH_MIN = 90, SERVE_MAX_MIN = 180, URGENT_MIN = 170;
export const TARGET_MIN = { core: 80, nometar: 80, metar: 160 };
export const PLAN = {
  free: { dailyCap: 9500, perReq: 100, reqPerTick: 1, gapMs: 0 },     // 5 % headroom under 10,000/day; <= 110/min (limit 600)
  paid: { dailyCap: 30000, perReq: 100, reqPerTick: 3, gapMs: 2000 },  // Standard plan: 1M/month
};
export const AWC = {
  metar: "https://aviationweather.gov/api/data/metar?bbox=-35.5,16,-22,33.5&format=json&hours=3",
  taf: "https://aviationweather.gov/api/data/taf?bbox=-35.5,16,-22,33.5&format=json",
};
export const MAX_SERVE_MS = { metar: 2 * 3600e3, taf: 6 * 3600e3 };  // a last-good copy older than this is not served (same as wx.mjs)
export const AWC_TIMEOUT_MS = 6000, OM_TIMEOUT_MS = 15000;
export const KEYS = { state: "state", metar: "metar", taf: "taf", model: "model", snapshot: "snapshot" };
const UA = { "User-Agent": "GoAround-weather-snapshot/1.0 (one shared copy, scheduled)" };
const MIN = 60e3;

// every aerodrome the site shows: the 640 model points + the 2 AIP aerodromes the old list did not have (FACO, FAHS)
export const ALL_POINTS = (() => { const seen = new Set(POINTS_JSON.map(p => p[0])); return POINTS_JSON.concat(CORE_JSON.filter(p => !seen.has(p[0]))); })();
export const store = () => { try { return getStore("wx-snapshot"); } catch { return null; } };
export const planOf = (key = process.env.OPEN_METEO_KEY) => (key ? PLAN.paid : PLAN.free);
const iso = t => new Date(t).toISOString();
const ms = x => { const v = typeof x === "number" ? x : Date.parse(x); return Number.isFinite(v) ? v : NaN; };

/* ---------- due times (persisted, not cron) ---------- */
export function isDue(src, now) { const n = src && ms(src.nextDue); return !Number.isFinite(n) || now >= n - SLACK_MIN * MIN; }
export function markDone(src, ok, now, everyMin) {
  src.lastTry = iso(now);
  if (ok) { src.lastOk = iso(now); src.nextDue = iso(now + everyMin * MIN); src.fails = 0; }
  else { src.fails = (src.fails || 0) + 1; src.nextDue = iso(now + TICK_MIN * MIN); }   // retry on the next tick
  return src;
}

/* ---------- METAR / TAF (aviationweather.gov, one bbox request each) ---------- */
export async function fetchAwc(kind, { fetchFn = fetch, timeout = AWC_TIMEOUT_MS } = {}) {
  try {
    const r = await fetchFn(AWC[kind], { headers: UA, signal: AbortSignal.timeout(timeout) });
    const text = await r.text();
    if (!r.ok) return { ok: false, status: r.status, error: (text || "HTTP " + r.status).slice(0, 200) };
    let j; try { j = JSON.parse(text); } catch { return { ok: false, status: r.status, error: "bad json" }; }
    if (!Array.isArray(j) || !j.length) return { ok: false, status: r.status, error: "empty" };
    return { ok: true, status: 200, rows: kind === "metar" ? latestPerStation(j) : j };
  } catch (e) { return { ok: false, status: 0, error: String(e && e.message || e).slice(0, 200) }; }
}

/* ---------- Open-Meteo ---------- */
export function omUrl(batch, key = process.env.OPEN_METEO_KEY) {
  const host = key ? "https://customer-api.open-meteo.com" : "https://api.open-meteo.com";
  return host + "/v1/forecast?latitude=" + batch.map(p => p[1]).join(",") + "&longitude=" + batch.map(p => p[2]).join(",") +
    "&hourly=" + VARS.join(",") + "&wind_speed_unit=kn&timezone=UTC&forecast_hours=" + HOURS + "&past_hours=" + PAST +
    (key ? "&apikey=" + encodeURIComponent(key) : "");
}
export async function fetchModel(batch, { fetchFn = fetch, timeout = OM_TIMEOUT_MS, now = Date.now(), key } = {}) {
  let r; try { r = await fetchFn(omUrl(batch, key), { headers: UA, signal: AbortSignal.timeout(timeout) }); }
  catch (e) { return { ok: false, status: 0, error: String(e && e.message || e).slice(0, 200) }; }
  if (r.status === 429) { const body = (await r.text().catch(() => "")).slice(0, 200);
    return { ok: false, status: 429, error: body, kind: classify429(body), retryAfter: retryAfterMin(r.headers, now) }; }
  if (!r.ok) return { ok: false, status: r.status, error: "HTTP " + r.status };
  let j; try { j = [].concat(await r.json()); } catch { return { ok: false, status: 200, error: "bad json" }; }
  if (j.length !== batch.length) return { ok: false, status: 200, error: "count mismatch " + j.length + "/" + batch.length };
  for (const o of j) if (!o || !o.hourly || !Array.isArray(o.hourly.time) || !o.hourly.time.length) return { ok: false, status: 200, error: "missing hourly" };
  const ft = iso(now);
  return { ok: true, units: j[0].hourly_units || {}, rows: batch.map((p, k) => ({ id: p[0], ft, el: j[k].elevation ?? null,
    time: j[k].hourly.time, v: Object.fromEntries(VARS.map(x => [x, j[k].hourly[x] || null])) })) };
}

/* ---------- budget: per UTC day, paced evenly over the ticks left today ---------- */
export function budgetFor(state, now, plan) {
  const day = iso(now).slice(0, 10), b = state.budget && state.budget.day === day ? state.budget : { day, used: 0 };
  const end = Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + 1);
  const ticksLeft = Math.max(1, Math.ceil((end - now) / (TICK_MIN * MIN)));
  const left = Math.max(0, plan.dailyCap - b.used);
  const weight = Math.min(left, Math.floor(left / ticksLeft * 100) / 100, plan.perReq * plan.reqPerTick * W_LOC);
  return { b, locations: Math.floor(weight / W_LOC + 1e-9) };
}

/* ---------- which points this tick ---------- */
export function classOf(id, metarIds, core = CORE_SET) { return core.has(id) ? "core" : metarIds.has(id) ? "metar" : "nometar"; }
const CORE_SET = new Set(CORE_JSON.map(p => p[0]));
export function pickPoints(points, model, metarIds, now, n, core = CORE_SET) {
  if (n <= 0) return [];
  const RANK = { core: 1, nometar: 2, metar: 3 }, due = [];
  for (const p of points) {
    const m = model[p[0]], age = m && Number.isFinite(ms(m.ft)) ? (now - ms(m.ft)) / MIN : Infinity;
    const cls = classOf(p[0], metarIds, core), target = TARGET_MIN[cls], noFzl = m && !m.fz;
    if (age < target - TICK_MIN && !(noFzl && age >= 30)) continue;          // not due yet (seeded points without FZL are due after 30 min)
    const rank = age >= URGENT_MIN ? 0 : RANK[cls];
    due.push({ p, rank, age });
  }
  due.sort((a, b) => a.rank - b.rank || b.age - a.age);                       // urgent, core, no-METAR, METAR; oldest first
  return due.slice(0, n).map(d => d.p);
}

/* ---------- metar ids with a recent report (the model is then only needed for the freezing level) ---------- */
export function metarIds(rows, now) {
  const s = new Set(); for (const r of rows || []) if (r && r.icaoId && now - (+r.obsTime * 1000) <= FRESH_MIN * MIN) s.add(r.icaoId); return s;
}

/* ---------- seed from the previous 10-shard copy, once (keeps true fetch times; no freezing level there) ---------- */
export async function seedFromShards(model, old = shardStore()) {
  if (!old) return 0; let n = 0;
  const shards = await readShards(old).catch(() => []);
  for (const sh of shards || []) { if (!sh || !Array.isArray(sh.rows)) continue;
    for (const r of sh.rows) { if (model[r.id]) continue;
      model[r.id] = { ft: sh.fetchedAt, el: r.el, time: r.time, v: { ...r.v, freezing_level_height: null }, fz: false }; n++; } }
  return n;
}

/* ---------- compose the one snapshot the browser loads ---------- */
export function compose({ metar, taf, model, units, state }, now = Date.now(), points = ALL_POINTS) {
  const src = (x, kind) => {
    const age = x && Number.isFinite(ms(x.fetchedAt)) ? now - ms(x.fetchedAt) : Infinity;
    const ok = age <= MAX_SERVE_MS[kind];
    return { fetchedAt: x && x.fetchedAt || null, rows: ok ? x.rows || [] : [], withheld: !ok && !!(x && x.rows && x.rows.length) };
  };
  const startH = Math.floor(now / 3600e3) * 3600e3 - 3600e3;                   // the hour before now ... forward
  const served = [], summary = { fresh: 0, degraded: 0, stale: 0, missing: 0 };
  for (const p of points) {
    const m = model && model[p[0]], ft = m ? ms(m.ft) : NaN, age = (now - ft) / MIN;
    if (!m || !Number.isFinite(ft)) { summary.missing++; continue; }
    if (age > SERVE_MAX_MIN || age < -1) { summary.stale++; continue; }
    summary[age <= FRESH_MIN ? "fresh" : "degraded"]++;
    served.push({ p, m, fs: age <= FRESH_MIN ? "fresh" : "degraded" });
  }
  const hours = new Set();
  for (const x of served) for (const t of x.m.time) if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t) && Date.parse(t + "Z") >= startH) hours.add(t);
  const time = [...hours].sort(), at = Object.fromEntries(time.map((t, k) => [t, k]));
  const v = Object.fromEntries(VARS.map(k => [k, []]));
  for (const x of served) for (const k of VARS) { const row = new Array(time.length).fill(null), s = (x.m.v && x.m.v[k]) || [];
    x.m.time.forEach((t, h) => { if (t in at) row[at[t]] = s[h] ?? null; }); v[k].push(row); }
  const fts = served.map(x => ms(x.m.ft));
  const mdl = served.length ? {
    updatedAt: iso(Math.min(...fts)), newestAt: iso(Math.max(...fts)), composedAt: iso(now), vars: VARS, units: units || {},
    pts: served.map(x => x.p), time, el: served.map(x => x.m.el ?? null), v, ft: served.map(x => x.m.ft), fs: served.map(x => x.fs),
    gen: served.map(() => null), fz: served.map(x => x.m.fz !== false),
    policy: { freshMin: FRESH_MIN, servedMaxMin: SERVE_MAX_MIN, targetMin: TARGET_MIN, tickMin: TICK_MIN } } : null;
  // aero: every aerodrome coordinate, so the browser knows a request is for an aerodrome even when its point is not served
  const aero = points.map(p => [Math.round(p[1] * 1e4) / 1e4, Math.round(p[2] * 1e4) / 1e4]);
  return { v: 2, composedAt: iso(now), nextAt: iso(now + TICK_MIN * MIN), metar: src(metar, "metar"), taf: src(taf, "taf"), model: mdl, aero,
    state: { ...state, model: { ...(state && state.model || {}), summary } } };
}

/* ---------- one scheduled tick ---------- */
export async function tick(s = store(), opts = {}) {
  if (!s) return { ran: false, why: "no blobs" };
  const now = (opts.now || Date.now)(), points = opts.points || ALL_POINTS, key = opts.key !== undefined ? opts.key : process.env.OPEN_METEO_KEY;
  const plan = opts.plan || planOf(key), fetchFn = opts.fetchFn || fetch, core = opts.core ? new Set(opts.core) : CORE_SET;
  const get = k => s.get(k, { type: "json" }).catch(() => null);
  const [st0, metar0, taf0, model0] = await Promise.all([get(KEYS.state), get(KEYS.metar), get(KEYS.taf), get(KEYS.model)]);
  const st = st0 || {}; st.metar = st.metar || {}; st.taf = st.taf || {}; st.model = st.model || {};
  let metar = metar0, taf = taf0; const mstore = model0 || { units: {}, pts: {} }, model = mstore.pts = mstore.pts || {};
  const log = { job: "weather-snapshot", at: iso(now) }, writes = [];

  // 1+2. METAR and TAF, in parallel, each only when its persisted due time has come
  const want = ["metar", "taf"].filter(k => isDue(st[k], now));
  const res = await Promise.all(want.map(k => fetchAwc(k, { fetchFn })));
  want.forEach((k, i) => { const r = res[i];
    markDone(st[k], r.ok, now, EVERY_MIN[k]); st[k].status = r.status; st[k].error = r.ok ? null : r.error;
    if (r.ok) { const v = { fetchedAt: iso(now), rows: r.rows }; if (k === "metar") metar = v; else taf = v; writes.push(s.setJSON(KEYS[k], v)); }
    log[k] = r.ok ? r.rows.length : "fail " + r.status; });

  // 3. model
  if (!st.model.seeded && !Object.keys(model).length && opts.seed !== false) { log.seeded = await seedFromShards(model, opts.oldShards); }
  st.model.seeded = true;
  const mm = st.model;
  if (mm.cooldownUntil && now < ms(mm.cooldownUntil)) log.model = "cooldown until " + mm.cooldownUntil;
  else {
    const { b, locations } = budgetFor(mm, now, plan); mm.budget = b;
    const pick = pickPoints(points, model, metarIds(metar && metar.rows, now), now, locations, core);
    let calls = 0, got = 0;
    for (let i = 0; i < pick.length && i / plan.perReq < plan.reqPerTick; i += plan.perReq) {
      if (i && plan.gapMs) await new Promise(r => setTimeout(r, plan.gapMs));
      const batch = pick.slice(i, i + plan.perReq), w = Math.round(batch.length * W_LOC * 10) / 10;
      const r = await fetchModel(batch, { fetchFn, now, key });
      mm.lastTry = iso(now); mm.status = r.ok ? 200 : r.status; mm.error = r.ok ? null : r.error;
      if (r.status !== 0) { b.used = Math.round((b.used + w) * 10) / 10; calls += w; }   // a request that reached Open-Meteo counts
      if (r.ok) { for (const row of r.rows) model[row.id] = { ft: row.ft, el: row.el, time: row.time, v: row.v, fz: true };
        mstore.units = r.units; got += r.rows.length; mm.lastOk = iso(now); mm.fails = 0; mm.limited = false; mm.cooldownUntil = null; }
      else { if (r.status === 429) { mm.fails = (mm.fails || 0) + 1; mm.limited = true; mm.kind = r.kind;
          mm.cooldownUntil = iso(now + cooldownMin(mm.fails, r.kind, r.retryAfter, now) * MIN); }
        break; }
    }
    log.model = { picked: pick.length, got, weight: calls, usedToday: b.used, cap: plan.dailyCap, plan: key ? "paid" : "free" };
    if (got) writes.push(s.setJSON(KEYS.model, mstore));
  }
  st.plan = key ? "paid" : "free";
  // opts.compose: optional faster composer returning { composedAt, text } (Cloudflare port, cloudflare/lib/fast_compose.mjs);
  // Netlify uses compose() and JSON.stringify exactly as before.
  const snap = (opts.compose || compose)({ metar, taf, model, units: mstore.units, state: st }, now, points);
  writes.push(s.set(KEYS.snapshot, typeof snap.text === "string" ? snap.text : JSON.stringify(snap), { metadata: { composedAt: snap.composedAt } }));
  writes.push(s.setJSON(KEYS.state, st));
  await Promise.all(writes);
  console.log(JSON.stringify(log));
  return { ran: true, log, snap, state: st };
}
