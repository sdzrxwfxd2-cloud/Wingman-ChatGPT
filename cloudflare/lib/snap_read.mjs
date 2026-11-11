// Read parts of the stored snapshot text by the offsets the companion Worker saved in the KV metadata (no 1 MB JSON.parse:
// a Pages Function on the free plan has 10 ms CPU per request).
import { KV_KEYS } from "./keys.mjs";
export async function readSnap(env) {
  if (!env.WX) return null;
  const g = await env.WX.getWithMetadata(KV_KEYS.snapshot, { type: "text", cacheTtl: 60 }).catch(() => null);
  if (!g || !g.value) return null;
  const m = g.metadata || {}, off = m.off || null;
  const part = (name) => { if (off && Array.isArray(off[name])) return g.value.slice(off[name][0], off[name][1]); return null; };
  return { text: g.value, meta: m, part, json: (name) => { const p = part(name); return p == null ? undefined : JSON.parse(p); },
    full: () => JSON.parse(g.value) };
}
