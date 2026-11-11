// Separate admin-session check. Does not import or change lib/auth.mjs (off-limits).
// Password: Cloudflare Pages secret ADMIN_DASH_SECRET. Cookie is an HMAC over an expiry.
const COOKIE = "ga_admin";
const MAX_AGE = 60 * 60 * 12;
const enc = new TextEncoder();

export async function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const [x, y] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b))
  ]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  if (u.length !== v.length) return false;
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function mintCookie(secret) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  const sig = await hmacHex(secret, "v1|" + exp);
  return `${COOKIE}=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function readCookie(request) {
  const raw = request.headers.get("Cookie") || "";
  const m = raw.match(/(?:^|;\s*)ga_admin=([^;]+)/);
  return m ? m[1] : "";
}

export async function hasSession(request, secret) {
  if (!secret) return false;
  const tok = readCookie(request);
  const i = tok.indexOf(".");
  if (i < 1) return false;
  const exp = tok.slice(0, i), sig = tok.slice(i + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expect = await hmacHex(secret, "v1|" + exp);
  return sameSecret(sig, expect);
}

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...extra }
  });
}

export async function requireAdmin(request, env) {
  const secret = env.ADMIN_DASH_SECRET;
  if (!secret) return { ok: false, res: json({ error: "admin password is not set" }, 503) };
  if (!(await hasSession(request, secret))) return { ok: false, res: json({ error: "auth" }, 401) };
  return { ok: true };
}
