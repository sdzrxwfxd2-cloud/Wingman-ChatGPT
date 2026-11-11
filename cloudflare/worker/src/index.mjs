// go-around-weather: the companion Worker for the Cloudflare Pages copy of Go Around (feat/cloudflare-pages, 7 Nov 2026).
// Cron Trigger every 10 min runs the SAME tick as netlify/functions/weather-snapshot-tick.mjs (netlify/lib/wx_snapshot.mjs):
// persisted due times METAR 20 min / TAF 40 min / model 80-min target, free Open-Meteo budget (9,500 weighted calls/day,
// one request of <= 100 locations per tick, <= 110/min vs the 600/min limit), 429 cool-down ladder, 90-min fresh guard,
// last-good kept. Storage: Workers KV instead of Netlify Blobs, 2 writes per tick (see cloudflare/lib/kv_bundle.mjs).
// Paid Open-Meteo later: `wrangler secret put OPEN_METEO_KEY` (never in the repo) switches to customer-api and 3 requests/tick.
import { tick } from "../../../netlify/lib/wx_snapshot.mjs";
import { bundleStore, flush, KV_KEYS } from "../../lib/kv_bundle.mjs";
import { fastCompose } from "../../lib/fast_compose.mjs";

export async function runTick(env, opts = {}) {
  const s = bundleStore(await env.WX.get(KV_KEYS.work, "text"));
  let last = null;
  const r = await tick(s, { key: env.OPEN_METEO_KEY || "", seed: false, compose: (...a) => (last = fastCompose(...a)), ...opts });
  const writes = await flush(env.WX, s, last && last.off ? { off: last.off, metarAt: last.metarAt, tafAt: last.tafAt } : { slow: true }, last && last.now);
  console.log(JSON.stringify({ job: "go-around-weather", kvWrites: writes, ...r.log }));
  return r;
}

export default {
  async scheduled(controller, env, ctx) { await runTick(env); },
  // No public trigger: a manual refresh from a browser could burn the free Open-Meteo quota. Status only.
  async fetch(req, env) {
    const g = await env.WX.getWithMetadata(KV_KEYS.snapshot, { type: "stream" });
    if (g.value) await g.value.cancel();
    return new Response(JSON.stringify({ worker: "go-around-weather", snapshotComposedAt: (g.metadata && g.metadata.composedAt) || null }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  },
};
