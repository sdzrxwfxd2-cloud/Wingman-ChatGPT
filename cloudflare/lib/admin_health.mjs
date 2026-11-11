// Read-only health checks for the rebuilt admin pages (/admin-status, /admin-sitestatus, /admin-dashboard), 11 Nov 2026.
// Pure helpers are exported for tests. Nothing here writes to KV or D1.
export const OFFICIAL = {
  metar: "https://aviationweather.gov/api/data/metar?bbox=-35.5,16,-22,33.5&format=json&hours=3",
  taf: "https://aviationweather.gov/api/data/taf?bbox=-35.5,16,-22,33.5&format=json"
};
export const PAGES = ["/", "/index.html", "/main.html", "/status.html", "/c/app.html", "/fact.html", "/calculator.html", "/pilot.html",
  "/library.html", "/logbook.html", "/brief.html", "/chart_v2/Wingman_Chart_v2.html", "/ops-stamp.json"];

// report time in ms for one AWC row (METAR obsTime is epoch seconds, TAF issueTime is ISO)
export function reportMs(kind, r) {
  if (!r) return 0;
  if (kind === "metar") { const t = Number(r.obsTime); if (t) return t * 1000; return Date.parse(r.reportTime || "") || 0; }
  return Date.parse(r.issueTime || r.bulletinTime || "") || 0;
}

// newest row per station id
export function latestById(kind, rows) {
  const m = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    const id = r && r.icaoId; if (!id) continue;
    const t = reportMs(kind, r), cur = m.get(id);
    if (!cur || t > cur.t) m.set(id, { id, t, raw: r.rawOb || r.rawTAF || "" });
  }
  return m;
}

// Compare the site's feed with the official one. behind = official has a newer report; missing = official has a recent one the
// site lacks; old = official itself has nothing recent (METAR > 90 min, TAF > 12 h) so it is not counted as missing.
export function compareWx(kind, siteRows, officialRows, now = Date.now()) {
  const site = latestById(kind, siteRows), up = latestById(kind, officialRows);
  const oldMs = kind === "metar" ? 90 * 6e4 : 12 * 36e5;
  const behind = [], missing = [], old = [];
  let match = 0, total = 0;
  for (const [id, o] of up) {
    if (now - o.t > oldMs) { old.push({ id, ageMin: Math.round((now - o.t) / 6e4) }); continue; }
    total++;
    const s = site.get(id);
    if (!s) { missing.push(id); continue; }
    if (s.t >= o.t) match++;
    else behind.push({ id, site: s.t, up: o.t });
  }
  behind.sort((a, b) => (b.up - b.site) - (a.up - a.site));
  missing.sort(); old.sort((a, b) => a.ageMin - b.ageMin);
  const stations = [...new Set([...site.keys(), ...up.keys()])].sort().map((id) => {
    const s = site.get(id), o = up.get(id);
    return { id, site: s ? s.t : 0, up: o ? o.t : 0, raw: (s || o).raw.slice(0, 200) };
  });
  return { match, total, behind, missing, old, siteN: site.size, upN: up.size, stations };
}

// Uptime from the probe history other pages record (ops/probes). Read only.
export function uptimeOf(hist, depId) {
  const h = Array.isArray(hist) ? hist : [];
  const mine = h.filter((x) => x.d === depId);
  return { checks: mine.length, ok: mine.filter((x) => x.up).length, first: mine[0]?.t || null, all: h.length, allOk: h.filter((x) => x.up).length,
    allFirst: h[0]?.t || null, last: h.length ? h[h.length - 1].t : null, downs: h.filter((x) => !x.up).slice(-10).map((x) => x.t),
    wxDowns: h.filter((x) => x.wx === false).slice(-10).map((x) => x.t), recent: h.slice(-48).map((x) => ({ t: x.t, up: !!x.up, ms: x.ms || 0 })) };
}

export function pageOk(p) { return p.s === 200 && p.complete !== false && !p.clash; }

// errors list from all the checks
export function errorsOf({ now, probes, wx, health, pages, uptime }) {
  const t = new Date(now).toISOString(), out = [];
  const chk = (what, p, ok) => { if (p && !ok.includes(p.s)) out.push({ t, what, detail: "HTTP " + p.s + (p.e ? " · " + p.e : "") + " in " + p.ms + " ms" }); };
  if (probes) {
    chk("Site home page", probes.site, [200, 401]); chk("METAR function /api/metar", probes.metar, [200]); chk("TAF function /api/taf", probes.taf, [200]);
    chk("Flights function", probes.flights, [200]); chk("Weather model /api/model-weather", probes.model, [200]);
  }
  if (wx) for (const k of ["metar", "taf"]) { const u = wx[k] && wx[k].up; if (u && u.s !== 200) out.push({ t, what: "Official " + k.toUpperCase() + " (aviationweather.gov)", detail: "HTTP " + u.s + (u.e ? " · " + u.e : "") }); }
  if (health) for (const [n, x] of [["METAR", health.metar], ["TAF", health.taf]]) if (x && x.status !== 200) out.push({ t: x.t, what: n + " snapshot last upstream fetch", detail: "HTTP " + x.status + (x.error ? " · " + String(x.error).slice(0, 120) : "") + (x.lastOk ? " · last good " + x.lastOk : "") });
  for (const p of (pages || [])) if (!pageOk(p)) out.push({ t, what: "Page " + p.p, detail: p.clash ? "merge clash marker in the page" : p.s !== 200 ? "HTTP " + p.s : "page is cut off" });
  if (uptime) uptime.downs.forEach((d) => out.push({ t: d, what: "Site down at a recorded check", detail: "site probe failed" }));
  return out;
}
