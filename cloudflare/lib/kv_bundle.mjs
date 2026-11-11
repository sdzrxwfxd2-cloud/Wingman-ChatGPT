// Cloudflare port of the shared weather snapshot (feat/cloudflare-pages, 7 Nov 2026): Netlify Blobs -> Workers KV.
// tick() in netlify/lib/wx_snapshot.mjs writes 3-5 separate blobs per tick (state, metar, taf, model, snapshot). Workers KV on the
// FREE plan allows 1,000 writes a day, so this adapter keeps the exact store interface tick() expects, buffers every write in
// memory, and the companion Worker flushes ONE combined "work" value (state + metar + taf + packed model) plus ONE "snapshot"
// value per tick: at most 2 writes x 144 ticks = 288 writes/day.
import { decodeModel, encodeModel } from "./fast_compose.mjs";

import { KV_KEYS } from "./keys.mjs";
export { KV_KEYS };

// work text (as stored) -> store object for tick()
export function bundleStore(workText) {
  // stored as: JSON header (no raw newlines) + "\n" + packed model text, so 1 MB of model text is never JSON-escaped or scanned
  let w = {}; if (workText) { const nl = workText.indexOf("\n"); try { w = JSON.parse(nl < 0 ? workText : workText.slice(0, nl)) || {}; } catch { w = {}; }
    if (nl >= 0) w.mp = workText.slice(nl + 1); }
  const m = {};
  if (w.state) m.state = w.state;
  if (w.metar) m.metar = w.metar;
  if (w.taf) m.taf = w.taf;
  if (w.mp || w.raw) m.model = { units: w.units || {}, pts: decodeModel(w.mp, w.raw) };
  let snapshot = null, snapMeta = null, dirty = false;
  return {
    get: async (k, o) => (k in m ? (o && o.type === "json" ? m[k] : JSON.stringify(m[k])) : null),
    setJSON: async (k, v) => { m[k] = v; dirty = true; },
    set: async (k, v, o) => { if (k === "snapshot") { snapshot = String(v); snapMeta = (o && o.metadata) || null; } else { m[k] = JSON.parse(v); dirty = true; } },
    out: () => ({ m, snapshot, snapMeta, dirty }),
  };
}

export function workText(m) {
  const enc = m.model ? encodeModel(m.model.pts) : { mp: "", raw: null };
  return JSON.stringify({ v: 1, state: m.state || null, metar: m.metar || null, taf: m.taf || null, units: (m.model && m.model.units) || {}, raw: enc.raw }) + "\n" + enc.mp;
}

// Flush: at most 3 KV writes (work, snapshot, now). The snapshot carries composedAt + part offsets as KV metadata (<= 1 KB), so the Pages Functions can
// build the ETag and slice METAR / TAF / model out of the stored text without parsing it.
export async function flush(kv, s, extraMeta, nowText) {
  const { m, snapshot, snapMeta, dirty } = s.out(), writes = [];
  if (dirty) writes.push(kv.put(KV_KEYS.work, workText(m)));
  if (snapshot) writes.push(kv.put(KV_KEYS.snapshot, snapshot, { metadata: { ...(snapMeta || {}), ...(extraMeta || {}) } }));
  /* step 2 (9 Nov 2026): the small "now" file, one more write per tick only when a new one was built (<= 432 writes/day in all) */
  if (snapshot && nowText) writes.push(kv.put(KV_KEYS.now, nowText, { metadata: { composedAt: (snapMeta && snapMeta.composedAt) || null } }));
  await Promise.all(writes);
  return writes.length;
}
