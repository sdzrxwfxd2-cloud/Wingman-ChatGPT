/* Critical 2 (31 Oct 2026) - shared model weather.
 * Loaded first on every page. Pages keep their own Open-Meteo URLs; this hook answers them from the ONE server copy
 * (/api/model-weather, refreshed every 6 h by a Netlify scheduled job), so browsers no longer call api.open-meteo.com.
 *  - "current" requests (lists, map, pilot, weather): values of the copy's hour that matches now.
 *  - 13-hour forecast requests (aerodrome pages): sliced from the same copy.
 *  - 10-minute phone copy shared by every page and frame (one /api/model-weather read per 10 min).
 *  - A hidden background frame (Map, Weather, Pilot kept warm) never touches the network until it is opened.
 *  - Anything the copy cannot answer goes to Open-Meteo gently (one at a time, 10-min reuse, 30-min pause after a 429),
 *    through wst/om-cache.js where a page loads it (fallback layer).
 *  - Failure: last good weather stays with "Model limit reached, showing weather from HH:MM SAST".
 *  - Stale guard (11 Nov 2026, MT t1513u): a "current" answer is given ONLY when the model hour it uses is valid
 *    within 180 min of now AND that point was fetched from Open-Meteo within 180 min (per-point fetch time when the
 *    copy has one, else the copy's refresh time). Otherwise nothing is served as current, so no status can come from
 *    old model data; the page falls back to METAR/TAF or "No current weather". Saved direct answers obey the same rule.
 *    Valid time, fetch time and (when known) model generation time stay separate; the banner shows UTC and SAST.
 *  - METAR/TAF first: lists already use the model only where there is no METAR; on an aerodrome page with a TAF,
 *    the first 3 forecast hours are marked as "METAR/TAF takes priority".
 *  - Credit line "Weather data by Open-Meteo.com" with CC BY 4.0 link wherever model data is shown.
 *  - Snapshot-only (9 Nov 2026, MT t873u/t875u): list, Status and card requests are answered ONLY from the copy, point by
 *    point (no more all-or-nothing batches, no direct Open-Meteo call from phones). Per point, by the time Open-Meteo was
 *    asked for that point: <= 180 min -> current (no "older" mark); > 180 min -> no current (FZL rule unchanged), so no
 *    status from it. Vars the copy does not
 *    carry come back as null (precipitation_probability: the rain line of the 13 h strip is hidden). Only URLs the copy
 *    cannot answer at all (dashboard / ops) still go direct, one at a time, and identical calls in flight are shared.
 */
(function () {
  'use strict';
  if (window.__wmModel) return; window.__wmModel = 1;
  var OM = /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/;
  var API = '/api/model-weather', LS_COPY = 'wm.mw.v2', LS_BLOCK = 'wm.om.block', LS_URL = 'wm.om.u:';
  var FZL_MAX_MS = 180 * 60e3, OLDER_MS = 180 * 60e3;   // serve-limit 180 min (MT t1513u: model is fresh up to 3 h, no older mark); FZL forecast may come from a copy point fetched up to 3 h ago
  var COPY_MS = 10 * 60e3, STALE_MS = 7.5 * 3600e3, MAX_AGE_MS = 180 * 60e3, BLOCK_MS = 30 * 60e3, GAP_MS = 1500, TOL = 0.005, PRIORITY_H = 3;
  var origFetch = window.fetch.bind(window);
  var top_ = (function () { try { return window.top.document && window.top; } catch (e) { return window; } })();
  function now() { return Date.now(); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function jsonResp(obj, status) { return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } }); }

  function hiddenFrame() {
    try { var f = window.frameElement; if (!f) return false;
      if (f.classList.contains('wmsec')) return !f.classList.contains('on') || f.style.display === 'none';
      return f.getClientRects().length === 0; } catch (e) { return false; }
  }
  function whenVisible() { return new Promise(function (res) { (function chk() { hiddenFrame() ? setTimeout(chk, 400) : res(); })(); }); }

  /* ---- copy lookup ---- */
  function index(d) {
    if (d._ix) return d._ix; var ix = {};
    d.pts.forEach(function (p, i) { var k = Math.round(p[1] * 100) + ',' + Math.round(p[2] * 100); (ix[k] = ix[k] || []).push(i); });
    Object.defineProperty(d, '_ix', { value: ix }); return ix;
  }
  function find(d, la, lo) {
    var ix = index(d), a = Math.round(la * 100), b = Math.round(lo * 100), best = -1, bd = TOL;
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) (ix[(a + x) + ',' + (b + y)] || []).forEach(function (i) {
      var dd = Math.abs(d.pts[i][1] - la) + Math.abs(d.pts[i][2] - lo); if (dd <= bd) { bd = dd; best = i; } });
    return best;
  }
  function hourIdx(d, t) { // last hour step <= t
    var h = -1; for (var i = 0; i < d.time.length; i++) if (Date.parse(d.time[i] + 'Z') <= t) h = i; return h;
  }
  var mem = null;   // parsed copy kept in memory (the 0.7 MB localStorage copy is parsed once, not per request)
  function getCopy(allowNet) {
    if (mem && now() - mem.got < COPY_MS) return Promise.resolve(mem);
    var c = ls(LS_COPY); if (c) mem = c;
    if (c && now() - c.got < COPY_MS) return Promise.resolve(c);
    if (!allowNet) return Promise.resolve(c || null);
    if (top_.__wmModelP) return top_.__wmModelP;
    var p = origFetch(API, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) { d.got = now(); ls(LS_COPY, d); mem = d; return d; })
      .catch(function () { var old = ls(LS_COPY); if (old) { old.got = now() - COPY_MS + 60e3; old.failed = 1; ls(LS_COPY, old); mem = old; } return old || null; })
      .then(function (d) { setTimeout(function () { top_.__wmModelP = null; }, 0); return d; });
    top_.__wmModelP = p; return p;
  }
  var CUR_KEYS = ['latitude', 'longitude', 'current', 'wind_speed_unit', 'timezone'], FZL_KEYS = CUR_KEYS.concat(['hourly', 'forecast_hours']);
  var HR_KEYS = ['latitude', 'longitude', 'hourly', 'wind_speed_unit', 'timezone', 'forecast_hours'];
  function parse(u) {
    var q = new URL(u).searchParams, kind = q.get('current') && !q.get('hourly') ? 'cur' : (q.get('hourly') && !q.get('current') ? 'hr' : null);
    /* FZL fix (9 Nov 2026, MT t844u): card "current + hourly=freezing_level_height" requests are answered from the copy too
       (they used to always go direct to Open-Meteo, so a 429 / 30-min block on the phone removed every FZL pill). */
    var fzl = !kind && !!q.get('current') && q.get('hourly') === 'freezing_level_height'; if (fzl) kind = 'cur';
    var allowed = fzl ? FZL_KEYS : kind === 'cur' ? CUR_KEYS : HR_KEYS, ok = !!kind;
    /* Extra keys that do not change which copy values we return. The calculator asks for
       elevation / past_days / forecast_days; rejecting them used to send the phone straight
       to Open-Meteo, and a 429 then blocked every other direct model call for 30 min. */
    var IGNORE_KEYS = { elevation: 1, past_days: 1, forecast_days: 1 };
    q.forEach(function (v, k) { if (allowed.indexOf(k) < 0 && !IGNORE_KEYS[k]) ok = false; });
    var varList = (q.get(kind === 'cur' ? 'current' : 'hourly') || '').split(',');
    /* Vars the copy never carries (winds-aloft, etc.): the URL is not a list/card/calculator
       request, so it must stay on the gentle direct path. Mixed requests (known + optional
       extras like surface_pressure or weather_code) still use the copy; missing extras come back null. */
    var COPY_VARS = { temperature_2m: 1, dew_point_2m: 1, wind_speed_10m: 1, wind_direction_10m: 1, wind_gusts_10m: 1, visibility: 1, pressure_msl: 1, cloud_cover: 1, cloud_cover_low: 1, cloud_base: 1, freezing_level_height: 1 };
    if (!varList.some(function (x) { return COPY_VARS[x]; })) ok = false;
    var needWind = varList.some(function (x) { return /wind/.test(x); });
    if ((needWind && q.get('wind_speed_unit') !== 'kn') || (!needWind && q.get('wind_speed_unit') && q.get('wind_speed_unit') !== 'kn') || !/^(|UTC|GMT)$/.test(q.get('timezone') || '')) ok = false;
    return { ok: ok, kind: kind, la: (q.get('latitude') || '').split(',').map(Number), lo: (q.get('longitude') || '').split(',').map(Number),
      vars: varList, n: +(q.get('forecast_hours') || 13), tz: q.get('timezone') || 'GMT', fzl: fzl };
  }
  /* ---- stale guard (6 Nov 2026) ---- */
  function ms(x) { var v = typeof x === 'number' ? x : Date.parse(x); return isFinite(v) ? v : NaN; }
  function validMs(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? Date.parse(s + 'Z') : NaN; } // copy hours are UTC, no zone
  function fetchedOf(d, i) { return d.ft && d.ft[i] ? d.ft[i] : d.updatedAt; }   // per-point fetch time if the copy has one
  /* Why a model hour may NOT be used as current: null = fresh enough. */
  function staleWhy(validT, fetchedT, t, maxFetch) {
    if (!isFinite(validT)) return 'no valid time';
    if (!isFinite(fetchedT)) return 'no fetch time';
    if (fetchedT > t + 60e3 || validT > t + MAX_AGE_MS) return 'time in the future';
    if (t - validT > MAX_AGE_MS) return 'model hour too old';
    if (t - fetchedT > (maxFetch || MAX_AGE_MS)) return 'model copy too old';
    return null;
  }
  var lastStale = null;   // {valid, fetched, why} of the last point with no usable current, for the banner
  /* One answer per point, never all-or-nothing (9 Nov 2026). Returns null only when the copy itself is unusable. */
  function answer(d, P, t) {
    if (!d || !d.v || !d.time || !d.vars) return null;
    var h = hourIdx(d, t); if (h < 0) return null;
    if (P.kind === 'hr' && h >= d.time.length - 1) return null;          // nothing ahead left in the copy
    var out = [], fzlOnly = P.fzl && P.vars.length === 1 && P.vars[0] === 'temperature_2m', usable = 0;
    var hasFz = d.vars.indexOf('freezing_level_height') >= 0 && d.v.freezing_level_height;
    function val(k, i) { var r = d.v[k] && d.v[k][i]; return r ? r : null; }   // var not in the copy -> null
    for (var n = 0; n < P.la.length; n++) {
      var i = find(d, P.la[n], P.lo[n]), vT = validMs(d.time[h]), fT = i < 0 ? NaN : ms(fetchedOf(d, i));
      var o = { latitude: P.la[n], longitude: P.lo[n], elevation: i >= 0 && d.el ? d.el[i] : null, generationtime_ms: 0, utc_offset_seconds: 0,
        timezone: P.tz, timezone_abbreviation: P.tz, wingman_copy: d.updatedAt,
        wingman_valid: isFinite(vT) ? new Date(vT).toISOString() : null,          // forecast valid time (UTC)
        wingman_fetched: isFinite(fT) ? new Date(fT).toISOString() : null,        // when Open-Meteo was asked
        wingman_generated: i >= 0 && d.gen && d.gen[i] || null };                 // model run time, null = unknown (never the fetch time)
      if (i < 0) { o.wingman_missing = true; lastStale = { valid: vT, fetched: NaN, why: 'not in the copy' }; out.push(o); continue; }
      if (P.kind === 'cur') {
        var why = staleWhy(vT, fT, t, OLDER_MS);
        if (why) lastStale = { valid: vT, fetched: fT, why: why };
        else { var cur = { time: d.time[h], interval: 3600 }, cu = { time: 'iso8601', interval: 'seconds' }; usable++;
          /* FZL answers carry every copy var (as on main #355): wst-card merges this temperature-only answer over the full one */
          (P.fzl ? P.vars.concat(d.vars.filter(function (k) { return k !== 'freezing_level_height' && P.vars.indexOf(k) < 0; })) : P.vars)
            .forEach(function (k) { var r = val(k, i); cur[k] = r ? r[h] : null; cu[k] = (d.units || {})[k]; });
          o.current = cur; o.current_units = cu;
          }                    // <= 180 min: current, no older mark (MT t1513u)
        if (P.fzl && hasFz && !(d.fz && d.fz[i] === false) && t - fT <= FZL_MAX_MS) {
          o.hourly = { time: d.time.slice(h, h + P.n), freezing_level_height: (val('freezing_level_height', i) || []).slice(h, h + P.n) };
          o.hourly_units = { time: 'iso8601', freezing_level_height: (d.units || {}).freezing_level_height || 'm' }; usable++; }
      } else {
        if (t - fT > OLDER_MS) { lastStale = { valid: vT, fetched: fT, why: 'model copy too old' }; out.push(o); continue; }
        var hr = { time: d.time.slice(h, h + P.n) }, hu = { time: 'iso8601' }, none = [];
        P.vars.forEach(function (k) { var r = val(k, i); if (!r) none.push(k);
          hr[k] = r ? r.slice(h, h + P.n) : hr.time.map(function () { return null; }); hu[k] = (d.units || {})[k]; });
        o.hourly = hr; o.hourly_units = hu; usable++;
        if (none.length) o.wingman_nulls = none;
        /* no older mark: model is fresh up to 180 min (MT t1513u) */
      }
      out.push(o);
    }
    if (!usable && lastStale && !fzlOnly) staleBanner(lastStale);   // nothing usable in this request: say so (METAR/TAF still shown)
    return out.length === 1 ? out[0] : out;
  }

  /* ---- gentle direct path ---- */
  var queue = Promise.resolve(), lastDirect = 0;
  function blocked() { var b = ls(LS_BLOCK); return b && now() < b; }
  /* a saved direct answer may stand in only while it is fresh: fetched <= 90 min ago and every 'current' valid <= 90 min ago */
  function freshHit(hit) {
    if (!hit || !hit.j || now() - hit.t > MAX_AGE_MS) return null;
    var ok = [].concat(hit.j).every(function (o) { return !o || !o.current || !staleWhy(validMs(o.current.time), hit.t, now()); });
    return ok ? hit : null;
  }
  var inflight = {};   // identical direct calls in flight share one request (no duplicate batches)
  function direct(input, u, init) {
    var hit = freshHit(ls(LS_URL + u)); if (hit && now() - hit.t < COPY_MS) return Promise.resolve(jsonResp(hit.j));
    if (blocked()) { banner(hit && hit.t, true); return Promise.resolve(hit ? jsonResp(hit.j) : unavailable()); }
    if (inflight[u]) return inflight[u].then(function (r) { return r.clone(); });
    var job = queue.then(whenVisible).then(function () { var w = Math.max(0, lastDirect + GAP_MS - now()); return new Promise(function (r) { setTimeout(r, w); }); })
      .then(function () { var h2 = freshHit(ls(LS_URL + u)); if (h2 && now() - h2.t < COPY_MS) return jsonResp(h2.j);   // answered while queued
        lastDirect = now(); return origFetch(input, init).then(function (r) {
        if (r.status === 429) { ls(LS_BLOCK, now() + BLOCK_MS); banner(hit && hit.t, true); return hit ? jsonResp(hit.j) : unavailable(); }
        if (!r.ok) return hit ? jsonResp(hit.j) : r;
        return r.clone().json().then(function (j) { try { prune(); ls(LS_URL + u, { t: now(), j: j }); } catch (e) {} credit(null); return r; }, function () { return r; });
      }); })
      .catch(function (e) { if (hit) { banner(hit.t, false); return jsonResp(hit.j); } throw e; });
    inflight[u] = job; job.then(function () { delete inflight[u]; }, function () { delete inflight[u]; });
    queue = job.catch(function () {}); return job.then(function (r) { return r.clone(); });
  }
  /* handled 429 with nothing saved: a clean JSON answer pages can read without throwing */
  function unavailable() { return jsonResp({ error: true, reason: 'Model weather unavailable' }, 429); }
  function prune() { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(LS_URL) === 0) ks.push([k, (ls(k) || {}).t || 0]); }
    ks.sort(function (a, b) { return a[1] - b[1]; }).slice(0, Math.max(0, ks.length - 19)).forEach(function (k) { localStorage.removeItem(k[0]); }); }

  /* ---- step 2 (9 Nov 2026): the small "now" file (/api/wx-now, ~25 KB gz, written by the weather Worker every 10 min) ----
     Current + next-hour model values, freezing level, fetch time per aerodrome, plus the METAR and TAF rows. List, Status and
     card "current" requests and /api/metar + /api/taf are answered from it first; the full copy stays for the 13 h strip and as
     the fallback when the now file is missing (worker not deployed yet, 503) or too old. */
  var NOW_API = '/api/wx-now', LS_NOW = 'wm.now.v1', NOW_TTL = 60e3, NOW_MAX_MS = 15 * 60e3, nowMem = null;
  function nowOk(n) { return n && !n.error && n.v === 1 && Array.isArray(n.pts) && now() - Date.parse(n.composedAt) < NOW_MAX_MS; }
  function getNow(allowNet) {
    if (nowMem && now() - nowMem.got < NOW_TTL) return Promise.resolve(nowMem);
    var c = ls(LS_NOW); if (c && (!nowMem || c.got > nowMem.got)) nowMem = c;
    if (c && now() - c.got < NOW_TTL) return Promise.resolve(c);
    if (!allowNet) return Promise.resolve(nowOk(nowMem) ? nowMem : null);
    if (top_.__wmNowP) return top_.__wmNowP;
    var miss = ls(LS_NOW + '.miss'); if (miss && now() - miss < 5 * 60e3) return Promise.resolve(nowOk(nowMem) ? nowMem : null);   // no now file: ask again in 5 min
    var p = origFetch(NOW_API, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (n) { if (!nowOk(n)) throw 0; n.got = now(); try { ls(LS_NOW, n); ls(LS_NOW + '.miss', null); } catch (e) {} nowMem = n; return n; })
      .catch(function () { ls(LS_NOW + '.miss', now()); return nowOk(nowMem) ? nowMem : null; })
      .then(function (n) { setTimeout(function () { top_.__wmNowP = null; }, 0); return n; });
    top_.__wmNowP = p; return p;
  }
  function fromNow(n) {   // now file -> the same shape as the full copy, so answer() works unchanged
    if (!n) return null; if (n._d) return n._d;
    var t0 = Date.parse(n.t0 + 'Z'), HH = n.fzlHours || 5, NH = n.hours || 2, time = [], v = {};
    for (var h = 0; h < HH; h++) time.push(new Date(t0 + h * 3600e3).toISOString().slice(0, 16));
    n.vars.forEach(function (k, j) { v[k] = n.c.map(function (row) { var a = []; for (var h2 = 0; h2 < HH; h2++) a.push(h2 < NH ? row[j * NH + h2] : null); return a; }); });
    v.freezing_level_height = n.fzl;
    var fts = n.ft.map(ms).filter(isFinite);
    var d = { updatedAt: new Date(Math.min.apply(null, fts)).toISOString(), vars: n.vars.concat(['freezing_level_height']), units: n.units || {},
      pts: n.pts, time: time, el: n.el, v: v, ft: n.ft, fz: n.fz, got: n.got, nowFile: true, validUntil: t0 + NH * 3600e3 };
    Object.defineProperty(n, '_d', { value: d }); return d;
  }
  /* "current" answers: the now file first, the full copy if the now file is missing or past its hours */
  function copyCur() {
    return getNow(false).then(function (n) { return n || whenVisible().then(function () { return getNow(true); }); })
      .then(function (n) { var d = fromNow(n); return d && now() < d.validUntil ? d : copyNow(); }, function () { return copyNow(); });
  }
  function best() { var d = nowMem && fromNow(nowMem); return d && now() < d.validUntil ? d : mem; }
  /* /api/metar and /api/taf from the now file (same rows the API serves from the snapshot); anything else goes to the network */
  function wxApi(kind, input, init) {
    return getNow(true).then(function (n) {
      var rows = n && n[kind];
      if (!Array.isArray(rows) || !rows.length) return origFetch(input, init);
      return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json', 'X-WX-Source': 'now' } });
    }, function () { return origFetch(input, init); });
  }
  function copyNow() {
    return getCopy(false).then(function (c) {
      if (c && now() - c.got < COPY_MS) return c;
      return whenVisible().then(function () { return getCopy(true); });
    });
  }
  function served(d, P) {   // after a copy answer: banners and the TAF-priority note
    credit(d);
    var upd = Date.parse(d.updatedAt), st = d.state || {};
    if (d.failed || now() - upd > STALE_MS || (st.error && Date.parse(st.lastTry || 0) > upd)) banner(upd, true);
    if (P.kind === 'hr') setTimeout(priority, 0);
  }
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || String(input);
    var api = /^(?:https?:\/\/[^\/]+)?\/api\/(metar|taf)$/.exec(u);
    if (api && (!init || !init.method || init.method === 'GET') && (u.charAt(0) === '/' || u.indexOf(location.origin + '/') === 0)) return wxApi(api[1], input, init);
    if (!OM.test(u)) return origFetch(input, init);
    var P = parse(u);
    if (!P.ok) return direct(input, u, init);   // URLs the copy cannot answer at all (dashboard / ops pages)
    return (P.kind === 'cur' && (!P.fzl || P.n <= 4) ? copyCur() : copyNow()).then(function (d) {
      lastStale = null; var a = answer(d, P, now());
      if (!a) { banner(0, false); return unavailable(); }   // no usable copy: no direct call from phones
      /* Map grids (isobars) use the same "current=pressure_msl" shape as a list request, but
         their lat/lon are not aerodromes, so most points come back wingman_missing. Lists and
         cards match the copy, so their missing rate stays low. A high miss rate means the copy
         cannot answer this request at all — send it down the gentle direct path (queued, 1.5 s
         gap, 30 min pause after a 429). */
      var arr = [].concat(a), miss = 0, i;
      for (i = 0; i < arr.length; i++) if (arr[i] && arr[i].wingman_missing) miss++;
      if (arr.length && miss / arr.length > 0.5) return direct(input, u, init);
      served(d, P);
      if (P.kind === 'hr' && [].concat(a).some(function (o) { return o.wingman_nulls; })) setTimeout(function () { noRain([].concat(a)[0]); }, 0);
      return jsonResp(a);
    }).catch(function () { return unavailable(); });   // never let the hook break a page
  };
  /* Status / list helper: many points from the copy in one go, no Response / URL round trip.
     pts: [[la, lo], ...], vars: current vars. Resolves to one answer object per point (null when the copy is missing). */
  window.__wmModelPoints = function (pts, vars) {
    var P = { ok: true, kind: 'cur', la: pts.map(function (p) { return +p[0]; }), lo: pts.map(function (p) { return +p[1]; }),
      vars: vars, n: 4, tz: 'GMT', fzl: false };
    return copyCur().then(function (d) {
      lastStale = null; var a = pts.length ? answer(d, P, now()) : [];
      if (!a) { banner(0, false); return pts.map(function () { return null; }); }
      served(d, P); return [].concat(a);
    }).catch(function () { return pts.map(function () { return null; }); });
  };
  window.__wmModelTest = { parse: parse, answer: answer, OLDER_MS: OLDER_MS, hourIdx: hourIdx, direct: direct, staleWhy: staleWhy, stamp: stamp, MAX_AGE_MS: MAX_AGE_MS,
    lastStale: function () { return lastStale; } };

  /* ---- UI ---- */
  function onBody(f) { if (document.body) f(); else document.addEventListener('DOMContentLoaded', f); }
  function sast(t) { try { return new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }) + ' SAST'; } catch (e) { return ''; } }
  /* "3 Nov 2026 15:01 UTC (3 Nov 17:01 SAST)": always the date, always both zones */
  function stamp(t) {
    if (!isFinite(t)) return 'unknown time';
    function f(z, y) { var o = { timeZone: z, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }; if (y) o.year = 'numeric';
      var p = {}; new Intl.DateTimeFormat('en-GB', o).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = x.value; });
      return p.day + ' ' + p.month + (y ? ' ' + p.year : '') + ' ' + p.hour + ':' + p.minute; }
    try { return f('UTC', 1) + ' UTC (' + f('Africa/Johannesburg', 0) + ' SAST)'; } catch (e) { return new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
  }
  /* old model refused: say so, with the copy's date and time in UTC and SAST */
  function staleBanner(s) {
    var t = isFinite(s.fetched) ? s.fetched : s.valid; staleShown = s;
    bannerText('Model weather too old, not used for status. Last model data: ' + stamp(t) + '. METAR/TAF still shown.');
  }
  function credit(d) {
    return; /* pager-tidy (MT t1746): weather source + 'Model updated' line removed from pages; covered in the terms and conditions */
    onBody(function () {
      var s = document.getElementById('wm-om-credit');
      if (!s) { s = document.createElement('div'); s.id = 'wm-om-credit';
        s.style.cssText = 'font:500 11px/1.4 -apple-system,system-ui,sans-serif;opacity:.65;text-align:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));color:inherit';
        document.body.appendChild(s); }
      var html = 'Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noopener" style="color:inherit">Open-Meteo.com</a> ' +
        '(<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener" style="color:inherit">CC BY 4.0</a>)';
      if (d && d.updatedAt) html += ' &middot; Model updated ' + sast(Date.parse(d.updatedAt));
      else if (s.dataset.t) return;
      s.dataset.t = d && d.updatedAt || ''; s.innerHTML = html;
    });
  }
  var staleShown = null;
  function banner(t, limit) {
    if (!t && staleShown) return;   // keep the dated "too old" notice rather than a vaguer one
    bannerText(t ? (limit ? 'Model limit reached' : 'Model update failed') + ', showing weather from ' + stamp(t) : 'Model weather unavailable right now. METAR/TAF still shown.');
  }
  function bannerText(text) {
    if (hiddenFrame()) return;
    onBody(function () {
      var b = document.getElementById('wm-om-stale');
      if (!b) { b = document.createElement('div'); b.id = 'wm-om-stale'; b.setAttribute('role', 'status');
        b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(78px + env(safe-area-inset-top));z-index:2147483000;max-width:92vw;padding:8px 14px;border-radius:999px;font:600 12.5px/1.3 -apple-system,system-ui,sans-serif;color:#fff;background:rgba(28,28,30,.82);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 4px 18px rgba(0,0,0,.25);text-align:center';
        b.onclick = function () { b.remove(); }; document.body.appendChild(b); }
      b.textContent = text;
    });
  }
  /* Display helper (10 Nov 2026, MT t1104u): read freezing level and elevation
     from the already-loaded copy. Does not change how status is computed. */
  window.__wmFzlAt = function (la, lo) {
    var d = best(); if (!d || !d.v) return null;
    var i = find(d, +la, +lo); if (i < 0) return null;
    var h = hourIdx(d, now());
    var row = d.v.freezing_level_height && d.v.freezing_level_height[i];
    if (!row) return null;
    var fl = (h >= 0 && row[h] != null) ? row[h] : row[0];
    if (fl == null) return null;
    return {
      fl: fl,
      elev: d.el ? d.el[i] : null,
      next: (h >= 0 && row[h + 1] != null) ? row[h + 1] : (row[1] != null ? row[1] : null),
      time: d.time && h >= 0 ? d.time[h] : (d.time && d.time[0] || null)
    };
  };

  /* 13 h strip: the copy has no rain chance, so its "% rain" line is hidden instead of showing a false 0% */
  function noRain(o, n) {
    if (!o || !o.wingman_nulls || o.wingman_nulls.indexOf('precipitation_probability') < 0) return;
    var el = document.getElementById('mhr'); if (!el) return;
    var tiles = el.querySelectorAll('.mht'); if (!tiles.length) { if ((n || 0) < 25) setTimeout(function () { noRain(o, (n || 0) + 1); }, 200); return; }
    el.querySelectorAll('.mht .mx span').forEach(function (x) { if (/% rain$/.test(x.textContent)) x.remove(); });
  }
  /* METAR/TAF first for the next 3 h on an aerodrome page that has a TAF. */
  function priority() {
    var el = document.getElementById('mhr'), taf = document.querySelector('.tafl div');
    if (!el || !taf || el.dataset.prio) return;
    var tiles = el.querySelectorAll('.mht'); if (!tiles.length) return setTimeout(priority, 200);
    el.dataset.prio = 1;
    for (var i = 0; i < Math.min(PRIORITY_H, tiles.length); i++) { tiles[i].style.opacity = '.45'; tiles[i].title = 'METAR/TAF takes priority'; }
    var n = document.createElement('p'); n.className = 'gsub'; n.id = 'wm-prio';
    n.textContent = 'Next 3 h: the METAR/TAF takes priority. The model fills in after that.';
    el.parentNode.insertBefore(n, el);
  }
})();
