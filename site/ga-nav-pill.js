/* Go Around - phone nav pill: zoom-out into one glass orb on the 6th slot,
   expands back quickly on scroll up / tap (interruptible). Additive file; does NOT edit wm-shell.js.
   Phone only (max-width:767px). WAAPI on transform + opacity only.
   v3: (1) glass blur lives on its own always-on layer (.gnp-bg) + the orb glass, which fade with
   their OWN opacity only, so the background is fully formed from the first frame of a morph;
   (2) the orb always sits on the 6th slot place (right end of the 6-slot pill), whichever tab is on. */
(function () {
  'use strict';
  if (window.__gaNavPill2) return;
  window.__gaNavPill2 = 1;

  /* ---------- Timing (ms) / easing / scale - the whole "feel" lives here ---------- */
  var T = {
    /* COLLAPSE (scroll down) - zoom-out, ~470ms end to end (unchanged) */
    iconOut: 240,        /* each icon slides into the 6th slot + shrinks + fades     */
    iconOutStagger: 24,  /* left-most icon leaves first, 24ms apart                 */
    shellOut: 300,       /* pill body zooms out toward the 6th slot and fades       */
    shellOutDelay: 70,
    orbIn: 340,          /* orb blooms in with a small overshoot                    */
    orbInDelay: 130,
    /* EXPAND (scroll up / tap) - solid and quick, ~290ms end to end */
    orbOut: 110,         /* orb dissolves into the pill (starts at 0ms)             */
    shellIn: 240,        /* pill body grows out from the 6th slot (starts at 0ms)   */
    shellInDelay: 0,
    iconIn: 220,         /* each icon settles into place                            */
    iconInDelay: 20,     /* first icon starts 20ms in                               */
    iconInStagger: 10    /* nearest the 6th slot first, 10ms apart                  */
  };
  var EASE = {
    out:    'cubic-bezier(.22,1,.36,1)',   /* soft settle (collapse orb)            */
    inOut:  'cubic-bezier(.4,0,.2,1)',     /* smooth zoom-out (collapse pill)       */
    accel:  'cubic-bezier(.55,0,.8,.25)',  /* things leaving                        */
    solid:  'cubic-bezier(.2,.9,.3,1)'     /* expand: fast start, firm stop, no bounce */
  };
  var S = {
    shellMin: 0.62,   /* pill body scale at the end of the zoom-out              */
    iconMin: 0.35,    /* icon scale when sucked into the slot (collapse)          */
    orbFrom: 0.40,    /* orb starts this small (collapse)                         */
    orbOver: 1.08,    /* orb overshoot (collapse)                                 */
    orbPop: 1.04,     /* orb swell as it hands back to the pill (expand)          */
    shellFrom: 0.86,  /* pill starts this size on expand                          */
    shellOver: 1.006, /* expand overshoot: 1.0 = none, keep <= 1.01               */
    iconFrom: 0.6     /* icon scale at the start of expand                        */
  };
  var HYST_DOWN = 12; /* px of downward travel before collapsing                 */
  var HYST_UP = 4;    /* px of upward travel before expanding (near-instant)     */
  var TOP_Y = 24;     /* always open near the top                                */

  var phoneMq = matchMedia('(max-width: 767px)');
  var rmMq = matchMedia('(prefers-reduced-motion: reduce)');

  function overlayOpen() {
    if (document.querySelector('.sheet.on, .sheet.mp.on, .sheet.glass.on, .fs-spot.on, .ipop.on, .wm-tcard.on, .wx-menu.on, .wds-sm.on, .sug.on')) return true;
    if (document.querySelector('.wmf[data-s="open"], .wmf-sh[data-s="open"]')) return true;
    if (document.querySelector('.wflt-b[aria-expanded="true"], .wflt [aria-expanded="true"]')) return true;
    try { if (window.W && typeof W.isOpen === 'function' && W.isOpen()) return true; } catch (e) {}
    return false;
  }
  function keyboardUp() {
    var a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return true;
    var vv = window.visualViewport;
    return !!(vv && vv.height < window.innerHeight - 120);
  }

  function ready(fn) {
    var n = 0;
    (function tick() {
      var dock = document.getElementById('wmC');
      var pill = dock && dock.querySelector('.wcpill');
      if (pill && pill.querySelector('.wctab')) return fn(dock, pill);
      if (++n < 200) setTimeout(tick, 50);
    })();
  }

  ready(function (dock, pill) {
    /* ---------- layers (siblings of .wcpill on #wmC) ---------- */
    var ghost = null;
    var orb = document.createElement('button');
    orb.type = 'button';
    orb.className = 'gnp-orb';
    orb.setAttribute('aria-label', 'Expand navigation');
    orb.tabIndex = -1;
    orb.innerHTML = '<span class="gnp-orb-glass"></span><span class="gnp-orb-kb"></span><span class="gnp-orb-ic"></span>';
    var orbIc = orb.querySelector('.gnp-orb-ic');
    var orbParts = [orb.querySelector('.gnp-orb-glass'), orb.querySelector('.gnp-orb-kb'), orbIc];
    /* glass layer under the ghost: created once, blur always on, hidden at rest (opacity 0) */
    var bg = document.createElement('div');
    bg.className = 'gnp-bg';
    bg.setAttribute('aria-hidden', 'true');
    dock.insertBefore(bg, dock.firstChild);
    dock.appendChild(orb);

    var state = 'open', want = 'open', busy = false, enabled = false;
    var anims = [], lastY = 0, acc = 0, dir = 0, raf = 0, safety = 0;

    function slots() {
      var out = [], all = pill.querySelectorAll('.wctab');
      for (var i = 0; i < all.length; i++) {
        var a = all[i];
        if (a.hidden || a.style.display === 'none') continue;
        if (a.classList.contains('wcx') && !a.classList.contains('in')) continue;
        if (a.getBoundingClientRect().width < 1) continue;
        out.push(a);
      }
      return out;
    }
    function selected() {
      var s = slots();
      for (var i = 0; i < s.length; i++) if (s[i].classList.contains('on')) return s[i];
      return s[0] || null;
    }
    /* Re-clone ONLY when the selected tab really changes (never on every class mutation:
       each re-clone restarts icon animations, which iOS may freeze on frame 0). */
    var orbKey = '';
    function syncOrbIcon(force) {
      var t = selected();
      var key = t ? (t.getAttribute('data-n') || '') : '';
      if (!force && key === orbKey && orbIc.firstChild) return;
      orbKey = key;
      orbIc.innerHTML = '';
      if (!t) return;
      var svg = t.querySelector('svg');
      if (!svg) return;
      /* wrapper keeps the shell's '.wctab svg ...' icon styles; svg keeps its own classes (e.g. .wx) */
      var w = document.createElement('span');
      w.className = 'wctab on';
      w.setAttribute('aria-hidden', 'true');
      w.appendChild(svg.cloneNode(true));
      orbIc.appendChild(w);
    }

    /* Width of the pill when it shows all 6 slots. The shell centres the pill and caps it at
       max(160, viewport - 32). Measured for real whenever 6 slots are showing; else the cap. */
    var w6 = 0, w6vw = 0;
    function sixWidth(pr) {
      var vw = window.innerWidth, cap = Math.max(160, vw - 32);
      if (w6vw !== vw) { w6 = 0; w6vw = vw; }
      if (slots().length >= 6) w6 = pr.width;
      return Math.max(pr.width, Math.min(cap, w6 || cap));
    }
    /* Place orb + ghost from live geometry (layout writes only at rest, never animated). */
    function geometry() {
      var dr = dock.getBoundingClientRect(), pr = pill.getBoundingClientRect();
      /* The orb ALWAYS takes the 6th slot's place = the right end of the 6-slot pill
         (same spot for tab 1..6; a 5-slot pill is narrower, so its own right end is NOT used). */
      var size = Math.round(pr.height) || 64;
      var mid = pr.left + pr.width / 2;
      var cx = mid + sixWidth(pr) / 2 - size / 2 - dr.left;
      var cy = pr.top + pr.height / 2 - dr.top;
      orb.style.setProperty('--gnp-size', size + 'px');
      /* snap to a whole screen pixel (a 5-slot pill can sit on a half pixel) */
      orb.style.left = (Math.round(cx + dr.left - size / 2) - dr.left) + 'px';
      orb.style.top = (Math.round(cy + dr.top - size / 2) - dr.top) + 'px';
      return { dr: dr, pr: pr, cx: cx, cy: cy, ox: cx - (pr.left - dr.left), size: size };
    }

    function buildGhost(g) {
      if (ghost) ghost.remove();
      ghost = pill.cloneNode(true);
      ghost.classList.add('gnp-ghost');
      ghost.removeAttribute('id');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('inert', '');
      ghost.querySelectorAll('[id]').forEach(function (e) { e.removeAttribute('id'); });
      ghost.querySelectorAll('a').forEach(function (e) { e.removeAttribute('href'); e.tabIndex = -1; });
      ghost.style.left = Math.round(g.pr.left - g.dr.left) + 'px';
      ghost.style.top = Math.round(g.pr.top - g.dr.top) + 'px';
      ghost.style.width = Math.round(g.pr.width) + 'px';
      ghost.style.height = Math.round(g.pr.height) + 'px';
      ghost.style.transformOrigin = g.ox + 'px 50%';
      dock.appendChild(ghost);
      /* glass layer: exact same box + origin as the ghost (no blur toggling, only style box) */
      bg.style.left = ghost.style.left; bg.style.top = ghost.style.top;
      bg.style.width = ghost.style.width; bg.style.height = ghost.style.height;
      bg.style.transformOrigin = ghost.style.transformOrigin;
      return ghost;
    }
    /* icons inside the ghost, with their offset to the 6th-slot centre */
    function ghostIcons(g) {
      var real = slots(), list = [], gt = ghost.querySelectorAll('.wctab');
      var gi = 0;
      for (var i = 0; i < gt.length; i++) {
        var orig = pill.querySelectorAll('.wctab')[i];
        if (real.indexOf(orig) < 0) continue;
        var r = orig.getBoundingClientRect();
        /* keep the tab's own layout transform (the shell positions tabs with transforms) */
        var base = getComputedStyle(orig).transform;
        base = (base && base !== 'none') ? base + ' ' : '';
        var sv = orig.querySelector('svg'), sr = sv ? sv.getBoundingClientRect() : r;
        list.push({ el: gt[i], base: base, dx: (g.cx + g.dr.left) - (sr.left + sr.width / 2), x: r.left });
        gi++;
      }
      list.sort(function (a, b) { return a.x - b.x; });
      return list;
    }

    var target = null;            /* 'closed' | 'open' while animating */
    function stopAll() {
      anims.forEach(function (a) { a.onfinish = null; try { a.cancel(); } catch (e) {} });
      anims = [];
      clearTimeout(safety);
    }
    function run(el, kf, opt) {
      opt.fill = 'both';
      var a = el.animate(kf, opt);
      a.onfinish = check;
      anims.push(a);
      return a;
    }
    /* all animations done (forwards OR reversed) -> rest in the current target */
    function check() {
      for (var i = 0; i < anims.length; i++) if (anims[i].playState !== 'finished') return;
      complete();
    }
    function complete() {
      var t = target; target = null;
      if (t === 'closed') restClosed(); else restOpen();
      settle();
    }
    function arm(ms) { clearTimeout(safety); safety = setTimeout(function () { if (busy) complete(); }, ms + 200); }

    function resetBg() {
      bg.style.cssText = '';
      bg.style.opacity = '';
      bg.style.transform = '';
    }
    function restOpen() {
      stopAll();
      if (ghost) { ghost.remove(); ghost = null; }
      resetBg();
      dock.classList.remove('gnp-morph', 'gnp-collapsed');
      orb.style.opacity = ''; orb.tabIndex = -1;
      state = 'open'; busy = false; target = null;
    }
    function restClosed() {
      stopAll();
      if (ghost) { ghost.remove(); ghost = null; }
      resetBg();
      dock.classList.remove('gnp-morph');
      dock.classList.add('gnp-collapsed');
      orb.style.opacity = ''; orb.tabIndex = 0;
      state = 'closed'; busy = false; target = null;
    }
    function settle() {           /* after any animation: follow the latest wish */
      if (want !== state) go(want);
    }
    /* direction flipped mid-animation: play everything backwards from where it is now */
    function flip() {
      target = target === 'closed' ? 'open' : 'closed';
      anims.forEach(function (a) { try { a.reverse(); } catch (e) {} });
      arm(600);
    }

    function collapse() {
      if (state === 'closed' || busy) return;
      if (overlayOpen()) return;
      busy = true; target = 'closed';
      syncOrbIcon(true);
      var g = geometry();
      if (rmMq.matches) { restClosed(); return settle(); }
      buildGhost(g);
      dock.classList.add('gnp-morph');
      ghost.style.opacity = '1';

      var icons = ghostIcons(g);
      icons.forEach(function (ic, i) {
        run(ic.el, [
          { transform: ic.base + 'translate3d(0,0,0) scale(1)', opacity: 1 },
          { transform: ic.base + 'translate3d(' + ic.dx + 'px,0,0) scale(' + S.iconMin + ')', opacity: 0 }
        ], { duration: T.iconOut, delay: i * T.iconOutStagger, easing: EASE.accel });
      });
      var shellKf = [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(.97)', opacity: 1, offset: .25 },
        { transform: 'scale(' + S.shellMin + ')', opacity: 0 }
      ], shellOpt = { duration: T.shellOut, delay: T.shellOutDelay, easing: EASE.inOut };
      run(ghost, shellKf, shellOpt);
      run(bg, shellKf, { duration: shellOpt.duration, delay: shellOpt.delay, easing: shellOpt.easing });
      var orbOpt = { duration: T.orbIn, delay: T.orbInDelay, easing: EASE.out };
      run(orb, [
        { transform: 'scale(' + S.orbFrom + ')' },
        { transform: 'scale(' + S.orbOver + ')', offset: .62 },
        { transform: 'scale(1)' }
      ], { duration: orbOpt.duration, delay: orbOpt.delay, easing: orbOpt.easing });
      orbParts.forEach(function (el) {
        run(el, [{ opacity: 0 }, { opacity: 1, offset: .62 }, { opacity: 1 }],
          { duration: orbOpt.duration, delay: orbOpt.delay, easing: orbOpt.easing });
      });
      arm(T.orbInDelay + T.orbIn);
    }

    function expand() {
      if (state === 'open' || busy) return;
      busy = true; target = 'open';
      var g = geometry();
      if (rmMq.matches) { restOpen(); return settle(); }
      buildGhost(g);
      dock.classList.remove('gnp-collapsed');
      dock.classList.add('gnp-morph');
      ghost.style.opacity = '0';
      orb.style.opacity = '1';

      /* orb box: transform only; its glass/knob/icon fade with their own opacity (blur kept) */
      run(orb, [
        { transform: 'scale(1)' },
        { transform: 'scale(' + S.orbPop + ')' }
      ], { duration: T.orbOut, easing: EASE.solid });
      orbParts.forEach(function (el) {
        run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: T.orbOut, easing: EASE.solid });
      });
      /* Same motion as before (scale .86 -> 1.006 -> 1 from the 6th slot). The glass layer
         is fully opaque from frame 0 (transform only) so the background is never see-through.
         Icons / rim on the ghost still fade in; that fade no longer takes the blur with it. */
      var sAt = S.shellFrom + (S.shellOver - S.shellFrom) * (0.25 / 0.7);
      var growOpt = { duration: T.shellIn, delay: T.shellInDelay, easing: EASE.solid };
      run(ghost, [
        { transform: 'scale(' + S.shellFrom + ')', opacity: 0 },
        { transform: 'scale(' + sAt.toFixed(4) + ')', opacity: 1, offset: .25 },
        { transform: 'scale(' + S.shellOver + ')', opacity: 1, offset: .7 },
        { transform: 'scale(1)', opacity: 1 }
      ], growOpt);
      run(bg, [
        { transform: 'scale(' + S.shellFrom + ')', opacity: 1 },
        { transform: 'scale(' + S.shellOver + ')', opacity: 1, offset: .7 },
        { transform: 'scale(1)', opacity: 1 }
      ], growOpt);

      var icons = ghostIcons(g).reverse(), end = T.shellInDelay + T.shellIn;
      icons.forEach(function (ic, i) {
        var d = T.iconInDelay + i * T.iconInStagger;
        run(ic.el, [
          { transform: ic.base + 'translate3d(' + (ic.dx * 0.5) + 'px,0,0) scale(' + S.iconFrom + ')', opacity: 0 },
          { transform: ic.base + 'translate3d(0,0,0) scale(1)', opacity: 1 }
        ], { duration: T.iconIn, delay: d, easing: EASE.solid });
        end = Math.max(end, d + T.iconIn);
      });
      arm(end);
    }

    function go(s) {
      want = s;
      if (!enabled) return;
      if (busy) { if (target && target !== s) flip(); return; }
      if (s === 'closed') collapse(); else expand();
    }

    orb.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); acc = 0; go('open'); });

    /* ---------- scroll: rAF + hysteresis + rubber-band + keyboard guards ---------- */
    function onY(y, max) {
      if (!enabled) return;
      if (y < 0 || (max > 0 && y > max)) return;          /* iOS rubber-band */
      var dy = y - lastY; lastY = y;
      if (!dy) return;
      if (keyboardUp()) { acc = 0; return; }
      if (overlayOpen()) { acc = 0; return go('open'); }
      if (y <= TOP_Y) { acc = 0; return go('open'); }
      var d = dy > 0 ? 1 : -1;
      if (d !== dir) { dir = d; acc = 0; }
      acc += Math.abs(dy);
      if (acc < (d > 0 ? HYST_DOWN : HYST_UP)) return;
      acc = 0;
      go(d > 0 ? 'closed' : 'open');
    }
    function hook(win, doc) {
      var pending = null;
      win.addEventListener('scroll', function () {
        var se = doc.scrollingElement || doc.documentElement;
        pending = [win.scrollY || se.scrollTop || 0, se.scrollHeight - win.innerHeight];
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; if (pending) { onY(pending[0], pending[1]); pending = null; } });
      }, { passive: true });
    }
    hook(window, document);
    function hookFrames() {
      document.querySelectorAll('iframe').forEach(function (f) {
        if (f.__gnp) return;
        try { if (!f.contentWindow || !f.contentDocument) return; f.__gnp = 1; hook(f.contentWindow, f.contentDocument); } catch (e) {}
      });
    }
    setInterval(function () { if (enabled) hookFrames(); }, 1000);

    /* selected tab changes while collapsed -> update orb icon; overlays -> open */
    new MutationObserver(function () {
      if (state === 'closed') syncOrbIcon(false);
      if (enabled && state === 'closed' && overlayOpen()) go('open');
    }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class', 'data-s', 'aria-expanded'] });

    function setEnabled(on) {
      enabled = !!on;
      want = 'open'; acc = 0; dir = 0;
      restOpen();
      if (enabled) { lastY = window.scrollY || 0; hookFrames(); }
    }
    function onMq(e) { setEnabled(e.matches); }
    if (phoneMq.addEventListener) phoneMq.addEventListener('change', onMq); else phoneMq.addListener(onMq);
    window.addEventListener('orientationchange', function () { setEnabled(phoneMq.matches); });
    window.addEventListener('resize', function () { if (state === 'closed' && !busy) geometry(); });
    /* remember the real 6-slot width whenever the 6th slot is showing (open, at rest) */
    setInterval(function () { if (enabled && state === 'open' && !busy) sixWidth(pill.getBoundingClientRect()); }, 1500);
    window.addEventListener('pageshow', function () { setEnabled(phoneMq.matches); });
    setEnabled(phoneMq.matches);

    /* test hooks (safe to keep) */
    window.__gaNavPillApi = {
      collapse: function () { go('closed'); }, expand: function () { go('open'); },
      state: function () { return { state: state, busy: busy, enabled: enabled }; },
      T: T, S: S
    };
  });
})();
