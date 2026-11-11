/* dashboard.js — private admin dashboard for Go Around (/dashboard). Same password as the site (edge gate).
 * Status bar + weather check come from the aerodrome page itself (main loaded hidden: same /api/metar + /api/taf feed,
 * same Open-Meteo model data, same engine via wst/wm-bridge.js + wm-final.js), so every DEPART / CAUTION / NO DEPART /
 * INCOMPLETE here IS the site's result. The source side comes from /dashboard-data (aviationweather.gov fetched directly)
 * and a throttled direct Open-Meteo check. Uptime, visitors, devices and errors come from /dashboard-data (Netlify Blobs). */
(function () {
  'use strict';
  var G = window.GADash, $ = function (q, r) { return (r || document).querySelector(q); }, $$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  var H = document.documentElement, LS = (function () { try { return localStorage; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sast = function (t) { if (!t) return '—'; return new Date(t).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + ' SAST'; };
  var kpi = function (v, l, c) { return '<div class="kpi ' + (c || '') + '"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; };
  var fails = {};
  function sec(id, state, html) { var s = $('#' + id); s.classList.remove('ok', 'warn', 'bad'); if (state) s.classList.add(state); if (html != null) { var b = $('.body', s); if (b) b.innerHTML = html; } }
  function fail(k, msg) { if (msg) fails[k] = msg; else delete fails[k]; var ks = Object.keys(fails), a = $('#alert'); a.hidden = !ks.length;
    a.innerHTML = '<b>Something needs attention</b><ul>' + ks.map(function (x) { return '<li>' + esc(fails[x]) + '</li>'; }).join('') + '</ul>'; }
  function prog(f) { var p = $('#prog'); $('i', p).style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)) + ')'; p.style.visibility = f >= 1 ? 'hidden' : 'visible'; }

  /* ---------- theme: the site's four ---------- */
  var TH = { midnight: ['night', 'black'], amethyst: ['night', 'purple'], white: ['day', 'white'], beige: ['day', 'beige'] };
  function markTheme() { $$('.thm button').forEach(function (b) { var t = TH[b.dataset.t]; b.classList.toggle('on', H.dataset.theme === t[0] && H.dataset.pal === t[1]); }); }
  $$('.thm button').forEach(function (b) { b.onclick = function () { var t = TH[b.dataset.t]; H.dataset.theme = t[0]; H.dataset.pal = t[1]; try { LS.setItem('wm-dash-theme', b.dataset.t); } catch (e) {} markTheme(); }; });
  markTheme();

  /* ---------- the aerodrome page, hidden ---------- */
  function loadMain() {
    var t0 = Date.now();
    return new Promise(function (res) {
      var f = $('#mainf'), last = '', same = 0;
      f.onload = function () {
        (function poll() {
          var w = f.contentWindow, R = {}, cards = 0, sig = '';
          try { R = w.__wmR || {}; cards = w.document.querySelectorAll('article.card').length; } catch (e) {}
          var ks = Object.keys(R), c = { go: 0, caution: 0, nogo: 0, none: 0 };
          ks.forEach(function (k) { var r = R[k] && R[k].r; if (r && c[r.status] != null) c[r.status]++; });
          sig = ks.length + ':' + c.go + ':' + c.caution + ':' + c.nogo + ':' + c.none;
          prog(cards ? 0.1 + 0.6 * Math.min(1, (Date.now() - t0) / 20000) : 0.06);
          if (ks.length && sig === last) same++; else same = 0; last = sig;
          if ((same >= 8 && Date.now() - t0 > 15000) || Date.now() - t0 > 75000) return res(w);
          setTimeout(poll, 1000);
        })();
      };
      f.src = '/main?dash=1';
    });
  }
  var txt = function (c, q) { var e = c.querySelector(q); return e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
  function analyse(w) {
    var D = w.document, R = w.__wmR || {}, seen = {}, list = [];
    $$('article.card', D).forEach(function (c) {
      var ic = txt(c, '.icao'); if (!/^[A-Z]{4}$/.test(ic) || seen[ic]) return; seen[ic] = 1;
      var e = R[ic], r = e && e.r, wx = e && e.w, ob = c.querySelector('[data-obs]'), la = c.querySelector('[data-la]');
      var src = r && r.source || null, cm = txt(c, '.cp[data-p=metar] .mono'), ct = txt(c, '.cp[data-p=taf] .mono');
      var obsS = ob ? +ob.dataset.obs || 0 : 0;
      list.push({ icao: ic, name: (txt(c, 'h2') || ic).replace(/\.$/, ''), status: r ? r.status : G.key(c.dataset.s), badge: G.key(c.dataset.s),
        heliport: !!(r && r.heliport) || !!(w.AD_CLASS && w.AD_CLASS[ic]), why: txt(c, '.why') || (r && (r.status === 'none' ? r.why : r.whyShort)) || '',
        src: src, time: r && r.time, href: (c.querySelector('a.go-fact') || { getAttribute: function () { return null; } }).getAttribute('href'),
        card: { metar: /^(METAR|SPECI)\b/.test(cm) ? cm : null, metarT: obsS > 1e9 ? obsS * 1000 : null, taf: /^TAF\b/.test(ct) ? ct : null,
          modelT: src === 'Model' && r && r.time ? r.time : null },
        obs: wx && wx.obs, lat: e && e.ad && e.ad.lat != null ? e.ad.lat : la ? +la.dataset.la : null, lon: e && e.ad && e.ad.lon != null ? e.ad.lon : la ? +la.dataset.lo : null });
    });
    var tiles = {}; $$('#tiles .tile', D).forEach(function (t) { var n = t.querySelector('.n'); if (n && /^\d+$/.test(n.textContent.trim())) tiles[t.dataset.s] = +n.textContent.trim(); });
    return { list: list, tiles: tiles, cards: $$('article.card', D).length };
  }

  /* ---------- 1. the old status bar ---------- */
  var SB = null, open = null;
  function statusBar(A) {
    SB = G.groupStatus(A.list); var c = SB.counts;
    $$('#tiles .tile').forEach(function (t) { $('.n', t).textContent = c[t.dataset.s]; });
    $('#sv2bar').dataset.g = G.lead(c);
    var ks = ['go', 'caution', 'nogo'], match = ks.every(function (k) { return A.tiles[k] == null || A.tiles[k] === c[k]; }), have = ks.some(function (k) { return A.tiles[k] != null; });
    var badge = A.list.filter(function (a) { return !a.heliport && a.badge !== G.key(a.status); }).length;
    sec('s-status', match && !badge ? 'ok' : 'bad');
    $('#st-meta').textContent = SB.total + ' ICAO aerodromes · heliports left out';
    $('#st-foot').innerHTML = (have ? 'Main page top boxes: ' + ks.map(function (k) { return (A.tiles[k] == null ? '–' : A.tiles[k]) + ' ' + G.LABEL[k]; }).join(' · ') + ' — ' +
      (match ? '<span class="ok-t">✓ same as the site</span>' : '<span class="bad-t">✗ differ from the engine</span>') : 'Main page top boxes not read.') +
      (badge ? ' · <span class="bad-t">' + badge + ' card badge(s) differ from the engine</span>' : ' · every card badge matches the engine') + '. Same profile and engine as the site (default profile in this browser).';
    fail('st', match && !badge ? null : 'Status bar: dashboard counts and the site differ');
    drawList();
  }
  function drawList() {
    var L = $('#sv2list');
    $$('#tiles .tile').forEach(function (t) { var on = t.dataset.s === open; t.classList.toggle('sel', on); t.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    if (!SB) return;
    if (!open) { L.innerHTML = '<p class="m">Tap a box to see which aerodromes and why.</p>'; return; }
    var g = SB.groups[open];
    L.innerHTML = '<div class="lh" style="--c:var(--' + { go: 'go', caution: 'cau', nogo: 'nogo', none: 'inc' }[open] + ')"><i></i>' + esc(G.LABEL[open]) + ' · ' + g.length + '</div>' +
      (g.length ? '<div class="rows">' + g.map(function (a) {
        return '<div class="ar"><b>' + esc(a.icao) + '</b><span><span class="nm">' + esc(a.name) + '</span><span class="y">' + esc(a.why) + '</span></span></div>'; }).join('') + '</div>'
        : '<p class="m">None right now.</p>');
  }
  $$('#tiles .tile').forEach(function (t) { t.onclick = function () { open = open === t.dataset.s ? null : t.dataset.s; drawList(); }; });

  /* ---------- 2. weather check ---------- */
  var OM_TTL = 15 * 6e4, OM_BATCH = 50, OM_GAP = 1200, sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var omKey = function (la, lo) { return 'wm-dash-om:' + la.toFixed(3) + ',' + lo.toFixed(3); };
  function omGet(la, lo) { try { var o = JSON.parse(LS.getItem(omKey(la, lo))); return o && Date.now() - o.t < OM_TTL ? o.d : null; } catch (e) { return null; } }
  function omPut(la, lo, d) { try { LS.setItem(omKey(la, lo), JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  function directModel(list) { /* direct Open-Meteo, batched + cached so the dashboard never causes HTTP 429 */
    var out = {}, need = [];
    list.forEach(function (x) { var c = omGet(x.lat, x.lon); if (c) out[x.icao] = c; else need.push(x); });
    var i = 0;
    function next() {
      if (i >= need.length) return Promise.resolve(out);
      var P = need.slice(i, i + OM_BATCH); i += OM_BATCH;
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + P.map(function (p) { return p.lat.toFixed(4); }).join(',') + '&longitude=' + P.map(function (p) { return p.lon.toFixed(4); }).join(',') +
        '&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility&wind_speed_unit=kn&timezone=UTC';
      var once = function (k) { return fetch(url).then(function (r) { if (r.status === 429 && k < 2) return sleep((k + 1) * 5000).then(function () { return once(k + 1); }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); };
      return once(0).then(function (j) { [].concat(j).forEach(function (o, k) { if (o && o.current) { out[P[k].icao] = o.current; omPut(P[k].lat, P[k].lon, o.current); } }); },
        function (e) { P.forEach(function (p) { out[p.icao] = { err: e.message || String(e) }; }); })
        .then(function () { return i < need.length ? sleep(OM_GAP).then(next) : out; });
    }
    return next();
  }
  var getJ = function (u) { var t = Date.now(); return fetch(u, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(u + ' HTTP ' + r.status); return r.json().then(function (d) { return { d: d, ms: Date.now() - t }; }); }); };
  var WX = [], wf = 'problems', wlim = 30;
  function copyNote(mc) { /* the site's shared model copy (/api/model-weather, 10 shards refreshed in turn) */
    if (!mc) return 'Site model copy /api/model-weather: not reachable.';
    if (mc.error) return 'Site model copy /api/model-weather: ' + esc(mc.error) + '.';
    var st = mc.state || {}, sm = st.summary || {}, sh = st.shards || [], old = sh.filter(function (x) { return x.state !== 'fresh'; });
    return 'Site model copy /api/model-weather: ' + (sm.fresh || 0) + ' fresh · ' + (sm.degraded || 0) + ' degraded · ' + (sm.stale || 0) + ' stale · ' + (sm.missing || 0) + ' missing points; last good refresh ' + sast(st.lastOk) +
      (st.lastOk ? ' (' + G.age(Date.now() - Date.parse(st.lastOk)) + ' ago)' : '') + (st.limited ? ' · <span class="bad-t">Open-Meteo limit hit</span>' : '') + (st.error ? ' · <span class="bad-t">' + esc(st.error) + '</span>' : '') +
      (old.length ? ' · <span class="warn-t">' + old.length + ' of ' + sh.length + ' shards older than 90 min (oldest ' + G.age(Date.now() - Math.min.apply(null, old.map(function (x) { return Date.parse(x.fetchedAt); }))) + ')</span>' : '') + '.';
  }
  function weather(A, feed, data, OM) {
    var now = Date.now(), siteM = G.latestMap(feed.metar, 'metar'), siteT = G.latestMap(feed.taf, 'taf');
    var src = data && data.source || null, upOk = !!(src && src.metar && src.metar.s === 200 && src.metar.n);
    var upM = upOk ? G.latestMap(src.metar.rows, 'metar') : {}, upT = src && src.taf && src.taf.s === 200 ? G.latestMap(src.taf.rows, 'taf') : {};
    WX = A.list.filter(function (a) { return !a.heliport; }).map(function (a) {
      var m = null; if (a.src === 'Model' && OM) { var d = OM[a.icao]; m = d ? (d.err ? { err: d.err } : { diff: G.modelDiff(a.obs, d) }) : null; }
      var r = G.checkWeather({ icao: a.icao, name: a.name, status: a.status, src: a.src, card: a.card,
        site: { metar: siteM[a.icao], taf: siteT[a.icao] }, up: upOk ? { metar: upM[a.icao], taf: upT[a.icao] } : { metar: siteM[a.icao], taf: siteT[a.icao] }, upOk: upOk, model: m }, now);
      r.a = a; r.upM = (upOk ? upM : siteM)[a.icao]; return r;
    });
    var C = { OK: 0, Warning: 0, Error: 0 }, st = 0; WX.forEach(function (r) { C[r.level]++; if (r.stale) st++; });
    var withM = WX.filter(function (r) { return r.a.card.metar; }).length, withT = WX.filter(function (r) { return r.a.card.taf; }).length, mod = WX.filter(function (r) { return r.a.src === 'Model'; }).length;
    $('#wx-kpi').innerHTML = kpi(WX.length, 'aerodromes checked') + kpi(C.OK, 'OK', 'ok') + kpi(C.Warning, 'warning', 'wa') + kpi(C.Error, 'error', 'er') + kpi(st, 'stale / not updated', st ? 'wa' : '');
    var newest = 0; Object.keys(siteM).forEach(function (k) { newest = Math.max(newest, siteM[k].t); });
    $('#wx-meta').textContent = 'checked ' + sast(now);
    $('#wx-foot').innerHTML = 'Card = what the aerodrome page shows now (' + withM + ' METAR · ' + withT + ' TAF · ' + mod + ' model). Source = aviationweather.gov fetched directly by the dashboard function' +
      (upOk ? ' (' + src.metar.n + ' METAR rows, ' + (src.taf ? src.taf.n : 0) + ' TAF rows' + (src.metar.cachedSec ? ', cached ' + src.metar.cachedSec + ' s' : '') + ')' : ' — <span class="bad-t">not reachable, compared with the site feed</span>') +
      '; model = direct Open-Meteo fetch (15-min cache). ' + copyNote(feed.model) + ' Site feed /api/metar newest report ' + (newest ? sast(newest) + ' (' + G.age(now - newest) + ' old)' : '—') + '. Stale = METAR or model older than 90 min, TAF expired or issued over 7 h ago, or the source has a newer report.';
    sec('s-wx', C.Error ? 'bad' : C.Warning ? 'warn' : 'ok');
    fail('wx', C.Error ? C.Error + ' aerodrome(s) with a weather error (see Weather check)' : null);
    wlim = 30; drawWx();
  }
  function drawWx() {
    var q = $('#q').value.trim().toLowerCase(), RK = { Error: 0, Warning: 1, OK: 2 };
    var L = WX.filter(function (r) { return (wf === 'all' || (wf === 'stale' ? r.stale : r.level !== 'OK')) && (r.a.icao + ' ' + r.a.name).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return (RK[a.level] - RK[b.level]) || (a.a.icao < b.a.icao ? -1 : 1); });
    var ag = function (l, ms, lim) { return ms == null ? '' : '<span class="' + (ms > lim * 6e4 ? 'old' : '') + '">' + l + ' ' + esc(G.age(ms)) + ' old</span>'; };
    $('#wx-list').innerHTML = L.slice(0, wlim).map(function (r) {
      var a = r.a, c = a.card, show = c.metar || c.taf || (a.src === 'Model' ? 'Model weather' : 'No weather on the card');
      return '<div class="wr"><div class="h"><b>' + esc(a.icao) + '</b><span class="nm">' + esc(a.name) + '</span><span class="pl ' + r.level + '">' + r.level.toUpperCase() + '</span></div>' +
        '<div class="ages">' + (a.src ? '<span>uses ' + esc(a.src) + '</span>' : '') + ag('METAR', r.ages.metar, 90) + ag('TAF', r.ages.taf, 420) + ag('Model', r.ages.model, 90) + '<span>' + esc(G.LABEL[G.key(a.status)]) + '</span></div>' +
        '<div class="raw"><em>Card:</em> ' + esc(show) + (r.upM && r.upM.raw && G.norm(r.upM.raw) !== G.norm(c.metar) ? '<br><em>Source:</em> ' + esc(r.upM.raw) : c.metar && r.upM ? '<br><em>Source:</em> same METAR ✓' : '') + '</div>' +
        (r.issues.length ? '<ul>' + r.issues.map(function (i) { return '<li class="' + i.lvl + '">' + esc(i.msg) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('') || '<p class="m">' + (WX.length ? 'No aerodromes match.' : 'No results yet.') + '</p>';
    var m = $('#wx-more'); m.hidden = L.length <= wlim; m.textContent = 'Show more (' + (L.length - wlim) + ' more)';
  }
  $('#wx-more').onclick = function () { wlim += 30; drawWx(); };
  $('#q').oninput = function () { wlim = 30; drawWx(); };
  $$('#wx-seg button').forEach(function (b) { b.onclick = function () { $('#wx-seg .on').classList.remove('on'); b.classList.add('on'); wf = b.dataset.f; wlim = 30; drawWx(); }; });

  /* ---------- 3. uptime, visitors + devices, errors ---------- */
  var dur = function (ms) { var m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60); return (d ? d + ' d ' : '') + h + ' h ' + (m % 60) + ' min'; };
  function health(d) {
    var p = d.probes, u = d.uptime || {}, row = function (n, x, ok) { var g = ok.indexOf(x.s) >= 0; return '<tr><td>' + n + '</td><td class="' + (g ? 'ok-t' : 'bad-t') + '">' + (g ? 'OK' : 'Problem') + '</td><td class="n">HTTP ' + x.s + ' · ' + x.ms + ' ms</td></tr>'; };
    var pct = u.checks ? Math.round(u.ok / u.checks * 1000) / 10 : null, all = u.all ? Math.round(u.allOk / u.all * 1000) / 10 : null;
    var bad = !d.up || [p.metar, p.taf, p.main].some(function (x) { return x.s !== 200; });
    var hw = function (n, h) { return '<tr><td>' + n + ' proxy last upstream fetch</td><td colspan="2" class="n">' + (h ? sast(h.t) + ' · HTTP ' + esc(h.status) : 'none recorded') + '</td></tr>'; };
    sec('s-health', bad ? 'bad' : p.site.ms > 2500 ? 'warn' : 'ok',
      '<div class="big">' + kpi(d.up ? 'Up' : 'Down', 'site', d.up ? 'ok' : 'er') + kpi(pct == null ? '—' : pct + '%', 'uptime this deploy') + kpi(p.site.ms + ' ms', 'response') + '</div>' +
      '<table>' + row('Site (password gate)', p.site, [200, 401]) + row('Aerodrome page', p.main, [200]) + row('METAR function', p.metar, [200]) + row('TAF function', p.taf, [200]) + row('Flights function', p.flights, [200]) + hw('METAR', d.health && d.health.metar) + hw('TAF', d.health && d.health.taf) + '</table>' +
      '<p class="m">Deploy <b>' + esc((d.deploy.id || 'unknown').slice(0, 8)) + '</b> (' + esc(d.deploy.context || '?') + '). Uptime this deploy: ' + (pct == null ? '—' : pct + '% of ' + u.checks + ' checks since ' + sast(u.first)) +
      ' · all recorded: ' + (all == null ? '—' : all + '% of ' + u.all + ' since ' + sast(u.allFirst)) + '. A check is recorded each time this dashboard or /ops loads — there is no 24/7 monitor yet.</p>');
    fail('health', bad ? 'Site health: a check failed (see Uptime & site health)' : null);
  }
  function visitors(v) {
    if (!v || v.error) { sec('s-vis', 'warn', '<p class="m">Visitor data unavailable' + (v ? ': ' + esc(v.error) : '') + '</p>'); return; }
    var b = v.beacon || {}, devs = b.devices || [], n = devs.reduce(function (a, x) { return a + x[1]; }, 0) || 1, col = { Phone: 'var(--acc)', Tablet: 'var(--cau)', Desktop: 'var(--go)' };
    var tl = function (t, a) { return a && a.length ? '<tr><td>' + t + '</td><td>' + a.map(function (x) { return esc(x[0]) + ' ' + Math.round(x[1] / n * 100) + '%'; }).join(' · ') + '</td></tr>' : ''; };
    sec('s-vis', 'ok', '<div class="big">' + kpi(v.today.views, 'views today · ' + v.today.unique + ' unique') + kpi(v.week.views, '7 days · ' + v.week.unique + ' unique') + kpi(v.all.views, 'all time') + '</div>' +
      (b.real ? '<div class="bar">' + devs.map(function (x) { return '<i style="width:' + (x[1] / n * 100) + '%;background:' + (col[x[0]] || 'var(--tx3)') + '"></i>'; }).join('') + '</div>' +
        '<table>' + tl('Devices', devs) + tl('System', b.os) + tl('Browser', b.browsers) + tl('Country', b.countries) + '</table>' +
        '<p class="m">' + b.real + ' page visits from ' + b.sessions + ' sessions in 7 days (site beacon; ' + b.tests + ' test/robot visits and this dashboard left out).</p>' : '<p class="m">No device data in the last 7 days yet.</p>') +
      '<table><tr><th>Top pages · 7 days</th><th class="n">Views</th></tr>' + (v.top.length ? v.top.map(function (t) { return '<tr><td>' + esc(t[0]) + '</td><td class="n">' + t[1] + '</td></tr>'; }).join('') : '<tr><td colspan="2" class="m">No visits yet</td></tr>') + '</table>' +
      '<p class="m">Views and uniques from the password gate counter since ' + sast(v.all.since) + ' (UTC days; uniques are a daily salted hash, no IPs kept).</p>');
  }
  function errors(d) {
    var E = (d.errors || []).slice().sort(function (a, b) { return a.t < b.t ? 1 : -1; });
    sec('s-err', E.length ? 'bad' : 'ok', (E.length ? '<table>' + E.slice(0, 15).map(function (e) { return '<tr><td>' + esc(sast(e.t)) + '</td><td><b>' + esc(e.what) + '</b><div class="m">' + esc(e.detail) + '</div></td></tr>'; }).join('') + '</table>'
      : '<p class="ok-t">No errors seen in the checks the dashboard can run.</p>') +
      '<div class="nc"><b>Not connected yet</b><br>' + (d.notConnected || []).map(esc).join('<br>') + '</div>');
  }

  /* ---------- run ---------- */
  var running = false;
  function run() {
    if (running) return; running = true; $('#re').disabled = true; fails = {}; fail('x'); prog(0.04);
    $('#sub').textContent = 'Go Around · private · checking…';
    var data = getJ('/dashboard-data').then(function (r) { var d = r.d; health(d); visitors(d.visitors); errors(d); fail('data'); return d; },
      function (e) { var m = '<p class="bad-t">Could not load /dashboard-data: ' + esc(e.message || e) + '</p>'; sec('s-health', 'bad', m); sec('s-vis', 'warn', m); sec('s-err', 'bad', m); fail('data', 'Dashboard data function not answering (' + (e.message || e) + ')'); return null; });
    var feed = Promise.all([getJ('/api/metar').then(function (r) { return r.d; }, function () { return []; }), getJ('/api/taf').then(function (r) { return r.d; }, function () { return []; }),
      fetch('/api/model-weather', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (d) { return d && { state: d.state, error: d.error }; }, function () { return null; })])
      .then(function (a) { return { metar: Array.isArray(a[0]) ? a[0] : [], taf: Array.isArray(a[1]) ? a[1] : [], model: a[2] }; });
    Promise.all([loadMain(), feed, data]).then(function (r) {
      var A = analyse(r[0]);
      if (!A.list.length) { fail('main', 'Aerodrome page did not load'); $('#sv2list').innerHTML = '<p class="bad-t">The aerodrome page did not load.</p>'; return; }
      statusBar(A); weather(A, r[1], r[2], null); prog(0.8);
      var md = A.list.filter(function (a) { return a.src === 'Model' && !a.heliport && isFinite(a.lat) && isFinite(a.lon) && a.lat != null; });
      /* the aerodrome page keeps working while the direct check runs: take a fresh snapshot for the final result */
      return directModel(md).then(function (OM) { var B = analyse(r[0]); if (!B.list.length) B = A; statusBar(B); weather(B, r[1], r[2], OM); });
    }).catch(function (e) { fail('run', 'Run failed: ' + (e.message || e)); })
      .then(function () { running = false; $('#re').disabled = false; prog(1); $('#sub').textContent = 'Go Around · private · updated ' + sast(Date.now()); });
  }
  $('#re').onclick = run;
  run();
})();
