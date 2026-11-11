// /api/metar and /api/taf on Cloudflare: same JSON array as netlify/functions/wx.mjs, but served from the shared snapshot
// (the companion Worker already applies the 2 h METAR / 6 h TAF last-good limits). If the snapshot has nothing, one live
// server-side fetch is tried (never from the browser), with no storage write.
import { readSnap } from "./snap_read.mjs";
import { latestPerStation } from "../../netlify/lib/wx_latest.mjs";
const UP = { metar: "https://aviationweather.gov/api/data/metar?bbox=-35.5,16,-22,33.5&format=json&hours=3",
  taf: "https://aviationweather.gov/api/data/taf?bbox=-35.5,16,-22,33.5&format=json" };
const J = (body, status, h = {}) => new Response(body, { status, headers: { "Content-Type": "application/json", ...h } });
export async function wxRoute(kind, request, env) {
  const s = await readSnap(env);
  if (s) {
    let rows = s.part(kind), at = s.meta[kind + "At"] || null;
    if (rows == null) { const f = s.full(); rows = JSON.stringify((f[kind] && f[kind].rows) || []); at = f[kind] && f[kind].fetchedAt; }
    if (rows && rows !== "[]") {
      return J(rows, 200, { "Cache-Control": "public, max-age=60", "X-WX-Source": "snapshot", ...(at ? { "X-WX-Updated": at } : {}) });
    }
  }
  try {
    const r = await fetch(UP[kind], { headers: { "User-Agent": "GoAround-cloudflare/1.0" }, signal: AbortSignal.timeout(6000) });
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) return J(JSON.stringify(kind === "metar" ? latestPerStation(j) : j), 200, { "Cache-Control": "public, max-age=60", "X-WX-Source": "live" }); }
  } catch {}
  return J('{"error":"upstream failed"}', 502, { "Cache-Control": "no-store" });
}
