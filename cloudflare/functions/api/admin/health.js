// GET /api/admin/health (11 Nov 2026): read-only site health for the rebuilt admin pages (/admin-status, /admin-sitestatus,
// /admin-dashboard). Admin session only (same ADMIN_DASH_SECRET as /admin). Never writes KV or D1: uptime is read from the
// probe history /api/ops and /dashboard-data already record. ~22 subrequests, well under the Workers limit.
import { requireAdmin, json } from "../../../lib/admin_session.mjs";
import { KV_KEYS } from "../../../lib/keys.mjs";
import { readSnap } from "../../../lib/snap_read.mjs";
import { OFFICIAL, PAGES, compareWx, uptimeOf, errorsOf } from "../../../lib/admin_health.mjs";

const UA = { "User-Agent": "GoAround-admin-health/1.0" };
async function probe(url, { body = false, ms = 8000 } = {}) {
  const t = Date.now();
  try {
    const r = await fetch(url, { redirect: "manual", headers: UA, signal: AbortSignal.timeout(ms) });
    const out = { s: r.status, ms: 0, kb: 0, src: r.headers.get("x-wx-source") || null, upd: r.headers.get("x-wx-updated") || null };
    if (body) { const txt = await r.text(); out.text = txt; out.kb = Math.round(txt.length / 1024); }
    else { out.kb = Math.round((Number(r.headers.get("content-length")) || 0) / 1024); await r.body?.cancel(); }
    out.ms = Date.now() - t;
    return out;
  } catch (e) { return { s: 0, ms: Date.now() - t, kb: 0, e: String(e).slice(0, 120) }; }
}
const parse = (txt) => { try { const j = JSON.parse(txt); return Array.isArray(j) ? j : []; } catch { return []; } };
const strip = (p) => { const o = { ...p }; delete o.text; return o; };

export async function onRequestGet({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return gate.res;
  const o = new URL(request.url).origin, now = Date.now();
  const pageP = Promise.all(PAGES.map(async (p) => {
    const r = await probe(o + p, { body: true });
    const html = /\.html$|\/$/.test(p);
    const complete = !html || !r.text ? r.s === 200 : /<\/html>\s*$/i.test(r.text.trim());
    const clash = !!(r.text && /^(<{7}|>{7}) /m.test(r.text));
    return { p, s: r.s, ms: r.ms, kb: r.kb, complete, clash };
  }));
  const [site, metar, taf, flights, model, upM, upT, pages, snap, nowMeta, hist] = await Promise.all([
    probe(o + "/"), probe(o + "/api/metar", { body: true }), probe(o + "/api/taf", { body: true }),
    probe(o + "/api/flights?icao=FAOR&lat=-26.13&lon=28.24"), probe(o + "/api/model-weather"),
    probe(OFFICIAL.metar, { body: true, ms: 9000 }), probe(OFFICIAL.taf, { body: true, ms: 9000 }), pageP,
    readSnap(env).catch(() => null),
    env.WX ? env.WX.getWithMetadata(KV_KEYS.now, { type: "stream" }).then(async (g) => { if (g && g.value) await g.value.cancel(); return (g && g.metadata) || null; }).catch(() => null) : null,
    env.WX ? env.WX.get(KV_KEYS.probes, "json").catch(() => null) : null
  ]);
  const wxOf = (kind, s, u) => {
    const c = compareWx(kind, parse(s.text), parse(u.text), now);
    return { site: { s: s.s, ms: s.ms, src: s.src, upd: s.upd }, up: { s: u.s, ms: u.ms, n: c.upN, e: u.e || null }, ...c };
  };
  const wx = { metar: wxOf("metar", metar, upM), taf: wxOf("taf", taf, upT) };
  let st = null; try { st = snap && (snap.part("state") != null ? snap.json("state") : null); } catch {}
  const h = (x) => x && x.lastTry ? { t: x.lastTry, status: x.status, error: x.error || null, lastOk: x.lastOk || null } : null;
  const health = { metar: h(st && st.metar), taf: h(st && st.taf) };
  const meta = snap ? snap.meta || {} : {};
  const depId = env.CF_PAGES_COMMIT_SHA ? env.CF_PAGES_COMMIT_SHA.slice(0, 12) : (env.DEPLOY_ID || null);
  const uptime = uptimeOf(hist, depId);
  const probes = { site: strip(site), metar: strip(metar), taf: strip(taf), flights: strip(flights), model: strip(model) };
  const up = site.s === 200 || site.s === 401;
  return json({
    now: new Date(now).toISOString(), up,
    deploy: { id: depId, branch: env.CF_PAGES_BRANCH || null, url: env.CF_PAGES_URL || null },
    probes, wx, health, pages,
    snapshot: { composedAt: meta.composedAt || null, metarAt: meta.metarAt || null, tafAt: meta.tafAt || null, nowComposedAt: (nowMeta && nowMeta.composedAt) || null },
    model: { s: model.s, ms: model.ms, limited: model.s === 429, composedAt: (nowMeta && nowMeta.composedAt) || meta.composedAt || null },
    uptime,
    errors: errorsOf({ now, probes, wx, health, pages, uptime }),
    notConnected: ["Cloudflare Workers logs (in the Cloudflare dashboard, not on this page)", "Browser JavaScript errors (no error reporter on the site yet)"]
  });
}
