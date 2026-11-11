# ga-core-v2-wire.js — proposed fixes (NOT run, NOT applied)

No browser or DOM in my sandbox, and I could not pull the 34 KB wire file in as a real file, so these are written as exact edits to make by hand and test in a browser. Nothing here touches wm-core.js, wst-engine.js, gate.ts, appdata/, auth or wm-shell.*.

## 1. Parse the model copies once, not once per card  (top outage suspect)
`readNowCopy()` and `readMwCopy()` JSON.parse the localStorage copies and `readNowCopy()` rebuilds a column array for EVERY aerodrome. `modelFromMwCopy(a)` calls both, and it runs for every card via `weatherFrom` -> `pickFreshestModel`. `applyS()` evaluates ~640 cards, so one pass = ~640 x (2 parses + a full rebuild). Add:

    var COPY_MEMO = {};
    function memoCopy(key, build) {
      var t = Date.now(), m = COPY_MEMO[key], raw = null;
      if (m && t - m.at < 5000) return m.val;
      try { raw = localStorage.getItem(key); } catch (e) {}
      if (m && m.raw === raw) { m.at = t; return m.val; }
      var val = null;
      if (raw) { try { val = build(raw); } catch (e) { val = null; } }
      COPY_MEMO[key] = { at: t, raw: raw, val: val };
      return val;
    }

Then `readMwCopy = function(){ return memoCopy('wm.mw.v2', function(raw){ var d = JSON.parse(raw); return (d && d.pts && d.v && d.time) ? d : null; }); }` and move the body of `readNowCopy` into `memoCopy('wm.now.v1', function(raw){ var n = JSON.parse(raw); ... })`.

## 2. Model copy past its valid hours returns all-null values
In `readNowCopy`, `HH = n.fzlHours || 5` hours are listed but values only exist for `NH = n.hours || 2`; later hours are `null`. `modelFromCopy` picks the last hour <= now, so from t0 + NH hours the row is all null, still "fresh" by composedAt, and can beat a good `wm.mw.v2` row in `modelFromMwCopy`. Fix: add `nh: NH` to the object `readNowCopy` returns, and in `modelFromCopy` after the hour loop:

    if (d.nh != null && h > d.nh - 1) h = d.nh - 1;   // never read past the filled hours
    ...
    var any = false; for (var q in cur) if (q !== 'time' && q !== 'fetchedAt' && cur[q] != null) any = true;
    if (!any) return null;

(The engine in 2.1.0 also treats an all-null model row as no model.)

## 3. `fetchLiveOfficial` can never recover from a hung request
`LIVE.pending = true` is only cleared when both fetches settle. No timeout, so one hung `/api/metar` or `/api/taf` leaves `pending` true forever: every later call returns on the first line and `wxFetchPending()` stays true. Add a watchdog:

    var wd = setTimeout(function () { LIVE.pending = false; }, 20000);
    // and clearTimeout(wd) in both final handlers

and wrap the two fetches with `AbortController` (15 s).

## 4. Stop re-evaluating 640 cards every 500 ms
`watchListPages` runs `rerunCards()` every 500 ms for up to 40 tries until a model copy exists. If `wm.now.v1` / `wm.mw.v2` never arrive (worker slow or failing) that is 40 full passes in 20 s. Replace the poll with: run once, then again only when the stored copy's length changes, max 6 tries.

## 5. Small items
- `runAdPage`: `adFromPage()` and `icOf` are outside the try/catch, and `fetchLiveOfficial(done)` calls `done` inside a promise handler, so a throw there is an unhandled rejection. Move them inside the try.
- `new MutationObserver(...)` on `#s-wx` calls `runAdPage`, which rewrites `#vs` / `#vw`. If `#verd` sits inside `#s-wx` this can loop at timer speed. Confirm in the DOM; if so, skip the repaint when text and `data-s` are unchanged.
