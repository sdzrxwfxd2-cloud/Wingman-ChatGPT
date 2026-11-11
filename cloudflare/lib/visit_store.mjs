// Visitor log store. Prefers D1 (binding VISITORS) when present.
// Falls back to the dedicated KV namespace VISITORS_KV (not the weather WX namespace).
// KV free-plan writes are shared account-wide (1,000/day) and are only a preview/stopgap.
// Retention: 90 days.
// KV read path (fix 11 Nov 2026): each visit's fields ride in the key's metadata (<= 1 KB), so list() alone gives the log and
// the totals. The old path did one get() per key: 1,383 keys x 3 windows = ~4,150 KV operations per /admin load, over the
// Workers limit of 1,000 KV operations per invocation, so /api/admin/stats failed. Older keys without metadata are still
// counted (the time is in the key name); at most KV_GET_BUDGET of the newest are read in full for the log.
export const KV_GET_BUDGET = 60;
export const KV_SUMMARY_GET_BUDGET = 400; // newest older keys read in full for the breakdowns (list pages + 400 < 1,000)
const KV_LIST_MAX_PAGES = 200; // 200 x 1,000 keys; well under the 1,000 operations limit
export const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const KV_PREFIX = "v:";
const KV_TTL = Math.floor(RETENTION_MS / 1000);

export function storageKind(env) {
  if (env && env.VISITORS) return "d1";
  if (env && env.VISITORS_KV) return "kv";
  return null;
}

function clip(s, n) {
  if (s == null) return "";
  return String(s).slice(0, n);
}

export function normalizeVisit(row) {
  return {
    ts: Number(row.ts) || Date.now(),
    sid: clip(row.sid, 64),
    n: Number(row.n) || 1,
    path: clip(row.path, 512),
    ref: clip(row.ref, 512),
    ip: clip(row.ip, 64),
    country: clip(row.country, 64),
    city: clip(row.city, 80),
    region: clip(row.region, 80),
    continent: clip(row.continent, 32),
    ua: clip(row.ua, 512),
    device_type: clip(row.device_type, 24),
    device_model: clip(row.device_model, 80),
    browser: clip(row.browser, 80),
    os: clip(row.os, 40),
    os_ver: clip(row.os_ver, 40),
    screen: clip(row.screen, 32),
    viewport: clip(row.viewport, 32),
    lang: clip(row.lang, 80),
    tz: clip(row.tz, 64),
    dpr: row.dpr == null || row.dpr === "" ? null : Number(row.dpr),
    net: clip(row.net, 24)
  };
}

export async function insertVisit(env, raw) {
  const kind = storageKind(env);
  if (!kind) return { ok: false, reason: "no-store" };
  const v = normalizeVisit(raw);
  if (kind === "d1") {
    if (Math.random() < 0.02) {
      try { await env.VISITORS.prepare("DELETE FROM visits WHERE ts < ?").bind(Date.now() - RETENTION_MS).run(); } catch {}
    }
    await env.VISITORS.prepare(
      `INSERT INTO visits (ts,sid,n,path,ref,ip,country,city,region,continent,ua,device_type,device_model,browser,os,os_ver,screen,viewport,lang,tz,dpr,net)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(v.ts, v.sid, v.n, v.path, v.ref, v.ip, v.country, v.city, v.region, v.continent,
      v.ua, v.device_type, v.device_model, v.browser, v.os, v.os_ver, v.screen, v.viewport, v.lang, v.tz, v.dpr, v.net).run();
    return { ok: true, store: "d1" };
  }
  const key = KV_PREFIX + v.ts + ":" + Math.random().toString(36).slice(2, 10);
  await env.VISITORS_KV.put(key, JSON.stringify(v), { expirationTtl: KV_TTL, metadata: toMeta(v) });
  return { ok: true, store: "kv" };
}

export async function listVisits(env, { since = 0, until = 0, country = "", device = "", q = "", ip = "", limit = 100 } = {}) {
  const kind = storageKind(env);
  if (!kind) return { rows: [], store: null };
  until = until || Date.now();
  const floor = Math.max(since, Date.now() - RETENTION_MS);
  limit = Math.min(Math.max(Number(limit) || 100, 1), 2000);
  if (kind === "d1") {
    const clauses = ["ts >= ?", "ts <= ?"];
    const binds = [floor, until];
    if (country) { clauses.push("country = ?"); binds.push(country); }
    if (device) { clauses.push("device_type = ?"); binds.push(device); }
    if (ip) { clauses.push("ip LIKE ?"); binds.push("%" + ip + "%"); }
    if (q) { clauses.push("(path LIKE ? OR ref LIKE ? OR city LIKE ? OR browser LIKE ? OR os LIKE ? OR device_model LIKE ?)"); binds.push(...Array(6).fill("%" + q + "%")); }
    const sql = `SELECT * FROM visits WHERE ${clauses.join(" AND ")} ORDER BY ts DESC LIMIT ?`;
    binds.push(limit);
    const out = await env.VISITORS.prepare(sql).bind(...binds).all();
    return { rows: out.results || [], store: "d1" };
  }
  const all = (await kvRows(env)).filter((v) => v.ts >= floor && v.ts <= until);
  const need = !!(country || device || ip || q);
  const match = (v) => {
    if (country && v.country !== country) return false;
    if (device && v.device_type !== device) return false;
    if (ip && !(v.ip || "").includes(ip)) return false;
    if (q) {
      const blob = [v.path, v.ref, v.city, v.browser, v.os, v.device_model].join(" ").toLowerCase();
      if (!blob.includes(q.toLowerCase())) return false;
    }
    return true;
  };
  // fill in the newest rows that have no metadata (older keys), within a small get() budget
  let gets = 0;
  for (let i = 0; i < all.length; i++) {
    const v = all[i];
    if (!need && i >= limit) break;
    if (v._full) continue;
    if (gets >= KV_GET_BUDGET) break;
    gets++;
    try { const raw = await env.VISITORS_KV.get(v._key, "json"); if (raw) Object.assign(v, normalizeVisit(raw), { _full: true }); } catch {}
  }
  const filtered = all.filter((v) => (need ? v._full && match(v) : true));
  return { rows: filtered.slice(0, limit).map(publicRow), store: "kv", totalMatched: filtered.length, partial: all.some((v) => !v._full) && need };
}

// Compact copy of a visit for KV metadata (limit 1,024 bytes): the full UA string stays only in the value.
export function toMeta(v) {
  const m = { ts: v.ts, sid: clip(v.sid, 40), n: v.n || 1, path: clip(v.path, 120), ref: clip(v.ref, 80), ip: clip(v.ip, 45),
    country: clip(v.country, 8), city: clip(v.city, 48), region: clip(v.region, 48), continent: clip(v.continent, 4),
    device_type: clip(v.device_type, 12), device_model: clip(v.device_model, 40), browser: clip(v.browser, 32), os: clip(v.os, 24),
    os_ver: clip(v.os_ver, 16), screen: clip(v.screen, 12), viewport: clip(v.viewport, 12), lang: clip(v.lang, 24), tz: clip(v.tz, 32),
    dpr: v.dpr == null ? null : v.dpr, net: clip(v.net, 8) };
  if (JSON.stringify(m).length > 1000) { m.ref = clip(m.ref, 30); m.lang = ""; m.path = clip(m.path, 60); }
  return m;
}

export const tsFromKey = (name) => { const t = Number(String(name || "").split(":")[1]); return Number.isFinite(t) ? t : 0; };
const publicRow = (v) => { const o = { ...v }; delete o._key; delete o._full; return o; };

// Every visit key, newest first, from list() only (metadata when present, else just the time from the key name).
export async function kvRows(env) {
  const rows = [];
  let cursor;
  for (let n = 0; n < KV_LIST_MAX_PAGES; n++) {
    const page = await env.VISITORS_KV.list({ prefix: KV_PREFIX, cursor, limit: 1000 });
    for (const k of page.keys || []) {
      const m = k.metadata && typeof k.metadata === "object" ? k.metadata : null;
      rows.push(m ? { ...normalizeVisit({ ...m, ts: m.ts || tsFromKey(k.name) }), ua: "", _key: k.name, _full: true }
        : { ts: tsFromKey(k.name), _key: k.name, _full: false });
    }
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  rows.sort((a, b) => b.ts - a.ts);
  return rows;
}

// today / 7 days / 30 days from ONE listing (the stats endpoint used to scan the store three times).
export async function summarizeWindows(env, { until = Date.now() } = {}) {
  const kind = storageKind(env);
  const win = (ms) => ({ since: until - ms, until });
  if (kind === "d1") {
    const [today, week, month] = await Promise.all([summarize(env, win(864e5)), summarize(env, win(7 * 864e5)), summarize(env, win(30 * 864e5))]);
    return { store: "d1", today, week, month };
  }
  if (!kind) return { store: null, error: "storage_not_ready" };
  const rows = await kvRows(env);
  await fillLegacy(env, rows, KV_SUMMARY_GET_BUDGET);
  const pick = (ms) => summarizeRows(rows.filter((r) => r.ts >= until - ms && r.ts <= until), until - ms, until);
  return { store: "kv", today: pick(864e5), week: pick(7 * 864e5), month: pick(30 * 864e5), legacy: rows.filter((r) => !r._full).length };
}

// Read the newest keys that have no metadata, 50 at a time, up to `budget` get() calls.
export async function fillLegacy(env, rows, budget) {
  const todo = rows.filter((r) => !r._full).slice(0, budget);
  for (let i = 0; i < todo.length; i += 50) {
    await Promise.all(todo.slice(i, i + 50).map(async (v) => { try { const raw = await env.VISITORS_KV.get(v._key, "json"); if (raw) Object.assign(v, normalizeVisit(raw), { _full: true }); } catch {} }));
  }
  return todo.length;
}

export async function summarize(env, { since, until }) {
  const kind = storageKind(env);
  if (kind === "d1") {
    try { return { store: "d1", ...(await summarizeD1(env, since, until)) }; }
    catch (e) { /* fall through */ }
  }
  if (!env.VISITORS_KV) return { store: kind, ...summarizeRows([], since, until) };
  const rows = (await kvRows(env)).filter((r) => r.ts >= since && r.ts <= (until || Date.now()));
  return { store: "kv", ...summarizeRows(rows, since, until) };
}

async function summarizeD1(env, since, until) {
  const floor = Math.max(since, Date.now() - RETENTION_MS);
  const untilTs = until || Date.now();
  const bound = (sql) => env.VISITORS.prepare(sql).bind(floor, untilTs);
  const visits = await bound("SELECT COUNT(*) AS n, COUNT(DISTINCT sid) AS u FROM visits WHERE ts >= ? AND ts <= ?").first();
  const top = async (col) => {
    const out = await bound(`SELECT ${col} AS name, COUNT(*) AS n FROM visits WHERE ts >= ? AND ts <= ? AND ${col} IS NOT NULL AND ${col} != '' GROUP BY ${col} ORDER BY n DESC LIMIT 12`).all();
    return out.results || [];
  };
  const days = await bound(
    "SELECT strftime('%Y-%m-%d', ts/1000, 'unixepoch') AS day, COUNT(*) AS n, COUNT(DISTINCT sid) AS u FROM visits WHERE ts >= ? AND ts <= ? GROUP BY day ORDER BY day"
  ).all();
  return {
    visits: visits?.n || 0,
    uniques: visits?.u || 0,
    days: days.results || [],
    pages: await top("path"),
    countries: await top("country"),
    cities: await top("city"),
    devices: await top("device_type"),
    browsers: await top("browser"),
    os: await top("os"),
    referrers: await top("ref"),
    models: await top("device_model")
  };
}

function summarizeRows(rows, since, until) {
  const count = (key) => {
    const m = new Map();
    for (const r of rows) {
      const name = (r[key] || "").trim();
      if (!name) continue;
      m.set(name, (m.get(name) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, n]) => ({ name, n }));
  };
  const dayMap = new Map();
  const sids = new Set();
  for (const r of rows) {
    if (r.sid) sids.add(r.sid);
    const day = new Date(r.ts).toISOString().slice(0, 10);
    const o = dayMap.get(day) || { day, n: 0, s: new Set() };
    o.n++; if (r.sid) o.s.add(r.sid);
    dayMap.set(day, o);
  }
  return {
    visits: rows.length,
    uniques: sids.size,
    days: [...dayMap.values()].map((d) => ({ day: d.day, n: d.n, u: d.s.size })).sort((a, b) => a.day.localeCompare(b.day)),
    pages: count("path"),
    countries: count("country"),
    cities: count("city"),
    devices: count("device_type"),
    browsers: count("browser"),
    os: count("os"),
    referrers: count("ref"),
    models: count("device_model"),
    since, until
  };
}
