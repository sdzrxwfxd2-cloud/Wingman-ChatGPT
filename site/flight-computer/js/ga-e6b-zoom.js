/* E6-B pinch / zoom / pan, one zoom per side (MT t2559).
   Same smooth-gesture technique as the runway 2D fix:
   - pointermove listeners are passive (touch-action:none on the face
     stops the browser scrolling, so nothing needs preventDefault),
   - during a gesture only a CSS transform is written, once per frame,
   - the end of the gesture commits the value to the trainer's own
     panzoom instance (window.instance), so the dial maths that reads
     instance.getTransform().scale stays right,
   - will-change is set only while moving.
   Zoom is clamped 1x..4x, the face can never be panned out of its box,
   and the reset key returns to 1x. Single-finger drags on a dial still
   turn the dial (the trainer pauses panzoom when a dial drag starts). */
(function () {
  "use strict";
  var MIN = 1, MAX = 4, STEP = 1.6;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var pz = null, layer = null, stage = null, keys = null;
  var appDrag = false;           /* a dial drag owns the finger */
  var pts = {};                  /* active pointers */
  var g = null;                  /* current gesture */
  var live = { x: 0, y: 0, s: 1 };
  var raf = 0, idleT = 0;
  var saved = {};                /* per side: sliderule / wind */
  var curSide = null;            /* the side the live zoom belongs to */

  function side() { return (typeof window.scope === "string" && window.scope) || "sliderule"; }
  function count() { var n = 0; for (var k in pts) n++; return n; }
  function list() { var a = []; for (var k in pts) a.push(pts[k]); return a; }

  function box() {
    return { w: layer.offsetWidth || 1, h: layer.offsetHeight || 1 };
  }
  function barPad(s) {
    if (s <= 1.001) return 0;
    var c = document.getElementById("ga-small-chrome");
    return c ? c.getBoundingClientRect().height + 20 : 0;
  }
  function clamp(t) {
    var b = box();
    t.s = Math.min(MAX, Math.max(MIN, t.s));
    var minX = b.w - b.w * t.s, minY = b.h - b.h * t.s - barPad(t.s);
    t.x = Math.min(0, Math.max(minX, t.x));
    t.y = Math.min(0, Math.max(minY, t.y));
    if (t.s <= 1.001) { t.s = 1; t.x = 0; t.y = 0; }
    return t;
  }
  function origin() {
    /* untransformed top-left of the zoom layer */
    var r = layer.parentNode.getBoundingClientRect();
    return { x: r.left + layer.offsetLeft, y: r.top + layer.offsetTop };
  }
  function paint() {
    raf = 0;
    layer.style.transformOrigin = "0 0";
    layer.style.transform = "matrix(" + live.s + ",0,0," + live.s + "," + live.x + "," + live.y + ")";
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(paint); }
  function moving(on) {
    clearTimeout(idleT);
    if (on) { layer.style.willChange = "transform"; root.classList.add("e6b-zooming"); }
    else idleT = setTimeout(function () {
      layer.style.willChange = ""; root.classList.remove("e6b-zooming");
    }, 180);
  }
  function current() {
    var t = pz.getTransform();
    return { x: t.x, y: t.y, s: t.scale };
  }
  function commit(t) {
    clamp(t);
    live = { x: t.x, y: t.y, s: t.s };
    var it = pz.getTransform();
    it.scale = t.s;
    pz.moveTo(t.x, t.y);          /* panzoom paints the same matrix next frame */
    if (curSide) saved[curSide] = { x: t.x, y: t.y, s: t.s };
    sync();
  }
  function animateTo(t) {
    clamp(t);
    if (reduce) { commit(t); paint(); return; }
    moving(true);
    layer.style.transition = "transform .28s cubic-bezier(.32,.72,0,1)";
    live = { x: t.x, y: t.y, s: t.s };
    paint();
    setTimeout(function () {
      layer.style.transition = "";
      commit(t);
      moving(false);
    }, 300);
  }
  function zoomAt(cx, cy, factor) {
    var t = current(), o = origin();
    var ns = Math.min(MAX, Math.max(MIN, t.s * factor));
    var px = (cx - o.x - t.x) / t.s, py = (cy - o.y - t.y) / t.s;
    animateTo({ s: ns, x: cx - o.x - px * ns, y: cy - o.y - py * ns });
  }
  function centre() {
    var r = stage.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + Math.min(r.height, window.innerHeight || r.height) / 2 };
  }

  /* ---------- gestures ---------- */
  function isPart(el) {
    if (!el || !el.closest) return false;
    return !!el.closest("#tas-dial, #tas-base, #tas-arc, #true-index, #compass, #plot-group, #plot-area, #speed-degrees");
  }
  function down(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (keys && keys.contains(e.target)) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var n = count();
    if (n === 2) {
      var a = list(), t = current();
      g = {
        kind: "pinch",
        d0: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1,
        m0: { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 },
        t0: t, o: origin()
      };
      live = { x: t.x, y: t.y, s: t.s };
      moving(true);
    } else if (n === 1) {
      var t1 = current();
      /* a dial / the wind scale / the azimuth owns this finger, even when zoomed */
      g = (t1.s > 1.001 && !isPart(e.target)) ? { kind: "pan?", p0: { x: e.clientX, y: e.clientY }, t0: t1 } : null;
    }
  }
  function move(e) {
    var p = pts[e.pointerId];
    if (!p || !g) return;
    p.x = e.clientX; p.y = e.clientY;
    if (g.kind === "pinch") {
      var a = list();
      if (a.length < 2) return;
      var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
      var m = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
      var s = Math.min(MAX, Math.max(MIN, g.t0.s * d / g.d0));
      var cx = (g.m0.x - g.o.x - g.t0.x) / g.t0.s, cy = (g.m0.y - g.o.y - g.t0.y) / g.t0.s;
      live = clamp({ s: s, x: m.x - g.o.x - cx * s, y: m.y - g.o.y - cy * s });
      schedule();
    } else if (g.kind === "pan?") {
      if (appDrag) { g = null; return; }          /* a dial took this finger */
      if (Math.abs(p.x - g.p0.x) + Math.abs(p.y - g.p0.y) < 4) return;
      g.kind = "pan"; live = { x: g.t0.x, y: g.t0.y, s: g.t0.s }; moving(true);
    }
    if (g && g.kind === "pan") {
      if (appDrag) return;
      live = clamp({ s: g.t0.s, x: g.t0.x + p.x - g.p0.x, y: g.t0.y + p.y - g.p0.y });
      schedule();
    }
  }
  function up(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId];
    if (!g) return;
    if (g.kind === "pinch" || g.kind === "pan") {
      if (raf) { cancelAnimationFrame(raf); paint(); }
      commit({ x: live.x, y: live.y, s: live.s });
      moving(false);
    }
    g = null;                       /* a lifted pinch finger never jumps into a pan */
  }
  function wheel(e) {
    /* ctrl + wheel and trackpad pinch zoom the face. A plain wheel pans
       the face while it is zoomed, and scrolls the page when it is not. */
    var t = current(), o = origin();
    if (!e.ctrlKey) {
      if (t.s <= 1.001) return;
      e.preventDefault();
      moving(true);
      live = clamp({ s: t.s, x: t.x - e.deltaX, y: t.y - e.deltaY });
      paint();
      commit({ x: live.x, y: live.y, s: live.s });
      moving(false);
      return;
    }
    e.preventDefault();
    var s = Math.min(MAX, Math.max(MIN, t.s * Math.exp(-e.deltaY * 0.01)));
    var px = (e.clientX - o.x - t.x) / t.s, py = (e.clientY - o.y - t.y) / t.s;
    moving(true);
    live = clamp({ s: s, x: e.clientX - o.x - px * s, y: e.clientY - o.y - py * s });
    paint();
    commit({ x: live.x, y: live.y, s: live.s });
    moving(false);
  }

  /* ---------- zoom keys (glass, top right of the face) ---------- */
  var ICON = {
    "in": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    "out": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    "reset": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/></svg>'
  };
  function makeKeys() {
    keys = document.createElement("div");
    keys.id = "e6b-zoom";
    keys.setAttribute("role", "group");
    keys.setAttribute("aria-label", "Zoom");
    [["in", "Zoom in"], ["out", "Zoom out"], ["reset", "Reset zoom"]].forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "e6b-zk e6b-zk-" + k[0];
      b.setAttribute("aria-label", k[1]);
      b.title = k[1];
      b.innerHTML = ICON[k[0]];
      b.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var c = centre();
        if (k[0] === "in") zoomAt(c.x, c.y, STEP);
        else if (k[0] === "out") zoomAt(c.x, c.y, 1 / STEP);
        else animateTo({ x: 0, y: 0, s: 1 });
      });
      keys.appendChild(b);
    });
    var col = stage.parentNode;
    col.appendChild(keys);
  }
  function sync() {
    if (!keys) return;
    var s = live.s;
    keys.classList.toggle("is-zoomed", s > 1.001);
    keys.querySelector(".e6b-zk-in").disabled = s >= MAX - 0.001;
    keys.querySelector(".e6b-zk-out").disabled = s <= MIN + 0.001;
    keys.querySelector(".e6b-zk-reset").disabled = s <= MIN + 0.001;
  }

  /* each side keeps its own zoom */
  function restore() {
    curSide = side();
    var t = saved[curSide] || { x: 0, y: 0, s: 1 };
    live = clamp({ x: t.x, y: t.y, s: t.s });
    commit({ x: live.x, y: live.y, s: live.s });
    paint();
  }

  function init() {
    pz = window.instance;
    layer = document.getElementById("pan-layer");
    stage = document.getElementById("outer-outer");
    if (!pz || !pz.getTransform || !layer || !stage) return false;
    /* The trainer pauses/resumes panzoom around dial drags. Keep that
       signal, but leave panzoom's own touch/wheel input off so only the
       passive handlers below move the face. */
    var origPause = pz.pause;
    try { origPause.call(pz); } catch (e) {}
    pz.pause = function () { appDrag = true; };
    pz.resume = function () { appDrag = false; };
    root.classList.add("e6b-zoom-on");
    var opt = { passive: true };
    stage.addEventListener("pointerdown", down, { passive: true, capture: true });
    window.addEventListener("pointermove", move, opt);
    window.addEventListener("pointerup", up, opt);
    window.addEventListener("pointercancel", up, opt);
    stage.addEventListener("wheel", wheel, { passive: false });
    var flip = document.getElementById("flip-e6b");
    if (flip) flip.addEventListener("click", function () {
      if (curSide) saved[curSide] = current();
    }, true);
    var wrap = document.getElementById("wrap");
    if (wrap) new MutationObserver(function () {
      if (side() !== curSide) restore();
      else paint();
      setTimeout(function () {
        if (side() !== curSide) restore();
        else { commit(live); paint(); }
      }, 60);
    }).observe(wrap, { childList: true });
    makeKeys();
    curSide = side();
    live = current();
    sync();
    return true;
  }

  window.gaE6bZoom = {
    refit: function () {
      if (!pz) return;
      if (side() !== curSide) restore(); else commit(current());
    },
    state: function () { return { side: side(), live: live, saved: saved }; },
    zoomTo: function (s) { var c = centre(); var t = current(); zoomAt(c.x, c.y, s / t.s); }
  };

  var tries = 0;
  (function boot() {
    if (init()) return;
    if (++tries < 60) setTimeout(boot, 100);
  })();
})();
