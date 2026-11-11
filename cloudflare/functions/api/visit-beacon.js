// POST /api/visit-beacon — first-party visit log.
// Client: site/wm-beacon.js (sendBeacon, no cookies, no layout).
// Server adds IP (CF-Connecting-IP), country/city/region (request.cf), UA + Client Hints.
// A visitor's name cannot be collected: devices do not share it.
import { parseUA } from "../../lib/ua_parse.mjs";
import { insertVisit, storageKind } from "../../lib/visit_store.mjs";

const ACCEPT_CH = "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Mobile, Sec-CH-UA";
const HEAD = { "Cache-Control": "no-store", "Accept-CH": ACCEPT_CH };

const recent = new Map();
function rateOk(ip) {
  const now = Date.now();
  const row = recent.get(ip) || [];
  const keep = row.filter((t) => now - t < 60_000);
  if (keep.length >= 30) { recent.set(ip, keep); return false; }
  keep.push(now);
  recent.set(ip, keep);
  if (recent.size > 4000) {
    for (const [k, v] of recent) if (!v.length || now - v[v.length - 1] > 60_000) recent.delete(k);
  }
  return true;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...HEAD, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!storageKind(env)) return new Response(null, { status: 204, headers: HEAD });
    const ip = request.headers.get("CF-Connecting-IP") || "";
    if (ip && !rateOk(ip)) return new Response(null, { status: 204, headers: HEAD });
    const text = await request.text();
    if (text.length > 8000) return new Response(null, { status: 204, headers: HEAD });
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!body || typeof body !== "object") body = {};
    // automated browsers and bots are not visitors (on 10 Nov ~95% of rows were one scripted iPhone profile from a US data
    // centre, and they used up the KV free plan's 1,000 new keys a day by 04:16 UTC, so real visits after that were lost)
    if (body.wd === 1 || /bot|crawl|spider|slurp|HeadlessChrome|GoAround-|Lighthouse|python-requests|curl\//i.test(request.headers.get("User-Agent") || "")) {
      return new Response(null, { status: 204, headers: HEAD });
    }
    const cf = request.cf || {};
    const ua = request.headers.get("User-Agent") || String(body.ua || "");
    const hints = {
      model: request.headers.get("Sec-CH-UA-Model") || body.model || "",
      platform: (request.headers.get("Sec-CH-UA-Platform") || body.plat || "").replace(/"/g, ""),
      platformVersion: request.headers.get("Sec-CH-UA-Platform-Version") || body.platv || "",
      mobile: request.headers.get("Sec-CH-UA-Mobile") === "?1" || body.mobile === 1,
      brands: request.headers.get("Sec-CH-UA") || body.brands || ""
    };
    const parsed = parseUA(ua, hints);
    let path = String(body.path || "");
    try { if (!path && request.headers.get("Referer")) path = new URL(request.headers.get("Referer")).pathname; } catch {}
    if (path && !path.startsWith("/")) path = "/";
    const ref = String(body.ref || "");
    const screen = (body.sw && body.sh) ? `${body.sw}x${body.sh}` : "";
    const viewport = (body.vw && body.vh) ? `${body.vw}x${body.vh}` : "";
    await insertVisit(env, {
      ts: Date.now(),
      sid: body.sid,
      n: body.n,
      path: path || "/",
      ref,
      ip,
      country: cf.country || "",
      city: cf.city || "",
      region: cf.region || cf.regionCode || "",
      continent: cf.continent || "",
      ua,
      device_type: parsed.device_type,
      device_model: parsed.device_model,
      browser: parsed.browser,
      os: parsed.os,
      os_ver: parsed.os_ver,
      screen,
      viewport,
      lang: body.lang || body.langs || "",
      tz: body.tz || "",
      dpr: body.dpr,
      net: body.net || ""
    });
  } catch (e) {
    // Never fail the page: beacon errors are silent.
  }
  return new Response(null, { status: 204, headers: HEAD });
}

export async function onRequest() {
  return new Response(null, { status: 204, headers: HEAD });
}
