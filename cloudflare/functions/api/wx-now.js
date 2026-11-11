// GET /api/wx-now (step 2, 9 Nov 2026, MT t873u): the small "now" file the companion Worker writes every tick (cloudflare/lib/
// fast_compose.mjs nowText): current + next-hour model values, freezing level, fetch time and elevation per aerodrome, plus the
// METAR and TAF rows. Streamed straight from KV (no parse, well under 1 ms CPU), edge-cached 60 s. Never calls Open-Meteo or AWC.
// 503 until the Worker has written the first one; the browser then falls back to /api/model-weather, /api/metar and /api/taf.
import { KV_KEYS } from "../../lib/keys.mjs";
const H = { "Content-Type": "application/json; charset=utf-8" };
const NOSTORE = { ...H, "Cache-Control": "no-store" };
export async function onRequestGet({ request, env }) {
  if (!env.WX) return new Response('{"error":"no store"}', { status: 503, headers: NOSTORE });
  const g = await env.WX.getWithMetadata(KV_KEYS.now, { type: "stream", cacheTtl: 60 }).catch(() => null);
  if (!g || !g.value) return new Response('{"error":"warming"}', { status: 503, headers: NOSTORE });
  const m = g.metadata || {}, etag = '"now-' + String(m.composedAt || "x").replace(/[^0-9A-Za-z:.-]/g, "") + '"';
  const head = { ...H, ETag: etag, "Cache-Control": "public, max-age=60, must-revalidate", "X-WX-Source": "now" };
  if ((request.headers.get("if-none-match") || "") === etag) { await g.value.cancel(); return new Response(null, { status: 304, headers: head }); }
  return new Response(g.value, { status: 200, headers: head });
}
