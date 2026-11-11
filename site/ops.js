/* ops.js — private ops dashboard. Weather, problem cards and GO/CAUTION/NO-GO come from main.html itself (loaded hidden,
 * same /api/metar + /api/taf feed, same wm-core.js engine via wm-bridge). Health + visitors come from /api/ops (admin password). */
(function () {
  'use strict';
  var $ = function (q, r) { return (r || document).querySelector(q); }, $$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  var H = document.documentElement, SS = (function () { try { return sessionStorage; } catch (e) { return null; } })();
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sast = function (t) { if (!t) return '—'; var d = new Date(t); return d.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) + ' SAST'; };
  var ago = function (t) { if (!t) return '—'; var m = Math.round((Date.now() - new Date(t).getTime()) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 2880 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min ago' : Math.floor(m / 1440) + ' days ago'; };
  var dur = function (ms) { var m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60); return (d ? d + ' d ' : '') + h + ' h ' + (m % 60) + ' min'; };
  var fails = {}, sec = function (id, state, html) { var s = $('#' + id); s.classList.remove('ok', 'warn', 'bad'); if (state) s.classList.add(state); if (html != null) $('.body', s).innerHTML = html; };
  function fail(k, msg) { if (msg) fails[k] = msg; else delete fails[k]; var ks = Object.keys(fails), a = $('#alert'); a.hidden = !ks.length;
    a.innerHTML = '<b>Something needs attention</b><ul>' + ks.map(function (k) { return '<li>' + esc(fails[k]) + '</li>'; }).join('') + '</ul>'; }
  var kpi = function (v, l, c) { return '<div class="kpi ' + (c || '') + '"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; };

  /* ---------- theme ---------- */
  var TH = { black: ['night', 'black'], white: ['day', 'white'] };
  function markTheme() { $$('.thm button').forEach(function (b) { var t = TH[b.dataset.t]; b.classList.toggle('on', H.dataset.theme === t[0] && H.dataset.pal === t[1]); }); }
  $$('.thm button').forEach(function (b) { b.onclick = function () { var t = TH[b.dataset.t]; H.dataset.theme = t[0]; H.dataset.pal = t[1];
    try { localStorage.setItem('wm-ops-theme', b.dataset.t); } catch (e) {} markTheme(); }; });
  markTheme();

  /* ---------- admin: health + visitors ---------- */
  var tok = SS && SS.getItem('wm-ops');
  function locked(msg) { var h = '<div class="lock"><span>' + esc(msg || 'Needs the admin password.') + '</span><button class="btn" data-unlock>Unlock</button></div>';
    sec('s-health', '', h); sec('s-vis', '', h); $$('[data-unlock]').forEach(function (b) { b.onclick = askPw; }); }
  function askPw() { var d = $('#login'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); $('#pw').focus(); }
  $('#lskip').onclick = function () { $('#login').close(); };
  $('#lf').addEventListener('submit', function (e) { e.preventDefault(); tok = btoa('admin:' + $('#pw').value); $('#pw').value = ''; admin(true); });
  function admin(fromForm) {
    if (!tok) { locked(); return; }
    sec('s-health', '', 'Checking…'); sec('s-vis', '', 'Loading…');
    fetch('/api/ops', { headers: { Authorization: 'Basic ' + tok }, cache: 'no-store' }).then(function (r) {
      if (r.status === 401) { tok = null; SS && SS.removeItem('wm-ops'); if (fromForm) { $('#lerr').textContent = 'Wrong password.'; } else locked(); throw 0; }
      if (!r.ok) throw new Error('/api/ops HTTP ' + r.status); return r.json();
    }).then(function (d) { SS && SS.setItem('wm-ops', tok); $('#lerr').textContent = ''; if ($('#login').open) $('#login').close(); health(d); visitors(d.visitors); fail('ops'); })
      .catch(function (e) { if (e === 0) return; sec('s-health', 'bad', '<p class="bad">Could not reach the ops function: ' + esc(e.message || e) + '</p>'); fail('ops', 'Ops function not answering (' + (e.message || e) + ')'); });
  }
  function health(d) {
    var p = d.probes, st = window.__stamp || {}, built = st.built ? new Date(st.built).getTime() : null, u = d.uptime || {};
    var row = function (n, x, okS) { var ok = okS.indexOf(x.s) >= 0; return '<tr><td>' + n + '</td><td class="' + (ok ? 'ok-t' : 'bad-t') + '">' + (ok ? 'OK' : 'Problem') + '</td><td class="n">HTTP ' + x.s + ' · ' + x.ms + ' ms</td></tr>'; };
    var bad = []; if (!d.up) bad.push('Site is DOWN (HTTP ' + p.site.s + ')'); if (p.metar.s !== 200) bad.push('METAR feed function failing (HTTP ' + p.metar.s + ')'); if (p.taf.s !== 200) bad.push('TAF feed function failing (HTTP ' + p.taf.s + ')'); if (p.flights.s !== 200) bad.push('Flights function failing (HTTP ' + p.flights.s + ')');
    var pct = u.checks ? Math.round(u.ok / u.checks * 1000) / 10 : null;
    sec('s-health', bad.length ? 'bad' : p.site.ms > 2500 ? 'warn' : 'ok',
      '<div class="big">' + kpi(d.up ? 'Up' : 'Down', 'site', d.up ? 'go' : 'ng') + kpi(p.site.ms + ' ms', 'response') + kpi(built ? dur(Date.now() - built) : '—', 'since this deploy') + '</div>' +
      '<table>' + row('Site (password gate)', p.site, [200, 401]) + row('METAR function', p.metar, [200]) + row('TAF function', p.taf, [200]) + row('Flights function', p.flights, [200]) + '</table>' +
      '<p class="m">Deploy <b>' + esc((d.deploy.id || 'unknown').slice(0, 8)) + '</b> (' + esc(d.deploy.context || '?') + ') · built ' + sast(st.built) + ' · commit ' + esc(st.commit || '?') + ' · ' + esc(st.branch || '') + '<br>' +
      'Uptime this deploy: ' + (pct == null ? '—' : pct + '% of ' + u.checks + ' checks since ' + sast(u.first)) + ' · all recorded: ' + (u.all ? Math.round(u.allOk / u.all * 1000) / 10 + '% of ' + u.all : '—') + '<br>Checked ' + sast(d.now) + '. A check is recorded each time this page loads.</p>');
    fail('health', bad.join(' · ') || null);
    if (d.wx) { window.__wxh = d.wx; wxHealthNote(); }
  }
  function visitors(v) {
    if (!v || v.error) { sec('s-vis', 'warn', '<p class="m">Visitor log unavailable' + (v ? ': ' + esc(v.error) : '') + '</p>'); return; }
    var s = v.split, n = s.phone + s.ipad + s.desktop + s.other || 1, pc = function (x) { return Math.round(x / n * 100); };
    sec('s-vis', 'ok', '<div class="big">' + kpi(v.today.views, 'views today · ' + v.today.unique + ' unique') + kpi(v.week.views, '7 days · ' + v.week.unique + ' unique') + kpi(v.all.views, 'all time') + '</div>' +
      '<div class="bar"><i style="width:' + pc(s.phone) + '%;background:var(--acc)"></i><i style="width:' + pc(s.ipad) + '%;background:var(--ca)"></i><i style="width:' + pc(s.desktop) + '%;background:var(--go)"></i><i style="width:' + pc(s.other) + '%;background:var(--none)"></i></div>' +
      '<p class="m">Phone ' + pc(s.phone) + '% · iPad ' + pc(s.ipad) + '% · Desktop ' + pc(s.desktop) + '%' + (s.other ? ' · Other ' + pc(s.other) + '%' : '') + ' (last ' + v.splitSample + ' page visits, 7 days; iPads in desktop mode count as desktop)</p>' +
      '<table><tr><th>Top pages · 7 days</th><th class="n">Views</th></tr>' + (v.top.length ? v.top.map(function (t) { return '<tr><td>' + esc(t[0]) + '</td><td class="n">' + t[1] + '</td></tr>'; }).join('') : '<tr><td colspan=2 class=m>No visits yet</td></tr>') + '</table>' +
      '<p class="m">Counting since ' + sast(v.all.since) + ' · ' + (v.all.logged == null ? '?' : v.all.logged) + ' visits in the log. Days are UTC days.</p>');
  }

  /* ---------- data freshness (build stamp) ---------- */
  function freshness(st) {
    var gen = st.sacaaGenerated ? new Date(st.sacaaGenerated.replace(' UTC', 'Z').replace(' ', 'T')) : null, age = gen ? (Date.now() - gen) / 864e5 : null;
    var ed = st.aipEdition ? st.aipEdition.replace(/_/g, ' ') : '—', wg = st.wstGen ? new Date(st.wstGen * 1000) : null;
    var old = age != null && age > 14;
    sec('s-data', old ? 'warn' : 'ok', '<table>' +
      '<tr><td>AIP (AD + ENR)</td><td>Edition ' + esc(ed) + '</td></tr>' +
      '<tr><td>AIC / SUP / NOTAM</td><td>Index links from SACAA snapshot ' + esc(st.sacaaGenerated || '—') + '</td></tr>' +
      '<tr><td>ATO list</td><td>' + (st.atoCount || '?') + ' ATOs · SACAA ' + esc(st.sacaaGenerated || '—') + '</td></tr>' +
      '<tr><td>DFE list</td><td>' + (st.dfeCount || '?') + ' examiners · SACAA ' + esc(st.sacaaGenerated || '—') + '</td></tr>' +
      '<tr><td>Aerodrome cards build</td><td>' + (wg ? sast(wg) : '—') + '</td></tr></table>' +
      '<p class="m">SACAA data is ' + (age == null ? '?' : Math.floor(age) + ' days') + ' old' + (old ? ' — <span class="warn-t">older than 14 days, the Monday auto-update has not landed</span>' : '') + '. Stamp built ' + sast(st.built) + '.</p>');
    fail('data', old ? 'SACAA data (ATO/DFE/AIC) is ' + Math.floor(age) + ' days old — Monday auto-update missing' : null);
  }

  /* ---------- weather / problems / counts from main.html ---------- */
  var feed = null;
  function wxHealthNote() { var h = window.__wxh, el = $('#wxh'); if (!h || !el) return;
    el.innerHTML = 'Server-side fetch: METAR ' + (h.metar ? sast(h.metar.t) + ' (HTTP ' + h.metar.status + ')' : 'none recorded') + ' · TAF ' + (h.taf ? sast(h.taf.t) + ' (HTTP ' + h.taf.status + ')' : 'none recorded'); }
  function getFeed() {
    var t0 = Date.now();
    return Promise.all([fetch('/api/metar', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('METAR HTTP ' + r.status); return r.json(); }),
      fetch('/api/taf', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })])
      .then(function (a) { feed = { metar: a[0] || [], taf: a[1] || [], at: Date.now(), ms: Date.now() - t0 }; }, function (e) { feed = { error: e.message || String(e), at: Date.now() }; });
  }
  function loadMain() {
    return new Promise(function (res) {
      var f = $('#mainf'), t0 = Date.now(), last = -1, same = 0;
      f.onload = function () {
        (function poll() {
          var w = f.contentWindow, n = 0, cards = 0;
          try { n = Object.keys(w.__wmR || {}).length; cards = w.document.querySelectorAll('article.card').length; } catch (e) {}
          if (cards && n >= cards && n === last) same++; else same = 0; last = n;
          if (same >= 3 || Date.now() - t0 > 45000) return res(w);
          setTimeout(poll, 1000);
        })();
      };
      f.src = '/main.html?ops=1';
    });
  }
  function analyse(w) {
    var D = w.document, now = Date.now() / 1e3, all = $$('article.card', D);
    var txt = function (c, q) { var e = c.querySelector(q); return e ? (e.textContent || '').trim() : ''; };
    var cards = all.map(function (c) {
      var ic = txt(c, '.icao'), age = c.querySelector('.meta .age'), obs = age ? +age.dataset.obs || 0 : 0, link = c.querySelector('a.go-fact');
      return { el: c, icao: ic, name: (txt(c, 'h2') || ic), isIcao: /^[A-Z]{4}$/.test(ic), s: c.dataset.s, src: c.dataset.src || '',
        metar: /^(METAR|SPECI)\b/.test(txt(c, '.cp[data-p=metar] .mono')), taf: /^TAF\b/.test(txt(c, '.cp[data-p=taf] .mono')), obs: obs,
        rwy: c.querySelectorAll('.rwd line.r').length, model: !!(c.dataset.wxm || (c.dataset.wx && c.dataset.wx.length > 2)), href: link ? link.getAttribute('href') : null };
    });
    var icao = cards.filter(function (c) { return c.isIcao; });
    return { cards: cards, icao: icao, now: now, R: w.__wmR || {}, K: w.WMCore, D: D };
  }
  function weather(A) {
    var I = A.icao, set = {}; I.forEach(function (c) { set[c.icao] = 1; });
    var fm = {}, ft = {}, newest = 0;
    if (feed && !feed.error) { feed.metar.forEach(function (m) { if (set[m.icaoId]) { fm[m.icaoId] = 1; newest = Math.max(newest, m.obsTime || 0); } }); feed.taf.forEach(function (t) { if (set[t.icaoId]) ft[t.icaoId] = 1; }); }
    var nM = Object.keys(fm).length, nT = Object.keys(ft).length, cM = I.filter(function (c) { return c.metar; }).length, cT = I.filter(function (c) { return c.taf; }).length;
    var anyWx = I.filter(function (c) { return c.metar || c.taf || c.model; }).length, stale = I.filter(function (c) { return c.metar && c.obs && A.now - c.obs > 7200; }).length;
    var newestAge = newest ? (Date.now() / 1e3 - newest) / 60 : null;
    var bad = feed && feed.error ? 'Weather feed failed: ' + feed.error : (nM === 0 ? 'Weather feed returned no METARs for any of the ' + I.length + ' aerodromes' : newestAge > 120 ? 'Newest METAR in the feed is ' + Math.round(newestAge) + ' min old' : null);
    sec('s-wx', bad ? 'bad' : stale > nM / 2 ? 'warn' : 'ok',
      '<div class="big">' + kpi(nM + ' / ' + I.length, 'ICAO aerodromes with a METAR') + kpi(nT, 'with a TAF') + kpi(anyWx, 'with any weather') + '</div>' +
      '<table><tr><td>Feed fetched (this page)</td><td>' + (feed ? sast(feed.at) + (feed.ms ? ' · ' + feed.ms + ' ms' : '') : '—') + '</td></tr>' +
      '<tr><td>Newest METAR in feed</td><td>' + (newest ? sast(newest * 1000) + ' (' + ago(newest * 1000) + ')' : '—') + '</td></tr>' +
      '<tr><td>Cards showing a METAR / TAF</td><td>' + cM + ' / ' + cT + '</td></tr>' +
      '<tr><td>Weather from model only</td><td>' + I.filter(function (c) { return !c.metar && c.src === 'Model'; }).length + '</td></tr>' +
      '<tr><td>METAR older than 2 h</td><td>' + stale + '</td></tr></table>' +
      '<p class="m">Same /api/metar + /api/taf feed main.html uses (aviationweather.gov, last 3 h). <span id="wxh"></span></p>');
    wxHealthNote(); fail('wx', bad);
  }
  var LBL = { go: 'GO', caution: 'CAUTION', nogo: 'NO-GO', none: 'No weather' };
  function counts(A) {
    if (!A.K) { sec('s-cnt', 'bad', '<p class="bad">wm-core.js did not load in the aerodrome page.</p>'); fail('cnt', 'GO/NO-GO engine (wm-core.js) not loaded'); return; }
    var res = A.cards.map(function (c) { return A.R[c.icao] && A.R[c.icao].r; }).filter(Boolean), S = A.K.summarize(res), c = S.counts;
    var ri = A.icao.map(function (x) { return A.R[x.icao] && A.R[x.icao].r; }).filter(Boolean), Si = A.K.summarize(ri).counts;
    var shown = { go: 0, caution: 0, nogo: 0, none: 0 }; A.cards.forEach(function (x) { if (shown[x.s] != null) shown[x.s]++; });
    var match = ['go', 'caution', 'nogo', 'none'].every(function (k) { return shown[k] === c[k]; }) && res.length === A.cards.length;
    var tiles = $$('button.tile', A.D).map(function (b) { return b.textContent.replace(/\s+/g, ' ').trim(); }).filter(function (t) { return /\d/.test(t); });
    var mk = function (o, k) { return { go: 'go', caution: 'ca', nogo: 'ng', none: 'nn' }[k]; };
    sec('s-cnt', match ? 'ok' : 'bad',
      '<div class="big">' + ['go', 'caution', 'nogo', 'none'].map(function (k) { return kpi(c[k], LBL[k], mk(c, k)); }).join('') + '</div>' +
      '<table><tr><th></th><th class="n">GO</th><th class="n">CAUT.</th><th class="n">NO-GO</th><th class="n">None</th></tr>' +
      '<tr><td>wm-core, all ' + res.length + ' cards</td><td class="n">' + c.go + '</td><td class="n">' + c.caution + '</td><td class="n">' + c.nogo + '</td><td class="n">' + c.none + '</td></tr>' +
      '<tr><td>Main page badges</td><td class="n">' + shown.go + '</td><td class="n">' + shown.caution + '</td><td class="n">' + shown.nogo + '</td><td class="n">' + shown.none + '</td></tr>' +
      '<tr><td>ICAO only (' + ri.length + ')</td><td class="n">' + Si.go + '</td><td class="n">' + Si.caution + '</td><td class="n">' + Si.nogo + '</td><td class="n">' + Si.none + '</td></tr></table>' +
      '<p class="' + (match ? 'ok-t' : 'bad-t') + '">' + (match ? '✓ Engine totals match the main page' : '✗ Engine totals do NOT match the main page badges') + '</p>' +
      '<p class="m">' + esc(S.lines.join(' · ')) + (tiles.length ? '<br>Main page tiles: ' + esc(tiles.slice(0, 6).join(' · ')) : '') + '<br>Default profile (wm-core v' + esc(A.K.VERSION) + ').</p>');
    fail('cnt', match ? null : 'GO/CAUTION/NO-GO totals differ between wm-core and the main page');
  }
  var P = null, ptab = 'noweather', pall = false;
  function problems(A) {
    var I = A.icao, L = {
      nometar: { t: 'No METAR', f: function (c) { return !c.metar; }, why: function (c) { return c.taf ? 'No METAR in the last 3 h — TAF only' : c.model || c.src === 'Model' ? 'No METAR or TAF — model weather only' : 'No METAR, TAF or model'; } },
      stale: { t: 'Old weather > 2 h', f: function (c) { return c.metar && c.obs && A.now - c.obs > 7200; }, why: function (c) { return 'Last METAR ' + Math.round((A.now - c.obs) / 360) / 10 + ' h ago'; } },
      norwy: { t: 'No runway data', f: function (c) { return !c.rwy; }, why: function () { return 'No runway headings — crosswind not checked'; } },
      noweather2: { t: 'No weather at all', f: function (c) { return c.s === 'none' || (!c.metar && !c.taf && !c.model && !c.src); }, why: function () { return 'No METAR, TAF or model data — card shows no status'; } }
    };
    L.noweather = L.noweather2; delete L.noweather2; P = {}; Object.keys(L).forEach(function (k) { P[k] = I.filter(L[k].f).map(function (c) { return { c: c, why: L[k].why(c) }; }); });
    function draw() {
      var list = P[ptab];
      sec('s-prob', P.noweather.length || P.stale.length > 20 ? 'warn' : 'ok',
        '<div class="tabs">' + Object.keys(L).map(function (k) { return '<button data-k="' + k + '" class="' + (k === ptab ? 'on' : '') + '">' + L[k].t + ' · ' + P[k].length + '</button>'; }).join('') + '</div>' +
        (list.length ? '<div class="plist">' + (pall ? list : list.slice(0, 12)).map(function (x) { return '<a class="pi" href="' + esc(x.c.href || '/index.html#aero') + '" target="_top"><b>' + esc(x.c.icao) + '</b><span>' + esc(x.c.name) + ' — ' + esc(x.why) + '</span></a>'; }).join('') + '</div>' + (list.length > 12 ? '<p><button class="btn ghost" id="pmore">' + (pall ? 'Show fewer' : 'Show all ' + list.length) + '</button></p>' : '') : '<p class="ok-t">None — all good.</p>') +
        '<p class="m">' + I.length + ' ICAO aerodromes checked (of ' + A.cards.length + ' cards). Tap one to open its card.</p>');
      $$('#s-prob .tabs button').forEach(function (b) { b.onclick = function () { ptab = b.dataset.k; pall = false; draw(); }; });
      var pm = $('#pmore'); if (pm) pm.onclick = function () { pall = !pall; draw(); };
    }
    draw();
  }


  /* ---------- Weather Test box (opens ops-weather.html) ---------- */
  var wtb = $('#s-wt'); if (wtb) { var go = function () { location.href = 'ops-weather.html'; }; wtb.onclick = go; wtb.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; }
  function wtest(A) {
    var I = A.cards.filter(function (c) { return A.R[c.icao]; }), mt = I.filter(function (c) { return c.metar || c.taf; }).length, m = I.filter(function (c) { return c.metar; }).length;
    var mod = I.filter(function (c) { return !c.metar && !c.taf; }).length, bad = I.filter(function (c) { return A.R[c.icao].r.status !== c.s; }).length, nw = I.filter(function (c) { return c.s === 'none'; }).length, L = null;
    try { L = JSON.parse(localStorage.getItem('wm-wt-last')); } catch (e) {}
    var st = bad || (L && L.Error) ? 'bad' : L && L.Warning ? 'warn' : 'ok';
    sec('s-wt', st, '<div class="big">' + kpi(I.length, 'aerodromes checked') + kpi(mt + ' · ' + m, 'METAR/TAF · METAR') + kpi(L ? L.modelOK + ' / ' + L.model : mod, L ? 'model OK (last run)' : 'on model weather') + kpi(L ? L.Error : bad, 'failures', (L ? L.Error : bad) ? 'ng' : 'go') + '</div>' +
      '<p class="m">' + (L ? 'Last full run ' + sast(L.t) + ': ' + L.OK + ' OK · ' + L.Warning + ' warning · ' + L.Error + ' error.' : 'No full run in this browser yet.') + ' Engine vs card badges now: ' + (bad ? '<span class="bad-t">' + bad + ' differ</span>' : '<span class="ok-t">all match</span>') + (nw ? ' · ' + nw + ' still without weather' : '') + '. Tap to open the full Weather Test.</p>');
  }
  function run() {
    $('#sub').textContent = 'Private · checking…'; fails = {}; fail('x');
    fetch('ops-stamp.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (s) { window.__stamp = s; freshness(s); }, function () { sec('s-data', 'warn', '<p class="m">No build stamp (ops-stamp.json) in this deploy.</p>'); }).then(function () { admin(false); });
    Promise.all([getFeed(), loadMain()]).then(function (r) {
      var A = analyse(r[1]);
      if (!A.cards.length) { sec('s-wx', 'bad', '<p class="bad">The aerodrome page did not load.</p>'); fail('main', 'Aerodrome page (main.html) did not load'); return; }
      weather(A); counts(A); problems(A); wtest(A);
      $('#sub').textContent = 'Private · updated ' + sast(Date.now());
    });
  }
  $('#re').onclick = run;
  if (!tok) setTimeout(function () { if (!tok) askPw(); }, 300);
  run();
})();
