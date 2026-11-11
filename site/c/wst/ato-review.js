/* ATO reviews: data interface + UI linking (31 Oct 2026, preview only).
   Active only with ?rv=1 or localStorage wm-rv=1, so the live ATO page is unchanged.
   Data: WMReviews talks to /api/ato-reviews (Netlify Blobs). Until a real pilot login exists the API refuses writes (401),
   and the UI falls back to the local stub (this browser only). Same rules as the server: one per ATO per account, 6-month replace. */
(function () {
  var Q = new URLSearchParams(location.search);
  var ST = (function () { try { return /[?&]stars=1\b/.test(location.search + top.location.search) } catch (e) { return Q.get('stars') === '1' } })(), on = Q.get('rv') === '1' || ST; try { on = on || localStorage.getItem('wm-rv') === '1' } catch (e) {}
  var NOTE = 'Your review is anonymous. This is mandatory and cannot be turned off.';
  var LIC = ['PPL', 'CPL', 'Night', 'IR', 'Instructor'], SIX = 182 * 864e5;
  var key = function (id) { return String(id || '').trim().toUpperCase().replace(/[^A-Z0-9/]/g, '').replace(/\//g, '_') };
  function agg(l) { var c = l.map(function (r) { return r.cost }).filter(Boolean), n = l.length;
    return { count: n, avgStars: n ? Math.round(l.reduce(function (a, r) { return a + r.stars }, 0) / n * 10) / 10 : null,
      avgCost: c.length ? Math.round(c.reduce(function (a, x) { return a + x }, 0) / c.length / 1000) * 1000 : null, costCount: c.length } }
  function pub(r) { return { id: r.id, ato: r.ato, atoName: r.atoName, stars: r.stars, text: r.text, cats: r.cats || null, cost: r.cost, licence: r.licence, when: r.when, created: r.created, incentivised: !!r.incentivised, votes: r.votes || 0, author: 'Anonymous pilot' } }
  // USERBASE: needs database - local review store (reviews, star-only ratings, account id); replace with Supabase reviews table
  var stub = {
    acct: function () { var a = localStorage.getItem('wm-rv-acct'); if (!a) { a = 'local-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('wm-rv-acct', a) } return a },
    all: function () { try { return JSON.parse(localStorage.getItem('wm-rv-db') || '{}') } catch (e) { return {} } },
    save: function (d) { localStorage.setItem('wm-rv-db', JSON.stringify(d)) },
    list: function (ato) { var d = this.all(), k = key(ato), me = this.acct(), l = [], mine = null;
      Object.keys(d).forEach(function (x) { if (x.indexOf('r/' + k + '/') === 0) { l.push(d[x]); if (d[x].acct === me) mine = d[x] } });
      l.sort(function (a, b) { return b.created - a.created });
      return Promise.resolve({ ato: k, aggregate: agg(l), reviews: l.map(pub), mine: mine ? { id: mine.id, canEditAfter: mine.created + SIX } : null }) },
    mine: function () { var d = this.all(), me = this.acct();
      return Promise.resolve({ reviews: Object.keys(d).map(function (x) { return d[x] }).filter(function (r) { return r.acct === me }).map(pub) }) },
    // USERBASE: needs database - review submit (POST) to the reviews table, requires signed-in pilot
    submit: function (b) { var d = this.all(), me = this.acct(), k = 'r/' + key(b.ato) + '/' + me, p = d[k], now = Date.now();
      if (p && now < p.created + SIX) return Promise.reject({ status: 409, until: p.created + SIX });
      var r = { id: 's' + now, ato: key(b.ato), atoName: b.atoName, stars: b.stars, cats: b.cats || null, text: b.text, cost: b.cost || null, licence: b.licence || null, when: b.when || null, acct: me, created: now, incentivised: false };
      d[k] = r; this.save(d); return Promise.resolve({ review: pub(r) }) }
  };
  // USERBASE: needs database - switch from local stub to the real /api/ato-reviews once the database exists
  var useStub = Q.get('rvstub') === '1';
  function api(m, path, body) { return fetch('/api/ato-reviews' + path, { method: m, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
    .then(function (r) { if (r.status === 401 || r.status === 404) { useStub = true; throw { fallback: 1 } } return r.json().then(function (j) { if (!r.ok) throw Object.assign({ status: r.status }, j); return j }) }) }
  function via(fa, fs) { if (useStub) return fs(); return fa().catch(function (e) { if (e && e.fallback) return fs(); throw e }) }
  var R = window.WMReviews = {
    NOTE: NOTE, LIC: LIC, stub: stub, agg: agg,
    list: function (ato) { return via(function () { return api('GET', '?ato=' + encodeURIComponent(ato)) }, function () { return stub.list(ato) }) },
    mine: function () { return via(function () { return api('GET', '?mine=1') }, function () { return stub.mine() }) },
    submit: function (b) { return via(function () { return api('POST', '', b) }, function () { return stub.submit(b) }) }
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
  var rand = function (n) { return 'R' + Math.round(n).toLocaleString('en-ZA').replace(/[,\u00a0]/g, ' ') };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var mlab = function (w) { var p = w.split('-'); return MON[+p[1] - 1] + ' ' + p[0] };
  var stars = function (n) { return '\u2605\u2605\u2605\u2605\u2605'.slice(0, n) + '\u2606\u2606\u2606\u2606\u2606'.slice(0, 5 - n) };
  R.item = function (r, showAto) {
    var t = [];
    if (r.cost) t.push('<span class="rv-tag">Real cost ' + rand(r.cost) + '</span>');
    if (r.licence) t.push('<span class="rv-tag">' + esc(r.licence) + '</span>');
    if (r.when) t.push('<span class="rv-tag">' + mlab(r.when) + '</span>');
    if (r.incentivised) t.push('<span class="rv-tag inc">Incentivised review</span>');
    return '<div class="rv-it"><div class="h"><span>' + (showAto ? esc(r.atoName || r.ato.replace(/_/g, '/')) : 'Anonymous pilot') + '</span><span class="s">' + stars(r.stars) + '</span></div><p>' + esc(r.text) + '</p>' + (t.length ? '<div class="rv-tags">' + t.join('') + '</div>' : '') + '</div>' };
  R.summary = function (a) { return a.count ? '<span class="rv-agg"><b>' + a.avgStars + '</b> \u2605 \u00b7 ' + a.count + (a.count === 1 ? ' review' : ' reviews') + (a.avgCost ? ' \u00b7 avg real cost <b>' + rand(a.avgCost) + '</b>' : '') + '</span>' : '' };
  R.renderMine = function (el) { R.mine().then(function (d) { el.innerHTML = d.reviews.length ? '<div class="rv-list">' + d.reviews.map(function (r) { return R.item(r, 1) }).join('') + '</div>' : '<p class="rv-agg">You have not reviewed an ATO yet.</p>' }) };

  /* Review flow v1 (MT t1485): tap Write a review -> bottom sheet. Overall stars, five category stars (MT t1551: Instructors, Booking, Aircraft, Ground school, Value for money), short text, submit.
     Preview only: submit always goes to the local stub (this browser), never to /api/ato-reviews. */
  var CATS = [['inst', 'Instructors'], ['book', 'Booking'], ['acft', 'Aircraft'], ['ground', 'Ground school'], ['value', 'Value for money']], WORD = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  var srow = function (k, size) { return '<div class="rv-sr rv-sr-' + size + '" data-k="' + k + '" role="radiogroup">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" role="radio" aria-checked="false" data-s="' + i + '" aria-label="' + i + ' of 5">' + STAR + '</button>' }).join('') + '</div>' };
  R.open = function (ato, name, done) {
    var st = { overall: 0 }, MAX = 500;
    var ov = document.createElement('div'); ov.className = 'rv-ov';
    ov.innerHTML = '<div class="rv-sh" role="dialog" aria-modal="true" aria-label="Review ' + esc(name) + '"><div class="grab"></div>' +
      '<div class="rv-step rv-form"><p class="rv-kick">Write a review</p><h4>' + esc(name) + '</h4>' +
      '<div class="rv-anon"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg><span><b>Your review is anonymous.</b> This is mandatory and cannot be turned off.</span></div>' +
      '<div class="rv-ovr">' + srow('overall', 'lg') + '<span class="rv-word" aria-live="polite">Tap to rate</span></div>' +
      '<div class="rv-cats">' + CATS.map(function (c) { return '<div class="rv-cat"><span>' + c[1] + '</span>' + srow(c[0], 'sm') + '</div>' }).join('') + '</div>' +
      '<div class="rv-f"><label>Your review</label><textarea class="rv-in" maxlength="' + MAX + '" rows="4" placeholder="Instructors, booking, aircraft, ground school, value. Keep it factual."></textarea><div class="rv-cnt"><span>At least 20 characters</span><span class="n">0 / ' + MAX + '</span></div></div>' +
      '<div class="rv-err" aria-live="polite"></div><button class="rv-sub" type="button" disabled>Submit review</button><div class="rv-one">One review per pilot per school. You can replace yours after 6 months.</div></div>' +
      '<div class="rv-step rv-done" hidden><div class="rv-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h4>Review submitted</h4><p>Thank you. Your review of ' + esc(name) + ' is posted anonymously.</p><div class="rv-done-st"></div><button class="rv-sub rv-close" type="button">Done</button><div class="rv-one">Preview: saved in this browser only.</div></div></div>';
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on') });
    var $ = function (s) { return ov.querySelector(s) }, err = $('.rv-err'), ta = $('textarea'), sub = $('.rv-form .rv-sub');
    var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, sh = ov.firstChild;
    /* v5: wait for the sheet's own transform transition (no fixed timeouts); reduced motion jumps to the end state. */
    function afterSlide(fn) { if (RM) { requestAnimationFrame(fn); return } var d = false, h = function (e) { if (e && e.target !== sh) return; if (d) return; d = true; sh.removeEventListener('transitionend', h); fn() }; sh.addEventListener('transitionend', h); setTimeout(h, 600) }
    function close() { ov.classList.remove('on'); afterSlide(function () { ov.remove() }) }
    function valid() { return st.overall > 0 && ta.value.trim().length >= 20 }
    function sync() { sub.disabled = !valid(); $('.rv-cnt .n').textContent = ta.value.length + ' / ' + MAX; $('.rv-word').textContent = st.overall ? WORD[st.overall] : 'Tap to rate' }
    ov.addEventListener('click', function (e) { if (e.target === ov) close() });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() });
    ov.querySelectorAll('.rv-form .rv-sr').forEach(function (g) { g.querySelectorAll('button').forEach(function (b) { b.onclick = function () {
      var v = +b.dataset.s; st[g.dataset.k] = v; g.querySelectorAll('button').forEach(function (x) { var on = +x.dataset.s <= v; x.classList.toggle('on', on); x.setAttribute('aria-checked', +x.dataset.s === v ? 'true' : 'false') }); if (!RM) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop') } err.textContent = ''; sync() } }) });
    ta.oninput = sync;
    $('.rv-close').onclick = close;
    sub.onclick = function () {
      if (!valid()) { err.textContent = st.overall ? 'Write at least 20 characters.' : 'Choose an overall rating.'; return }
      var cats = {}; CATS.forEach(function (c) { if (st[c[0]]) cats[c[0]] = st[c[0]] });
      sub.disabled = true;
      // USERBASE: needs database - preview submit writes locally; wire to API + auth
      stub.submit({ ato: ato, atoName: name, stars: st.overall, cats: cats, text: ta.value.trim() })
        .then(function () { $('.rv-form').hidden = true; $('.rv-done').hidden = false;
          $('.rv-done-st').innerHTML = '<span class="rv-st">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= st.overall ? 'on' : '') + '">' + STAR + '</i>' }).join('') + '</span><b>' + WORD[st.overall] + '</b>'; done && done() })
        .catch(function (e) { sub.disabled = false; err.textContent = e && e.status === 409 ? 'You already reviewed this school. You can replace it after ' + new Date(e.until).toLocaleDateString('en-ZA') + '.' : 'Could not save. Try again.' });
    };
    afterSlide(function () { var f = $('.rv-sr button'); f && f.focus({ preventScroll: true }) });
  };

  /* Link into the existing ATO cards (.c.wx[data-k=ato] in c/app.html); the card renderer itself is not changed. */
  /* Same school, two or more SACAA registrations (preview only, client render; data files untouched).
     The same registration listed twice shows once. Grouped when the normalised name matches, or when website AND email both match. */
  /* Confirmed by web check (31 Oct 2026): one operator runs both ATOs. Excellentia Airline Academy owns and operates
     Aeronav Academy (SACAA/1110/ATO) and Skyhawk Aviation (SACAA/1147 + 1637/ATO); see flyexcellentia.com. */
  var LINK = { 'SACAA/1110/ATO': 'excellentia', 'SACAA/1147/ATO': 'excellentia', 'SACAA/1637/ATO': 'excellentia' };
  var DUP = null;
  function dups() {
    if (DUP) return DUP; DUP = {};
    var A = (typeof D !== 'undefined' && D.atos) || [], C = window.ATOC || {};
    var nm = function (n) { return String(n || '').toLowerCase().replace(/&/g, ' and ').replace(/\(.*?\)/g, '').replace(/\b(pty|ltd|limited|cc|inc|npc|the|rf)\b/g, '').replace(/[^a-z0-9]/g, '') };
    var dm = function (w) { return String(w || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0] };
    var par = A.map(function (_, i) { return i }), f = function (x) { while (par[x] !== x) x = par[x]; return x }, seen = {};
    A.forEach(function (t, i) { var c = C[(t.name || '') + '|' + (t.certificate_number || '')] || {};
      var ks = ['n:' + nm(t.name)]; if (c.website && c.email) ks.push('we:' + dm(c.website) + '|' + String(c.email).toLowerCase());
      if (LINK[t.certificate_number]) ks.push('l:' + LINK[t.certificate_number]);
      ks.forEach(function (k) { if (k in seen) par[f(i)] = f(seen[k]); else seen[k] = i }) });
    var g = {}; A.forEach(function (t, i) { (g[f(i)] = g[f(i)] || []).push(t) });
    Object.keys(g).forEach(function (r) { var l = g[r]; if (l.length < 2) return;
      l.sort(function (a, b) { return a.certificate_number < b.certificate_number ? -1 : 1 });
      var ids = l.map(function (t) { return t.certificate_number }).filter(function (x, j, a) { return a.indexOf(x) === j }); if (ids.length < 2) return; ids.forEach(function (id, j) { DUP[id] = { main: ids[0], ids: ids, hide: j > 0 } }) });
    return DUP;
  }
  R.dups = dups;
  /* Merged school: one small line under the name, e.g. 'ATO 1110 · 1147 · 1637'. Mixed kinds keep each prefix: 'DTO 0017 · ATO 1624'. */
  R.regLine = function (ids) { var p = ids.map(function (id) { var m = String(id).match(/(\d+)\/(ATO|DTO)$/i); return m ? { n: m[1], k: m[2].toUpperCase() } : { n: String(id), k: '' } });
    var one = p.every(function (x) { return x.k === p[0].k });
    return p.map(function (x, i) { return one ? (i ? '' : (x.k ? x.k + ' ' : '')) + x.n : (x.k ? x.k + ' ' : '') + x.n }).join(' \u00b7 ') };
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  function wire(card) {
    if (card.dataset.rv) return; card.dataset.rv = '1';
    var idEl = card.querySelector('.wx-sub .id'), h = card.querySelector('h3'), head = card.querySelector('.wx-head'); if (!idEl || !h || !head) return;
    var ato = idEl.textContent.trim(), name = h.textContent.trim(), dg = dups()[ato];
    var twin = document.querySelector('.c.wx[data-k="ato"][data-rv-id="' + ato + '"]'); card.setAttribute('data-rv-id', ato);
    if ((twin && twin !== card) || (dg && dg.hide)) { card.setAttribute('data-rv-dup', ''); return }
    if (dg) { var regs = document.createElement('div'); regs.className = 'rv-regs'; regs.innerHTML = '<span class="rv-regs-n"></span><span class="rv-regs-tag">Merged ATO</span>'; regs.firstChild.textContent = R.regLine(dg.ids); var sub = card.querySelector('.wx-sub'); if (sub) regs.firstChild.style.color = getComputedStyle(sub).color; regs.setAttribute('aria-label', 'Registrations ' + dg.ids.join(', ')); h.after(regs); card.setAttribute('data-rv-merged', dg.ids.length) }
    var row = card.querySelector('.wx-row'); if (!row) { row = document.createElement('div'); row.className = 'wx-row'; head.appendChild(row) }
    var btn = document.createElement('span'); btn.className = 'rv-btn'; btn.setAttribute('role', 'button'); btn.tabIndex = 0; row.appendChild(btn);
    var rate = document.createElement('span'); rate.className = 'rv-rate'; rate.hidden = true; h.appendChild(rate);
    var det = document.createElement('div'); det.className = 'rv-det'; var hs = getComputedStyle(head); det.style.padding = '0 ' + hs.paddingRight + ' 12px ' + hs.paddingLeft;
    function paint() {
      R.list(ato).then(function (d) {
        var mine = !!d.mine, a = d.aggregate;
        btn.className = 'rv-btn' + (mine ? ' ghost' : ''); btn.setAttribute('aria-disabled', mine ? 'true' : 'false');
        btn.innerHTML = mine ? 'You reviewed this' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>Write a review';
        btn.onclick = mine ? function (e) { e.stopPropagation() } : function (e) { e.stopPropagation(); e.preventDefault(); if (window.WMAtoPage) window.WMAtoPage.open(ato, { write: true }); else R.open(ato, name, paint) };
        btn.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') btn.onclick(e) };
        if (a.count) { var n = Math.round(a.avgStars); rate.hidden = false; rate.setAttribute('aria-label', a.avgStars + ' out of 5 stars, ' + a.count + ' reviews');
          rate.innerHTML = '<span class="rv-st">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '">' + STAR + '</i>' }).join('') + '</span><b>' + a.avgStars.toFixed(1) + '</b><em>(' + a.count + ')</em>' } else rate.hidden = true;
        det.innerHTML = '<div class="rv-sum"><div><span>Rating</span><b>' + (a.avgStars || '-') + '</b></div><div><span>Reviews</span><b>' + a.count + '</b></div><div><span>Avg real cost</span><b>' + (a.avgCost ? rand(a.avgCost) : '-') + '</b></div></div>' +
          (a.costCount ? '<p class="rv-agg" style="margin:6px 2px 0">Average of ' + a.costCount + ' pilot-reported total cost' + (a.costCount > 1 ? 's' : '') + '.</p>' : '') +
          '<div class="rv-list">' + d.reviews.map(function (r) { return R.item(r) }).join('') + '</div>';
      });
    }
    var body = card.querySelector('.wx-body'); if (body) body.prepend(det);
    paint();
  }
  function scan() { document.querySelectorAll('.c.wx[data-k="ato"]').forEach(wire) }
  R.scan = scan;
  if (!on) return;
  var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = (document.currentScript && document.currentScript.src || 'wst/ato-review.js').replace(/ato-review\.js.*/, 'ato-review.css?v=2c3e2f1c10'); document.head.appendChild(l);
  var l2 = document.createElement('link'); l2.rel = 'stylesheet'; l2.href = l.href.replace(/ato-review\.css.*/, 'ato-page.css?v=7a3668844f'); document.head.appendChild(l2);
  var l3 = document.createElement('link'); l3.rel = 'stylesheet'; l3.href = l.href.replace(/ato-review\.css.*/, 'ato-ratings.css?v=886592f609'); document.head.appendChild(l3);
  var go = function () { if (ST) return; /* ?stars=1: the stars build owns the ATO cards */ scan(); new MutationObserver(scan).observe(document.body, { childList: true, subtree: true }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
