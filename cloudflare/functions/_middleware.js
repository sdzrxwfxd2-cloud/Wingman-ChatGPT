// Site password for the Cloudflare Pages copy: the Cloudflare equivalent of netlify/edge-functions/gate.ts (unchanged).
// Every page and asset needs the site password (SITE_PASSWORD secret), except the same paths gate.ts leaves open
// (/api/*, icons, manifest, /admin*). The Netlify gate's visit counter is NOT ported here as a KV write.
// Visits go through /api/visit-beacon + D1 (preferred) or the dedicated VISITORS_KV namespace.
import { isOpen } from "../lib/auth.mjs";

const ACCEPT_CH = "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Mobile, Sec-CH-UA";

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (isOpen(path)) return keepHtml(context, path);
  // MT 8 Nov 2026 23:23 SAST: site password removed for public pages. /dashboard-data keeps its own password check.
  return keepHtml(context, path);
}

// Cloudflare Pages "pretty URLs" 308-redirect /app.html -> /app and /index.html -> /. The site scripts test
// location.pathname (e.g. /app\.html$/ for the new ATO/DFE page, scripts and theme), so on Cloudflare the address must keep
// its .html exactly as on Netlify. When an .html request gets that redirect, serve the same asset bytes in place (200, URL unchanged).
async function keepHtml(context, path) {
  const res = await context.next();
  let out = res;
  if (path.endsWith(".html") && res.status >= 300 && res.status < 400 && context.env.ASSETS) {
    const loc = res.headers.get("location");
    if (loc) {
      const url = new URL(context.request.url), to = new URL(loc, url);
      const pretty = path.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
      if (to.origin === url.origin && to.pathname === pretty) {
        const asset = await context.env.ASSETS.fetch(new Request(new URL(pretty + url.search, url), context.request));
        out = asset.status >= 300 && asset.status < 400 ? res : asset;
      }
    }
  }
  return withVisitHints(out, path);
}

function withVisitHints(res, path) {
  if (!res) return res;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const html = ct.includes("text/html");
  if (!html && !path.endsWith(".html") && path !== "/") return res;
  const headers = new Headers(res.headers);
  headers.set("Accept-CH", ACCEPT_CH);
  let out = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  if (html && !path.startsWith("/admin")) {
    out = new HTMLRewriter().on("body", {
      element(el) { el.append('<script src="/wm-beacon.js" defer></script>', { html: true }); }
    }).transform(out);
  }
  return out;
}
