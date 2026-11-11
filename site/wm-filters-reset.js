/* wm-filters-reset.js
   MT t2188: on every full page load, clear list-filter state so chips/search/sort/per-page
   start at defaults. Non-filter prefs are left alone (theme, Depart/Land, My minimums,
   aircraft/licence, login, nav pill, weather caches).
   MT follow-up: keep ICAO/All (wm-count) and hide helipads (wm-heli-hide); Per page still resets.
   Load this in <head> before any filter module (fv3, wmf, wq, wds) restores storage. */
(function () {
  'use strict';
  var LS = [
    'wm-flt-state',
    'wm-fv3',
    'wm-fv3-sort',
    'wm-perpage',
    'wds-pp-ato',
    'wds-pp-dfe'
  ];
  var SS = [
    'wds-mf',
    'wmf-dfe',
    'wq-prov',
    'wq-city',
    'wq-q',
    'wmx:ato',
    'wmx:dfe'
  ];
  /* Kept on purpose (do not add here):
     wm-theme, wm-pal, wm-pal-day,
     wm.phaseMode,
     wm-limits, wm-ac, wm-lvl, wm-night, wm-rules,
     wm-count (ICAO/All), wm-heli-hide (hide helipads),
     wm-flt-opt (filter UI variant A/B, not a selection),
     wmPillPrev, wmLW, wm-sid, wm-ops*, wm-rv*, wm-pin*, wm-fs-wx, wm-da, wm-routes, wm-xw */
  var LS_PREFIX = ['wds-pp-'];
  var SS_PREFIX = ['wmx:'];

  function wipe(store, exact, prefixes) {
    if (!store) return;
    var kill = exact.slice(), seen = Object.create(null), i, k, p, n;
    try {
      n = store.length;
      for (i = 0; i < n; i++) {
        k = store.key(i);
        if (!k) continue;
        for (p = 0; p < prefixes.length; p++) {
          if (k.indexOf(prefixes[p]) === 0) { kill.push(k); break; }
        }
      }
    } catch (e) {}
    for (i = 0; i < kill.length; i++) {
      k = kill[i];
      if (seen[k]) continue;
      seen[k] = 1;
      try { store.removeItem(k); } catch (e) {}
    }
  }

  try { wipe(localStorage, LS, LS_PREFIX); } catch (e) {}
  try { wipe(sessionStorage, SS, SS_PREFIX); } catch (e) {}

  /* Drop filter-only query keys; keep theme, tab, flt (UI variant), auth, etc. */
  try {
    var u = new URL(location.href), drop = ['q', 'prov', 'province', 'city', 'chips', 'filter', 'sort'];
    var changed = 0, d;
    for (d = 0; d < drop.length; d++) {
      if (u.searchParams.has(drop[d])) { u.searchParams.delete(drop[d]); changed = 1; }
    }
    if (changed) history.replaceState(null, '', u.pathname + u.search + u.hash);
  } catch (e) {}

  window.WM_FILTERS_RESET = {
    ls: LS.slice(),
    ss: SS.slice(),
    lsPrefix: LS_PREFIX.slice(),
    ssPrefix: SS_PREFIX.slice()
  };
})();
