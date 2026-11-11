// Live traffic board from ADS-B: aircraft positions from api.adsb.lol (free, keyless, ODbL),
// route (origin/destination) per callsign from the adsb.lol VRS standing-data route database.
// Nothing is invented: flights without a route record are shown only under "nearby traffic".
const R = 6371e3 / 1852; // earth radius in NM
const dist = (a, b, c, d) => { const t = x => x * Math.PI / 180; const h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const tfetch = (u, ms = 8000) => fetch(u, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "Wingman-dashboard/1.0" } });
export async function board(icao, lat, lon, radius = 150) {
  const pu = `https://api.adsb.lol/v2/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${radius}`;
  let j = null, err = "";
  for (let k = 0; k < 3 && !j; k++) {
    try { const r = await tfetch(pu); if (r.ok) j = await r.json(); else err = "adsb.lol HTTP " + r.status; } catch (e) { err = String(e); }
    if (!j) await new Promise(f => setTimeout(f, 1200 * (k + 1)));
  }
  if (!j) throw new Error(err || "adsb.lol unavailable");
  const ac = (j.ac || []).map(a => ({ cs: (a.flight || "").trim(), reg: a.r || null, type: a.t || null, hex: a.hex,
    alt: a.alt_baro === "ground" ? 0 : (a.alt_baro ?? a.alt_geom ?? null), ground: a.alt_baro === "ground",
    gs: a.gs ?? null, vs: a.baro_rate ?? a.geom_rate ?? null, trk: a.track ?? null, lat: a.lat ?? null, lon: a.lon ?? null, sq: a.squawk || null,
    d: (a.lat != null && a.lon != null) ? Math.round(dist(lat, lon, a.lat, a.lon) * 10) / 10 : null, seen: a.seen_pos ?? a.seen ?? null }))
    .filter(a => a.d != null).sort((x, y) => x.d - y.d);
  const withCs = ac.filter(a => /^[A-Z]{3}\d/.test(a.cs)).slice(0, 60);
  await Promise.all(withCs.map(async a => {
    try { const q = await tfetch(`https://vrs-standing-data.adsb.lol/routes/${a.cs.slice(0, 2)}/${a.cs}.json`, 5000);
      if (q.ok) { const k = await q.json(); a.route = (k.airport_codes || "").split("-").filter(Boolean); a.rname = (k._airports || []).map(x => x.name); } } catch {}
  }));
  const dep = [], arr = [];
  for (const a of ac) {
    if (!a.route) continue; const i = a.route.indexOf(icao); if (i < 0) continue;
    const last = a.route.length - 1, idx = (c) => a.route.indexOf(c);
    if (i === 0) dep.push({ ...a, to: a.route[1], toName: a.rname?.[1] });
    else if (i === last) arr.push({ ...a, from: a.route[i - 1], fromName: a.rname?.[i - 1] });
    else { // multi-leg route: decide by vertical trend near the field; otherwise list under both with note
      if ((a.vs ?? 0) > 300) dep.push({ ...a, to: a.route[i + 1], toName: a.rname?.[i + 1], multi: true });
      else arr.push({ ...a, from: a.route[i - 1], fromName: a.rname?.[i - 1], multi: true });
    }
  }
  const near = ac.filter(a => a.d <= 15).slice(0, 25);
  return { icao, updated: new Date().toISOString(), now: j.now ?? null, radius, total: ac.length, dep, arr, near, pos: ac.slice(0, 150).map(a => ({ cs: a.cs, lat: a.lat, lon: a.lon, trk: a.trk, alt: a.alt, gs: a.gs, type: a.type, d: a.d })),
    source: "ADS-B positions: api.adsb.lol (ODbL). Routes: adsb.lol VRS standing-data route database (scheduled, crowd-sourced)." };
}
