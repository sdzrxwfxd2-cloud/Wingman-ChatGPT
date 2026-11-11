// Visitor log store. Prefers D1 (binding VISITORS) when present.
// Falls back to the dedicated KV namespace VISITORS_KV (not the weather WX namespace).
// KV free-plan writes are shared account-wide (1,000/day) and are only a preview/stopgap.
// Retention: 90 days.
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
  await env.VISITORS_KV.put(key, JSON.stringify(v), { expirationTtl: KV_TTL });
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
  // KV: list recent keys then filter in memory (fine for preview-scale logs).
  const rows = [];
  let cursor;
  for (let n = 0; n < 10 && rows.length < 2000; n++) {
    const page = await env.VISITORS_KV.list({ prefix: KV_PREFIX, cursor, limit: 1000 });
    for (const k of page.keys || []) {
      const raw = await env.VISITORS_KV.get(k.name, "json");
      if (raw && raw.ts >= floor && raw.ts <= until) rows.push(raw);
    }
    if (page.list_complete) break;
    cursor = page.cursor;
  }
  rows.sort((a, b) => b.ts - a.ts);
  const filtered = rows.filter((v) => {
    if (country && v.country !== country) return false;
    if (device && v.device_type !== device) return false;
    if (ip && !(v.ip || "").includes(ip)) return false;
    if (q) {
      const blob = [v.path, v.ref, v.city, v.browser, v.os, v.device_model].join(" ").toLowerCase();
      if (!blob.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  return { rows: filtered.slice(0, limit), store: "kv", totalMatched: filtered.length };
}

export async function summarize(env, { since, until }) {
  const kind = storageKind(env);
  if (kind === "d1") {
    try { return { store: "d1", ...(await summarizeD1(env, since, until)) }; }
    catch (e) { /* fall through */ }
  }
  const { rows, store } = await listVisits(env, { since, until, limit: 2000 });
  return { store, ...summarizeRows(rows, since, until) };
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
