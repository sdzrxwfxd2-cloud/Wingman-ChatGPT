// Keep only the newest METAR per station (SPECI and COR handled). Pure function, unit-tested in tools/test_wx.mjs.
export function latestPerStation(rows, now = Date.now() / 1000) {
  const best = new Map();
  const key = r => [Number(r.obsTime) || 0, Date.parse(String(r.receiptTime || "").replace(" ", "T") + "Z") || 0,
                    /\bCOR\b/.test(r.rawOb || "") ? 1 : 0, (r.rawOb || "").length];
  const cmp = (a, b) => { const x = key(a), y = key(b); for (let i = 0; i < 4; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  for (const r of rows || []) {
    const id = String(r.icaoId || "").trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(id)) continue;
    const t = Number(r.obsTime);
    if (!Number.isFinite(t) || t > now + 600) continue; // missing or future-dated
    if (/\bNIL\b/.test(r.rawOb || "")) continue;
    const p = best.get(id);
    if (!p || cmp(r, p) > 0) best.set(id, { ...r, icaoId: id });
  }
  return [...best.values()];
}
