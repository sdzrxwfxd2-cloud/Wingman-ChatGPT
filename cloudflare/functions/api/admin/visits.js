import { requireAdmin, json } from "../../../lib/admin_session.mjs";
import { listVisits, storageKind } from "../../../lib/visit_store.mjs";

export async function onRequestGet({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return gate.res;
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const ms = range === "1d" || range === "today" ? 86400000 : range === "30d" ? 30 * 86400000 : 7 * 86400000;
  const until = Date.now();
  const since = until - ms;
  const store = storageKind(env);
  if (!store) return json({ rows: [], store: null });
  const out = await listVisits(env, {
    since, until,
    country: url.searchParams.get("country") || "",
    device: url.searchParams.get("device") || "",
    q: url.searchParams.get("q") || "",
    ip: url.searchParams.get("ip") || "",
    limit: url.searchParams.get("limit") || 100
  });
  return json({ store: out.store, rows: out.rows, totalMatched: out.totalMatched || out.rows.length });
}
