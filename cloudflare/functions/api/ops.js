// Cloudflare port of the archived Netlify /api/ops (wingman-ops-dashboard netlify/functions/ops.mjs).
// Unlocks ops.html and ops-weather.html. Password is ADMIN_DASH_SECRET via HTTP Basic
// (same protocol as the existing ops.js: btoa("admin:" + password)). Does not import auth.mjs.
import { sameSecret } from "../../lib/admin_session.mjs";
import { KV_KEYS } from "../../lib/keys.mjs";
import { readSnap } from "../../lib/snap_read.mjs";
import { summarize, storageKind, RETENTION_MS } from "../../lib/visit_store.mjs";

const J = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: J });
}

function passwordFromBasic(header) {
  if (!header || !header.startsWith("Basic ")) return "";
  try {
    return atob(header.slice(6)).split(":").slice(1).join(":");
  } catch {
    return "";
  }
}

const probe = async (url) => {
  const t = Date.now();
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(9000) });
    await r.body?.cancel();
    return { s: r.status, ms: Date.now() - t };
  } catch (e) {
    return { s: 0, ms: Date.now() - t, e: String(e).slice(0, 120) };
  }
};

function splitDevices(devices) {
  const split = { phone: 0, ipad: 0, desktop: 0, other: 0 };
  for (const row of devices || []) {
    const name = String(row.name || "").toLowerCase();
    const n = Number(row.n) || 0;
    if (name === "mobile" || name === "phone") split.phone += n;
    else if (name === "tablet" || name === "ipad") split.ipad += n;
    else if (name === "desktop") split.desktop += n;
    else split.other += n;
  }
  return split;
}

function visitorsPayload(today, week, all) {
  return {
    today: { views: today.visits || 0, unique: today.uniques || 0 },
    week: { views: week.visits || 0, unique: week.uniques || 0 },
    all: {
      views: all.visits || 0,
      since: all.since ? new Date(all.since).toISOString() : null,
      logged: all.visits || 0
    },
    byDay: (week.days || []).map((d) => ({ d: d.day, views: d.n, unique: d.u })),
    top: (week.pages || []).map((p) => [p.name, p.n]),
    split: splitDevices(week.devices),
    splitSample: week.visits || 0
  };
}

async function loadVisitors(env, now) {
  const kind = storageKind(env);
  // KV summarize() reads every visit key one-by-one (thousands of subrequests) and
  // would hang this function past the Worker limit. D1 can answer with a few queries.
  // The /admin traffic page is the place for the full KV visitor log.
  if (kind !== "d1") {
    return { error: kind ? "visitor totals for this page are on /admin (Cloudflare KV cannot be fully scanned here)" : "visitor counting is not on the Cloudflare copy yet (no visitor store bound)" };
  }
  const until = now.getTime();
  const today = await summarize(env, { since: until - 864e5, until });
  const week = await summarize(env, { since: until - 7 * 864e5, until });
  const allSince = until - RETENTION_MS;
  const all = await summarize(env, { since: allSince, until });
  all.since = allSince;
  return visitorsPayload(today, week, all);
}

async function wxHealth(env) {
  try {
    const snap = await readSnap(env);
    let st = null;
    try { st = snap && (snap.part("state") != null ? snap.json("state") : snap.full().state); } catch {}
    const h = (x) => x && x.lastTry ? { t: x.lastTry, status: x.status, error: x.error || null, lastOk: x.lastOk || null } : null;
    return { metar: h(st && st.metar), taf: h(st && st.taf) };
  } catch {
    return { metar: null, taf: null };
  }
}

export async function onRequestGet({ request, env }) {
  const secret = env.ADMIN_DASH_SECRET;
  if (!secret) return json({ error: "ADMIN_DASH_SECRET not set" }, 503);
  const password = passwordFromBasic(request.headers.get("authorization") || "");
  if (!(await sameSecret(password, secret))) return json({ error: "auth" }, 401);

  const o = new URL(request.url).origin, now = new Date();
  const [site, metar, taf, flights] = await Promise.all([
    probe(o + "/"),
    probe(o + "/api/metar"),
    probe(o + "/api/taf"),
    probe(o + "/api/flights?icao=FAOR&lat=-26.13&lon=28.24")
  ]);
  const up = site.s === 401 || site.s === 200;
  const depId = env.CF_PAGES_COMMIT_SHA ? env.CF_PAGES_COMMIT_SHA.slice(0, 12) : (env.DEPLOY_ID || null);

  let hist = [];
  try {
    hist = (await env.WX.get(KV_KEYS.probes, "json")) || [];
    hist.push({ t: now.toISOString(), up, ms: site.ms, wx: metar.s === 200, d: depId });
    hist = hist.slice(-600);
    await env.WX.put(KV_KEYS.probes, JSON.stringify(hist));
  } catch {}
  const mine = hist.filter((x) => x.d === depId);
  const uptime = {
    checks: mine.length,
    ok: mine.filter((x) => x.up).length,
    first: mine[0]?.t || null,
    all: hist.length,
    allOk: hist.filter((x) => x.up).length,
    allFirst: hist[0]?.t || null
  };

  let visitors = null;
  try { visitors = await loadVisitors(env, now); }
  catch (e) { visitors = { error: String(e).slice(0, 160) }; }

  const wx = await wxHealth(env);

  return json({
    now: now.toISOString(),
    deploy: {
      id: depId,
      context: env.CF_PAGES_BRANCH ? "cloudflare-pages:" + env.CF_PAGES_BRANCH : "cloudflare-pages",
      published: null
    },
    probes: { site, metar, taf, flights },
    up,
    uptime,
    wx,
    visitors
  });
}

export const onRequest = onRequestGet;
