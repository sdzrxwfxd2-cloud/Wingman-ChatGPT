import { requireAdmin, json } from "../../../lib/admin_session.mjs";
import { summarize, storageKind } from "../../../lib/visit_store.mjs";

function windowMs(range) {
  if (range === "1d" || range === "today") return 24 * 60 * 60 * 1000;
  if (range === "30d") return 30 * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export async function onRequestGet({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return gate.res;
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const until = Date.now();
  const since = until - windowMs(range);
  const store = storageKind(env);
  if (!store) return json({ error: "storage_not_ready", store: null, range, since, until });
  const day = await summarize(env, { since: until - windowMs("1d"), until });
  const week = range === "7d" ? await summarize(env, { since, until }) : await summarize(env, { since: until - windowMs("7d"), until });
  const month = range === "30d" ? await summarize(env, { since, until }) : await summarize(env, { since: until - windowMs("30d"), until });
  const chosen = range === "1d" || range === "today" ? day : range === "30d" ? month : week;
  return json({
    now: new Date().toISOString(),
    tz: "Africa/Johannesburg",
    store,
    range,
    today: { visits: day.visits, uniques: day.uniques },
    d7: { visits: week.visits, uniques: week.uniques },
    d30: { visits: month.visits, uniques: month.uniques },
    days: chosen.days || [],
    pages: chosen.pages || [],
    countries: chosen.countries || [],
    cities: chosen.cities || [],
    devices: chosen.devices || [],
    browsers: chosen.browsers || [],
    os: chosen.os || [],
    referrers: chosen.referrers || [],
    models: chosen.models || [],
    cloudflare: { connected: false, note: "Cloudflare GraphQL analytics is optional. The visitor log on this page is the source of visits, devices and IPs. A read-only Analytics token can be added later as the Cloudflare secret CF_ANALYTICS_TOKEN." },
    note: "A visitor's name cannot be collected. Phones and computers do not share the owner's name."
  });
}
