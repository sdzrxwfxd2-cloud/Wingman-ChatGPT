/* dashboard-core.js — pure logic for the private admin dashboard (/dashboard). No DOM, no network.
 * Used by dashboard.js in the browser (window.GADash) and by tests/dashboard/*.test.js in Node.
 * Status words are the site's own: DEPART / CAUTION / NO DEPART / INCOMPLETE (engine keys go / caution / nogo / none).
 * Weather check: what a card shows (METAR, TAF, model) vs the source (aviationweather.gov, Open-Meteo) and the site's
 * own /api feed. Freshness limits match the site: METAR and model count for 90 min (wst/wm-bridge.js usable-weather guard). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GADash = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var MIN = 6e4, HOUR = 36e5;
  var LIMITS = { metarMin: 90, metarLostMin: 180, behindMin: 60, modelMin: 90, tafIssueMin: 7 * 60 };
  var LABEL = { go: 'DEPART', caution: 'CAUTION', nogo: 'NO DEPART', none: 'INCOMPLETE' };
  var ORDER = ['go', 'caution', 'nogo', 'none'];
  var RANK = { Error: 0, Warning: 1, OK: 2 };

  /** card data-s / engine status -> engine key (the card writes data-s="incomplete" for none). */
  function key(s) { s = String(s || '').toLowerCase(); return s === 'incomplete' || s === '' ? 'none' : s === 'no-go' || s === 'no depart' ? 'nogo' : s === 'depart' ? 'go' : s; }

  /** "42 min", "3 h 5 min", "2 d 4 h" from a duration in ms (null -> "—"). */
  function age(ms) {
    if (ms == null || !isFinite(ms)) return '—';
    var m = Math.round(Math.abs(ms) / MIN), s = ms < 0 ? 'in ' : '';
    if (m < 1) return s + '<1 min';
    if (m < 60) return s + m + ' min';
    if (m < 2880) return s + Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
    return s + Math.floor(m / 1440) + ' d ' + Math.floor((m % 1440) / 60) + ' h';
  }

  /** UTC day/hour/minute -> ms, nearest month to now (reports never sit more than ~15 days away). */
  function dayT(d, h, mi, now) {
    var n = new Date(now), y = n.getUTCFullYear(), mo = n.getUTCMonth(), t = Date.UTC(y, mo, d, h, mi || 0);
    if (t - now > 15 * 864e5) t = Date.UTC(y, mo - 1, d, h, mi || 0); else if (now - t > 15 * 864e5) t = Date.UTC(y, mo + 1, d, h, mi || 0);
    return t;
  }
  var clean = function (raw) { return ' ' + String(raw || '').replace(/=/g, ' ').replace(/\s+/g, ' ').trim() + ' '; };

  /** METAR/SPECI observation time (ms) from the DDHHMMZ group. */
  function metarTime(raw, now) { var m = / (\d{2})(\d{2})(\d{2})Z /.exec(clean(raw)); return m ? dayT(+m[1], +m[2], +m[3], now) : null; }

  /** TAF times: issued (DDHHMMZ) and validity DDHH/DDHH (hour 24 allowed). */
  function tafTimes(raw, now) {
    var s = clean(raw), i = / (\d{2})(\d{2})(\d{2})Z /.exec(s), v = / (\d{2})(\d{2})\/(\d{2})(\d{2}) /.exec(s);
    var dh = function (d, h) { return dayT(+d, 0, 0, now) + (+h) * HOUR; };
    var from = v ? dh(v[1], v[2]) : null, to = v ? dh(v[3], v[4]) : null;
    if (from != null && to != null && to <= from) to += 30 * 864e5; // month wrap inside one TAF
    return { issued: i ? dayT(+i[1], +i[2], +i[3], now) : null, from: from, to: to };
  }

  /** METAR text without the leading METAR/SPECI/COR word, single spaces, no "=". */
  function norm(raw) { return String(raw || '').replace(/=/g, ' ').replace(/^\s*(METAR|SPECI)\s+(COR\s+)?/, '').replace(/^\s*TAF\s+(AMD\s+|COR\s+)?/, '').replace(/\s+/g, ' ').trim(); }
  var hhmm = function (t) { if (t == null) return '—'; var d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0') + 'Z'; };

  /**
   * One aerodrome's weather check.
   * x = { icao, name, status, src ('METAR'|'TAF'|'Model'|null),
   *       card: { metar, metarT, taf, modelT },            // what the card shows (raw text, ms times)
   *       site: { metar:{raw,t}, taf:{raw,issue,to} },     // the site's /api/metar + /api/taf feed
   *       up:   { metar:{raw,t}, taf:{raw,issue,to} },     // the source, aviationweather.gov, fetched directly
   *       upOk: true when the source answered,
   *       model: { diff: [..] } | { err } | null }         // direct Open-Meteo comparison (model cards only)
   * -> { level: OK|Warning|Error, issues:[{lvl,msg}], ages:{metar,taf,model} (ms), stale: bool }
   */
  function checkWeather(x, now) {
    var c = x.card || {}, site = x.site || {}, up = x.up || {}, out = [], I = function (l, m) { out.push({ lvl: l, msg: m }); };
    var cm = c.metar && /^(METAR|SPECI)\b/.test(String(c.metar).trim()) ? c.metar : null;
    var ct = c.taf && /^TAF\b/.test(String(c.taf).trim()) ? c.taf : null;
    var mT = cm ? (c.metarT || metarTime(cm, now)) : null, mAge = mT != null ? now - mT : null;
    var src = up.metar || null, srcT = src ? (src.t || metarTime(src.raw, now)) : null;
    var feed = site.metar || null, feedT = feed ? (feed.t || metarTime(feed.raw, now)) : null;
    var stale = false;

    /* METAR */
    if (cm) {
      if (mAge > LIMITS.metarLostMin * MIN) { stale = true; I('Error', 'METAR ' + hhmm(mT) + ' is ' + age(mAge) + ' old — has not updated'); }
      else if (mAge > LIMITS.metarMin * MIN) { stale = true; I('Warning', 'METAR ' + hhmm(mT) + ' is ' + age(mAge) + ' old (site limit 90 min)'); }
      if (srcT != null && srcT > mT + MIN) {
        var gap = srcT - mT; stale = true;
        I(gap > LIMITS.behindMin * MIN ? 'Error' : 'Warning', 'Source has a newer METAR (' + hhmm(srcT) + ') — card still shows ' + hhmm(mT) + ', ' + age(gap) + ' behind');
      } else if (src && srcT === mT && norm(src.raw) !== norm(cm)) I('Warning', 'Card METAR text differs from the source (same time ' + hhmm(mT) + ', amended?)');
    } else if (src && srcT != null && now - srcT <= LIMITS.metarMin * MIN) {
      I('Error', 'Source has a current METAR (' + hhmm(srcT) + ', ' + age(now - srcT) + ' old) but the card shows none');
    }
    if (feedT != null && srcT != null && srcT > feedT + MIN) I('Warning', 'Site /api/metar feed is behind the source by ' + age(srcT - feedT));
    if (cm && feedT != null && feedT > mT + MIN && !(srcT != null && srcT > mT + MIN)) { stale = true; I('Warning', 'Site feed has a newer METAR (' + hhmm(feedT) + ') than the card'); }
    if (cm && /\/\/\/\/|\s\/\/\/\/\/\/\s/.test(cm)) I('Warning', 'AUTO station sent no visibility/cloud (////)');

    /* TAF */
    var tt = ct ? tafTimes(ct, now) : null, uT = up.taf || null, tAge = tt && tt.issued != null ? now - tt.issued : null;
    if (ct) {
      if (tt.to != null && tt.to < now) { stale = true; I('Error', 'TAF on the card expired ' + age(now - tt.to) + ' ago'); }
      else if (tAge != null && tAge > LIMITS.tafIssueMin * MIN) { stale = true; I('Warning', 'TAF issued ' + hhmm(tt.issued) + ', ' + age(tAge) + ' ago — not updated'); }
      if (uT && uT.issue != null && tt.issued != null && uT.issue > tt.issued + MIN) { stale = true; I('Warning', 'Source has a newer TAF (issued ' + hhmm(uT.issue) + ') than the card (' + hhmm(tt.issued) + ')'); }
    } else if (uT && (uT.to == null || uT.to > now)) I('Warning', 'Source has a valid TAF (issued ' + hhmm(uT.issue) + ') but the card shows none');

    /* Model */
    var modAge = c.modelT != null ? now - c.modelT : null;
    if (x.src === 'Model') {
      if (c.modelT == null) I('Warning', 'Model weather time unknown');
      else if (modAge > LIMITS.modelMin * MIN) { stale = true; I('Warning', 'Model weather is ' + age(modAge) + ' old (site limit 90 min)'); }
      if (x.model && x.model.err) I('Warning', 'Direct Open-Meteo check failed (' + x.model.err + ')');
      else if (x.model && x.model.diff && x.model.diff.length) I('Warning', 'Model differs from a direct Open-Meteo fetch: ' + x.model.diff.join(', '));
    }

    if (key(x.status) === 'none') I('Warning', 'INCOMPLETE — no current weather on the card');
    if (x.upOk === false) I('Warning', 'Source (aviationweather.gov) not reachable — compared with the site feed only');
    var level = out.reduce(function (s, i) { return RANK[i.lvl] < RANK[s] ? i.lvl : s; }, 'OK');
    return { level: level, issues: out, stale: stale, ages: { metar: mAge, taf: tAge, model: modAge } };
  }

  /** Model vs direct Open-Meteo "current" (knots, metres). Returns a list of differences. */
  function modelDiff(o, d) {
    if (!o || !d) return [];
    var diff = [], dv = Math.min(10, d.visibility / 1e3);
    if (isFinite(o.wspd) && isFinite(d.wind_speed_10m) && Math.abs(o.wspd - d.wind_speed_10m) > 4) diff.push('wind ' + Math.round(o.wspd) + ' vs ' + Math.round(d.wind_speed_10m) + ' kt');
    if (o.gust != null && isFinite(d.wind_gusts_10m) && Math.abs(o.gust - d.wind_gusts_10m) > 6) diff.push('gust ' + Math.round(o.gust) + ' vs ' + Math.round(d.wind_gusts_10m) + ' kt');
    if (typeof o.vis === 'number' && isFinite(dv) && Math.abs(Math.min(10, o.vis) - dv) > 2) diff.push('vis ' + o.vis + ' vs ' + dv.toFixed(1) + ' km');
    return diff;
  }

  /**
   * The old status bar: count aerodromes per status and keep why for each.
   * list = [{ icao, name, status, why, src, time, heliport }]. Heliports and non-ICAO strips are left out, like the main page top boxes.
   */
  function groupStatus(list) {
    var g = { go: [], caution: [], nogo: [], none: [] }, seen = {};
    (list || []).forEach(function (a) {
      if (!a || !/^[A-Z]{4}$/.test(a.icao || '') || a.heliport || seen[a.icao]) return; seen[a.icao] = 1;
      var k = key(a.status); if (!g[k]) return;
      g[k].push({ icao: a.icao, name: a.name || a.icao, why: whyText(a), src: a.src || null, time: a.time || null });
    });
    ORDER.forEach(function (k) { g[k].sort(function (a, b) { return a.icao < b.icao ? -1 : 1; }); });
    return { groups: g, counts: { go: g.go.length, caution: g.caution.length, nogo: g.nogo.length, none: g.none.length }, total: ORDER.reduce(function (n, k) { return n + g[k].length; }, 0) };
  }
  /** Status explanation as the card shows it, without the leading status word. */
  function whyText(a) {
    var w = String(a.why || '').replace(/\s+/g, ' ').trim();
    w = w.replace(/^(DEPART|LAND|CAUTION|NO DEPART|NO LAND|NO-GO|GO|INCOMPLETE)\s*·\s*/i, '');
    if (!w) w = key(a.status) === 'none' ? 'No current weather' : 'No reason given';
    return w;
  }
  /** Status the bar glows with: the biggest group of DEPART / CAUTION / NO DEPART (same rule as the old #sv2bar). */
  function lead(counts) { return ['nogo', 'caution', 'go'].reduce(function (a, k) { return (counts[k] || 0) > (counts[a] || 0) ? k : a; }, 'go'); }

  /** Latest per station from aviationweather.gov JSON rows (METAR: obsTime s; TAF: issueTime ISO, validTimeTo s). */
  function latestMap(rows, kind) {
    var m = {};
    (Array.isArray(rows) ? rows : []).forEach(function (r) {
      var id = String(r.icaoId || r.stationId || '').toUpperCase(); if (!/^[A-Z]{4}$/.test(id)) return;
      if (kind === 'metar') { var t = (+r.obsTime || 0) * 1000; if (!t || /\bNIL\b/.test(r.rawOb || '')) return; if (!m[id] || t > m[id].t) m[id] = { raw: r.rawOb, t: t }; }
      else { var is = typeof r.issueTime === 'number' ? r.issueTime * 1000 : Date.parse(String(r.issueTime || '').replace(' ', 'T') + (/Z$/.test(r.issueTime || '') ? '' : 'Z'));
        var to = r.validTimeTo ? (typeof r.validTimeTo === 'number' ? r.validTimeTo * 1000 : Date.parse(r.validTimeTo)) : null;
        if (!isFinite(is)) is = null; if (!m[id] || (is || 0) > (m[id].issue || 0)) m[id] = { raw: r.rawTAF, issue: is, to: isFinite(to) ? to : null }; }
    });
    return m;
  }

  return { LABEL: LABEL, ORDER: ORDER, LIMITS: LIMITS, key: key, age: age, metarTime: metarTime, tafTimes: tafTimes, norm: norm, hhmm: hhmm,
    checkWeather: checkWeather, modelDiff: modelDiff, groupStatus: groupStatus, whyText: whyText, lead: lead, latestMap: latestMap };
});
