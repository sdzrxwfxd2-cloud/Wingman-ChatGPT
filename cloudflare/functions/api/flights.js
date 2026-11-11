// GET /api/flights (Cloudflare port of netlify/functions/flights.mjs): live board around an aerodrome from keyless ADS-B sources.
import { board } from "../../../netlify/lib/flights_core.mjs";
export async function onRequestGet({ request }) {
  const u = new URL(request.url); const icao = (u.searchParams.get("icao") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const lat = +u.searchParams.get("lat"), lon = +u.searchParams.get("lon");
  if (!icao || !isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return new Response('{"error":"bad params"}', { status: 400 });
  try { return new Response(JSON.stringify(await board(icao, lat, lon)), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" } }); }
  catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: { "Content-Type": "application/json" } }); }
}
