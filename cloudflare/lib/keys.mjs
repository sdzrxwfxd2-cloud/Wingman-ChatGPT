// KV keys shared by the companion Worker (writer) and the Pages Functions (readers). Tiny on purpose: the Pages Functions
// import only this, never the snapshot engine.
export const KV_KEYS = { work: "wx/work", snapshot: "wx/snapshot", now: "wx/now", probes: "ops/probes" };
