// /visitor-log-data — JSON of recent visits, admin-session only (sign in on /admin first).
// visitor-log.html reads `visits` in the Netlify field names (t, dev, br, sw×sh …); the store keeps D1 column names (ts,
// device_type, browser, screen …). Before 11 Nov this endpoint returned only `rows`, so the page always showed 0 visits.
import { requireAdmin, json } from "../lib/admin_session.mjs";
import { listVisits, storageKind } from "../lib/visit_store.mjs";

const DEV = { mobile: "Phone", tablet: "Tablet", desktop: "Desktop" };
const wh = (s) => { const m = String(s || "").match(/^(\d+)\s*[x×]\s*(\d+)$/); return m ? [+m[1], +m[2]] : ["", ""]; };
export function toLogRow(r, perSid) {
  const [sw, sh] = wh(r.screen), [vw, vh] = wh(r.viewport);
  return { t: r.ts, path: r.path || "/", dev: DEV[r.device_type] || (r.device_type ? r.device_type : "Unknown"), model: r.device_model || "",
    os: r.os || "", osv: r.os_ver || "", br: r.browser || "", brv: "", sw, sh, vw, vh, dpr: r.dpr == null ? "" : r.dpr, lang: r.lang || "",
    tz: r.tz || "", city: r.city || "", region: r.region || "", country: r.country || "", ip: r.ip || "", ref: r.ref || "", sid: r.sid || "",
    n: r.n || 1, sv: perSid[r.sid] || 1, test: /GoAround-|HeadlessChrome|bot|crawl|spider/i.test(r.ua || "") ? 1 : 0 };
}

export async function onRequestGet({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return gate.res;
  const store = storageKind(env);
  if (!store) return json({ error: "storage_not_ready", rows: [], visits: [] });
  const out = await listVisits(env, { since: Date.now() - 14 * 86400000, until: Date.now(), limit: 500 });
  const rows = out.rows.filter((r) => r.path); // keys still waiting for metadata have no fields yet
  const perSid = {}; rows.forEach((r) => { if (r.sid) perSid[r.sid] = Math.max(perSid[r.sid] || 0, r.n || 1); });
  return json({ store: out.store, rows, visits: rows.map((r) => toLogRow(r, perSid)), total: out.totalMatched });
}
