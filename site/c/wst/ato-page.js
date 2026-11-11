/* ATO page, option 2 "navy header with a big score" (MT t1499). Preview only: active with ?rv=1 (same switch as ato-review.js).
   Opened by tapping an ATO name on an ATO card, or by 'Write a review' (opens the page, then the review sheet).
   Deep link: #school=SACAA_1110_ATO and #school=...&write=1. Reads D.atos / ATOC only; no data files changed.
   Motion: page slides in on transform+opacity only, close is faster than open, reduced motion jumps to the end state. */
(function () {
  var Q = new URLSearchParams(location.search), ST = (function () { try { return /[?&]stars=1\b/.test(location.search + top.location.search) } catch (e) { return Q.get('stars') === '1' } })(), on = Q.get('rv') === '1' || ST; try { on = on || localStorage.getItem('wm-rv') === '1' } catch (e) {}
  if (!on) return;
  var R = function () { return window.WMReviews };
  var RM = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  var stars = function (n, cls) { var r = Math.round(n || 0); return '<span class="ap-st ' + (cls || '') + '">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= r ? 'on' : '') + '">' + STAR + '</i>' }).join('') + '</span>' };
  var cert = function (k) { return String(k || '').replace(/_/g, '/') };
  var keyOf = function (id) { return String(id || '').toUpperCase().replace(/\//g, '_') };
  var atos = function () { return (typeof D !== 'undefined' && D.atos) || [] };
  var find = function (id) { return atos().filter(function (t) { return t.certificate_number === id })[0] };
  var clean = function (n) { return String(n || '').replace(/\s*\((pty|rf)\)\s*/ig, ' ').replace(/\b(ltd|limited|npc|cc)\b\.?/ig, '').replace(/\s+/g, ' ').trim() };
  var town = function (t) { var p = String(t.operations_address || '').split(',').map(function (x) { return x.trim() }).filter(function (x) { return x && !/^\d+$/.test(x) }); return p.length > 1 ? p[p.length - 2] : (t.region || '') };
  var COURSE = [[/^PPL/i, 'PPL'], [/^CPL/i, 'CPL'], [/^ATPL/i, 'ATPL'], [/^Night/i, 'Night'], [/^Instrument/i, 'IR'], [/Instructor/i, 'Instructor'], [/MEA|Multi/i, 'Multi-engine'], [/Helicopter|\(H\)/i, 'Helicopter']];
  var courses = function (ts) { var o = []; ts.forEach(function (t) { (t._cs || []).forEach(function (c) { COURSE.forEach(function (m) { if (m[0].test(c) && o.indexOf(m[1]) < 0) o.push(m[1]) }) }) }); return o };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var date = function (d) { var p = String(d || '').split('/'); return p.length === 3 ? (+p[0]) + ' ' + MON[+p[1] - 1] + ' ' + p[2] : '' };
  var future = function (d) { var p = String(d || '').split('/'); return p.length === 3 && new Date(+p[2], +p[1] - 1, +p[0]) > new Date() };
  var num = function (id) { var m = String(id).match(/(\d+)\/(ATO|DTO)$/i); return m ? m[1] : id };
  var cur = null;
  /* Built data (tools/ato/build_ato.py, MT t1603): one small JSON per ATO with PUBLIC parts only (c/ato/<KEY>.json).
     The page prefers it; without a built file it falls back to D.atos in the browser (same fields). */
  var DOCS = {};
  var loadDoc = function (id) { var k = keyOf(id); if (k in DOCS) return Promise.resolve(DOCS[k]);
    return fetch('ato/' + k + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null }).catch(function () { return null }).then(function (d) { DOCS[k] = d; return d }) };
  // USERBASE: needs database - signed-in state. Until auth exists, ?si=1 previews the signed-in page with labelled example data.
  var SI = Q.get('si') === '1'; try { SI = SI || localStorage.getItem('wm-si') === '1' } catch (e) {}
  // USERBASE: needs database - full reviews and contact details for signed-in pilots. Example file only, fake data.
  var EXAMPLE = null, loadEx = function () { return EXAMPLE ? Promise.resolve(EXAMPLE) : fetch('ato/_example_reviews.json').then(function (r) { return r.ok ? r.json() : {} }).catch(function () { return {} }).then(function (j) { EXAMPLE = j; return j }) };
  /* Votes and reports (MT t1549): local only until the database exists. One vote per pilot per comment; no vote or report on your own comment. */
  var ICO = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5l7 7.5h-4v7.5H9V12H5z"/></svg>',
    dn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.5L5 12h4V4.5h6V12h4z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>'
  };
  // USERBASE: needs database - signed-in pilot account id (auth)
  var acct = function () { try { return R() && R().stub ? R().stub.acct() : 'local' } catch (e) { return 'local' } };
  var ls = function (k, d) { try { return JSON.parse(localStorage.getItem(k) || '') || d } catch (e) { return d } };
  // USERBASE: needs database - votes (one per pilot per comment) and reports (needs reporter email + cell); tables review_votes, review_reports
  var V = {
    all: function () { return ls('wm-rv-votes', {}) },
    get: function (rid) { var a = this.all()[acct()] || {}; return a[rid] || 0 },
    set: function (rid, v) { var d = this.all(), me = acct(); d[me] = d[me] || {}; if (v) d[me][rid] = v; else delete d[me][rid]; localStorage.setItem('wm-rv-votes', JSON.stringify(d)) },
    reported: function (rid) { return ls('wm-rv-reports', []).some(function (x) { return x.review === rid && x.by === acct() }) },
    report: function (rid, ato, reason) { var l = ls('wm-rv-reports', []); l.push({ review: rid, ato: ato, reason: reason, by: acct(), at: Date.now() }); localStorage.setItem('wm-rv-reports', JSON.stringify(l)) }
  };
  window.WMRvVotes = V;
  var REASONS = [['false', 'False or misleading'], ['offensive', 'Offensive or abusive'], ['personal', 'Shares personal details'], ['spam', 'Spam or advertising']];
  // USERBASE: needs database - vote row reads the pilot vote and net total from review_votes
  function voteRow(r, own) {
    var v = own ? 0 : V.get(r.id), net = (r.votes || 0) + v, dis = own ? ' disabled' : '';
    return '<div class="ap-vote' + (v > 0 ? ' is-up' : v < 0 ? ' is-dn' : '') + '" data-rid="' + esc(r.id) + '" data-base="' + (r.votes || 0) + '">' +
      '<button type="button" class="ap-vb ap-up" aria-label="Upvote" aria-pressed="' + (v > 0) + '"' + dis + '>' + ICO.up + '</button>' +
      '<span class="ap-net" aria-live="polite">' + net + '</span>' +
      '<button type="button" class="ap-vb ap-dn" aria-label="Downvote" aria-pressed="' + (v < 0) + '"' + dis + '>' + ICO.dn + '</button>' +
      (own ? '<span class="ap-own">Your review</span>' : '<button type="button" class="ap-vb ap-flag' + (V.reported(r.id) ? ' is-done' : '') + '" aria-label="Report this comment">' + ICO.flag + '</button>') + '</div>';
  }
  // USERBASE: needs database - report sheet: add email + cell fields, POST to review_reports, admin email alert, auto-hide at 3
  function reportSheet(rid, ato, done) {
    if (V.reported(rid)) return;
    var ov = document.createElement('div'); ov.className = 'ap-rp-ov';
    ov.innerHTML = '<div class="ap-rp" role="dialog" aria-modal="true" aria-label="Report this comment"><div class="ap-rp-grab"></div><h4>Report this comment</h4><p class="ap-rp-sub">Why are you reporting it? The pilot who wrote it will not see who reported it.</p>' +
      REASONS.map(function (x) { return '<button type="button" class="ap-rp-o" data-r="' + x[0] + '">' + x[1] + '<span></span></button>' }).join('') +
      '<button type="button" class="ap-rp-go" disabled>Send report</button><button type="button" class="ap-rp-x">Cancel</button></div>';
    var pick = null, shut = function () { ov.remove() };
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.ap-rp-x')) return shut();
      var o = e.target.closest('.ap-rp-o'); if (o) { pick = o.dataset.r; [].forEach.call(ov.querySelectorAll('.ap-rp-o'), function (b) { b.classList.toggle('on', b === o) }); ov.querySelector('.ap-rp-go').disabled = false; return }
      if (e.target.closest('.ap-rp-go') && pick) { V.report(rid, ato, pick); ov.querySelector('.ap-rp').innerHTML = '<h4>Thanks, report sent</h4><p class="ap-rp-sub">We will review this comment. Nothing changes for you.</p><button type="button" class="ap-rp-x">Done</button>'; done && done() }
    });
    (cur || document.body).appendChild(ov); requestAnimationFrame(function () { ov.classList.add('on') });
    return ov;
  }
  window.WMRvReport = reportSheet;

  /* Courses (MT t1564, t1571): small grey pills stacked one per line, full course names. Long names truncate with an ellipsis (option A, the only option; ?cp=b removed). */
  function coursesRow(ts) {
    var cs = []; ts.forEach(function (t) { (t._cs || []).forEach(function (c) { c = String(c).trim(); if (c && cs.indexOf(c) < 0) cs.push(c) }) });
    if (!cs.length) return '<div class="ap-row"><span>Courses</span><b>-</b></div>';
    var pill = function (c, i) { return '<span class="ap-cp' + (i >= 4 ? ' ap-more' : '') + '" title="' + esc(c) + '">' + esc(c) + '</span>' };
    return '<div class="ap-row ap-crow ap-crs"><span>Courses</span><div class="ap-cst">' + cs.map(pill).join('') +
      (cs.length > 4 ? '<button type="button" class="ap-xall" aria-expanded="false">Show more</button>' : '') + '</div></div>';
  }
  /* Base aerodrome (MT t1564, t1571): ICAO + name, links to the aerodrome page. Same font and colours as the aerodrome card sub line (.sub .icao).
     Registration rows below show the ATO licence number in the same blue as the ATO card (.wx-sub .id, token --tcv). */
  function baseRow(b) {
    if (!b || !b.ident) return '';
    var nm = String(b.name || '').replace(/ International Airport| Airport| Aerodrome/i, '');
    return '<div class="ap-row ap-base"><span>Base aerodrome</span><a class="ap-adl" href="ad/' + esc(b.ident) + '.html"><b>' + esc(b.ident) + '</b><em>' + esc(nm) + '</em><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a></div>';
  }

  /* MERGED ATO RULE (MT t1591, 31 Oct 2026). IMPORTANT, keep this in the Python ATO builder too:
     whenever two or more SACAA registrations are merged into one ATO page, the page must show the NEXT (new)
     registration / licence number first, and mark it "Current". The new one is the highest certificate number
     (SACAA issues them in rising order); a tie is broken by the latest effective_date. The older numbers stay listed
     underneath for reference. Data used: certificate_number + effective_date from the ATO data (read only). */
  var regNum = function (id) { var m = String(id || '').match(/\/(\d+)\//); return m ? +m[1] : -1 };
  var eff = function (d) { var p = String(d || '').split('/'); return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : 0 };
  function newestFirst(ts) { return ts.slice().sort(function (a, b) { return (regNum(b.certificate_number) - regNum(a.certificate_number)) || (eff(b.effective_date) - eff(a.effective_date)) }) }

  function group(id) { var g = R() && R().dups ? R().dups()[id] : null; return g ? g.ids.slice() : [id] }

  function open(id, opt) {
    id = cert(id); opt = opt || {};
    var ids0 = group(id);
    loadDoc(ids0.slice().sort()[0]).then(function (doc) { render(id, opt, doc) });
  }
  function render(id, opt, doc) {
    var ids = group(id), main = ids[0], ts = ids.map(find).filter(Boolean); if (!ts.length) return;
    if (ts.length > 1) { ts = newestFirst(ts); ids = ts.map(function (t) { return t.certificate_number }) } /* merged: NEXT (new) registration first */
    var t0 = find(main) || ts[0], name = clean(t0.name), b = t0._b || {};
    if (cur) cur.remove();
    var pg = document.createElement('div'); pg.className = 'ap'; pg.setAttribute('role', 'dialog'); pg.setAttribute('aria-modal', 'true'); pg.setAttribute('aria-label', name);
    var merged = ids.length > 1;
    if (doc) { name = doc.name; merged = doc.merged; ids = doc.regs.map(function (r) { return r.id }) }
    var regRows = doc ? doc.regs.map(function (r) { var ok = future(r.expiry); return '<div class="ap-row ap-reg"><span><i class="ap-id">' + esc(r.id) + '</i>' + (merged ? ' <em>' + esc(r.name) + '</em>' : '') + (r.current ? ' <span class="ap-cur">Current</span>' : '') + '</span><b class="' + (ok ? 'ap-ok' : 'ap-exp') + '">' + (ok ? 'Valid until ' : 'Expired ') + esc(date(r.expiry)) + '</b></div>' }).join('') : null;
    var crs = doc ? coursesRow([{ _cs: doc.courses }]) : coursesRow(ts), bse = doc ? baseRow(doc.base) : baseRow(b);
    pg.innerHTML = '<div class="ap-scroll"><div class="ap-hero">' +
      '<p class="ap-k">ATO \u00b7 ' + esc(doc ? doc.town : town(t0)) + '</p><h1>' + esc(name) + '</h1>' +
      '<div class="ap-regs"><span>' + esc((R() && R().regLine) ? R().regLine(ids) : ids.join(' \u00b7 ')) + '</span>' + (merged ? '<span class="ap-mt">Merged ATO</span>' : '') + '</div>' +
      '<div class="ap-big"><span class="ap-n">-</span><span class="ap-r">' + stars(0, 'lg') + '<span class="ap-cnt">No reviews yet</span></span><span class="rv-btn ap-write" role="button" tabindex="0">' + PEN + 'Write a review</span></div></div>' +
      '<div class="ap-body">' + (SI ? '<p class="ap-k ap-sec">Contact</p><div class="ap-card ap-contact"><div class="ap-row"><span>Phone</span><b>+27 00 000 0000</b></div><div class="ap-row"><span>Email</span><b>contact@example.invalid</b></div><div class="ap-row"><span>Website</span><b>example.invalid</b></div></div>' : '') + '<p class="ap-k ap-sec">About the ATO</p><div class="ap-card">' +
      crs + bse + (regRows != null ? regRows : ts.map(function (t, ti) { var ok = future(t.expiry_date); return '<div class="ap-row ap-reg"><span><i class="ap-id">' + esc(t.certificate_number) + '</i>' + (merged ? ' <em>' + esc(clean(t.name)) + '</em>' : '') + (merged && ti === 0 ? ' <span class="ap-cur">Current</span>' : '') + '</span><b class="' + (ok ? 'ap-ok' : 'ap-exp') + '">' + (ok ? 'Valid until ' : 'Expired ') + esc(date(t.expiry_date)) + '</b></div>' }).join('')) +
      '</div>' + (SI || ST ? '<div class="ap-rate"></div>' : '')+ (ST ? '<div class="ap-sec st-rvrow"><p class="ap-k">' + (SI ? 'All reviews' : 'Most helpful') + '</p><button type="button" class="ap-k st-rvh">Write a review</button></div>' : '<p class="ap-k ap-sec">' + (SI ? 'All reviews' : 'Most helpful') + '</p>') + '<div class="ap-revs"></div>' +
      (SI ? '<p class="ap-exnote">Signed-in preview. Example data, not real reviews or contact details.</p>' :
      '<div class="ap-gate"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg><h5>Log in to see more</h5><p class="ap-gp">All reviews, the full cost breakdown, documents and the ATO\'s contact details. Free account.</p><span class="ap-cta">Log in free</span></div>') +
      '</div></div>';
    document.body.appendChild(pg); cur = pg;
    var html = document.documentElement, prevOv = html.style.overflow; html.style.overflow = 'hidden';
    var $ = function (s) { return pg.querySelector(s) };
    function paint() {
      if (!R()) return;
      var src = (SI ? loadEx() : Promise.resolve(null)).then(function (ex) {
        return Promise.all(ids.map(function (i) { return R().list(i).catch(function () { return { reviews: [], mine: null } }) })).then(function (rs) {
          if (ex) rs = rs.concat(ids.map(function (i) { return { reviews: ex[i] || [] } }));
          return rs }) });
      src.then(function (rs) {
        var all = [], mine = null; rs.forEach(function (r) { all = all.concat(r.reviews || []); mine = mine || r.mine });
        /* Signed out: total rating and two comments from the built public file (no breakdown). */
        if (!SI && doc && doc.reviews && !mine) all = doc.reviews.top.concat(new Array(Math.max(0, doc.reviews.count - doc.reviews.top.length)).fill(null)).map(function (r, j) { return r || { id: 'h' + j, stars: doc.reviews.avg || 0, votes: -1e9, created: 0 } });
        var n = all.length, avg = (!SI && doc && doc.reviews.avg != null && !mine) ? doc.reviews.avg : n ? Math.round(all.reduce(function (a, r) { return a + r.stars }, 0) / n * 10) / 10 : 0;
        var MIN = (window.WMAtoRatings && window.WMAtoRatings.MIN) || 3, shown = n >= MIN; /* same 3-review minimum as the ratings box */
        $('.ap-n').textContent = shown ? avg.toFixed(1) : '-';
        $('.ap-r .ap-st').outerHTML = stars(shown ? avg : 0, shown ? 'lg' : 'lg ap-hide');
        $('.ap-cnt').textContent = !n ? 'No reviews yet' : shown ? n + ' reviews' : n + (n === 1 ? ' review' : ' reviews') + ', rating shows at ' + MIN;
        var top = all.slice().sort(function (a, b) { return (b.votes || 0) - (a.votes || 0) || b.created - a.created }).slice(0, SI ? 50 : 2).filter(function (r) { return r.text != null });
        var A = window.WMAtoRatings; if (A && $('.ap-rate')) $('.ap-rate').innerHTML = A.box(A.summarize(all), { label: window.WM_RV_EXAMPLE ? 'Example data' : '' });
        var mid = mine && mine.id;
        $('.ap-revs').innerHTML = top.length ? top.map(function (r) { var own = !!mid && r.id === mid; return '<article class="ap-cm"><div class="ap-cmh"><span>Anonymous pilot</span>' + stars(r.stars, 'sm') + '</div><p>' + esc(r.text) + '</p><div class="ap-cmf"><span class="ap-lic">' + esc(r.licence || '') + '</span>' + voteRow(r, own) + '</div></article>' }).join('') : '<p class="ap-empty">No reviews yet. Be the first pilot to review ' + esc(name) + '.</p>';
        var w = $('.ap-write'); w.classList.toggle('ghost', !!mine); w.lastChild.textContent = mine ? 'You reviewed this' : 'Write a review';
      });
    }
    function write() { if ($('.ap-write').classList.contains('ghost') || !R()) return; R().open(main, name, paint) }
    if (ST) { $('.ap-write').style.display = 'none'; $('.st-rvh').onclick = function (e) { e.stopPropagation(); if (window.WMStars) WMStars.open(main, esc(name)) } }
    $('.ap-write').onclick = function (e) { e.stopPropagation(); write() };
    $('.ap-write').onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); write() } };
    function close() {
      if (pg.dataset.closing) return; pg.dataset.closing = '1';
      var done = function () { pg.remove(); if (cur === pg) cur = null; html.style.overflow = prevOv };
      if (/#school=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
      if (RM() || !pg.animate) return done();
      pg.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24%)', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }).finished.catch(function () {}).then(done);
    }
    pg.close = close;
    pg.addEventListener('click', function (e) {
      var x = e.target.closest('.ap-xall');
      if (x) { var open_ = x.getAttribute('aria-expanded') !== 'true', row = x.closest('.ap-crow'); row.classList.toggle('is-open', open_); x.setAttribute('aria-expanded', open_); x.textContent = open_ ? 'Show less' : 'Show more'; return }
      var b = e.target.closest('.ap-vb'); if (!b || b.disabled) return;
      var row2 = b.closest('.ap-vote'), rid = row2.dataset.rid;
      if (b.classList.contains('ap-flag')) { reportSheet(rid, main, function () { b.classList.add('is-done') }); return }
      var want = b.classList.contains('ap-up') ? 1 : -1, v = V.get(rid) === want ? 0 : want; V.set(rid, v);
      row2.classList.toggle('is-up', v > 0); row2.classList.toggle('is-dn', v < 0);
      row2.querySelector('.ap-up').setAttribute('aria-pressed', v > 0); row2.querySelector('.ap-dn').setAttribute('aria-pressed', v < 0);
      row2.querySelector('.ap-net').textContent = (+row2.dataset.base) + v;
    });
    /* MT t1603: the in-page back button is removed; the top-bar back ('ATOs', wm-adback.js) closes the page. */
    pg.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.querySelector('.rv-ov')) close() });
    paint();
    var h = '#school=' + keyOf(main) + (opt.write ? '&write=1' : '');
    if (location.hash !== h) history.replaceState(null, '', location.pathname + location.search + h);
    var after = function () { pg.style.willChange = ''; pg.tabIndex = -1; pg.focus({ preventScroll: true }); if (opt.write) write() };
    if (RM() || !pg.animate) { requestAnimationFrame(after); return }
    pg.style.willChange = 'transform,opacity';
    pg.animate([{ transform: 'translateX(100%)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.32,.72,0,1)' }).finished.catch(function () {}).then(after);
  }
  window.WMAtoPage = { open: open, close: function () { cur && cur.close() } };

  /* Tap an ATO name on a card -> page. The card chevron/head still expands as before. */
  document.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('.c.wx[data-k="ato"] h3'); if (!h || e.target.closest('.rv-btn')) return;
    var id = h.closest('.c.wx').querySelector('.wx-sub .id'); if (!id) return;
    e.preventDefault(); e.stopPropagation(); open(id.textContent.trim());
  }, true);
  function fromHash() { var m = location.hash.match(/#school=([A-Z0-9_]+)(&write=1)?/i); if (!m) return; var go = function () { if (atos().length) open(m[1], { write: !!m[2] }); else setTimeout(go, 200) }; go() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fromHash); else fromHash();
})();
