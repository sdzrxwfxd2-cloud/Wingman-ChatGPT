/*!
 * wm-core.js — Wingman GO / CAUTION / NO-GO engine. v1.2 (28 Oct 2026). DEMO.
 * One dependency-free module used by cards, glow, counts, Status and filter chips.
 * Plain-English spec: wingman_core_rules.md. Sources: SOURCES.md.
 * Guidance only — the pilot in command decides.
 *
 * Units: visibility km, ceiling ft AGL, wind kt, temperature °C, QNH hPa, elevation ft, time = epoch ms.
 * Status levels: 'go' < 'caution' < 'nogo'. 'none' = no weather at all.
 */
(function (root) {
  'use strict';

  // ───────────────────────── constants ─────────────────────────
  var VERSION = '1.1.0';
  var HELI_WHY = 'Heliport \u2014 no GO / CAUTION / NO-GO verdict. Model weather, not an official report. For emergency reference only.';
  var DISCLAIMER = 'Guidance only \u2014 the pilot in command decides.';

  /**
   * Legal floors. VFR: CAR 2011 91.06.21 (substituted by 33rd Amendment, GG55226, 21 Aug 2026).
   *  Table 1 (CTR, and ATZ not in a CTR): ground vis 5 km AND ceiling 1 500 ft to take off / land / approach.
   *  Table 2 (all other airspace, at or below 3 000 ft AMSL / 1 000 ft AGL, class F/G): 5 km, clear of cloud, surface in sight
   *  -> no legal ceiling number; ceil:null. Unknown airspace is treated as Table 1 (safe side).
   *  IFR: lowest CAT I (approach plate rules, UNCONFIRMED as SA law).
   */
  var LEGAL = {
    vfr: { vis: 5, ceil: 1500, src: 'SACAA CAR 91.06.21' },          // strictest VFR floor (used for typed numbers)
    ctr: { vis: 5, ceil: 1500, src: 'SACAA CAR 91.06.21 Table 1 (CTR/ATZ)', tag: 'CAR 91.06.21 Table 1', note: 'CTR/ATZ: 5 km and 1 500 ft ceiling (CAR 91.06.21 Table 1)' },
    other: { vis: 5, ceil: null, src: 'SACAA CAR 91.06.21 Table 2 (outside CTR/ATZ)', tag: 'CAR 91.06.21 Table 2', note: 'Outside CTR/ATZ: 5 km, clear of cloud, surface in sight (CAR 91.06.21 Table 2)' },
    ifr: { vis: 0.55, ceil: 200, src: 'CAT I floor \u2014 use the approach plate' },
    svfr: { vis: 1.5, ceil: 600, src: 'SACAA CAR 91.06.22 (CTR, ATC clearance, day only)' }
  };
  /** ad.airspace: 'ctr' | 'atz' | 'other'. Anything else = unknown -> Table 1. */
  function legalFor(ad) {
    var a = ad && ad.airspace;
    if (a === 'other') return { rule: LEGAL.other, known: true, kind: 'other' };
    return { rule: LEGAL.ctr, known: a === 'ctr' || a === 'atz', kind: a === 'ctr' || a === 'atz' ? a : 'unknown' };
  }

  /** Licence starting numbers. APP DEFAULTS, not regulation (SOURCES.md §F). */
  var LICENCE = {
    ppl: { name: 'PPL', vis: 8, ceil: 2500, xw: 12, gust: 25, tw: 5, night: false, ir: false },
    cpl: { name: 'CPL', vis: 5, ceil: 1500, xw: 15, gust: 25, tw: 5, night: false, ir: false },
    ir:  { name: 'IR',  vis: 6, ceil: 2000, xw: 12, gust: 25, tw: 5, night: true,  ir: true, ifrVis: 2, ifrCeil: 600 }
  };
  /**
   * Night numbers. APP DEFAULT, not regulation: CAR 91.06.21 (2026) has no separate night VMC numbers and
   * CAR 61.10.5 (night rating) only says the holder may fly by night (SOURCES.md \u00a7C). Applied after night starts.
   */
  var NIGHT = { vis: 8, ceil: 2500, appDefault: true, label: 'Night (app default, not law)' };

  /**
   * Max demonstrated crosswind (kt). ok:true = read from POH/AFM text; ok:false = UNCONFIRMED (secondary source or
   * POH not opened). xw:null = no value found -> licence number + CAUTION. Full source list: SOURCES.md \u00a7D.
   */
  var AIRCRAFT = [
    // Cessna
    { id: 'C172', name: 'Cessna 172S', grp: 'Cessna', xw: 15, ok: true, src: 'C172S POH \u00a75 Fig 5-4' },
    { id: 'C172NPR', name: 'Cessna 172 N/P/R', grp: 'Cessna', xw: 15, ok: false, src: 'Assumed same as 172S (POH not opened)' },
    { id: 'C150', name: 'Cessna 150', grp: 'Cessna', xw: null, ok: false, src: 'Varies by model (12\u201315 kt reported) \u2014 not verified' },
    { id: 'C152', name: 'Cessna 152', grp: 'Cessna', xw: 12, ok: false, src: 'C152 POH \u00a74 (secondary source)' },
    { id: 'C182', name: 'Cessna 182', grp: 'Cessna', xw: 15, ok: false, src: 'C182T POH (secondary source)' },
    // Piper
    { id: 'PA28', name: 'PA-28-161 Warrior', grp: 'Piper', xw: 17, ok: true, src: 'PA-28-161 AFM \u00a74' },
    { id: 'PA28A', name: 'PA-28-181 Archer', grp: 'Piper', xw: 17, ok: false, src: 'Archer POH (secondary source)' },
    { id: 'PA28C', name: 'PA-28 Cherokee 140/180', grp: 'Piper', xw: 17, ok: false, src: 'Assumed PA-28 family value (POH not opened)' },
    { id: 'PA28R', name: 'PA-28R Arrow', grp: 'Piper', xw: 17, ok: false, src: 'Assumed PA-28 family value (POH not opened)' },
    { id: 'PA32', name: 'PA-32 Saratoga / Six', grp: 'Piper', xw: 17, ok: false, src: 'PA-32-301 POH (search summary, text not read)' },
    { id: 'PA38', name: 'PA-38 Tomahawk', grp: 'Piper', xw: 15, ok: false, src: 'PA-38-112 POH (search summary, text not read)' },
    { id: 'PA34', name: 'PA-34 Seneca', grp: 'Piper', xw: 17, ok: true, src: 'PA-34 POH §2 placard: max demo crosswind 17 kt' },
    // Sling (South Africa)
    { id: 'SLG2', name: 'Sling 2', grp: 'Sling', xw: 15, ok: true, src: 'Sling LSA POH Rev 3.3 \u00a72.5' },
    { id: 'SLG4', name: 'Sling 4', grp: 'Sling', xw: 15, ok: true, src: 'Sling 4 POH Rev 2.2 \u00a72.5' },
    { id: 'SLGT', name: 'Sling TSi', grp: 'Sling', xw: null, ok: false, src: 'POH value not found' },
    { id: 'SLGN', name: 'Sling NGT', grp: 'Sling', xw: null, ok: false, src: 'POH value not found' },
    // Jabiru
    { id: 'J430', name: 'Jabiru J430', grp: 'Jabiru', xw: 14, ok: true, src: 'J430 manual \u00a72.7.6' },
    { id: 'J170', name: 'Jabiru J170', grp: 'Jabiru', xw: 14, ok: true, src: 'J170-D POH Rev 4 \u00a72.8' },
    { id: 'J230', name: 'Jabiru J230/J160', grp: 'Jabiru', xw: null, ok: false, src: 'POH value not found' },
    // Light sport / homebuilt common at SA clubs
    { id: 'BTHK', name: 'Bathawk', grp: 'LSA', xw: null, ok: false, src: 'No published value found' },
    { id: 'A22', name: 'Aeroprakt A22 Foxbat', grp: 'LSA', xw: 15, ok: false, src: 'Search summary only, POH not opened' },
    { id: 'SAVS', name: 'ICP Savannah S', grp: 'LSA', xw: null, ok: false, src: 'Only forum claims found' },
    { id: 'RV12', name: "Van's RV-12", grp: 'LSA', xw: 11, ok: false, src: "Van's RV-12 POH Rev 19 (search summary, text not read)" },
    { id: 'RV7', name: "Van's RV-7", grp: 'LSA', xw: 12, ok: false, src: 'Swiss STSB report 2290 (secondary)' },
    // Tecnam
    { id: 'P2008', name: 'Tecnam P2008', grp: 'Tecnam', xw: 15, ok: true, src: 'P2008 JC AFM \u00a72.18' },
    { id: 'P92', name: 'Tecnam P92', grp: 'Tecnam', xw: 15, ok: true, src: 'P92 Eaglet Flight Manual Rev 8 \u00a72.1.24' },
    { id: 'P2002', name: 'Tecnam P2002 Sierra', grp: 'Tecnam', xw: 22, ok: true, src: 'P2002 POH \u00a72.1.24 / \u00a74.5' },
    // Diamond / Robin / Beech
    { id: 'DA20', name: 'Diamond DA20', grp: 'Diamond', xw: 20, ok: true, src: 'DA20-C1 AFM' },
    { id: 'DA40', name: 'Diamond DA40', grp: 'Diamond', xw: 20, ok: false, src: 'Diamond spec sheet (not AFM)' },
    { id: 'DA42', name: 'Diamond DA42', grp: 'Diamond', xw: 20, ok: false, src: 'DA42 QRH (not AFM)' },
    { id: 'DR400', name: 'Robin DR400', grp: 'Robin', xw: null, ok: false, src: 'POH value not found' },
    { id: 'BE36', name: 'Beech Bonanza A36', grp: 'Beech', xw: 17, ok: false, src: 'A36 POH \u00a75 (search summary, text not read)' }
  ];

  var CFG = {
    margin: 0.2,            // CAUTION within 20 % of a limit
    staleMin: 90,           // METAR older than this = old
    trendH: 2,              // TAF look-ahead hours
    nightWarnMin: 60,       // CAUTION this long before night
    daCaution: 8000,        // density altitude ft
    modelTtlMin: 15         // model cache
  };

  /** Fields: dir 'min' = observed value must be >= limit (vis, ceil); 'max' = must be <= limit (wind). */
  var FIELDS = {
    vis:  { dir: 'min', unit: 'km', label: 'Visibility', lo: 0.5, hi: 50, step: 0.5 },
    ceil: { dir: 'min', unit: 'ft', label: 'Cloud base', lo: 200, hi: 10000, step: 100 },
    xw:   { dir: 'max', unit: 'kt', label: 'Crosswind', lo: 3, hi: 40, step: 1 },
    gust: { dir: 'max', unit: 'kt', label: 'Gust', lo: 5, hi: 35, step: 1 },
    tw:   { dir: 'max', unit: 'kt', label: 'Tailwind', lo: 0, hi: 20, step: 1 }
  };

  var LV = { none: -1, go: 0, caution: 1, nogo: 2 };
  var R = Math.PI / 180;

  // ───────────────────────── helpers ─────────────────────────
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function aircraft(id) { for (var i = 0; i < AIRCRAFT.length; i++) if (AIRCRAFT[i].id === id) return AIRCRAFT[i]; return AIRCRAFT[0]; }
  function fmtN(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  function fmtV(f, v) { return f === 'vis' ? (Math.round(v * 10) / 10) + ' km' : fmtN(v) + ' ' + FIELDS[f].unit; }
  /** South Africa has no DST: SAST = UTC+2 always. */
  function sast(ms) { var d = new Date(ms + 7200e3); return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2); }
  function worst(a, b) { return LV[a] >= LV[b] ? a : b; }

  // ───────────────────────── profile ─────────────────────────
  var KEY = 'wm-profile';
  function store() { try { return root.localStorage || null; } catch (e) { return null; } }
  function defaultProfile() { return { licence: 'ppl', night: false, aircraft: 'C172', rules: 'vfr', custom: {} }; }

  function normProfile(p) {
    var d = defaultProfile(); p = p || {};
    var out = {
      licence: LICENCE[p.licence] ? p.licence : d.licence,
      night: !!p.night,
      aircraft: aircraft(p.aircraft).id,
      rules: p.rules === 'ifr' ? 'ifr' : 'vfr',
      custom: {}
    };
    if (out.licence === 'ir') out.night = true;
    if (out.rules === 'ifr' && out.licence !== 'ir') out.rules = 'vfr';
    var c = p.custom || {};
    for (var f in FIELDS) if (num(c[f])) out.custom[f] = c[f];
    if (num(out.custom.gust) && out.custom.gust > FIELDS.gust.hi) out.custom.gust = FIELDS.gust.hi;
    return out;
  }

  /** Read profile; on first run migrate old keys wm-lvl / wm-ac / wm-rules / wm-night / wm-limits. */
  function getProfile(ls) {
    ls = ls || store(); if (!ls) return defaultProfile();
    var raw = ls.getItem(KEY);
    if (raw) { try {
      var parsed = JSON.parse(raw);
      var pLoaded = normProfile(parsed);
      var storedGust = parsed.custom && parsed.custom.gust;
      if (num(storedGust) && storedGust > FIELDS.gust.hi) ls.setItem(KEY, JSON.stringify(pLoaded));
      return pLoaded;
    } catch (e) { /* fall through to migrate */ } }
    var p = defaultProfile();
    var lvl = ls.getItem('wm-lvl'); if (LICENCE[lvl]) p.licence = lvl;
    var ac = ls.getItem('wm-ac'); if (ac) p.aircraft = ac;
    if (ls.getItem('wm-rules') === 'ifr') p.rules = 'ifr';
    var n = ls.getItem('wm-night'); if (n === '1' || n === 'true' || n === 'on') p.night = true;
    var lim = ls.getItem('wm-limits');
    if (lim) { try {
      var L = JSON.parse(lim), base = LICENCE[p.licence];
      // Old Engine A: gv/gc = CAUTION thresholds. Keep only if stricter than licence. Wind keys were total wind, not crosswind: dropped.
      if (num(L.gv) && L.gv > base.vis) p.custom.vis = L.gv;
      if (num(L.gc) && L.gc > base.ceil) p.custom.ceil = L.gc;
    } catch (e) {} }
    p = normProfile(p); ls.setItem(KEY, JSON.stringify(p));
    return p;
  }

  function setProfile(p, ls) {
    p = normProfile(p); ls = ls || store();
    if (ls) {
      ls.setItem(KEY, JSON.stringify(p));
      // keep old keys in sync so pages not yet migrated still work
      ls.setItem('wm-lvl', p.licence); ls.setItem('wm-ac', p.aircraft); ls.setItem('wm-rules', p.rules); ls.setItem('wm-night', p.night ? '1' : '0');
    }
    return p;
  }

  // ───────────────────────── minimums ─────────────────────────
  /** Starting value (before "You") for a field and its origin label. */
  function baseOf(f, p, isNight) {
    var lic = LICENCE[p.licence], ac = aircraft(p.aircraft);
    var v = lic[f], o = 'Licence';
    if (isNight && (f === 'vis' || f === 'ceil') && NIGHT[f] > v) { v = NIGHT[f]; o = 'Night'; } // app default
    if (f === 'xw' && num(ac.xw) && ac.xw <= v) { v = ac.xw; o = 'Aircraft'; }
    if ((f === 'vis' || f === 'ceil') && v < LEGAL.vfr[f]) { v = LEGAL.vfr[f]; o = 'Legal'; } // strictest VFR floor; per-aerodrome law checked in evaluate()
    return { value: v, origin: o };
  }
  /** Safe ceiling for wind fields: the number you may not exceed (aircraft for xw, licence otherwise). */
  function capOf(f, p) {
    var lic = LICENCE[p.licence], ac = aircraft(p.aircraft);
    if (f === 'xw') return num(ac.xw) ? { value: Math.max(ac.xw, 0), who: ac.id + ' limit' } : { value: lic.xw, who: lic.name + ' limit' };
    return { value: lic[f], who: lic.name + ' limit' };
  }

  /**
   * Effective minimums with origin labels.
   * @returns {{vis,ceil,xw,gust,tw, ifr?, flags:{warnDot:boolean}}} each field {value, origin, base, warn?}
   */
  function effectiveMinimums(profile, opts) {
    var p = normProfile(profile), isNight = !!(opts && opts.night), out = { flags: { warnDot: false } };
    for (var f in FIELDS) {
      var b = baseOf(f, p, isNight), c = p.custom[f], e = { value: b.value, origin: b.origin, base: b.value };
      if (num(c)) {
        var stricter = FIELDS[f].dir === 'min' ? c >= b.value : c <= b.value;
        if (stricter) { e.value = c; e.origin = 'You'; }
        else { e.warn = true; out.flags.warnDot = true; } // looser custom: kept for display, engine uses safe base
      }
      out[f] = e;
    }
    var lic = LICENCE[p.licence];
    if (lic.ir) out.ifr = { vis: { value: Math.max(lic.ifrVis, LEGAL.ifr.vis), origin: 'Licence' }, ceil: { value: Math.max(lic.ifrCeil, LEGAL.ifr.ceil), origin: 'Licence' } };
    return out;
  }

  // ───────────────────────── validation ─────────────────────────
  /**
   * Validate one typed number.
   * status: 'ok' (stricter, origin You) | 'default' (equals start) | 'above' (looser than licence/aircraft, amber; engine uses clamped)
   *         | 'legal' (below SACAA floor, springs back to clamped) | 'unrealistic' (shake, suggestion in clamped)
   * @returns {{status, clamped:number, message:string, origin:string}}
   */
  function validateInput(field, value, profile) {
    var F = FIELDS[field]; if (!F) throw new Error('unknown field ' + field);
    var p = normProfile(profile), b = baseOf(field, p, false), v = typeof value === 'string' ? parseFloat(value) : value;
    if (!num(v) || v < F.lo || v > F.hi) {
      var sug = b.value; // suggest the starting number
      return { status: 'unrealistic', clamped: sug, origin: b.origin, message: 'Did you mean ' + fmtV(field, sug) + '?' };
    }
    if (F.dir === 'min') {
      var legal = LEGAL.vfr[field];
      if (v < legal) return { status: 'legal', clamped: legal, origin: 'Legal', message: 'Legal VFR minimum is ' + fmtV(field, legal) + ' (' + LEGAL.vfr.src + ')' };
      if (v < b.value) return { status: 'above', clamped: b.value, origin: b.origin, message: 'Below ' + LICENCE[p.licence].name + ' minimum ' + fmtV(field, b.value) + ' \u2014 cards use ' + fmtV(field, b.value) };
      if (v === b.value) return { status: 'default', clamped: v, origin: b.origin, message: '' };
      return { status: 'ok', clamped: v, origin: 'You', message: 'Stricter than ' + b.origin.toLowerCase() + ' \u2713' };
    }
    var cap = capOf(field, p), safe = Math.min(cap.value, b.value);
    if (v > safe) return { status: 'above', clamped: safe, origin: b.origin, message: 'Above ' + (v > cap.value ? cap.who : LICENCE[p.licence].name + ' limit') + ' ' + fmtV(field, v > cap.value ? cap.value : b.value) };
    if (v === b.value) return { status: 'default', clamped: v, origin: b.origin, message: '' };
    return { status: 'ok', clamped: v, origin: 'You', message: 'Stricter than ' + b.origin.toLowerCase() + ' \u2713' };
  }

  // ───────────────────────── weather ─────────────────────────
  /**
   * Normalised observation: {wdir:deg|null, vrb:bool, wspd, gust|null, vis km|undefined, ceil ft|null(no ceiling)|undefined(unknown),
   *  temp, qnh, time}. TAF: {periods:[{from,to, ...same fields}]}.
   */
  function covering(taf, t) {
    if (!taf || !taf.periods) return null; var hit = null;
    for (var i = 0; i < taf.periods.length; i++) { var q = taf.periods[i]; if (q.from <= t && t < q.to) hit = q; } // later (BECMG/FM) wins
    return hit;
  }
  /**
   * Choose weather: METAR > current TAF period > Model.
   * @returns {{src:'METAR'|'TAF'|'Model'|null, time, obs, stale:boolean, ageMin, filled:string[], taf}}
   */
  function pickWeather(metar, taf, model, now) {
    var tp = covering(taf, now), res = { src: null, time: null, obs: null, stale: false, ageMin: null, filled: [], taf: taf || null };
    if (metar) {
      var o = {}, k; for (k in metar) o[k] = metar[k];
      if (o.cavok) { o.vis = 10; o.ceil = null; }
      var missVis = !num(o.vis), missWind = !num(o.wspd);
      if ((missVis || missWind) && !tp) { /* keep METAR, missing data flagged later */ }
      if ((missVis || missWind) && tp) {
        if (missVis && num(tp.vis)) { o.vis = tp.vis; res.filled.push('vis'); }
        if (missWind && num(tp.wspd)) { o.wspd = tp.wspd; o.wdir = tp.wdir; o.gust = tp.gust; res.filled.push('wind'); }
        if (o.ceil === undefined && tp.ceil !== undefined) { o.ceil = tp.ceil; res.filled.push('ceil'); }
      }
      res.src = 'METAR'; res.obs = o; res.time = o.time;
      res.ageMin = Math.round((now - o.time) / 6e4); res.stale = res.ageMin > CFG.staleMin;
      return res;
    }
    if (tp) { res.src = 'TAF'; res.obs = tp; res.time = tp.from; return res; }
    if (model) { res.src = 'Model'; res.obs = model; res.time = model.time; return res; }
    return res;
  }

  /** Adapter: aviationweather.gov METAR JSON → normalised obs (same parsing as wst-engine obsOf). */
  function fromAWC(m) {
    if (!m) return null;
    var cl = (m.clouds || []).filter(function (c) { return /BKN|OVC|VV|OVX/.test(c.cover) && c.base != null; }).map(function (c) { return c.base; });
    var v = String(m.visib == null ? '' : m.visib), cav = /CAVOK/.test(m.rawOb || '');
    var vis = cav || /^(6|10)/.test(v) ? 10 : (isNaN(parseFloat(v)) ? undefined : Math.min(10, parseFloat(v) * 1.609));
    return { wdir: m.wdir === 'VRB' ? null : +m.wdir, vrb: m.wdir === 'VRB', wspd: m.wspd || 0, gust: m.wgst || null, vis: vis,
      ceil: cl.length ? Math.min.apply(null, cl) : ((m.clouds && m.clouds.length) || cav ? null : undefined),
      temp: m.temp, qnh: m.altim, time: m.obsTime * 1000, cavok: cav, raw: m.rawOb };
  }

  // model cache (15 min) — protects Open-Meteo from HTTP 429
  function cacheModel(key, data, now, ls) { ls = ls || store(); if (ls) ls.setItem('wm-om:' + key, JSON.stringify({ t: now, d: data })); }
  function getCachedModel(key, now, ls) {
    ls = ls || store(); if (!ls) return null; var r = ls.getItem('wm-om:' + key); if (!r) return null;
    try { var o = JSON.parse(r); return now - o.t < CFG.modelTtlMin * 6e4 ? o.d : null; } catch (e) { return null; }
  }

  // ───────────────────────── sun / wind / DA maths ─────────────────────────
  /** NOAA sunrise equation. Returns UTC ms of rise/set for sun altitude alt (deg), or null (polar). */
  function sun(lat, lon, ms, alt) {
    var d = new Date(ms), day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var JD = day / 864e5 + 2440587.5, n = Math.ceil(JD - 2451545 + 0.0008), Js = n - lon / 360, M = (357.5291 + 0.98560028 * Js) % 360;
    var C = 1.9148 * Math.sin(M * R) + 0.02 * Math.sin(2 * M * R) + 0.0003 * Math.sin(3 * M * R), L = (M + C + 180 + 102.9372) % 360;
    var Jt = 2451545 + Js + 0.0053 * Math.sin(M * R) - 0.0069 * Math.sin(2 * L * R), dec = Math.asin(Math.sin(L * R) * Math.sin(23.4397 * R));
    var c = (Math.sin(alt * R) - Math.sin(lat * R) * Math.sin(dec)) / (Math.cos(lat * R) * Math.cos(dec));
    if (c < -1 || c > 1) return null; var w = Math.acos(c) / R / 360, toMs = function (j) { return (j - 2440587.5) * 864e5; };
    return { rise: toMs(Jt - w), set: toMs(Jt + w) };
  }
  /** Night = 15 min after sunset to 15 min before sunrise (CAR Part 1 wording; see SOURCES.md §C). */
  function nightInfo(lat, lon, now) {
    var s = sun(lat, lon, now, -0.833); if (!s) return { isNight: false, nightFrom: null };
    var Q = 15 * 6e4, from = s.set + Q, to = s.rise - Q;
    return { isNight: now >= from || now < to, nightFrom: from, sunset: s.set, sunrise: s.rise };
  }
  /** Components for one runway. hdg = runway true heading (deg). +hw = headwind. */
  function components(hdg, wdir, wspd) { var a = (wdir - hdg) * R; return { hw: wspd * Math.cos(a), xw: Math.abs(wspd * Math.sin(a)) }; }
  /** Best runway = most headwind, least crosswind as tie-break. Gust components use the same angle. */
  function bestRunway(runways, wdir, wspd, gust) {
    var b = null;
    for (var i = 0; i < runways.length; i++) {
      var r = runways[i], c = components(r.hdg, wdir, wspd);
      if (!b || c.hw > b.hw + 0.01 || (Math.abs(c.hw - b.hw) <= 0.01 && c.xw < b.xw)) {
        var g = num(gust) ? components(r.hdg, wdir, gust) : c;
        b = { id: r.id, hdg: r.hdg, hw: c.hw, xw: c.xw, gxw: g.xw };
      }
    }
    return b;
  }
  /** Density altitude (ft): pressure altitude + 120 ft per °C above ISA. */
  function densityAltitude(elev, temp, qnh) {
    if (!num(elev) || !num(temp)) return null;
    var pa = elev + (1013.25 - (num(qnh) ? qnh : 1013.25)) * 30, isa = 15 - 2 * pa / 1000;
    return Math.round(pa + 120 * (temp - isa));
  }

  // ───────────────────────── checks ─────────────────────────
  function reason(check, value, limit, severity, text) { return { check: check, value: value, limit: limit, severity: severity, text: text }; }

  /** "min" style check (vis/ceil). v1.2: below the law or a number YOU set = NO-GO; below an app guide (licence/night default) but legal = CAUTION. */
  function checkMin(check, label, v, lim, legal, unit, lsrc, org, guide) {
    var f = function (x) { return check === 'vis' ? fmtV('vis', x) : fmtN(x) + ' ' + unit; };
    if (num(legal) && v < legal) return reason(check, v, legal, 'nogo', label + ' ' + f(v) + ', below legal ' + f(legal) + (lsrc ? ' \u2014 ' + lsrc : ''));
    var hard = !org || org === 'You' || org === 'Legal';
    if (v < lim) {
      if (hard) return reason(check, v, lim, 'nogo', label + ' ' + f(v) + ', below your ' + f(lim));
      return reason(check, v, lim, 'caution', label + ' ' + f(v) + ', below the ' + (guide || org) + ' guide of ' + f(lim) + (num(legal) ? ' (legal ' + f(legal) + ')' : ' (no legal number here)'));
    }
    if (v < lim * (1 + CFG.margin)) return reason(check, v, lim, 'caution', label + ' ' + f(v) + ', close to ' + (hard ? 'your ' : 'the ' + (guide || org) + ' guide of ') + f(lim));
    return reason(check, v, lim, 'go', label + ' ' + f(v));
  }

  /** Weather-only checks (used for current weather and for each TAF period in the trend). */
  function coreChecks(ad, o, m, rules, ifrMin) {
    var out = [], vMin = rules === 'ifr' ? ifrMin.vis.value : m.vis.value, cMin = rules === 'ifr' ? ifrMin.ceil.value : m.ceil.value;
    var legal = rules === 'ifr' ? LEGAL.ifr : legalFor(ad).rule, ls = rules === 'ifr' ? '' : legal.tag;
    var oV = rules === 'ifr' ? null : m.vis.origin, oC = rules === 'ifr' ? null : m.ceil.origin, gN = function (o) { return o === 'Night' ? 'night' : o === 'Licence' ? (m.licName || 'licence') : o; };
    // visibility
    if (!num(o.vis)) out.push(reason('vis', null, vMin, 'caution', 'Visibility not reported'));
    else out.push(checkMin('vis', 'Visibility', o.vis, vMin, legal.vis, 'km', ls, oV, gN(oV)));
    // ceiling (null = no BKN/OVC = no ceiling)
    if (o.ceil === undefined) out.push(reason('ceil', null, cMin, 'caution', 'Cloud base not reported'));
    else if (o.ceil === null) out.push(reason('ceil', null, cMin, 'go', 'No cloud ceiling'));
    else out.push(checkMin('ceil', 'Cloud', o.ceil, cMin, legal.ceil, 'ft', ls, oC, gN(oC)));
    // wind
    var xwL = m.xw.value, gL = m.gust.value, twL = m.tw.value, wind = null;
    if (!num(o.wspd)) out.push(reason('wind', null, xwL, 'caution', 'Wind not reported'));
    else if (o.wspd === 0) out.push(reason('wind', 0, xwL, 'go', 'Calm'));
    else if (o.vrb || o.wdir == null) {
      // v1.2: VRB = light (<=6 kt, AWC/AIM 7-1-29; ICAO Annex 3 uses <3 kt) or no usable direction. No runway angle, so worst case = full speed.
      var vw = Math.max(o.wspd, num(o.gust) ? o.gust : 0), light = o.wspd <= 6 && !num(o.gust);
      if (light) out.push(reason('xw', vw, xwL, vw > xwL / 2 ? 'caution' : 'go', 'Light variable wind ' + o.wspd + ' kt' + (vw > xwL / 2 ? ', over half your ' + xwL + ' kt crosswind limit' : ' \u2014 no crosswind problem')));
      else out.push(reason('xw', vw, xwL, vw > xwL ? 'nogo' : 'caution', 'Variable wind ' + o.wspd + (num(o.gust) ? 'G' + o.gust : '') + ' kt, no direction \u2014 worst case full crosswind' + (vw > xwL ? ', above your ' + xwL + ' kt' : '')));
    } else if (!ad.runways || !ad.runways.length) {
      out.push(reason('rwy', null, xwL, 'caution', 'Runway headings unknown \u2014 crosswind not checked'));
    } else {
      var b = bestRunway(ad.runways, o.wdir, o.wspd, o.gust); wind = b;
      var X = Math.round(b.xw), GX = Math.round(b.gxw), who = m.xw.origin === 'Aircraft' ? 'the ' + m.xw.label + ' limit' : 'your';
      var lab = function (n) { return who === 'your' ? 'your ' + n + ' kt' : m.xw.label + ' limit ' + n + ' kt'; };
      if (X > xwL) out.push(reason('xw', X, xwL, 'nogo', 'Crosswind ' + X + ' kt on RWY ' + b.id + ', above ' + lab(xwL)));
      else if (GX > xwL) out.push(reason('xw', GX, xwL, 'caution', 'Gust crosswind ' + GX + ' kt on RWY ' + b.id + ', above ' + lab(xwL)));
      else if (X >= xwL * (1 - CFG.margin)) out.push(reason('xw', X, xwL, 'caution', 'Crosswind ' + X + ' kt on RWY ' + b.id + ', close to ' + lab(xwL)));
      else out.push(reason('xw', X, xwL, 'go', 'Crosswind ' + X + ' kt on RWY ' + b.id));
      var T = Math.round(-b.hw);
      if (T >= twL && T > 0) out.push(reason('tw', T, twL, 'caution', 'Tailwind ' + T + ' kt on best runway ' + b.id + ' \u2014 longer landing roll, check POH distances'));
    }
    if (num(o.gust)) {
      if (o.gust > gL) out.push(reason('gust', o.gust, gL, 'nogo', 'Gusting ' + o.gust + ' kt, above your ' + gL + ' kt'));
      else if (o.gust >= gL * (1 - CFG.margin)) out.push(reason('gust', o.gust, gL, 'caution', 'Gusty wind ' + o.gust + ' kt'));
    }
    return { reasons: out, wind: wind };
  }

  function sortReasons(a) { return a.slice().sort(function (x, y) { return LV[y.severity] - LV[x.severity]; }); }
  function statusOf(rs) { var s = 'go'; for (var i = 0; i < rs.length; i++) s = worst(s, rs[i].severity); return s; }

  /**
   * Evaluate one aerodrome.
   * @param ad {icao, name, lat, lon, elev, runways:[{id,hdg}], iap:true|false|null}
   * @param weather result of pickWeather()
   * @param profile user profile
   * @param now epoch ms
   * @returns {{status, reasons:[{check,value,limit,severity,text}], source, time, why, wind, da, night, minimums}}
   */
  function evaluate(ad, weather, profile, now) {
    var p = normProfile(profile), lic = LICENCE[p.licence], ac = aircraft(p.aircraft);
    var ni = num(ad.lat) && num(ad.lon) ? nightInfo(ad.lat, ad.lon, now) : { isNight: false, nightFrom: null };
    var hasNight = p.night || lic.ir;
    var m = effectiveMinimums(p, { night: ni.isNight && hasNight }); m.xw.label = ac.id; m.licName = LICENCE[p.licence].name;
    var R0 = [], add = function (r) { R0.push(r); };
    var lg = legalFor(ad);
    var base = { source: weather && weather.src, time: weather && weather.time, night: ni, minimums: m, disclaimer: DISCLAIMER,
      legal: { airspace: lg.kind, vis: lg.rule.vis, ceil: lg.rule.ceil, note: (lg.known ? '' : 'Airspace unknown \u2014 using ') + lg.rule.note } };
    // Heliports (MT 30 Oct 2026): no GO/CAUTION/NO-GO verdict; the card shows model weather for emergency reference only.
    if (ad.heliport) return mix(base, { status: 'none', heliport: true, reasons: [], why: HELI_WHY, wind: null, da: null });
    if (!weather || !weather.obs) {
      return mix(base, { status: 'none', reasons: [], why: 'No weather \u2014 no METAR, TAF or model', wind: null, da: null });
    }
    var o = weather.obs, rules = p.rules;
    // rules / ratings
    if (rules === 'ifr') {
      if (!lic.ir) add(reason('rating', null, null, 'nogo', 'IFR needs an instrument rating'));
      if (ad.iap === false) add(reason('iap', null, null, 'nogo', 'No published instrument approach'));
      else if (ad.iap == null) add(reason('iap', null, null, 'caution', 'Instrument approach unknown \u2014 check AIP AD 2.24'));
    } else {
      if (ni.isNight && !hasNight) add(reason('night', null, null, 'nogo', 'Night \u2014 no night rating'));
      else if (!ni.isNight && !hasNight && ni.nightFrom && ni.nightFrom > now && ni.nightFrom - now <= CFG.nightWarnMin * 6e4)
        add(reason('night', Math.round((ni.nightFrom - now) / 6e4), null, 'caution', 'Night in ' + Math.round((ni.nightFrom - now) / 6e4) + ' min, no night rating'));
    }
    if (rules !== 'ifr' && !lg.known) add(reason('airspace', null, null, 'go', 'Airspace unknown \u2014 using CTR/ATZ minimum 5 km / 1 500 ft (CAR 91.06.21 Table 1)'));
    if (!num(ac.xw)) add(reason('acx', null, null, 'caution', ac.name + ' POH crosswind not verified \u2014 using ' + lic.name + ' ' + m.xw.value + ' kt'));
    // weather
    var cc = coreChecks(ad, o, m, rules, m.ifr); cc.reasons.forEach(add);
    if (weather.stale) add(reason('stale', weather.ageMin, CFG.staleMin, 'caution', 'Old METAR (' + weather.ageMin + ' min)'));
    if (weather.filled && weather.filled.length) add(reason('filled', null, null, 'caution', 'METAR incomplete \u2014 ' + weather.filled.join(', ') + ' from TAF forecast'));
    // density altitude
    var dA = densityAltitude(ad.elev, o.temp, o.qnh);
    if (dA != null && dA >= CFG.daCaution) add(reason('da', dA, CFG.daCaution, 'caution', 'Density altitude ' + fmtN(dA) + ' ft (hot and high)'));
    // TAF trend: any period starting within the next 2 h that is worse than now
    var cur = statusOf(cc.reasons), taf = weather.taf;
    if (taf && taf.periods) {
      var end = now + CFG.trendH * 36e5, worse = null;
      taf.periods.forEach(function (q) {
        if (q.from > now && q.from <= end) {
          var r = sortReasons(coreChecks(ad, q, m, rules, m.ifr).reasons), s = statusOf(r);
          if (LV[s] > LV[cur] && (!worse || LV[s] > LV[worse.s])) worse = { s: s, at: q.from, r: r[0] };
        }
      });
      if (worse) add(reason('trend', null, null, 'caution', 'TAF forecast: worsening from ' + sast(worse.at) + ': ' + worse.r.text.charAt(0).toLowerCase() + worse.r.text.slice(1)));
    }
    var reasons = sortReasons(R0), status = statusOf(reasons);
    var top = reasons[0], label = { go: 'GO', caution: 'CAUTION', nogo: 'NO-GO' }[status];
    var tag = weather.src + ' ' + sast(weather.time);
    var lead = status === 'go' ? (cc.wind ? 'Wind ' + Math.round(Math.max(0, cc.wind.hw)) + ' kt head, ' + Math.round(cc.wind.xw) + ' kt cross on RWY ' + cc.wind.id : 'Within your limits') : top.text;
    return mix(base, { status: status, reasons: reasons, why: label + ': ' + lead + ' \u00b7 ' + tag, whyShort: lead, wind: cc.wind, da: dA });
  }
  function mix(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  var GROUP = { vis: 'low visibility', ceil: 'low cloud', xw: 'crosswind', gust: 'gusty wind', tw: 'tailwind', wind: 'wind not reported',
    night: 'night', rating: 'rating', iap: 'no approach', stale: 'old METAR', filled: 'incomplete METAR', da: 'hot and high',
    trend: 'worsening TAF', rwy: 'runway headings unknown', airspace: 'airspace unknown', acx: 'aircraft limit unverified' };
  /**
   * Summary for Status top: counts + main reasons per level.
   * @param results array of evaluate() results
   */
  function summarize(results) {
    var c = { go: 0, caution: 0, nogo: 0, none: 0 }, why = { caution: {}, nogo: {} };
    results.forEach(function (r) {
      c[r.status]++;
      if (r.status === 'caution' || r.status === 'nogo') { var k = GROUP[r.reasons[0].check] || r.reasons[0].check; why[r.status][k] = (why[r.status][k] || 0) + 1; }
    });
    var top = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, 3).map(function (k) { return { reason: k, count: o[k] }; }); };
    var main = { nogo: top(why.nogo), caution: top(why.caution) };
    var lines = [];
    if (main.nogo.length) lines.push('Most NO-GO: ' + main.nogo[0].reason);
    if (main.caution.length) lines.push('Most CAUTION: ' + main.caution[0].reason);
    return { total: results.length, counts: c, main: main, lines: lines };
  }

  var API = {
    VERSION: VERSION, DISCLAIMER: DISCLAIMER, LEGAL: LEGAL, LICENCE: LICENCE, NIGHT: NIGHT, AIRCRAFT: AIRCRAFT, CFG: CFG, FIELDS: FIELDS,
    getProfile: getProfile, setProfile: setProfile, defaultProfile: defaultProfile, normProfile: normProfile,
    effectiveMinimums: effectiveMinimums, validateInput: validateInput,
    pickWeather: pickWeather, fromAWC: fromAWC, cacheModel: cacheModel, getCachedModel: getCachedModel,
    evaluate: evaluate, summarize: summarize,
    util: { legalFor: legalFor, sun: sun, nightInfo: nightInfo, components: components, bestRunway: bestRunway, densityAltitude: densityAltitude, sast: sast, aircraft: aircraft }
  };
  root.WMCore = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
