/*! card-motion.js - one expand/collapse for .c.wx weather cards and details.c school cards.
 *
 * Rules: layout snaps, only the card body animates (opacity + small translateY),
 * the tapped card's top stays fixed on screen, no smooth scrolling, no filters.
 *
 * Feature flag (one line in app.html, before this script and before wx-motion.js):
 *   <script>window.WM_CARD_MOTION_V2 = true;</script>     // new behaviour
 *   <script>window.WM_CARD_MOTION_V2 = false;</script>    // old behaviour back
 * wx-motion.js must start with: if (window.WM_CARD_MOTION_V2 === true) return;
 *
 * Wingman wiring (31 Oct 2026, verified against c/app.html): the weather card body is .wx-body (as guessed),
 * the open class is 'open' (not 'is-open'), the toggle is the .wx-head button. c/app.html's own toggle(c)
 * builds the body lazily and calls window.WXMotion.toggle(card, fill); this file provides that WXMotion when
 * the flag is on, so taps on .wx-head are NOT handled here a second time (CFG.wx.delegate=false).
 * --cm-top-inset is set at runtime to the height of the pinned top bar (.wmtop 59px standalone, or the
 * shell's bar when the page sits in the Wingman shell's non-scrolling iframe, where the parent scrolls).
 */
(function (root) {
  'use strict';

  var CFG = {
    maxOpen: 3,
    openMs: 280,                       // open 240-320
    closeMs: 210,                      // close 180-240
    ease: 'cubic-bezier(.32,.72,0,1)',
    rise: 8,                           // px, opening translateY; closing uses half
    wx: {
      card: '.c.wx',
      body: '.wx-body',                // verified: c/app.html atoCard/dfeCard
      openClass: 'open',               // verified: c/app.html toggle() and wx-motion.js use 'open'
      toggle: '.wx-head',              // verified: the card header button
      delegate: false                  // c/app.html already listens and calls WXMotion.toggle
    },
    details: { card: 'details.c', toggle: 'summary' }
  };

  /* ---------- pure core (unit-tested in node) ---------- */

  // Open card ids, oldest first. add() returns the ids that must be closed quietly.
  function createOpenSet(max) {
    var s = new Set();
    return {
      has: function (id) { return s.has(id); },
      add: function (id) {
        s.delete(id);
        var evicted = [];
        while (s.size >= max) {
          var oldest = s.values().next().value;
          s.delete(oldest);
          evicted.push(oldest);
        }
        s.add(id);
        return evicted;
      },
      delete: function (id) { return s.delete(id); },
      prune: function (keep) { Array.from(s).forEach(function (id) { if (!keep(id)) s.delete(id); }); },
      list: function () { return Array.from(s); },
      get size() { return s.size; }
    };
  }

  // Only opacity and transform, ever. Reduced motion: opacity only.
  function keyframes(dir, reduce, rise, fromOpacity) {
    if (dir === 'in') {
      var from = reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(' + rise + 'px)' };
      if (fromOpacity != null && !isNaN(fromOpacity)) from.opacity = fromOpacity;
      return [from, reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0)' }];
    }
    return [
      reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0)' },
      reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(' + rise / 2 + 'px)' }
    ];
  }

  function scrollDelta(beforeTop, afterTop) { return afterTop - beforeTop; }

  function fullyOffscreen(rect, viewTop, viewBottom) {
    return rect.bottom <= viewTop || rect.top >= viewBottom;
  }

  var core = {
    createOpenSet: createOpenSet,
    keyframes: keyframes,
    scrollDelta: scrollDelta,
    fullyOffscreen: fullyOffscreen,
    CFG: CFG
  };
  if (typeof module === 'object' && module.exports) module.exports = core;

  /* ---------- browser part ---------- */

  if (typeof window === 'undefined' || root.WM_CARD_MOTION_V2 !== true) return;
  var doc = root.document;
  var html = doc.documentElement;
  if (html.classList.contains('cm-on')) return;          // loaded twice
  html.classList.add('cm-on');

  var WX = CFG.wx;
  var style = doc.createElement('style');
  style.textContent =
    'html.cm-on ' + WX.card + ':not(.' + WX.openClass + ') ' + WX.body + '{display:none!important}' +
    'html.cm-on ' + WX.card + ' ' + WX.body + '{transition:none!important}' +
    'html.cm-on ' + WX.card + '.' + WX.openClass + ' ' + WX.body + '{grid-template-rows:1fr!important;opacity:1!important}' +
    'html.cm-on ' + WX.card + ',html.cm-on ' + CFG.details.card + '{scroll-margin-top:var(--cm-top-inset,72px)}' +
    'html.cm-on ' + CFG.details.card + '>summary{touch-action:manipulation}';
  doc.head.appendChild(style);

  var openSet = createOpenSet(CFG.maxOpen);
  var registry = new Map();             // id -> card element
  var ids = new WeakMap();
  var states = new WeakMap();           // card -> { token, anims, els, closing }
  var seq = 0;

  function idOf(card) {
    var id = ids.get(card);
    if (!id) {
      id = card.id || card.getAttribute('data-card-id') || 'cm' + (++seq);
      ids.set(card, id);
    }
    registry.set(id, card);
    return id;
  }

  function st(card) {
    var s = states.get(card);
    if (!s) { s = { token: 0, anims: [], els: [], closing: false }; states.set(card, s); }
    return s;
  }

  var ops = {
    details: {
      isOpen: function (c) { return c.open; },
      setOpen: function (c, v) { c.open = !!v; },
      bodies: function (c) {
        return Array.prototype.filter.call(c.children, function (e) { return e.tagName !== 'SUMMARY'; });
      }
    },
    wx: {
      isOpen: function (c) { return c.classList.contains(WX.openClass); },
      setOpen: function (c, v) {
        c.classList.toggle(WX.openClass, !!v);
        var h = c.querySelector(WX.toggle);
        if (h) h.setAttribute('aria-expanded', String(!!v));
      },
      bodies: function (c) { return Array.prototype.slice.call(c.querySelectorAll(WX.body)); }
    }
  };
  function kindOf(card) { return card.tagName === 'DETAILS' ? 'details' : 'wx'; }
  function logicallyOpen(card) { return ops[kindOf(card)].isOpen(card) && !st(card).closing; }

  /* ----- animation: opacity + translateY on the body only ----- */

  function stop(card) {
    var s = st(card);
    s.token++;
    s.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* already gone */ } });
    s.els.forEach(function (e) { e.style.willChange = ''; });
    s.anims = [];
    s.els = [];
  }

  function play(card, dir, done) {
    var s = st(card);
    var from = null;
    if (dir === 'in' && s.els.length) from = parseFloat(root.getComputedStyle(s.els[0]).opacity);
    stop(card);

    var els = ops[kindOf(card)].bodies(card);
    if (!els.length || typeof Element.prototype.animate !== 'function') { done(); return; }

    var reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var token = s.token;
    s.els = els;
    s.anims = els.map(function (el) {
      el.style.willChange = reduce ? 'opacity' : 'opacity, transform';
      return el.animate(keyframes(dir, reduce, CFG.rise, from), {
        duration: dir === 'in' ? CFG.openMs : CFG.closeMs,
        easing: CFG.ease,
        fill: dir === 'in' ? 'backwards' : 'forwards'
      });
    });
    Promise.all(s.anims.map(function (a) { return a.finished; })).then(function () {
      if (s.token === token) done();
    }, function () { /* cancelled: a newer animation owns the card */ });
  }

  /* ----- scroll anchoring: keep the tapped card's top where it was ----- */

  function parentScroller() {
    try {
      var fe = root.frameElement, se = doc.scrollingElement || html;
      if (fe && se.scrollHeight <= se.clientHeight + 1) return fe.ownerDocument.scrollingElement;
    } catch (e) { /* cross-origin parent */ }
    return null;
  }
  function scrollerOf(card) {
    for (var p = card.parentElement; p && p !== doc.body && p !== html; p = p.parentElement) {
      var oy = root.getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    }
    return parentScroller() || doc.scrollingElement || html;
  }

  function jump(sc, delta) {
    try { sc.scrollBy({ top: delta, behavior: 'instant' }); }
    catch (e) { sc.scrollTop += delta; }
  }

  function withFixedTop(card, mutate) {
    var sc = scrollerOf(card);
    var holder = sc === doc.scrollingElement ? html : sc.ownerDocument !== doc && sc === sc.ownerDocument.scrollingElement ? sc.ownerDocument.documentElement : sc;
    var before = card.getBoundingClientRect().top;
    holder.style.overflowAnchor = 'none';                 // we do the anchoring, not the browser
    mutate();
    var delta = scrollDelta(before, card.getBoundingClientRect().top);
    if (delta) jump(sc, delta);
    root.requestAnimationFrame(function () { holder.style.overflowAnchor = ''; });
  }

  function ensureVisible(card) {
    var sc = scrollerOf(card);
    var top = 0, bottom = root.innerHeight, r = card.getBoundingClientRect();
    if (sc.ownerDocument !== doc) {                        // framed: compare in the parent's viewport
      var fr = root.frameElement.getBoundingClientRect();
      r = { top: r.top + fr.top, bottom: r.bottom + fr.top };
      bottom = sc.ownerDocument.defaultView.innerHeight;
    } else if (sc !== doc.scrollingElement) { var vr = sc.getBoundingClientRect(); top = vr.top; bottom = vr.bottom; }
    if (!fullyOffscreen(r, top, bottom)) return;
    try { card.scrollIntoView({ block: 'start', behavior: 'instant' }); }
    catch (e) { card.scrollIntoView(); }
  }

  /* ----- open / close ----- */

  // Used for eviction: no animation, no scroll correction of its own.
  function quietClose(card) {
    var s = st(card);
    stop(card);
    s.closing = false;
    ops[kindOf(card)].setOpen(card, false);
  }

  function prune() {
    openSet.prune(function (id) {
      var c = registry.get(id);
      if (c && c.isConnected) return true;
      registry.delete(id);
      return false;
    });
  }

  function openCard(card) {
    var id = idOf(card);
    prune();
    st(card).closing = false;
    var evicted = openSet.add(id);
    withFixedTop(card, function () {
      evicted.forEach(function (eid) {
        var c = registry.get(eid);
        if (c && c !== card && c.isConnected) quietClose(c);
      });
      ops[kindOf(card)].setOpen(card, true);              // layout snaps here
    });
    play(card, 'in', function () { stop(card); });
    ensureVisible(card);
  }

  function closeCard(card) {
    var s = st(card);
    openSet.delete(idOf(card));
    s.closing = true;
    play(card, 'out', function () {                       // fade first, then one layout snap
      s.closing = false;
      withFixedTop(card, function () { ops[kindOf(card)].setOpen(card, false); });
      stop(card);
    });
  }

  function toggle(card) { if (logicallyOpen(card)) closeCard(card); else openCard(card); }

  function closeAll() { openSet.list().forEach(function (id) { var c = registry.get(id); if (c) closeCard(c); }); }

  /* ----- events (delegated, so lazily rendered cards just work) ----- */

  function interactive(target, boundary) {
    var el = target.closest('a,button,input,select,textarea,label,[data-no-toggle]');
    return !!el && el !== boundary && boundary.contains(el);
  }

  function findCard(target) {
    if (!target || !target.closest) return null;
    var d = target.closest(CFG.details.card);
    if (d) {
      var sum = target.closest(CFG.details.toggle);
      if (sum && sum.parentNode === d && !interactive(target, sum)) return d;
      return null;
    }
    var w = target.closest(WX.card);
    if (!w || WX.delegate === false) return null;
    if (WX.toggle) {
      var t = target.closest(WX.toggle);
      if (!t || !w.contains(t)) return null;
    } else {
      var b = target.closest(WX.body);
      if (b && w.contains(b)) return null;
    }
    return interactive(target, w) ? null : w;
  }

  doc.addEventListener('click', function (e) {
    if (e.button > 0) return;
    var card = findCard(e.target);
    if (!card) return;
    if (kindOf(card) === 'details') e.preventDefault();   // stop the native instant toggle
    toggle(card);
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (!t.matches || !t.matches(WX.card)) return;
    if (!t.hasAttribute('tabindex') && t.getAttribute('role') !== 'button') return;
    e.preventDefault();
    toggle(t);
  });

  // Something else opened/closed a <details> (search, anchor link): keep the set honest.
  doc.addEventListener('toggle', function (e) {
    var c = e.target;
    if (!c || !c.matches || !c.matches(CFG.details.card) || st(c).closing) return;
    var id = idOf(c);
    if (c.open) {
      if (!openSet.has(id)) openSet.add(id).forEach(function (eid) {
        var o = registry.get(eid);
        if (o && o !== c) quietClose(o);
      });
    } else {
      openSet.delete(id);
    }
  }, true);

  /* --cm-top-inset = height of the pinned top bar, so a card scrolled into view lands below it */
  function topInset() {
    var h = 0;
    function bars(d) {
      Array.prototype.forEach.call(d.querySelectorAll('.wmtop, header.topbar'), function (e) {
        var cs = d.defaultView.getComputedStyle(e);
        if ((cs.position === 'sticky' || cs.position === 'fixed') && cs.display !== 'none') h = Math.max(h, e.getBoundingClientRect().height);
      });
    }
    bars(doc);
    try { if (root.frameElement) bars(root.frameElement.ownerDocument); } catch (e) { /* cross-origin */ }
    html.style.setProperty('--cm-top-inset', Math.round(h || 72) + 'px');
  }
  root.addEventListener('resize', topInset);

  function seed() {
    topInset();
    doc.querySelectorAll(CFG.details.card + '[open], ' + WX.card + '.' + WX.openClass).forEach(function (c) {
      openSet.add(idOf(c));
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', seed); else seed();

  // c/app.html's toggle(c) calls WXMotion.toggle(card, fill); fill() builds the body on first open.
  root.WXMotion = {
    toggle: function (card, fill) {
      if (!logicallyOpen(card) && typeof fill === 'function') fill();
      toggle(card);
    }
  };

  root.WMCardMotion = {
    toggle: toggle,
    open: openCard,
    close: closeCard,
    closeAll: closeAll,
    openIds: function () { return openSet.list(); },
    config: CFG
  };
})(typeof window !== 'undefined' ? window : globalThis);
