// /visitor-log-data — JSON of recent visits, admin-session only (replaces the old 501 stub).
import { requireAdmin, json } from "../lib/admin_session.mjs";
import { listVisits, storageKind } from "../lib/visit_store.mjs";

export async function onRequestGet({ request, env }) {
  const gate = await requireAdmin(request, env);
  if (!gate.ok) return gate.res;
  const store = storageKind(env);
  if (!store) return json({ error: "storage_not_ready", rows: [] });
  const out = await listVisits(env, { since: Date.now() - 7 * 86400000, until: Date.now(), limit: 100 });
  return json({ store: out.store, rows: out.rows });
}
