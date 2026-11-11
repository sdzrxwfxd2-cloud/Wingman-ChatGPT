/* ATO stars + Write a review: DESIGN PREVIEW ONLY (MT, 31 Oct 2026).
   Active only with ?stars=1. All ratings are made-up EXAMPLE values derived from the certificate number.
   Nothing is saved or sent; Submit only shows a "preview" confirmation. Live ATO page is unchanged without the flag. */
(function () {
  var on = /[?&]stars=1\b/.test(location.search); try { on = on || /[?&]stars=1\b/.test(top.location.search) } catch (e) {}
  if (!on) return;
  document.documentElement.classList.add('wm-stars');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
  function hash(s) { var h = 2166136261; s = String(s || ''); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  var cache = {};
  function get(t) { var k = t.certificate_number || t.name; if (cache[k]) return cache[k];
    var h = hash(k), c = [0, 1, 2, 3, 4, 5, 7, 9, 12, 14, 18, 23, 27, 31, 38, 46][h % 16], a = Math.round((3 + ((h >>> 8) % 21) / 10) * 10) / 10;
    return cache[k] = { count: c, avg: c ? a : null } }
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>';
  function row(avg) { var s = ''; for (var i = 1; i <= 5; i++) { var f = Math.max(0, Math.min(1, avg - i + 1)); s += '<i style="--f:' + Math.round(f * 100) + '%">' + STAR + '</i>' } return '<span class="st-row" aria-hidden="true">' + s + '</span>' }
  var S = window.WMStars = { mode: '', get: get,
    /* rating: plain stars + average + count, inline right after the ATO name (only with 3+ reviews) */
    inline: function (t) { var r = get(t); return r.count >= 3 ? '<span class="st-in" aria-label="Rated ' + r.avg + ' out of 5 from ' + r.count + ' reviews">' + row(r.avg) + '<b>' + r.avg.toFixed(1) + '</b><span>(' + r.count + ')</span></span>' : '' },
    /* Write a review: an ordinary .wx-pill, same row, size and font as the courses pill. Opens the ATO's own page. */
    pill: function (t) { return '<span class="wx-pill st-write" role="button" tabindex="0" data-stop data-st-k="' + esc(t.certificate_number || '') + '" data-st-n="' + esc(t.name) + '">Write a review</span>' },
    /* Sort by rating: example average, then count; ATOs under 3 reviews always last */
    sort: function (L) { if (!S.mode) return L; var f = S.mode === 'lo' ? -1 : 1;
      return L.slice().sort(function (x, y) { var a = get(x), b = get(y), ax = a.count >= 3, bx = b.count >= 3;
        if (ax !== bx) return ax ? -1 : 1; if (!ax) return b.count - a.count || x.name.localeCompare(y.name);
        return f * (b.avg - a.avg) || b.count - a.count || x.name.localeCompare(y.name) }) },
    /* Review sheet v3 (MT t1779): design B cards, design C stars, gold overall from the 5 categories,
       licence from the profile, optional open text. Design preview: nothing is saved or sent. */
    CATS: ['Instructors', 'Booking', 'Aircraft', 'Ground school', 'Value for money'],
    open: function (k, name) {
      var v = {}, ov = document.createElement('div'); ov.className = 'st-ov';
      var lic = (window.WMProfile && WMProfile.licence) || 'CPL';
      ov.innerHTML = '<div class="st-sh" role="dialog" aria-modal="true" aria-label="Write a review"><div class="st-grab"></div>' +
        '<div class="st-hd"><h4>Write a review</h4><button type="button" class="st-x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><p class="st-to">' + name + '</p>' +
        '<div class="st-ovr"><span class="st-ovn">\u2013</span><span class="st-ovs"></span><span class="st-ovl">Overall, from your ratings</span></div>' +
        S.CATS.map(function (c, ci) { return '<div class="st-c"><div class="st-ct">' + c + '</div><div class="st-pick" role="radiogroup" aria-label="' + c + '">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" role="radio" aria-label="' + c + ' ' + i + ' star' + (i > 1 ? 's' : '') + '" data-c="' + ci + '" data-v="' + i + '">' + STAR + '</button>' }).join('') + '</div></div>' }).join('') +
        '<textarea rows="3" placeholder="Anything else? Write as much as you like (optional)"></textarea>' +
        '<p class="st-lic2"><span>' + esc(lic) + '</span>Licence taken from your profile</p>' +
        '<p class="st-anon">Your review is anonymous. Please be honest and fair, because it affects this ATO\u2019s reputation.</p>' +
        '<button type="button" class="st-go" disabled>Post review</button><p class="st-prev">Design preview \u00b7 nothing is saved or sent</p></div>';
      document.body.appendChild(ov);
      /* The app frame is as tall as its content (the shell window scrolls), so fit the sheet to the part of the frame the pilot can see,
         above the shell tab bar, and tint the shell's own top bar and tab bar too so the whole screen is dimmed. */
      var dimTop = null;
      try { var fe = window.frameElement, P = parent; if (fe && P !== window) { var r = fe.getBoundingClientRect(), nav = P.document.getElementById('wmC'), nr = nav && nav.getBoundingClientRect(), nb = nr && nr.height ? nr.top : P.innerHeight;
        var visTop0 = Math.max(0, -r.top), visBot = Math.min(r.height, nb - r.top - 8);
        ov.classList.add('st-fit'); ov._fit = function () { var h = ov.firstChild.offsetHeight; ov.firstChild.style.marginTop = Math.max(Math.max(visTop0, tbB - r.top) + 8, visBot - h) + 'px' };
        var tbB = 0; [].forEach.call(P.document.querySelectorAll('.topbar, header'), function (e) { var b = e.getBoundingClientRect(); if (b.height && b.top < 10) tbB = Math.max(tbB, Math.min(120, b.bottom)) });
        var S0 = 'position:fixed;left:0;right:0;z-index:2147483646;background:rgba(8,12,28,.62);opacity:0;transition:opacity .26s;';
        dimTop = P.document.createElement('div'); dimTop.className = 'st-topdim';
        dimTop.innerHTML = '<div style="' + S0 + 'top:0;height:' + Math.max(0, r.top, tbB) + 'px"></div><div style="' + S0 + 'top:' + nb + 'px;bottom:0"></div>';
        P.document.body.appendChild(dimTop);
        dimTop.onclick = function () { close() } } } catch (e) { dimTop = null }
      if (ov._fit) ov._fit();
      requestAnimationFrame(function () { ov.classList.add('in'); if (dimTop) [].forEach.call(dimTop.children, function (d) { d.style.opacity = 1 }) });
      var sh = ov.firstChild, go = sh.querySelector('.st-go');
      function upd() { var n = 0, t = 0;
        [].forEach.call(sh.querySelectorAll('.st-pick button'), function (b) { var c = +b.dataset.c, i = +b.dataset.v; b.classList.toggle('on', i <= (v[c] || 0)); b.setAttribute('aria-checked', i === v[c]) });
        for (var c in v) { n++; t += v[c] }
        var o = n ? Math.round(t / n * 10) / 10 : 0;
        sh.querySelector('.st-ovn').textContent = n ? o.toFixed(1) : '\u2013';
        sh.querySelector('.st-ovs').innerHTML = row(o);
        go.disabled = n < S.CATS.length }
      function close() { ov.classList.remove('in'); if (dimTop) [].forEach.call(dimTop.children, function (d) { d.style.opacity = 0 }); setTimeout(function () { ov.remove(); if (dimTop) dimTop.remove() }, 260) }
      ov.addEventListener('click', function (e) { var b = e.target.closest('button');
        if (e.target === ov || (b && b.classList.contains('st-x'))) return close();
        if (!b) return; if (b.dataset.v) v[b.dataset.c] = +b.dataset.v;
        if (b === go && !go.disabled) { sh.innerHTML = '<div class="st-grab"></div><div class="st-done">' + STAR + '<h4>Thanks</h4><p>This is a design preview, so your review was not sent.</p><button type="button" class="st-go">Done</button></div>'; sh.querySelector('.st-go').onclick = close; return }
        upd() });
      upd(); S._sh = sh; S._set = function (a) { a.forEach(function (x, i) { v[i] = x }); upd() } }
  };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.st-write'); if (!b) return; e.preventDefault(); e.stopPropagation(); if (window.WMAtoPage) WMAtoPage.open(b.dataset.stK); else S.page(b.dataset.stK, b.dataset.stN) }, true);
  /* ATO page (ato-pages-py template, c/wst/atp.js) shown in a shell-owned view; the review sheet is offered there */
  var back = null;
  function add(tag, a) { var e = document.createElement(tag); for (var k in a) e[k] = a[k]; document.head.appendChild(e); return e }
  var atpReady = null;
  function atp() { if (atpReady) return atpReady; add('link', { rel: 'stylesheet', href: 'wst/atp.css?v=1' });
    return atpReady = new Promise(function (ok) { add('script', { src: 'wst/atp-config.js?v=1', onload: function () { add('script', { src: 'wst/atp.js?v=1', onload: ok }) } }) }) }
  function shut() { var v = document.getElementById('st-atp'); if (!v) return; v.remove(); document.documentElement.classList.remove('st-atp-on'); if (back != null) scrollTo({ top: back, behavior: 'instant' }); back = null }
  addEventListener('popstate', function () { if (!/[?&]atp=/.test(location.search)) shut() });
  S.page = function (k, name) { back = scrollY; atp().then(function () {
    var v = document.createElement('main'); v.id = 'st-atp'; v.className = 'wrap';
    v.innerHTML = '<button type="button" class="wx-pill st-back">\u2039 ATOs</button><div class="wmad"></div>'; document.body.appendChild(v);
    document.documentElement.classList.add('st-atp-on'); scrollTo({ top: 0, behavior: 'instant' });
    try { history.pushState({ atp: k }, '', location.pathname + location.search.replace(/&atp=[^&]*/, '') + '&atp=' + encodeURIComponent(k) + location.hash) } catch (e) {}
    v.querySelector('.st-back').onclick = function () { history.back() };
    return WMATP.render(v.querySelector('.wmad'), k).then(function () { var r = get({ certificate_number: k, name: name });
      var sc = v.querySelector('[data-atp-slot="rating"]'); if (sc && r.count >= 3) sc.innerHTML = '<div class="atp-n">' + r.avg.toFixed(1) + '</div><div class="atp-r">' + r.count + ' reviews \u00b7 example</div>';
      var b = v.querySelector('.atp-hero .atp-btn'); if (b) b.remove();
      var rs = v.querySelector('[data-atp-slot="reviews"]'); if (rs) { rs.id = 'st-reviews'; var e = rs.querySelector('.atp-empty'); if (e) e.textContent = 'No reviews yet. Be the first pilot to review this ATO.';
        var w = document.createElement('button'); w.type = 'button'; w.className = 'atp-k st-rvh'; w.textContent = 'Write a review'; w.onclick = function () { S.open(k, esc(name)) }; var hd = rs.querySelector('.atp-sec'); (hd || rs).appendChild(w) }
      var nt = v.querySelector('.atp-note'); if (nt) nt.remove() }) }) };
  var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'wst/ato-stars.css?v=3198eb8a'; document.head.appendChild(l);
})();
