/* ops-weather.js — Weather Test (admin), rebuilt on the NEW engine.
 * Layout = old v2 Weather Test (design_review/weather_test). Data: main.html loaded hidden (same /api/metar + /api/taf feed,
 * same Open-Meteo model data, same wm-core.js via wst/wm-bridge.js), so every GO/CAUTION/NO-GO here IS the main page's result.
 * Checks per aerodrome: card badge vs engine (and a re-run of WMCore.evaluate), METAR/TAF vs the live feed, age, AUTO ////,
 * model data vs a direct Open-Meteo fetch (batched 50, 1.2 s apart, 429 back-off, 15-min localStorage cache). */
(function () {
  'use strict';
  var $ = function (q, r) { return (r || document).querySelector(q); }, $$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  var H = document.documentElement, LS = (function () { try { return localStorage; } catch (e) { return null; } })(), SS = (function () { try { return sessionStorage; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sast = function (t, full) { if (!t) return '—'; return new Date(t).toLocaleString('en-ZA', full ? { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false } : { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + ' SAST'; };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LBL = { go: 'GO', caution: 'CAUTION', nogo: 'NO-GO', none: 'No weather' }, cls = { OK: 'ok', Warning: 'warn', Error: 'err' }, RANK = { Error: 0, Warning: 1, OK: 2 };

  /* ---------- theme (same two as ops.html) ---------- */
  var TH = { black: ['night', 'black'], white: ['day', 'white'] };
  function markTheme() { $$('.thm button').forEach(function (b) { var t = TH[b.dataset.t]; b.classList.toggle('on', H.dataset.theme === t[0] && H.dataset.pal === t[1]); }); }
  $$('.thm button').forEach(function (b) { b.onclick = function () { var t = TH[b.dataset.t]; H.dataset.theme = t[0]; H.dataset.pal = t[1]; try { LS.setItem('wm-ops-theme', b.dataset.t); } catch (e) {} markTheme(); }; });
  markTheme();

  /* ---------- admin gate: same ADMIN_PASSWORD + session token as ops.html (/api/ops) ---------- */
  var tok = SS && SS.getItem('wm-ops');
  function gate(msg) { $('#app').hidden = true; $('#gate').hidden = false; $('#lerr').textContent = msg || ''; $('#pw').focus(); }
  function check(fromForm) {
    if (!tok) return gate();
    fetch('/api/ops', { headers: { Authorization: 'Basic ' + tok }, cache: 'no-store' }).then(function (r) {
      if (r.status === 401) { tok = null; SS && SS.removeItem('wm-ops'); return gate(fromForm ? 'Wrong password.' : ''); }
      if (!r.ok) return gate('Ops function not answering (HTTP ' + r.status + ').');
      SS && SS.setItem('wm-ops', tok); $('#gate').hidden = true; $('#app').hidden = false; segs(); run();
    }, function (e) { gate('Could not reach /api/ops: ' + (e.message || e)); });
  }
  $('#lf').addEventListener('submit', function (e) { e.preventDefault(); tok = btoa('admin:' + $('#pw').value); $('#pw').value = ''; check(true); });

  /* ---------- run log + progress ---------- */
  var LOG = [];
  function log(lvl, msg) { LOG.push({ t: Date.now(), lvl: lvl, msg: msg });
    $('#lg').innerHTML = LOG.map(function (l) { return '<div><time>' + sast(l.t).replace(/^.* (\d\d:\d\d) SAST$/, '$1') + '</time><span class="' + (l.lvl === 'err' ? 'err' : l.lvl === 'ok' ? 'ok' : l.lvl === 'warn' ? 'warn' : '') + '">' + esc(l.msg) + '</span></div>'; }).join(''); }
  function prog(f) { $('#prog i').style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)) + ')'; $('#prog').style.opacity = f >= 1 ? '0' : '1'; }

  /* ---------- sources ---------- */
  function getFeed() {
    var t0 = Date.now(), j = function (u) { var t = Date.now(); return fetch(u, { cache: 'no-store' }).then(function (r) { var ms = Date.now() - t; if (!r.ok) throw new Error('HTTP ' + r.status + ' in ' + ms + ' ms'); return r.json().then(function (d) { return { d: d || [], ms: ms }; }); }); };
    return Promise.all([j('/api/metar').catch(function (e) { return { err: e.message }; }), j('/api/taf').catch(function (e) { return { err: e.message }; })]).then(function (a) {
      if (a[0].err) log('err', 'Site /api/metar: ' + a[0].err); else log('ok', 'Site /api/metar: HTTP 200 in ' + a[0].ms + ' ms, ' + a[0].d.length + ' reports');
      if (a[1].err) log('err', 'Site /api/taf: ' + a[1].err); else log('ok', 'Site /api/taf: HTTP 200 in ' + a[1].ms + ' ms, ' + a[1].d.length + ' reports');
      var M = {}, T = {};
      (a[0].d || []).forEach(function (m) { if (!M[m.icaoId] || (m.obsTime || 0) > (M[m.icaoId].obsTime || 0)) M[m.icaoId] = m; });
      (a[1].d || []).forEach(function (t) { if (!T[t.icaoId] || (t.issueTime || '') > (T[t.icaoId].issueTime || '')) T[t.icaoId] = t; });
      return { M: M, T: T, ok: !a[0].err };
    });
  }
  function loadMain() {
    var t0 = Date.now();
    return new Promise(function (res) {
      var f = $('#mainf'), last = -1, same = 0;
      f.onload = function () {
        (function poll() {
          var w = f.contentWindow, n = 0, cards = 0;
          try { n = Object.keys(w.__wmR || {}).length; cards = w.document.querySelectorAll('article.card').length; } catch (e) {}
          prog(cards ? 0.1 + 0.5 * Math.min(1, n / cards) : 0.08);
          if (cards && n >= cards && n === last) same++; else same = 0; last = n;
          if (same >= 3 || Date.now() - t0 > 45000) { log(n ? 'ok' : 'err', 'Aerodrome page: ' + cards + ' cards, ' + n + ' engine results in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s'); return res(w); }
          setTimeout(poll, 1000);
        })();
      };
      f.src = '/main.html?ops=1&wt=1';
    });
  }
  /* direct Open-Meteo check — throttled + cached so the admin page never causes HTTP 429 */
  var OM_TTL = 15 * 6e4, OM_BATCH = 50, OM_GAP = 1200;
  function omKey(la, lo) { return 'wm-wt-om:' + la.toFixed(3) + ',' + lo.toFixed(3); }
  function omGet(la, lo) { try { var o = JSON.parse(LS.getItem(omKey(la, lo))); return o && Date.now() - o.t < OM_TTL ? o.d : null; } catch (e) { return null; } }
  function omPut(la, lo, d) { try { LS.setItem(omKey(la, lo), JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function directModel(list) { /* list: [{icao,lat,lon}] -> {icao: current|{err}} */
    var out = {}, need = [];
    list.forEach(function (x) { var c = omGet(x.lat, x.lon); if (c) out[x.icao] = c; else need.push(x); });
    log('info', list.length + ' model-weather aerodromes; ' + (list.length - need.length) + ' from 15-min cache, ' + need.length + ' to fetch in batches of ' + OM_BATCH);
    var i = 0, b = 0;
    function next() {
      if (i >= need.length) return Promise.resolve(out);
      var P = need.slice(i, i + OM_BATCH), n = ++b, t0 = Date.now(); i += OM_BATCH;
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + P.map(function (p) { return p.lat.toFixed(4); }).join(',') + '&longitude=' + P.map(function (p) { return p.lon.toFixed(4); }).join(',') +
        '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover,temperature_2m,pressure_msl&wind_speed_unit=kn&timezone=UTC';
      var tryOnce = function (k) {
        return fetch(url).then(function (r) {
          if (r.status === 429 && k < 2) { log('warn', 'Direct batch ' + n + ': HTTP 429, backing off ' + (k + 1) * 5 + ' s'); return sleep((k + 1) * 5000).then(function () { return tryOnce(k + 1); }); }
          if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
        });
      };
      return tryOnce(0).then(function (j) {
        [].concat(j).forEach(function (o, k) { if (o && o.current) { out[P[k].icao] = o.current; omPut(P[k].lat, P[k].lon, o.current); } });
        log('ok', 'Direct batch ' + n + ': ' + P.length + ' coords, OK in ' + (Date.now() - t0) + ' ms');
      }, function (e) { P.forEach(function (p) { out[p.icao] = { err: e.message || String(e) }; }); log('err', 'Direct batch ' + n + ': ' + (e.message || e)); })
        .then(function () { prog(0.65 + 0.33 * Math.min(1, i / need.length)); return i < need.length ? sleep(OM_GAP).then(next) : out; });
    }
    return next();
  }

  /* ---------- checks ---------- */
  var norm = function (s) { return String(s || '').replace(/=/g, ' ').replace(/^\s*(METAR|SPECI)\s+(COR\s+)?/, '').replace(/\s+/g, ' ').trim(); };
  var inSA = function (la, lo) { return la >= -35.5 && la <= -22 && lo >= 16 && lo <= 33.5; };
  function rowsFrom(w, F) {
    var D = w.document, R = w.__wmR || {}, K = w.WMCore, B = w.WMB, prof = B && B.prof ? B.prof() : null, txt = function (c, q) { var e = c.querySelector(q); return e ? (e.textContent || '').trim() : ''; };
    var seen = {}, rows = [];
    $$('article.card', D).forEach(function (c) {
      var ic = txt(c, '.icao'); if (!ic || seen[ic]) return; seen[ic] = 1;
      var e = R[ic], r = e && e.r, wx = e && e.w, ad = (e && e.ad) || {}, la = c.querySelector('[data-la]');
      if (ad.lat == null && la) { ad.lat = +la.dataset.la; ad.lon = +la.dataset.lo; }
      var cm = txt(c, '.cp[data-p=metar] .mono'), ct = txt(c, '.cp[data-p=taf] .mono'), hasM = /^(METAR|SPECI)\b/.test(cm), hasT = /^TAF\b/.test(ct);
      var src = r && r.source, row = { icao: ic, name: txt(c, 'h2') || ic, s: r ? r.status : 'none', badge: c.dataset.s, src: src === 'Model' || (!src && !hasM && !hasT) ? 'Model' : 'METAR/TAF',
        esrc: src || '—', time: r && r.time, ageMin: wx && wx.ageMin, why: r ? (r.status === 'none' ? r.why : r.whyShort) : 'No engine result', issues: [], lat: ad.lat, lon: ad.lon, obs: wx && wx.obs,
        site: hasM ? cm : hasT ? ct : null, off: null, href: (c.querySelector('a.go-fact') || {}).getAttribute ? c.querySelector('a.go-fact').getAttribute('href') : null };
      var I = function (lvl, msg) { row.issues.push({ lvl: lvl, msg: msg }); };
      // 1. engine == main page (badge) and engine is deterministic
      if (!r) I('Error', 'No WMCore result for this card');
      else {
        if (row.badge && row.badge !== r.status) I('Error', 'Card badge ' + (LBL[row.badge] || row.badge) + ' but engine says ' + LBL[r.status]);
        if (K && prof && ad && wx && e.t) { try { var r2 = K.evaluate(ad, wx, prof, e.t); if (r2.status !== r.status) I('Error', 'Re-running WMCore gives ' + LBL[r2.status] + ', page has ' + LBL[r.status]); } catch (x) {} }
        if (r.status === 'none') I('Error', 'No weather — card shows no GO/NO-GO');
      }
      // 2. METAR / TAF vs live feed
      var fm = F.M[ic], ft = F.T[ic];
      if (fm) row.off = fm.rawOb;
      if (row.src === 'METAR/TAF') {
        if (hasM && fm && norm(cm) !== norm(fm.rawOb)) { var newer = (fm.obsTime || 0) * 1000 > (wx && wx.obs && wx.obs.time || 0) + 6e4; I(newer ? 'Warning' : 'OK', newer ? 'Feed has a newer METAR than the card' : 'Card METAR text differs from feed'); }
        if (!hasM && fm) I('Error', 'Feed has a METAR (' + norm(fm.rawOb).slice(5, 12) + ') but the card shows none');
        if (!hasM && hasT && !fm) I('Warning', 'No METAR in last 3 h from site or feed (station silent; TAF only)');
        if (hasM && /\/\/\/\/|\s\/\/\/\/\/\/\s/.test(cm)) I('Warning', 'AUTO station sent no visibility/cloud (////) — engine flags missing data');
        if (wx && wx.stale) I('Warning', 'Old METAR (' + wx.ageMin + ' min)');
        if (wx && wx.filled && wx.filled.length) I('Warning', 'METAR incomplete — ' + wx.filled.join(', ') + ' taken from TAF');
        if (ft && !hasT) I('Warning', 'Feed has a TAF but the card shows none');
      } else if (fm) I('Error', 'Feed has a METAR but the card uses model weather');
      if (row.lat != null && !inSA(row.lat, row.lon)) I('Warning', 'Coordinates ' + row.lat.toFixed(3) + ',' + row.lon.toFixed(3) + ' outside SA box');
      rows.push(row);
    });
    return rows;
  }
  function modelChecks(rows, OM) {
    rows.forEach(function (row) {
      if (row.src !== 'Model') return;
      var d = OM[row.icao], o = row.obs, I = function (l, m) { row.issues.push({ lvl: l, msg: m }); };
      if (!o) { I('Error', 'No model data on the site'); }
      else {
        var miss = ['wspd', 'vis'].filter(function (k) { return typeof o[k] !== 'number' || !isFinite(o[k]); });
        if (miss.length) I('Warning', 'Model data missing ' + miss.join(', '));
        if (o.wspd > 80 || o.wspd < 0 || o.vis < 0 || o.vis > 100) I('Warning', 'Model values out of range');
      }
      if (!d) return; if (d.err) { I('Warning', 'Direct Open-Meteo check failed (' + d.err + ')'); return; }
      row.mt = d.time; row.off = 'Wind ' + String(Math.round(d.wind_direction_10m)).padStart(3, '0') + '°/' + Math.round(d.wind_speed_10m) + 'kt G' + Math.round(d.wind_gusts_10m) + ' · Vis ' + (d.visibility >= 1e4 ? '≥10 km' : (d.visibility / 1e3).toFixed(1) + ' km') + ' · Cloud ' + d.cloud_cover + '% · ' + Math.round(d.temperature_2m) + '° · ' + Math.round(d.pressure_msl) + ' hPa';
      if (o) {
        var dv = Math.min(10, d.visibility / 1e3), diff = [];
        if (Math.abs(o.wspd - d.wind_speed_10m) > 4) diff.push('wind ' + Math.round(o.wspd) + ' vs ' + Math.round(d.wind_speed_10m) + ' kt');
        if (o.gust != null && Math.abs(o.gust - d.wind_gusts_10m) > 6) diff.push('gust ' + Math.round(o.gust) + ' vs ' + Math.round(d.wind_gusts_10m) + ' kt');
        if (typeof o.vis === 'number' && Math.abs(Math.min(10, o.vis) - dv) > 2) diff.push('vis ' + o.vis + ' vs ' + dv.toFixed(1) + ' km');
        row.same = !diff.length; if (diff.length) I('Warning', 'Direct Open-Meteo fetch differs: ' + diff.join(', ') + ' (site cache up to 15 min old)');
      }
    });
  }
  function finish(rows) { rows.forEach(function (r) { r.status = r.issues.reduce(function (s, i) { return RANK[i.lvl] < RANK[s] ? i.lvl : s; }, 'OK'); }); }
  var modelTxt = function (o) { return o ? 'Wind ' + (o.wdir == null ? 'VRB' : String(Math.round(o.wdir)).padStart(3, '0') + '°') + '/' + Math.round(o.wspd) + 'kt' + (o.gust ? ' G' + Math.round(o.gust) : '') + ' · Vis ' + (o.vis == null ? '?' : o.vis >= 10 ? '≥10 km' : o.vis + ' km') + (o.ceil != null ? ' · Ceil ' + o.ceil + ' ft' : '') : null; };

  /* ---------- table ---------- */
  var ROWS = [], f = 'all', sf = 'all', lim = 40, animated = false;
  function draw() {
    var q = $('#q').value.trim().toLowerCase();
    var L = ROWS.filter(function (r) { return (f === 'all' || r.status === f) && (sf === 'all' || r.src === sf) && (r.icao + r.name).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return (RANK[a.status] - RANK[b.status]) || (a.src < b.src ? -1 : a.src > b.src ? 1 : 0) || (a.icao < b.icao ? -1 : 1); });
    $('#tb').innerHTML = L.slice(0, lim).map(function (r) {
      var mod = r.src === 'Model', site = mod ? modelTxt(r.obs) : r.site, same = mod ? r.same : r.site && r.off && norm(r.site) === norm(r.off);
      var obsT = mod ? (r.mt ? Date.parse(r.mt + 'Z') : null) : r.time;
      return '<tr><td><div class="ic">' + esc(r.icao) + '</div><div class="nm">' + esc(r.name) + '</div></td><td class="st"><span class="pill ' + cls[r.status] + '">' + r.status + '</span></td>' +
        '<td class="src">' + (mod ? 'Model · Open-Meteo' : 'METAR/TAF') + '<div class="nm">engine: ' + esc(r.esrc) + '</div></td>' +
        '<td>' + (obsT ? esc(sast(obsT).replace(' SAST', '')) + '<div class="nm">' + (mod ? 'model valid' : Math.round((Date.now() - obsT) / 6e4) + ' min ago') + ' · SAST</div>' : '<span class="nm">—</span>') + '</td>' +
        '<td><div class="raw">' + esc(site || (mod ? 'No model data' : 'No METAR on site')) + '</div><div class="nm" style="margin-top:4px">' +
        (same ? (mod ? '✓ Matches direct Open-Meteo fetch' : '✓ Matches live feed') : mod ? (r.off ? 'Direct: ' + esc(r.off) : 'No direct fetch') : r.off ? 'Feed: ' + esc(r.off) : 'No METAR in feed') + '</div></td>' +
        '<td><span class="pill ' + r.s + '">' + LBL[r.s] + '</span>' + (r.badge && r.badge !== r.s ? '<div class="nm err">card: ' + esc(LBL[r.badge] || r.badge) + '</div>' : '') + '</td>' +
        '<td>' + (r.issues.filter(function (i) { return i.lvl !== 'OK'; }).length ? r.issues.filter(function (i) { return i.lvl !== 'OK'; }).map(function (i) { return '<div class="' + cls[i.lvl] + '" style="font-size:13px">' + esc(i.msg) + '</div>'; }).join('') :
          '<span class="nm">' + (mod ? 'Fetched, fields complete, values sane' : 'Matches feed, parsed correctly') + '</span>') + '<div class="nm" style="margin-top:4px">' + esc(r.why || '') + '</div></td></tr>';
    }).join('') || '<tr><td class="nm" colspan="7">No aerodromes match</td></tr>';
    var m = $('#more'); m.hidden = L.length <= lim; m.textContent = 'Show more (' + (L.length - lim) + ' of ' + L.length + ' remaining)';
    if (!animated && !reduce && ROWS.length) { animated = true; enter(); }
  }
  function enter() { /* once-only entrance, first 10 rows, 30 ms stagger (CURSOR_LESSONS_29oct item 4) */
    $$('#tb tr').slice(0, 10).forEach(function (tr, i) { tr.style.animationDelay = (i * 30) + 'ms'; tr.classList.add('wm-in');
      var done = function () { tr.classList.remove('wm-in'); tr.style.animationDelay = ''; }; tr.addEventListener('animationend', done, { once: true }); setTimeout(done, 400 + i * 30); });
  }
  $('#more').onclick = function () { lim += 40; draw(); };
  $('#q').oninput = function () { lim = 40; draw(); };
  var segDone = false;
  function segs() {
    if (segDone) return; segDone = true;
    [['#seg', function (b) { f = b.dataset.f; }], ['#sseg', function (b) { sf = b.dataset.s; }]].forEach(function (a) {
      var seg = $(a[0]), th = seg.querySelector('.th');
      var mv = function (b, anim) { th.style.width = b.offsetWidth + 'px';
        if (!anim) { th.style.transition = 'none'; th.style.transform = 'translateX(' + b.offsetLeft + 'px)'; requestAnimationFrame(function () { requestAnimationFrame(function () { th.style.transition = ''; }); }); return; }
        seg.classList.add('mv'); th.style.transform = 'translateX(' + b.offsetLeft + 'px)';
        th.addEventListener('transitionend', function () { seg.classList.remove('mv'); }, { once: true }); setTimeout(function () { seg.classList.remove('mv'); }, 360); };
      $$('button', seg).forEach(function (b) { b.onclick = function () { $('.on', seg).classList.remove('on'); b.classList.add('on'); mv(b, true); lim = 40; a[1](b); draw(); }; });
      requestAnimationFrame(function () { mv($('.on', seg), false); });
      addEventListener('resize', function () { mv($('.on', seg), false); });
    });
  }

  /* ---------- history + summary for ops.html ---------- */
  function hist() { try { return JSON.parse(LS.getItem('wm-wt-hist')) || []; } catch (e) { return []; } }
  function drawHist() { $('#hs').innerHTML = hist().map(function (h) { return '<span>' + esc(sast(h.t)) + ' · <b class="ok">' + h.OK + '</b> / <b class="warn">' + h.Warning + '</b> / <b class="err">' + h.Error + '</b></span>'; }).join('') || '<span class="nm">No previous runs in this browser</span>'; }

  var running = false;
  function run() {
    if (running) return; running = true; $('#re').disabled = true; LOG = []; ROWS = []; animated = false; prog(0.04);
    $('#meta').textContent = 'Running… loading the aerodrome page and the live feed';
    log('info', 'Loading main.html hidden (same feed, same wm-core engine) + /api/metar, /api/taf');
    Promise.all([getFeed(), loadMain()]).then(function (a) {
      var F = a[0], w = a[1], K = w.WMCore, rows = rowsFrom(w, F);
      if (!rows.length) { log('err', 'Aerodrome page did not load'); throw new Error('no cards'); }
      // engine vs main page totals (same as ops.html "GO · CAUTION · NO-GO")
      var res = rows.map(function (r) { return { status: r.s, reasons: [] }; }), c = { go: 0, caution: 0, nogo: 0, none: 0 }, b = { go: 0, caution: 0, nogo: 0, none: 0 };
      rows.forEach(function (r) { c[r.s]++; if (b[r.badge] != null) b[r.badge]++; });
      var match = ['go', 'caution', 'nogo', 'none'].every(function (k) { return c[k] === b[k]; });
      $('#eng').innerHTML = '<div><span>wm-core v' + esc(K ? K.VERSION : '?') + ' · engine ' + c.go + ' GO / ' + c.caution + ' CAUTION / ' + c.nogo + ' NO-GO / ' + c.none + ' none</span></div>' +
        '<div><span>Main page badges ' + b.go + ' GO / ' + b.caution + ' CAUTION / ' + b.nogo + ' NO-GO / ' + b.none + ' none</span></div>' +
        '<div><span class="' + (match ? 'ok' : 'err') + '">' + (match ? '✓ Every GO/CAUTION/NO-GO here is the main page result' : '✗ Engine and main page badges differ — see Error rows') + '</span></div>';
      log(match ? 'ok' : 'err', 'Engine vs main page: ' + (match ? 'all ' + rows.length + ' match' : 'MISMATCH'));
      var nM = rows.filter(function (r) { return r.src === 'METAR/TAF'; }).length;
      log('info', nM + ' METAR/TAF aerodromes checked against the live feed (' + Object.keys(F.M).length + ' stations with a METAR)');
      ROWS = rows; finish(rows); draw(); prog(0.65);
      var md = rows.filter(function (r) { return r.src === 'Model' && r.lat != null && isFinite(r.lat); }).map(function (r) { return { icao: r.icao, lat: r.lat, lon: r.lon }; });
      return directModel(md).then(function (OM) { modelChecks(rows, OM); finish(rows); return { rows: rows, nM: nM, F: F, match: match }; });
    }).then(function (o) {
      var rows = o.rows, C = { OK: 0, Warning: 0, Error: 0 }; rows.forEach(function (r) { C[r.status]++; });
      var mod = rows.filter(function (r) { return r.src === 'Model'; }), modOK = mod.filter(function (r) { return r.status === 'OK'; }).length;
      var withM = rows.filter(function (r) { return r.site && /^(METAR|SPECI)/.test(r.site); }).length, withT = rows.filter(function (r) { return r.src === 'METAR/TAF'; }).length;
      $('#cT').textContent = rows.length; $('#cO').textContent = C.OK; $('#cW').textContent = C.Warning; $('#cE').textContent = C.Error;
      var now = Date.now();
      $('#meta').textContent = 'Last run ' + sast(now, true) + ' · METAR/TAF: card vs live /api/metar feed · Model: site Open-Meteo vs direct fetch · GO/NO-GO: wm-core, same as the main page';
      log('ok', 'Done: ' + C.OK + ' OK, ' + C.Warning + ' Warning, ' + C.Error + ' Error');
      var S = { t: now, total: rows.length, OK: C.OK, Warning: C.Warning, Error: C.Error, metar: withM, metarTaf: withT, model: mod.length, modelOK: modOK, match: o.match };
      try { LS.setItem('wm-wt-last', JSON.stringify(S)); var h = hist(); h.unshift(S); LS.setItem('wm-wt-hist', JSON.stringify(h.slice(0, 10))); } catch (e) {}
      draw(); drawHist();
    }).catch(function (e) { $('#meta').textContent = 'Run failed: ' + (e.message || e); }).then(function () { running = false; $('#re').disabled = false; prog(1); });
  }
  $('#re').onclick = run;
  drawHist(); check(false);
})();
