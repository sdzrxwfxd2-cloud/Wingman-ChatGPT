// GET /api/weather-snapshot (Cloudflare port of netlify/functions/weather-snapshot.mjs): streams the one shared weather copy the
// companion Worker (cloudflare/worker) wrote to KV. Never calls aviationweather.gov or Open-Meteo. No parsing: the body is
// streamed straight from KV and the ETag comes from the KV metadata (composedAt), so a request costs well under 1 ms CPU.
import { KV_KEYS } from "../../lib/keys.mjs";
const H = { "Content-Type": "application/json; charset=utf-8" };
const NOSTORE = { ...H, "Cache-Control": "no-store" };
export async function onRequestGet({ request, env }) {
  if (!env.WX) return new Response('{"error":"no store"}', { status: 503, headers: NOSTORE });
  const g = await env.WX.getWithMetadata(KV_KEYS.snapshot, { type: "stream", cacheTtl: 60 }).catch(() => null);
  if (!g || !g.value) return new Response('{"error":"warming"}', { status: 503, headers: NOSTORE });
  const m = g.metadata || {}, etag = '"' + String(m.composedAt || "x").replace(/[^0-9A-Za-z:.-]/g, "") + '"';
  const head = { ...H, ETag: etag, "Cache-Control": "public, max-age=60, must-revalidate", "X-WX-Source": "snapshot" };
  if ((request.headers.get("if-none-match") || "") === etag) { await g.value.cancel(); return new Response(null, { status: 304, headers: head }); }
  return new Response(g.value, { status: 200, headers: head });
}
