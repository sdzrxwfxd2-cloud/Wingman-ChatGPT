/* Wire Go Around engine v2 into the live page.
 *
 * ONE FLAG: window.GA_USE_ENGINE_V2
 *   - default true (this file is loaded)
 *   - set to false in this file, or open with ?engine=v1, to use the previous
 *     stacked engine (wm-core + wst-engine overlay) without removing script tags
 *
 * Loaded after wst-engine.js, and after wm-bridge.js when that file is present,
 * so it replaces WST.status and WMB.evalCard. Does not edit wm-core.js,
 * wst-engine.js, wm-bridge.js, gate.ts, appdata/, auth, or wm-shell.css.
 *
 * On-screen words stay with phase.js (DEPART / LAND / CAUTION / NO DEPART /
 * NO LAND). Internal keys stay go / caution / nogo / none.
 */
(function () {
  'use strict';

  try {
    if (/[?&]engine=v1(?:&|$)/.test(location.search || '')) {
      window.GA_USE_ENGINE_V2 = false;
    }
  } catch (e) {}

  if (window.GA_USE_ENGINE_V2 === false) return;

  var V2 = window.GACoreV2;
  var W = window.WST;
  if (!V2 || !V2.evaluate || !W || !W.status) return;

  window.GA_USE_ENGINE_V2 = true;

  var OLD_STATUS = W.status;
  window.GA_ENGINE_PREV_STATUS = OLD_STATUS;

  /* Shared live official feed for cards and pages, including stations that
     are not in the 65-field wst-data catalog (e.g. FAVV). */
  var LIVE = { metar: {}, taf: {}, pending: false, at: 0 };

  function mapStatus(s, code) {
    if (s === 'incomplete' || s === 'none') return 'none';
    if (s === 'noiap' || code === 'noiap') return 'nogo';
    if (s === 'go' || s === 'caution' || s === 'nogo') return s;
    return s || 'none';
  }

  function icOf(a) {
    return (a && (a.ic || a.icao)) || '';
  }

  function fieldOf(a) {
    if (!a) return {};
    var ic = icOf(a);
    var heli = !!(a.heliport || a.heli || (typeof window !== 'undefined' && window.AD_CLASS && window.AD_CLASS[ic]));
    var rw = a.rw || a.runways || [];
    return {
      icao: ic,
      name: a.nm || a.name,
      lat: a.la != null ? a.la : a.lat,
      lon: a.lo != null ? a.lo : a.lon,
      elevFt: a.el != null ? a.el : (a.elev != null ? a.elev : a.elevFt),
      category: a.cat || a.category || a.airspace,
      iap: a.iap,
      heliport: heli,
      heli: heli,
      runways: rw,
      rw: rw
    };
  }

  function ls(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function profileOf(P, acId, rules) {
    var out = P ? {
      licence: P.licence,
      ceil: P.ceil,
      vis: P.vis,
      xw: P.xw,
      gust: P.gust,
      night: P.night,
      ir: P.ir,
      iceil: P.iceil,
      ivis: P.ivis
    } : {};
    var lvl = ls('wm-lvl');
    if (lvl === 'ppln') lvl = 'ppl';
    if (!out.licence && lvl) out.licence = lvl;
    if (!out.licence && (out.ceil == null && out.vis == null)) out.licence = 'cpl';
    var n = ls('wm-night');
    if (n != null) out.night = n === '1';
    else if (out.night == null && (out.licence === 'cpl' || out.licence === 'ir' || !out.licence)) out.night = true;
    return {
      profile: out,
      aircraftId: acId || ls('wm-ac') || 'C172',
      rules: rules || (ls('wm-rules') === 'ifr' ? 'ifr' : 'vfr')
    };
  }

  function modelFromOm(om) {
    if (!om) return null;
    if (om.current) {
      var c = om.current;
      var copy = {};
      for (var k in c) copy[k] = c[k];
      if (om.fetchedAt != null) copy.fetchedAt = om.fetchedAt;
      else if (om.wingman_fetched) copy.fetchedAt = om.wingman_fetched;
      return copy;
    }
    return om;
  }

  /* Shared model copies: the live worker "now" file (wm.now.v1, used by
     cards) and the full /api/model-weather copy (wm.mw.v2, used by the
     13-hour strip). S.om is only filled for fields without a METAR. */
  function readMwCopy() {
    try {
      var raw = localStorage.getItem('wm.mw.v2');
      var d = raw ? JSON.parse(raw) : null;
      return (d && d.pts && d.v && d.time) ? d : null;
    } catch (e) { return null; }
  }

  function readNowCopy() {
    try {
      var raw = localStorage.getItem('wm.now.v1');
      var n = raw ? JSON.parse(raw) : null;
      if (!n || n.v !== 1 || !Array.isArray(n.pts) || !n.t0 || !n.vars || !n.c) return null;
      var t0 = Date.parse(String(n.t0) + 'Z');
      if (!isFinite(t0)) return null;
      var HH = n.fzlHours || 5, NH = n.hours || 2, time = [], v = {}, h;
      for (h = 0; h < HH; h++) time.push(new Date(t0 + h * 3600e3).toISOString().slice(0, 16));
      n.vars.forEach(function (key, j) {
        v[key] = n.c.map(function (row) {
          var a = [];
          for (var h2 = 0; h2 < HH; h2++) a.push(h2 < NH ? row[j * NH + h2] : null);
          return a;
        });
      });
      if (n.fzl) v.freezing_level_height = n.fzl;
      return { pts: n.pts, time: time, v: v, vars: n.vars.concat(n.fzl ? ['freezing_level_height'] : []), ft: n.ft, composedAt: n.composedAt };
    } catch (e) { return null; }
  }

  function modelFromCopy(d, a) {
    if (!d || !d.pts || !d.v || !d.time) return null;
    var ic = icOf(a);
    var idx = -1, i;
    for (i = 0; i < d.pts.length; i++) {
      if (d.pts[i] && d.pts[i][0] === ic) { idx = i; break; }
    }
    if (idx < 0 && a) {
      var la = a.la != null ? a.la : a.lat, lo = a.lo != null ? a.lo : a.lon;
      if (la != null && lo != null) {
        var best = 0.01;
        for (i = 0; i < d.pts.length; i++) {
          var dd = Math.abs(d.pts[i][1] - la) + Math.abs(d.pts[i][2] - lo);
          if (dd < best) { best = dd; idx = i; }
        }
      }
    }
    if (idx < 0) return null;
    var nowMs = Date.now(), h = -1;
    for (i = 0; i < d.time.length; i++) {
      if (Date.parse(String(d.time[i]) + 'Z') <= nowMs) h = i;
    }
    if (h < 0) return null;
    var cur = { time: d.time[h] };
    var vars = d.vars || [];
    for (i = 0; i < vars.length; i++) {
      var key = vars[i], col = d.v[key];
      if (col && col[idx]) cur[key] = col[idx][h];
    }
    if (d.ft && d.ft[idx]) {
      var fetched = Date.parse(d.ft[idx]);
      if (isFinite(fetched)) cur.fetchedAt = fetched;
    } else if (d.composedAt) {
      var composed = Date.parse(d.composedAt);
      if (isFinite(composed)) cur.fetchedAt = composed;
    }
    return cur;
  }

  function modelFromMwCopy(a) {
    var fromNow = modelFromCopy(readNowCopy(), a);
    var fromMw = modelFromCopy(readMwCopy(), a);
    if (fromNow && fromMw) return modelTimeMs(fromNow) >= modelTimeMs(fromMw) ? fromNow : fromMw;
    return fromNow || fromMw;
  }


  function looksLikeMetar(raw) {
    raw = String(raw || '').trim();
    return /^(METAR|SPECI)\b/.test(raw) || /^[A-Z]{4}\s+\d{6}Z\b/.test(raw);
  }

  function looksLikeTaf(raw) {
    return /^TAF\b/.test(String(raw || '').trim());
  }

  function rawObsMs(raw, now) {
    now = now || Date.now();
    var m = /(\d{2})(\d{2})(\d{2})Z/.exec(String(raw || ''));
    if (!m) return 0;
    var day = +m[1], hour = +m[2], min = +m[3];
    var base = new Date(now);
    var y = base.getUTCFullYear(), mo = base.getUTCMonth();
    var best = 0, bestAge = Infinity, dmo, t, dt, age;
    /* Day-of-month has no year/month. Prefer the interpretation that is
       nearest to now and not more than 12 hours in the future — otherwise
       a leftover "142100Z" on 10 Nov is read as 14 Nov and beats today's
       live METAR. */
    for (dmo = -1; dmo <= 1; dmo++) {
      t = Date.UTC(y, mo + dmo, day, hour, min);
      dt = new Date(t);
      if (dt.getUTCDate() !== day || dt.getUTCHours() !== hour) continue;
      if (t > now + 12 * 3600 * 1000) continue;
      age = now - t;
      if (age < bestAge) { bestAge = age; best = t; }
    }
    return best;
  }

  function metarTimeMs(met, now) {
    if (!met) return 0;
    if (met.obsTime != null && isFinite(+met.obsTime)) {
      var o = +met.obsTime;
      return o < 1e12 ? o * 1000 : o;
    }
    if (met.time != null && isFinite(+met.time) && +met.time > 1e11) return +met.time;
    return rawObsMs(met.raw || met.rawOb, now);
  }

  function metarCandidate(met) {
    if (!met) return null;
    if (met.raw || met.rawOb || met.wspd != null || met.wdir != null ||
        met.ws != null || met.vis != null || met.visib != null || met.ceil != null || met.cavok) {
      return met;
    }
    return null;
  }

  function pickFreshestMetar(cands, now) {
    now = now || Date.now();
    var usable = [], any = [], i, c, t, age, pool, best, bestT;
    for (i = 0; i < cands.length; i++) {
      c = metarCandidate(cands[i]);
      if (!c) continue;
      t = metarTimeMs(c, now);
      if (t > now + 12 * 3600 * 1000) t = rawObsMs(c.raw || c.rawOb, now);
      any.push({ c: c, t: t || 0 });
      age = t ? now - t : Infinity;
      /* Same 90-minute official window as the engine: a usable live METAR
         always beats a weeks-old baked raw, even if the baked day-of-month
         parsed onto a later calendar day. */
      if (t && age >= -12 * 3600 * 1000 && age <= 90 * 60 * 1000) usable.push({ c: c, t: t });
    }
    pool = usable.length ? usable : any;
    best = null; bestT = -1;
    for (i = 0; i < pool.length; i++) {
      if (!best || pool[i].t > bestT) { best = pool[i].c; bestT = pool[i].t; }
    }
    return best;
  }

  function stampMetar(met, now) {
    if (!met) return null;
    var t = metarTimeMs(met, now);
    if (!t) return met;
    var out = {}, k;
    for (k in met) out[k] = met[k];
    if (out.time == null || !isFinite(+out.time) || +out.time < 1e11) out.time = t;
    if (out.obsTime == null) out.obsTime = t / 1000;
    if (!out.raw && out.rawOb) out.raw = out.rawOb;
    if (!out.rawOb && out.raw) out.rawOb = out.raw;
    return out;
  }

  function modelTimeMs(model) {
    if (!model) return 0;
    var raw = model.fetchedAt != null ? model.fetchedAt
      : (model.time != null ? model.time
      : (model.current && model.current.time));
    if (raw == null) return 0;
    var t = typeof raw === 'number' ? +raw : Date.parse(String(raw).replace(/Z?$/, 'Z'));
    return isFinite(t) ? t : 0;
  }

  /* Prefer the live /api/model-weather copy (wm.mw.v2) over the baked
     wst-data.js snapshot, which can be weeks old and would otherwise
     hide the live model and force NO DATA on model-only fields. */
  function pickFreshestModel(a, om) {
    var fromOm = modelFromOm(om);
    var fromMw = modelFromMwCopy(a);
    if (fromMw && fromOm) return modelTimeMs(fromMw) >= modelTimeMs(fromOm) ? fromMw : fromOm;
    return fromMw || fromOm;
  }

  function weatherFrom(a, ob) {
    var ic = icOf(a);
    var S = (typeof window !== 'undefined' && window.WMST) || {};
    var weather = {};
    var now = Date.now();
    var store = (S.metar && ic && S.metar[ic]) || null;
    var fromOb = null;
    if (ob && (ob.src === 'off' || ob.src === 'metar' || ob.src === 'speci' || ob.raw || ob.rawOb)) {
      fromOb = {
        raw: ob.raw || ob.rawOb,
        rawOb: ob.raw || ob.rawOb,
        time: ob.time,
        obsTime: ob.time && ob.time > 1e12 ? ob.time / 1000 : ob.obsTime,
        wdir: ob.vrb ? 'VRB' : (ob.wd != null ? ob.wd : ob.wdir),
        wspd: ob.ws != null ? ob.ws : ob.wspd,
        wgst: ob.g != null ? ob.g : ob.wgst,
        vis: ob.vis,
        visib: ob.visib,
        ceil: ob.ceil,
        temp: ob.t != null ? ob.t : ob.temp,
        altim: ob.qnh != null ? ob.qnh : ob.altim,
        cavok: ob.cavok,
        cnr: ob.cnr,
        clouds: ob.clouds
      };
    }
    var met = stampMetar(pickFreshestMetar([store, fromOb], now), now);
    if (met) weather.metar = met;

    var taf = (S.taf && ic && S.taf[ic]) || (ob && ob.taf) || null;
    if (taf) weather.taf = typeof taf === 'string' ? taf : (taf.rawTAF || taf.raw || taf);

    var model = pickFreshestModel(a, S.om && ic && S.om[ic]);
    if (!model && ob && ob.src === 'model') {
      model = {
        vis: ob.vis, ceil: ob.ceil, wd: ob.wd, ws: ob.ws, g: ob.g,
        t: ob.t, qnh: ob.qnh, time: ob.time, vrb: ob.vrb, low: ob.low, cc: ob.cc,
        visibility: ob.visibility, wind_speed_10m: ob.wind_speed_10m,
        wind_direction_10m: ob.wind_direction_10m, wind_gusts_10m: ob.wind_gusts_10m
      };
    }
    if (model) weather.model = model;
    return weather;
  }

  function txt(c, q) {
    var e = c && c.querySelector && c.querySelector(q);
    return e ? (e.textContent || '').trim() : '';
  }

  function weatherFromCard(c, a, ob) {
    var w = weatherFrom(a, ob);
    var icL = icOf(a);
    if (icL && LIVE.metar[icL]) {
      var pl = stampMetar(pickFreshestMetar([w.metar, LIVE.metar[icL]], Date.now()), Date.now());
      if (pl) w.metar = pl;
    }
    if (icL && LIVE.taf[icL]) {
      var curT = w.taf ? String(w.taf).trim() : '';
      if (!curT || rawObsMs(LIVE.taf[icL]) >= rawObsMs(curT)) w.taf = LIVE.taf[icL];
    }
    if (!w.metar) {
      var m = txt(c, '.cp[data-p=metar] .mono');
      if (/^(METAR|SPECI)\b/.test(m)) w.metar = { raw: m };
    }
    if (!w.taf) {
      var t = txt(c, '.cp[data-p=taf] .mono');
      if (/^TAF\b/.test(t)) w.taf = t;
    }
    if (!w.model) {
      try {
        if (c && c.dataset && c.dataset.wxm) {
          var d = JSON.parse(c.dataset.wxm);
          w.model = { vis: d.v, ceil: d.c, ws: d.w, g: d.g, time: +d.t, vrb: true };
        }
      } catch (e) {}
    }
    return w;
  }

  function phaseOf() {
    try {
      if (window.WMPHASE && (WMPHASE.mode === 'land' || WMPHASE.mode === 'depart')) return WMPHASE.mode;
      if (window.GA_PHASE === 'land' || window.GA_PHASE === 'depart') return window.GA_PHASE;
      var stored = ls('wm.phaseMode') || ls('wm-phase');
      if (stored === 'land' || stored === 'depart') return stored;
      var on = document.querySelector('[data-phase].on, [data-phase][aria-pressed="true"], .wphase [aria-pressed="true"], button[data-v="land"].on');
      if (on) {
        var v = (on.getAttribute('data-phase') || on.getAttribute('data-v') || on.textContent || '').toLowerCase();
        if (v.indexOf('land') >= 0 && v.indexOf('depart') < 0) return 'land';
      }
    } catch (e) {}
    return 'depart';
  }

  function etaOf(phase) {
    if (phase !== 'land') return undefined;
    try {
      var P = window.WMPHASE;
      if (!P || !P.arrive) return undefined;
      if (P.arrive.at != null) return +P.arrive.at;
      if (P.arrive.off) return Date.now() + P.arrive.off * 36e5;
    } catch (e) {}
    return undefined;
  }

  function sourceKind(result) {
    var kind = result && result.source && result.source.kind;
    if (kind === 'speci' || kind === 'trend') return 'metar';
    if (kind === 'metar' || kind === 'taf' || kind === 'model') return kind;
    var src = result && result.weatherUsed && result.weatherUsed.src;
    if (src === 'speci' || src === 'trend' || src === 'off') return 'metar';
    if (src === 'metar' || src === 'taf' || src === 'model') return src;
    return null;
  }

  function incompleteLabel(result) {
    if (result && result.status === 'incomplete') return 'No weather';
    return (result && (result.label || result.why)) ||
      (V2 && V2.NO_WEATHER_LABEL) ||
      'No weather';
  }

  function withModelDisclaimer(why, result) {
    if (result && result.status === 'incomplete') {
      return incompleteLabel(result);
    }
    var text = why || '';
    if (sourceKind(result) === 'model') {
      var note = V2.MODEL_DISCLAIMER || 'Model estimate only — not an official weather report.';
      if (text.indexOf(note) < 0) text = text ? (text + ' · ' + note) : note;
    }
    return text;
  }

  function toLegacy(result, ob) {
    var s = mapStatus(result.status, result.code);
    var F = (result.findings || result.reasons || []).map(function (f) {
      return { lv: f.lv === 'incomplete' ? 'none' : f.lv, txt: f.txt, k: f.k, ruleId: f.ruleId };
    });
    var wd = result.wind;
    return {
      s: s,
      why: withModelDisclaimer(result.why, result),
      label: result.status === 'incomplete' ? incompleteLabel(result) : (result.label || null),
      F: F,
      wind: wd ? { id: wd.id, hw: wd.hw, xw: wd.xw, gx: wd.gxw != null ? wd.gxw : wd.gx, a: wd.a } : null,
      da: result.da,
      si: result.sun || result.si,
      ob: ob,
      heliport: !!result.heliport,
      core: result,
      v2: result
    };
  }

  function toCard(result, a) {
    var s = mapStatus(result.status, result.code);
    var why = withModelDisclaimer(result.why, result);
    var kind = sourceKind(result);
    var used = result.weatherUsed;
    return {
      status: s,
      code: result.code,
      heliport: !!result.heliport,
      why: why,
      whyShort: why,
      label: result.status === 'incomplete' ? incompleteLabel(result) : (result.label || null),
      reasons: (result.findings || []).map(function (f) {
        var sev = f.lv === 'note' ? 'go' : mapStatus(f.lv, '');
        return { check: f.k || 'engine', value: null, limit: null, severity: sev, text: f.txt };
      }),
      source: kind,
      time: used && used.time,
      da: result.da,
      wind: result.wind,
      sun: result.sun,
      phase: result.phase,
      icao: icOf(a),
      disclaimers: result.disclaimers,
      rulePackVersion: result.rulePackVersion,
      v2: result
    };
  }

  function storeResult(a, card, now, result) {
    if (!window.WMB || !window.WMB.results || !a) return;
    var ic = icOf(a);
    if (!ic) return;
    window.WMB.results[ic] = { r: card, t: now, w: result && result.source, ad: a };
  }

  function runV2(a, ob, acId, rules, P, now, extraWeather) {
    now = now || Date.now();
    var pr = profileOf(P, acId, rules);
    var weather = extraWeather || weatherFrom(a, ob);
    var phase = phaseOf();
    return V2.evaluate({
      field: fieldOf(a),
      weather: weather,
      profile: pr.profile,
      aircraftId: pr.aircraftId,
      rules: pr.rules,
      phase: phase,
      eta: etaOf(phase),
      now: now
    });
  }

  W.status = function (a, ob, acId, rules, P, now) {
    try {
      var result = runV2(a, ob, acId, rules, P, now);
      var legacy = toLegacy(result, ob);
      storeResult(a, toCard(result, a), now || Date.now(), result);
      return legacy;
    } catch (err) {
      try { console.log('ga-core-v2-wire status', err); } catch (x) {}
      return OLD_STATUS.apply(this, arguments);
    }
  };

  function runwaysFromCard(c) {
    if (!c || !c.querySelectorAll) return [];
    var lines = c.querySelectorAll('.rwd line.r');
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      try {
        var dx = l.x2.baseVal.value - l.x1.baseVal.value;
        var dy = l.y2.baseVal.value - l.y1.baseVal.value;
        var h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        var idA = String(Math.round(h / 10) || 36).padStart(2, '0');
        var idB = String(Math.round(((h + 180) % 360) / 10) || 36).padStart(2, '0');
        out.push({ id: idA, true: h, hdg: h });
        out.push({ id: idB, true: (h + 180) % 360, hdg: (h + 180) % 360 });
      } catch (e) {}
    }
    return out;
  }

  function runwaysFromFs(ic, a) {
    var f = window.FS_D && FS_D.a && FS_D.a.filter(function (x) { return x[0] === ic; })[0];
    var dec = (a && a.dec != null) ? +a.dec : -22;
    var S = window.WMST;
    if ((a && a.dec == null) && S && S.ads && S.ads.length && a && a.la != null) {
      var best = 1e9, j;
      for (j = 0; j < S.ads.length; j++) {
        var dlat = S.ads[j].la - a.la, dlon = S.ads[j].lo - a.lo;
        var d = dlat * dlat + dlon * dlon;
        if (d < best && S.ads[j].dec != null) { best = d; dec = S.ads[j].dec; }
      }
    }
    var rw = [];
    if (f && f[6] && f[6].length) {
      rw = f[6].map(function (id) {
        var h = ((+String(id).replace(/\D/g, '') * 10 + dec) % 360 + 360) % 360;
        return { id: String(id), true: h, hdg: h };
      });
    }
    return rw;
  }

  function ensureRunwayHeadings(a, c) {
    if (!a) return a;
    var rw = a.rw || a.runways || [];
    var has = rw.some(function (r) { return r && isFinite(+(r.true != null ? r.true : r.trueHdg)); });
    if (has) return a;
    /* Honest: only published FS_D headings. Never invent a heading from the
       decorative card SVG (ZA-0069 Riverside has no published runways). */
    var fs = runwaysFromFs(icOf(a), a);
    if (fs.length) {
      var b2 = {}; for (var k in a) b2[k] = a[k];
      b2.rw = fs; b2.runways = fs;
      return b2;
    }
    return a;
  }

  function adFromCard(c, ic) {
    var C = window.WSTC, S = window.WMST;
    if (C && C.AD && C.AD[ic]) return ensureRunwayHeadings(C.AD[ic], c);
    if (S && S.ads) {
      for (var i = 0; i < S.ads.length; i++) if (S.ads[i].ic === ic) return ensureRunwayHeadings(S.ads[i], c);
    }
    var la = c.querySelector && c.querySelector('[data-la]');
    var cat = c.dataset && c.dataset.cat;
    var el = c.querySelector && (c.querySelector('[data-el]') || c.querySelector('[data-elev]'));
    return ensureRunwayHeadings({
      ic: ic,
      icao: ic,
      la: la ? +la.dataset.la : null,
      lo: la ? +la.dataset.lo : null,
      el: el ? +(el.dataset.el || el.dataset.elev) : null,
      cat: cat === 'controlled' || cat === 'international' ? 'c' : cat === 'uncontrolled' ? 'u' : undefined,
      rw: [],
      iap: null
    }, c);
  }

  function patchEvalCard() {
    if (!window.WMB || !window.WMB.evalCard || window.WMB.evalCard.__gaV2) return;
    var OLD_EVAL = window.WMB.evalCard;
    window.GA_ENGINE_PREV_EVALCARD = OLD_EVAL;
    var wrapped = function (c, now) {
      now = now || Date.now();
      try {
        var ic = txt(c, '.icao');
        if (ic) {
          var a = adFromCard(c, ic);
          var S = window.WMST;
          var ob = (S && W.obsOf) ? W.obsOf(a, S) : null;
          var result = runV2(a, ob, null, null, null, now, weatherFromCard(c, a, ob));
          var card = toCard(result, a);
          storeResult(a, card, now, result);
          return card;
        }
      } catch (err) {
        try { console.log('ga-core-v2-wire evalCard', err); } catch (x) {}
      }
      return OLD_EVAL.apply(this, arguments);
    };
    wrapped.__gaV2 = true;
    window.WMB.evalCard = wrapped;
  }

  patchEvalCard();
  if (!window.WMB || !window.WMB.evalCard || !window.WMB.evalCard.__gaV2) {
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', patchEvalCard);
    }
    setTimeout(patchEvalCard, 0);
    setTimeout(patchEvalCard, 50);
  }

  function pageIcao() {
    try {
      var title = document.title || '';
      var tm = title.match(/Go Around\s*[·•]\s*([A-Z]{4}|ZA-\d{4})\b/i);
      if (tm) return tm[1].toUpperCase();
    } catch (e) {}
    try {
      if (window.WSTAD && (WSTAD.ic || WSTAD.icao)) return String(WSTAD.ic || WSTAD.icao).toUpperCase();
    } catch (e) {}
    var path = '';
    try { path = location.pathname || ''; } catch (e) { path = ''; }
    var m = path.match(/\/([A-Z0-9-]+)(?:\.html)?$/i);
    return m ? m[1].toUpperCase() : '';
  }

  function adFromPage() {
    var ic = pageIcao();
    var C = window.WSTC, S = window.WMST, A = window.WSTAD || {};
    if (C && C.AD && C.AD[ic]) return ensureRunwayHeadings(C.AD[ic], null);
    if (S && S.ads) {
      for (var i = 0; i < S.ads.length; i++) if (S.ads[i].ic === ic) return ensureRunwayHeadings(S.ads[i], null);
    }
    var f = window.FS_D && FS_D.a && FS_D.a.filter(function (x) { return x[0] === ic; })[0];
    var dec = -22;
    if (S && S.ads && S.ads.length) {
      var best = 1e9, j;
      for (j = 0; j < S.ads.length; j++) {
        var d = (S.ads[j].la - A.la) * (S.ads[j].la - A.la) + (S.ads[j].lo - A.lo) * (S.ads[j].lo - A.lo);
        if (d < best) { best = d; dec = S.ads[j].dec; }
      }
    }
    var rw = [];
    if (f && f[6] && f[6].length) {
      rw = f[6].map(function (id) {
        var h = ((+String(id).replace(/\D/g, '') * 10 + dec) % 360 + 360) % 360;
        return { id: id, true: h, hdg: h };
      });
    }
    return ensureRunwayHeadings({
      ic: ic,
      icao: ic,
      nm: f ? f[1] : ic,
      la: A.la,
      lo: A.lo,
      el: null,
      cat: f && (f[4] === 'i' || f[4] === 'c') ? 'c' : 'u',
      iap: null,
      rw: rw,
      heli: !rw.length && /heli(?:port|pad|stop)?\b|hospital|\bHP\b/i.test(f ? f[1] : document.title)
    }, null);
  }

  /* Aerodrome pages and cards: read the same live /api/metar + /api/taf feed,
     including stations outside the 65-field wst-data catalog (e.g. FAVV). */
  function fetchLiveOfficial(done) {
    if (typeof fetch !== 'function') return;
    /* Keep the latest callback so a second call while a fetch is in flight
       is not dropped (the old early-return left LIVE.pending true and lost `done`). */
    if (done) LIVE.nextDone = done;
    if (LIVE.pending) return;
    LIVE.pending = true;
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (LIVE.hangTimer) { clearTimeout(LIVE.hangTimer); LIVE.hangTimer = 0; }
      LIVE.pending = false;
      var cb = LIVE.nextDone;
      LIVE.nextDone = null;
      if (cb) cb();
    }
    /* If /api/metar or /api/taf hang, do not leave pending stuck forever. */
    LIVE.hangTimer = setTimeout(finish, 8000);
    var p1 = fetch('/api/metar', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    var p2 = fetch('/api/taf', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    Promise.all([p1, p2]).then(function (res) {
      var M = Array.isArray(res[0]) ? res[0] : [];
      var T = Array.isArray(res[1]) ? res[1] : [];
      var i, m, prev;
      var Sstore = (typeof window !== 'undefined' && window.WMST) || null;
      if (Sstore && !Sstore.metar) Sstore.metar = {};
      if (Sstore && !Sstore.taf) Sstore.taf = {};
      for (i = 0; i < M.length; i++) {
        m = M[i];
        if (!m || !m.icaoId) continue;
        prev = LIVE.metar[m.icaoId];
        if (!prev || (+m.obsTime || 0) >= (+prev.obsTime || 0)) LIVE.metar[m.icaoId] = m;
        if (Sstore) Sstore.metar[m.icaoId] = LIVE.metar[m.icaoId];
      }
      for (i = 0; i < T.length; i++) {
        if (T[i] && T[i].icaoId && T[i].rawTAF) {
          LIVE.taf[T[i].icaoId] = T[i].rawTAF;
          if (Sstore) Sstore.taf[T[i].icaoId] = T[i].rawTAF;
        }
      }
      LIVE.at = Date.now();
    }).then(finish, finish);
  }

  function weatherFromPage(a) {
    var w = weatherFrom(a, null);
    var icL = icOf(a);
    if (icL && LIVE.metar[icL]) {
      var pl = stampMetar(pickFreshestMetar([w.metar, LIVE.metar[icL]], Date.now()), Date.now());
      if (pl) w.metar = pl;
    }
    if (icL && LIVE.taf[icL]) {
      var cur = w.taf ? String(w.taf).trim() : '';
      if (!cur || rawObsMs(LIVE.taf[icL]) >= rawObsMs(cur)) w.taf = LIVE.taf[icL];
    }
    var rm = document.querySelector('#s-wx .rawb[data-r=metar]');
    var rt = document.querySelector('#s-wx .rawb[data-r=taf]');
    var raw = rm ? (rm.textContent || '').trim() : '';
    var tf = rt ? (rt.textContent || '').trim() : '';
    /* The page fetch writes the live raw into the DOM. wst-data.js may still
       hold a weeks-old METAR/TAF for the same ICAO — pick the newer report. */
    if (looksLikeMetar(raw)) {
      var picked = stampMetar(pickFreshestMetar([w.metar, { raw: raw, rawOb: raw }], Date.now()), Date.now());
      if (picked) w.metar = picked;
    }
    if (looksLikeTaf(tf)) {
      var storeTaf = w.taf ? String(w.taf).trim() : '';
      if (!storeTaf || storeTaf !== tf) {
        if (!storeTaf || rawObsMs(tf) >= rawObsMs(storeTaf)) w.taf = tf;
      }
    }
    if (!w.model) {
      var S = (typeof window !== 'undefined' && window.WMST) || {};
      w.model = pickFreshestModel(a, S.om && a && S.om[icOf(a)]);
    }
    return w;
  }

  function pageHasOfficial() {
    var rm = document.querySelector('#s-wx .rawb[data-r=metar]');
    var rt = document.querySelector('#s-wx .rawb[data-r=taf]');
    var raw = rm ? (rm.textContent || '').trim() : '';
    var tf = rt ? (rt.textContent || '').trim() : '';
    if (looksLikeMetar(raw) || looksLikeTaf(tf)) return true;
    try {
      var a0 = adFromPage();
      var ic0 = a0 && icOf(a0);
      if (ic0 && (LIVE.metar[ic0] || LIVE.taf[ic0])) return true;
    } catch (e) {}
    return false;
  }

  function modelCopyReady() {
    try { return !!(localStorage.getItem('wm.now.v1') || localStorage.getItem('wm.mw.v2')); } catch (e) { return false; }
  }

  function paintPage(legacy) {
    var v = document.getElementById('verd');
    var vs = document.getElementById('vs');
    var vw = document.getElementById('vw');
    if (!v || !vs || v.getAttribute('data-s') === 'heli' || (legacy && legacy.heliport)) return;
    try { window.GA_V2_PAGE = legacy; } catch (e) {}
    var land = phaseOf() === 'land';
    var LB = {
      go: land ? 'LAND' : 'DEPART',
      caution: 'CAUTION',
      nogo: land ? 'NO LAND' : 'NO DEPART',
      none: 'No weather'
    };
    /* Model-only fields: keep the pill blank until the model copy was tried.
       METAR/TAF fields keep their existing first paint. */
    if (legacy && legacy.s === 'none' && !pageHasOfficial() && !modelCopyReady()) {
      v.dataset.s = '';
      vs.textContent = '';
      if (vw) vw.textContent = '';
      return;
    }
    var noneLab = legacy.s === 'none' ? (legacy.label || legacy.why || 'No weather') : '';
    v.dataset.s = legacy.s;
    vs.textContent = (legacy.s === 'none' && noneLab) ? noneLab : (LB[legacy.s] || legacy.s);
    if (vw) {
      var why = String(legacy.why || noneLab || '').replace(/ · METAR.*$/, '');
      if (legacy.s === 'go') vw.textContent = 'Within your limits: ' + why + '.';
      else if (legacy.s === 'none') vw.textContent = why || noneLab;
      else {
        var bits = (legacy.F || []).filter(function (f) { return f.lv === legacy.s; }).map(function (f) { return f.txt; });
        vw.textContent = 'Because ' + (bits.join('; ') || why) + '.';
      }
    }
    var row = null;
    try {
      row = [].slice.call(v.querySelectorAll('.vsuit .kv>div')).filter(function (d) {
        return d.firstChild && /^Status/.test(d.firstChild.textContent || '');
      })[0];
    } catch (e) { row = null; }
    if (row && row.lastChild) {
      row.lastChild.textContent = vs.textContent;
      row.lastChild.style.color = 'var(--' + (legacy.s === 'nogo' ? 'nogo' : legacy.s === 'caution' ? 'cau' : legacy.s === 'none' ? 'tx3' : 'go') + ')';
    }
  }

  function paintHeli(ic) {
    var v = document.getElementById('verd');
    var vs = document.getElementById('vs');
    var vw = document.getElementById('vw');
    if (!v || !vs) return;
    var cls = window.AD_CLASS && window.AD_CLASS[ic];
    var lab = cls === 'helistop' ? 'HELIPAD' : 'HELIPORT';
    v.dataset.s = 'heli';
    vs.textContent = lab;
    if (vw) { vw.textContent = ''; vw.style.display = 'none'; }
    try {
      var row = [].slice.call(v.querySelectorAll('.vsuit .kv>div')).filter(function (d) {
        return d.firstChild && /^Status/.test(d.firstChild.textContent || '');
      })[0];
      if (row && row.lastChild) {
        row.lastChild.textContent = lab;
        row.lastChild.style.color = 'var(--tx3)';
      }
    } catch (e) {}
    window.GA_V2_PAGE = { s: 'heli', label: lab, heliport: true, why: '', F: [], findings: [] };
  }

  var paintingPage = false;
  function runAdPage() {
    if (!document.getElementById('verd')) return;
    if (paintingPage) return;
    paintingPage = true;
    try {
      var a = adFromPage();
      if (!a || !icOf(a)) return;
      var ic = icOf(a);
      if (a.heliport || a.heli || (window.AD_CLASS && window.AD_CLASS[ic])) {
        paintHeli(ic);
        return;
      }
      try {
        var result = runV2(a, null, null, null, null, Date.now(), weatherFromPage(a));
        paintPage(toLegacy(result, null));
      } catch (err) {
        try { console.log('ga-core-v2-wire ad-page', err); } catch (x) {}
      }
    } finally {
      paintingPage = false;
    }
  }

  function watchAdPage() {
    if (!document.getElementById('verd')) return;
    try {
      var vs0 = document.getElementById('vs');
      var vw0 = document.getElementById('vw');
      var baked = /^(—|-|GO|NO-GO|NO DATA|INCOMPLETE|No weather)$/i;
      if (vs0 && baked.test((vs0.textContent || '').trim())) vs0.textContent = '';
      if (vw0 && /No current METAR|status unavailable|vis not reported \(assumed OK\)/i.test(vw0.textContent || '')) vw0.textContent = '';
      var v0 = document.getElementById('verd');
      if (v0) {
        var row0 = [].slice.call(v0.querySelectorAll('.vsuit .kv>div')).filter(function (d) {
          return d.firstChild && /^Status/.test(d.firstChild.textContent || '');
        })[0];
        if (row0 && row0.lastChild && baked.test((row0.lastChild.textContent || '').trim())) {
          row0.lastChild.textContent = '';
        }
      }
    } catch (e) {}
    runAdPage();
    var box = document.getElementById('s-wx');
    if (box && !box.__gaV2Watch) {
      box.__gaV2Watch = 1;
      /* #verd (the verdict the engine writes) lives INSIDE #s-wx on fact.html
         and the aerodrome pages. Watching the whole section re-entered runAdPage
         on every paint and could freeze the page (clocks stuck on --:--, no cards).
         Ignore mutations inside #verd and debounce the rest. */
      var scheduled = false;
      new MutationObserver(function (muts) {
        var relevant = false, i, n;
        for (i = 0; i < muts.length; i++) {
          n = muts[i].target;
          if (!n) continue;
          if (n.id === 'verd' || (n.closest && n.closest('#verd'))) continue;
          relevant = true;
          break;
        }
        if (!relevant || scheduled) return;
        scheduled = true;
        setTimeout(function () { scheduled = false; runAdPage(); }, 50);
      }).observe(box, {
        subtree: true, childList: true, characterData: true
      });
    }
    document.addEventListener('wm:phase', runAdPage);
    fetchLiveOfficial(runAdPage);
    setInterval(function () { if (!document.hidden) fetchLiveOfficial(runAdPage); }, 5 * 60 * 1000);
    document.addEventListener('wst:data', function () { fetchLiveOfficial(runAdPage); });
    function wxFetchPending() {
      if (LIVE.pending || !LIVE.at) return true;
      try {
        if (document.querySelector('#s-wx .ld, #s-wx.ld, .box.ld')) return true;
        var s = document.getElementById('s-wx');
        if (s && /Updating/.test(s.textContent || '')) return true;
      } catch (e) {}
      return false;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      var hasModel = false;
      try { hasModel = !!(localStorage.getItem('wm.now.v1') || localStorage.getItem('wm.mw.v2')); } catch (e) {}
      runAdPage();
      /* Keep retrying until the live METAR/TAF fetch finishes AND the model
         copy is present, so a stale wst-data snapshot cannot win the first paint. */
      if ((hasModel && !wxFetchPending()) || tries > 40) clearInterval(timer);
    }, 500);
  }

  function rerunCards() {
    try {
      if (typeof window.applyS === 'function') window.applyS();
    } catch (e) {}
  }

  function watchListPages() {
    if (document.getElementById('verd')) return;
    if (!document.querySelector('#list .card, #wsp-cards .card, .card .icao')) return;
    /* applyS() re-evaluates every card. Calling it every 500ms (up to 40 times)
       blocked the main thread for many seconds once model data arrived — the
       loading-shell outage around 12:49 SAST on deploy 5cf79068. Run once when
       live official data arrives, and once more when the model copy first appears. */
    var queued = false;
    function requestRerun() {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; rerunCards(); }, 50);
    }
    fetchLiveOfficial(requestRerun);
    document.addEventListener('wst:data', function () { fetchLiveOfficial(requestRerun); });
    setInterval(function () { if (!document.hidden) fetchLiveOfficial(requestRerun); }, 5 * 60 * 1000);
    var tries = 0;
    var sawModel = false;
    var timer = setInterval(function () {
      tries += 1;
      var hasModel = false;
      try { hasModel = !!(localStorage.getItem('wm.now.v1') || localStorage.getItem('wm.mw.v2')); } catch (e) {}
      if (hasModel && !sawModel) {
        sawModel = true;
        requestRerun();
      }
      if (sawModel || tries > 20) clearInterval(timer);
    }, 500);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', watchAdPage);
      document.addEventListener('DOMContentLoaded', watchListPages);
    } else {
      watchAdPage();
      watchListPages();
    }
  }

  window.GA_ENGINE_V2_WIRED = true;
})();
