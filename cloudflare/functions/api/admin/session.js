import { sameSecret, mintCookie, clearCookie, hasSession, json } from "../../../lib/admin_session.mjs";

export async function onRequestGet({ request, env }) {
  const secret = env.ADMIN_DASH_SECRET;
  if (!secret) return json({ ok: false, error: "admin password is not set" }, 503);
  const ok = await hasSession(request, secret);
  return json({ ok }, ok ? 200 : 401);
}

export async function onRequestPost({ request, env }) {
  const secret = env.ADMIN_DASH_SECRET;
  if (!secret) return json({ error: "admin password is not set" }, 503);
  let body = {};
  try { body = await request.json(); } catch {}
  const password = body && typeof body.password === "string" ? body.password : "";
  if (!(await sameSecret(password, secret))) {
    return json({ error: "wrong password" }, 401);
  }
  return json({ ok: true }, 200, { "Set-Cookie": await mintCookie(secret) });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
}
