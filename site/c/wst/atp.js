/* ATO pages v3 template (MT t1684, Claude review applied). Renders one ATO from c/atp/d/<KEY>.<hash>.json into a container the shell provides.
   Not wired live: nothing in app.html loads this yet.
   NO-INNER-SCROLL: plain flow content. Never scrolls anything (no scrollTo/scrollIntoView), never creates iframes, fixed layers
   or scroll boxes. The shell window is the only scroller and owns scroll restore (render, then window scroll to top, then fade in).
   BACK: the shell's wm-adback back pill is the only back control; this page has none.
   DATABASE: reviews, ratings, sign-in and contact details are coded below but gated by WM_ATP.DB_ENABLED.
   While false there are zero network calls besides the public JSON, and the empty state shows. */
(function () {
  var C = window.WM_ATP = window.WM_ATP || {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) };
  var PEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var date = function (d) { var p = String(d || '').split('/'); return p.length === 3 ? (+p[0]) + ' ' + MON[+p[1] - 1] + ' ' + p[2] : '' };
  var future = function (d) { var p = String(d || '').split('/'); return p.length === 3 && new Date(+p[2], +p[1] - 1, +p[0]) > new Date() };
  var num = function (id) { var m = String(id).match(/(\d+)\/(ATO|DTO)$/i); return m ? m[1] : id };
  var ID_RE = /^SACAA\/\d{4}\/(ATO|DTO)$/;
  var FILE_RE = /^[A-Z0-9_]+\.[0-9a-f]{10}\.json$/;
  var okMail = function (e) { return /^[^\s@<>"'?&]+@[^\s@<>"'?&]+\.[^\s@<>"'?&]+$/.test(String(e || '')) };

  /* ---------- data: manifest (revalidated) + hashed docs (immutable). Failures are never cached. ---------- */
  var MAN = null, DOCS = {}, hiddenAt = 0;
  var murl = function () { return C.MANIFEST || 'atp/manifest.json' };
  function manifest(fresh) {
    if (MAN && !fresh) return MAN;
    return MAN = fetch(murl(), { cache: fresh ? 'reload' : 'no-cache', credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw 0; return r.json() }).catch(function () { MAN = null; return { files: {} } });
  }
  function find(m, id) {
    var f = m.files || {}; if (f[id]) return f[id];
    for (var k in f) if (f[k].ids && f[k].ids.indexOf(id) >= 0) return f[k];
    return null;
  }
  function load(id, fresh) {
    return manifest(fresh).then(function (m) {
      var e = find(m, id); if (!e || !FILE_RE.test(e.file)) return null;
      var base = murl().replace(/manifest\.json(\?.*)?$/, '') + (m.dir === 'd/' ? 'd/' : '');
      return fetch(base + e.file, { credentials: 'same-origin' }).then(function (r) {
        if (r.ok) return r.json();
        if (r.status === 404 && !fresh) return load(id, true); // old manifest pointed at a file a new deploy removed
        return null;
      });
    });
  }
  function doc(id) {
    if (!ID_RE.test(id)) return Promise.resolve(null);
    if (DOCS[id]) return DOCS[id];
    return DOCS[id] = load(id).then(function (d) { if (!d) delete DOCS[id]; return d }, function () { delete DOCS[id]; return null });
  }
  // Home Screen app stays alive for days: revalidate the manifest after 10 minutes hidden.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > 600000) { MAN = null; DOCS = {}; }
  });

  /* ---------- database layer (all gated) ---------- */
  var DB = {
    on: function () { return C.DB_ENABLED === true && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(C.SUPABASE_URL || '') && !!C.SUPABASE_ANON_KEY },
    // Session comes from the auth module via WM_ATP.getSession(). No preview branch lives in this file.
    session: function () {
      if (typeof C.getSession !== 'function') return Promise.resolve(null);
      try { return Promise.resolve(C.getSession()).catch(function () { return null }) } catch (e) { return Promise.resolve(null) }
    },
    rest: function (path, s, opt) {
      var h = { apikey: C.SUPABASE_ANON_KEY, Accept: 'application/json', 'Content-Type': 'application/json' };
      if (s && s.access_token) h.Authorization = 'Bearer ' + s.access_token;
      return fetch(C.SUPABASE_URL + '/rest/v1/' + path, Object.assign({ headers: h, credentials: 'omit' }, opt || {})).then(function (r) { if (!r.ok) throw r.status; return r.json() });
    },
    // Public: ato_ratings view counts published reviews only, keyed on the stable ATO key.
    ratings: function (key) {
      if (!DB.on()) return Promise.resolve(null);
      return DB.rest('ato_ratings?ato_key=eq.' + encodeURIComponent(key) + '&select=count,avg').then(function (r) { return r && r[0] || null }).catch(function () { return null });
    },
    reviews: function (key, s, all) {
      if (!DB.on()) return Promise.resolve([]);
      return DB.rest('ato_reviews?ato_key=eq.' + encodeURIComponent(key) + '&status=eq.published&select=id,stars,text,licence,votes,created_at&order=votes.desc&limit=' + (all ? 50 : 2), s).catch(function () { return [] });
    },
    // Signed in with a paid plan only, through the get_contact RPC (security definer, plan check, rate limit). Never a table select.
    contact: function (key, s) {
      if (!DB.on() || !s || !s.access_token) return Promise.resolve(null);
      return DB.rest('rpc/get_contact', s, { method: 'POST', body: JSON.stringify({ p_keys: [key] }) }).then(function (r) { return r && r[0] || null }).catch(function () { return null });
    },
    // Legacy registration-id filter guard, kept for any in.(…) query.
    ids: function (ids) { return (ids || []).filter(function (i) { return ID_RE.test(i) }) }
  };
  C.DB = DB;

  /* ---------- view ---------- */
  function licenceOk(cur) { return /^valid/i.test(cur.status || '') && future(cur.expiry) }
  function scoreHtml(rt) {
    return rt && rt.count >= (C.MIN_REVIEWS || 3) ? '<div class="atp-n">' + esc(Number(rt.avg).toFixed(1)) + '</div><div class="atp-r">' + esc(rt.count) + ' reviews</div>'
      : '<div class="atp-r">No rating yet</div>';
  }
  function hero(d) {
    var regs = d.regs.map(function (r) { return '<span>' + (/DTO$/i.test(r.id) ? 'DTO' : 'ATO') + ' ' + esc(num(r.id)) + (d.merged && r.current ? ' <span class="atp-mt">current</span>' : '') + '</span>' }).join('');
    var former = (d.formerly || []).length ? '<p class="atp-fm">formerly ' + d.formerly.map(esc).join(', ') + '</p>' : '';
    var write = DB.on() ? '<button type="button" class="atp-btn" data-atp="write">' + PEN + 'Write a review</button>'
      : '<button type="button" class="atp-btn" aria-disabled="true" disabled>' + PEN + 'Reviews open when accounts launch</button>';
    return '<header class="atp-hero"><p class="atp-k">' + esc(d.kind) + (d.town ? ' · ' + esc(d.town) : '') + '</p><h1 tabindex="-1">' + esc(d.name) + '</h1>' + former +
      '<div class="atp-regs">' + regs + '</div><div class="atp-big"><div class="atp-score" data-atp-slot="rating">' + scoreHtml(null) + '</div>' + write + '</div></header>';
  }
  function contactInner(d, c, s) {
    if (!s) return '';
    var rows = '<div class="atp-row"><span>Address</span><b>' + esc(String(d.address || d.town).replace(/\s*,[\s,]*/g, ', ')) + '</b></div>';
    if (c && c.phone) rows += '<div class="atp-row"><span>Phone</span><b><a href="tel:' + esc(String(c.phone).replace(/[^+\d]/g, '')) + '">' + esc(c.phone) + '</a></b></div>';
    if (c && okMail(c.email)) rows += '<div class="atp-row"><span>Email</span><b><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></b></div>';
    if (c && c.website) { try { var u = new URL(c.website); if (/^https?:$/.test(u.protocol)) rows += '<div class="atp-row"><span>Website</span><b><a href="' + esc(u.href) + '" target="_blank" rel="noopener noreferrer">' + esc(u.host) + '</a></b></div>' } catch (e) { } }
    if (!c) rows += '<div class="atp-row"><span>Phone and email</span><b>When accounts open</b></div>';
    return '<section class="atp-sec"><p class="atp-k">Contact</p></section><div class="atp-card">' + rows + '</div>';
  }
  function details(d) {
    var cur = d.regs[0] || {}, ok = licenceOk(cur);
    var txt = ok ? 'Valid until ' + esc(date(cur.expiry)) : (future(cur.expiry) ? esc(cur.status || 'Not valid') : 'Expired ' + esc(date(cur.expiry)));
    return '<section class="atp-sec"><p class="atp-k">Details</p></section><div class="atp-card">' +
      (d.base ? '<div class="atp-row"><span>Base</span><b>' + esc(d.base.name) + ' · ' + esc(d.base.ident) + '</b></div>' : '') +
      '<div class="atp-row"><span>Region</span><b>' + esc(d.region || d.town) + '</b></div>' +
      '<div class="atp-row"><span>Licence</span><b class="' + (ok ? 'atp-ok' : '') + '">' + txt + '</b></div></div>';
  }
  function coursesInner(d, open) {
    var cs = d.courses || [], n = open ? cs.length : Math.min(cs.length, 8);
    return '<section class="atp-sec"><p class="atp-k">Courses · ' + cs.length + '</p></section><div class="atp-card"><div class="atp-cl">' +
      cs.slice(0, n).map(function (c) { return '<span class="atp-cs">' + esc(c) + '</span>' }).join('') + '</div>' +
      (cs.length > 8 ? '<button type="button" class="atp-more" data-atp="more" aria-expanded="' + (open ? 'true' : 'false') + '"' + (open ? ' hidden' : '') + '>Show all ' + cs.length + '</button>' : '') + '</div>';
  }
  function reviewsInner(list) {
    var head = '<section class="atp-sec"><p class="atp-k">Reviews</p></section>';
    if (!list || !list.length) return head + '<p class="atp-empty" data-atp="empty">No reviews yet. Be the first pilot to review this ATO.</p>';
    return head + list.map(function (r) { return '<div class="atp-card"><div class="atp-row"><span>' + esc(r.licence || 'Pilot') + '</span><b>' + esc(r.stars) + '/5</b></div><p class="atp-rv">' + esc(r.text) + '</p></div>' }).join('');
  }

  /* Hero and body draw immediately from the public JSON; rating, reviews and contact are patched in place afterwards.
     A token stops a slower earlier render from overwriting a newer one in the same container. */
  function render(el, id) {
    var t = el._atpT = (el._atpT || 0) + 1, st = { open: false };
    return doc(id).then(function (d) {
      if (el._atpT !== t) return null;
      if (!d) { el.innerHTML = '<div class="atp"><div class="atp-wrap"><p class="atp-empty">ATO not found. Check your connection and try again.</p></div></div>'; return null }
      el.innerHTML = '<div class="atp" data-atp-id="' + esc(d.id) + '" data-atp-key="' + esc(d.key || '') + '" data-db="' + (DB.on() ? 1 : 0) + '"><div class="atp-wrap">' + hero(d) +
        '<div class="atp-body"><div data-atp-slot="contact"></div>' + details(d) + '<div data-atp="courses">' + coursesInner(d, false) + '</div>' +
        '<div data-atp-slot="reviews">' + reviewsInner([]) + '</div>' +
        (DB.on() ? '' : '<p class="atp-note">Reviews and ratings open when pilot accounts launch.</p>') + '</div></div></div>';
      document.title = d.name + ' · ATO · Go Around';
      var h1 = el.querySelector('h1'); if (h1 && h1.focus) h1.focus({ preventScroll: true });
      el.onclick = function (e) {
        var b = e.target.closest && e.target.closest('[data-atp]'); if (!b) return;
        var k = b.getAttribute('data-atp');
        if (k === 'more') { st.open = true; el.querySelector('[data-atp=courses]').innerHTML = coursesInner(d, true) }
        else if (k === 'write' && DB.on()) el.dispatchEvent(new CustomEvent('atp:write', { bubbles: true, detail: { id: d.id, key: d.key } }));
      };
      return DB.session().then(function (s) {
        if (el._atpT !== t) return null;
        var root = el.querySelector('.atp'); root.setAttribute('data-signed-in', s ? 1 : 0);
        var slot = function (n, html) { var x = el.querySelector('[data-atp-slot=' + n + ']'); if (x) x.innerHTML = html };
        slot('contact', contactInner(d, null, s));
        if (!DB.on()) return d;
        return Promise.all([DB.ratings(d.key), DB.reviews(d.key, s, !!s), DB.contact(d.key, s)]).then(function (b) {
          if (el._atpT !== t) return null;
          slot('rating', scoreHtml(b[0])); slot('reviews', reviewsInner(b[1])); slot('contact', contactInner(d, b[2], s));
          return d;
        });
      });
    });
  }
  window.WMATP = { render: render, doc: doc, manifest: manifest };
})();
