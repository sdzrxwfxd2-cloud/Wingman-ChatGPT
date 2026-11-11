// Small Netlify-Blobs-shaped wrapper over one Workers KV namespace (key prefix = store name), for the low-traffic routes
// (ATO reviews). Same calls the Netlify functions use: get(k, {type:"json"}), setJSON, list({prefix}).
export function kvStore(kv, name) {
  const p = name + "/";
  return {
    get: async (k, o) => kv.get(p + k, o && o.type === "json" ? "json" : "text"),
    setJSON: async (k, v) => kv.put(p + k, JSON.stringify(v)),
    list: async ({ prefix = "" } = {}) => { const blobs = []; let cursor;
      do { const r = await kv.list({ prefix: p + prefix, cursor }); for (const x of r.keys) blobs.push({ key: x.name.slice(p.length) }); cursor = r.list_complete ? null : r.cursor; } while (cursor);
      return { blobs }; },
  };
}
