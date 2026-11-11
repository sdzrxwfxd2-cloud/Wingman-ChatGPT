// GET /api/model-weather (Cloudflare port of netlify/functions/model-weather.mjs): the model part of the shared snapshot + health.
// Never calls Open-Meteo. 503 "warming" until the companion Worker has written the first snapshot.
import { readSnap } from "../../lib/snap_read.mjs";
const json = (body, status, h = {}) => new Response(body, { status, headers: { "Content-Type": "application/json; charset=utf-8", ...h } });
export async function onRequestGet({ env }) {
  const s = await readSnap(env); if (!s) return json('{"error":"warming"}', 503, { "Cache-Control": "no-store" });
  let state, modelText = s.part("model");
  if (modelText == null) { const f = s.full(); state = f.state; modelText = JSON.stringify(f.model); } else state = s.json("state");
  const m = (state && state.model) || {};
  const health = { summary: m.summary || null, shards: [], lastTry: m.lastTry || null, lastOk: m.lastOk || null, status: m.status || null,
    error: m.error || null, limited: !!m.limited, fails: m.fails || 0, cooldownUntil: m.cooldownUntil || null, budget: m.budget || null, plan: (state && state.plan) || null };
  if (!modelText || modelText === "null") return json(JSON.stringify({ error: "warming", state: health }), 503, { "Cache-Control": "no-store" });
  return json(modelText.slice(0, -1) + ',"state":' + JSON.stringify(health) + "}", 200, { "Cache-Control": "public, max-age=120" });
}
