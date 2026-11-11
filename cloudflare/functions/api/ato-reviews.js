// /api/ato-reviews (Cloudflare port of netlify/functions/ato-reviews.mjs). Storage: KV prefix "atoreviews/".
// Same rules: writes are refused (401) until a real per-user login exists, so this only reads today.
import { validate, canWrite, incentivised, publicView, aggregate, reviewKey, atoKey, SIX_MONTHS_MS } from "../../../netlify/lib/ato_reviews_core.mjs";
import { kvStore } from "../../lib/kv_store.mjs";
const H = { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
function accountId() { return null; }   // TODO(backend login), same as the Netlify version
export async function onRequest({ request, env }) {
  if (!env.WX) return J({ error: "no store" }, 503);
  const st = kvStore(env.WX, "atoreviews"), u = new URL(request.url), acct = accountId(request);
  const CAMPAIGN = env.WM_REVIEW_CAMPAIGN ? JSON.parse(env.WM_REVIEW_CAMPAIGN) : null;
  if (request.method === "GET") {
    if (u.searchParams.get("mine") === "1") {
      if (!acct) return J({ error: "sign in required" }, 401);
      const idx = (await st.get(`u/${acct}`, { type: "json" })) || []; const out = [];
      for (const a of idx) { const r = await st.get(reviewKey(a, acct), { type: "json" }); if (r) out.push(publicView(r)); }
      return J({ reviews: out });
    }
    const ato = atoKey(u.searchParams.get("ato")); if (!ato) return J({ error: "ato required" }, 400);
    const { blobs } = await st.list({ prefix: `r/${ato}/` }); const list = [];
    for (const b of blobs) { const r = await st.get(b.key, { type: "json" }); if (r) list.push(r); }
    list.sort((a, b) => b.created - a.created);
    const mine = acct ? list.find((r) => r.acct === acct) : null;
    return J({ ato, aggregate: aggregate(list), reviews: list.map(publicView), mine: mine ? { id: mine.id, canEditAfter: mine.created + SIX_MONTHS_MS } : null });
  }
  if (request.method === "POST") {
    if (!acct) return J({ error: "sign in required" }, 401);
    const txt = await request.text(); if (txt.length > 8000) return J({ error: "too big" }, 413);
    let body; try { body = JSON.parse(txt); } catch { return J({ error: "bad json" }, 400); }
    const v = validate(body); if (!v.ok) return J({ error: "invalid", errors: v.errors }, 422);
    const key = reviewKey(v.clean.ato, acct), prev = await st.get(key, { type: "json" }), now = Date.now();
    const cw = canWrite(prev, now); if (!cw.allowed) return J({ error: "one review per ATO; you can replace yours after 6 months", until: cw.until }, 409);
    const r = { ...v.clean, id: crypto.randomUUID(), acct, created: now, incentivised: incentivised(CAMPAIGN, now) };
    await st.setJSON(key, r);
    const idx = (await st.get(`u/${acct}`, { type: "json" })) || []; if (!idx.includes(v.clean.ato)) { idx.push(v.clean.ato); await st.setJSON(`u/${acct}`, idx); }
    return J({ review: publicView(r) }, prev ? 200 : 201);
  }
  return J({ error: "GET or POST" }, 405);
}
