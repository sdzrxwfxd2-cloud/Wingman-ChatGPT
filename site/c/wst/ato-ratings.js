// USERBASE: needs database - per-school category averages come from the reviews table (hidden under 3 ratings)
/* ATO ratings box (MT t1541): overall star average plus the average for each category, for the navy school page (PR #218, ?rv=1).
   Pure averaging in summarize(); box() returns HTML only. Works in the browser (window.WMAtoRatings) and in Node (module.exports).
   Rules (blueprint defamation plan): a category or the overall average is hidden until it has at least 3 reviews (MIN).
   Five categories for every school (MT t1551): inst, book, acft, ground, value. Old reviews that used 'admin' count as 'book' (backward compatible). */
(function (root) {
  var MIN = 3;
  var CATS = [['inst', 'Instructors'], ['book', 'Booking'], ['acft', 'Aircraft'], ['ground', 'Ground school'], ['value', 'Value for money']];
  var ALIAS = { book: 'admin' };
  var cv = function (c, k) { if (!c) return; var v = c[k]; return v == null && ALIAS[k] ? c[ALIAS[k]] : v };
  var r1 = function (x) { return Math.round(x * 10 + 1e-9) / 10 };
  var ok = function (v) { return typeof v === 'number' && isFinite(v) && v >= 1 && v <= 5 };

  function summarize(reviews, opt) {
    opt = opt || {}; var min = opt.min == null ? MIN : opt.min, cats = opt.cats || CATS;
    var list = (reviews || []).filter(function (r) { return r && ok(r.stars) });
    var n = list.length, sum = list.reduce(function (a, r) { return a + r.stars }, 0);
    return {
      count: n,
      overall: { avg: n ? r1(sum / n) : null, count: n, shown: n >= min },
      cats: cats.map(function (c) {
        var v = list.map(function (r) { return cv(r.cats, c[0]) }).filter(ok);
        var avg = v.length ? r1(v.reduce(function (a, x) { return a + x }, 0) / v.length) : null;
        return { key: c[0], label: c[1], avg: avg, count: v.length, shown: v.length >= min };
      })
    };
  }

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) };
  function stars(avg) { var r = Math.round(avg || 0); return '<span class="ar-st">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= r ? 'on' : '') + '">' + STAR + '</i>' }).join('') + '</span>' }

  function box(s, opt) {
    opt = opt || {}; var min = opt.min == null ? MIN : opt.min;
    var head = s.overall.shown
      ? '<div class="ar-top"><span class="ar-n">' + s.overall.avg.toFixed(1) + '</span><span class="ar-tr">' + stars(s.overall.avg) + '<span class="ar-c">' + s.count + ' reviews</span></span></div>'
      : '<div class="ar-top ar-wait"><span class="ar-c">' + (s.count ? s.count + ' of ' + min + ' reviews needed before scores show' : 'No reviews yet') + '</span></div>';
    var rows = s.cats.map(function (c) {
      return '<div class="ar-row' + (c.shown ? '' : ' ar-off') + '"><span class="ar-l">' + esc(c.label) + '</span>' +
        '<span class="ar-bar"><i style="width:' + (c.shown ? (c.avg / 5 * 100).toFixed(1) : 0) + '%"></i></span>' +
        '<b class="ar-v">' + (c.shown ? c.avg.toFixed(1) : '-') + '</b></div>';
    }).join('');
    return '<div class="ar-box" role="group" aria-label="Pilot ratings">' + (opt.label ? '<p class="ar-ex">' + esc(opt.label) + '</p>' : '') + head + rows +
      '<p class="ar-note">Pilot opinions, not an official SACAA rating. Shown after ' + min + ' reviews.</p></div>';
  }

  var api = { MIN: MIN, CATS: CATS, ALIAS: ALIAS, summarize: summarize, box: box };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WMAtoRatings = api;
})(typeof window !== 'undefined' ? window : this);
