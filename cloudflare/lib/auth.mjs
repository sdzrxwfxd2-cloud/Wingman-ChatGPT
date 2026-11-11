// Cloudflare equivalent of netlify/edge-functions/gate.ts (which stays untouched): HTTP Basic Auth with the site password
// from the SITE_PASSWORD secret. Any user name, password must match. Constant-time compare (SHA-256 of both sides).
export const REALM = 'Basic realm="Wingman demo", charset="UTF-8"';
// the same paths gate.ts leaves open (its config.excludedPath)
export const OPEN = new Set(["/admin", "/admin-status.html", "/admin-visitors.html", "/favicon.ico", "/favicon-16.png", "/favicon-32.png",
  "/favicon-48.png", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png", "/icon-192.png", "/icon-512.png",
  "/icon-maskable-512.png", "/manifest.json", "/logo-mark.png"]);
export const isOpen = (path) => OPEN.has(path) || path.startsWith("/api/");

export function passwordOf(header) {
  const h = header || ""; if (!h.startsWith("Basic ")) return null;
  try { return atob(h.slice(6)).split(":").slice(1).join(":"); } catch { return null; }
}
const enc = new TextEncoder();
export async function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(x, y);
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i]; return d === 0;
}
export async function authorised(header, pass) { const pw = passwordOf(header); return pw !== null && !!pass && sameSecret(pw, pass); }
export const challenge = () => new Response("Password required", { status: 401, headers: { "WWW-Authenticate": REALM, "Cache-Control": "no-store" } });
