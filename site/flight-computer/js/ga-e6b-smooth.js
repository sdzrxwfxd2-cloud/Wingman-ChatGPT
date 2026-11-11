/* E6-B smooth dials, draggable glass bars, and silent tutorials (MT t2568).
   Same gesture technique as the runway 2D fix and ga-e6b-zoom.js:
   - pointermove is passive,
   - during a drag only a transform is written, once per animation frame,
   - will-change is set only while moving,
   - the trainer's Snap transform (and closest-line maths) is committed
     once at the end, so the value read after a drag still comes from
     the painted face.
   Screen → SVG mapping uses the SVG's screen CTM, so a dial follows
   the finger at 1x and when the face is zoomed. The old getXYCoords
   mixed CSS pixels with SVG units and lagged behind the finger.
   Optional inertia is off: it would drift the face after lift and
   disagree with closestLine(). */
(function () {
  "use strict";
  if (/(?:^|[?&])e6bRawDrag=1(?:&|$)/.test(location.search || "")) return;

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- screen → SVG user units ---------- */
  function eventPoint(e) {
    if (!e) return null;
    if (e.clientX != null) return { x: e.clientX, y: e.clientY };
    if (e.originalEvent) return eventPoint(e.originalEvent);
    var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (t) return { x: t.clientX, y: t.clientY };
    if (e.pageX != null) return { x: e.pageX - (window.scrollX || 0), y: e.pageY - (window.scrollY || 0) };
    return null;
  }
  function svgOf() { return document.getElementById("flight-computer"); }
  function toSvg(e) {
    var svg = svgOf(), p = eventPoint(e);
    if (!svg || !p || !svg.createSVGPoint || !svg.getScreenCTM) return { x: 0, y: 0 };
    var pt = svg.createSVGPoint();
    pt.x = p.x; pt.y = p.y;
    try {
      var m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      pt = pt.matrixTransform(m.inverse());
      return { x: pt.x, y: pt.y };
    } catch (err) {
      return { x: 0, y: 0 };
    }
  }

  /* ---------- rAF batching for Snap drags ---------- */
  var raw = {};
  var pending = null;   /* { kind, ev } */
  var raf = 0;
  var startSvg = null;  /* finger in SVG units at drag start (for the slide) */

  function grabRaw() {
    ["getXYCoords", "dragDial", "startDial", "stopDial",
     "dragCompass", "startCompass", "stopCompass",
     "dragTrueIndex", "startTrueIndex", "stopTrueIndex"].forEach(function (n) {
      if (typeof window[n] === "function" && !window[n]._ga) raw[n] = window[n];
    });
    return !!(raw.dragDial && raw.startDial && raw.stopDial);
  }

  function movingNodes(on) {
    var ids = ["tas-dial", "tas-arc", "plot-group", "true-index", "compass", "plot-dot", "plot-dot-1", "plot-dot-2"];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      if (on) {
        el.style.willChange = "transform";
        root.classList.add("e6b-dialing");
      } else {
        el.style.willChange = "";
      }
    }
    if (!on) root.classList.remove("e6b-dialing");
  }


  function getArc() {
    if (window.tasArc && window.tasArc.drag) return window.tasArc;
    if (typeof window.Snap === "function") {
      var a = Snap("#tas-arc");
      if (a && a.drag) { window.tasArc = a; return a; }
    }
    return null;
  }

  /* The visible wind scale (the speed grid) is #tas-arc, a sibling of
     #true-index / #plot-group. The trainer only slid the compass over
     that fixed grid, so grabbing the scale itself did nothing. Slide
     the scale with the finger; leave the azimuth and true-index mark
     where they are. windIndexDistance still reads the rivet against
     the painted grid. */
  function applySlide(dy) {
    var arc = getArc();
    if (!arc) return;
    window.yShift = dy;
    function shift(el) {
      if (!el) return;
      var orig = el.data("origTransform");
      el.transform((orig || "") + (orig ? "T" : "t") + [0, dy]);
    }
    shift(arc);
    shift(window.dot);
    shift(window.dot1);
    shift(window.dot2);
  }

  function flush() {
    raf = 0;
    if (!pending) return;
    var ev = pending.ev, kind = pending.kind;
    if (kind === "dial" && window.dialActive !== false && raw.dragDial) {
      raw.dragDial(0, 0, 0, 0, ev);
    } else if (kind === "compass" && raw.dragCompass) {
      raw.dragCompass(0, 0, 0, 0, ev);
    } else if (kind === "slide") {
      /* The trainer divides Snap's screen-pixel dy by panzoom scale
         only, which skips the fit scale and slips when zoomed. Apply
         the same transforms in SVG units from the finger. */
      var now = toSvg(ev);
      var dy = now.y - (startSvg ? startSvg.y : now.y);
      applySlide(dy);
    }
  }
  function schedule(kind, ev) {
    pending = { kind: kind, ev: ev };
    if (!raf) raf = requestAnimationFrame(flush);
  }
  function endGesture(origStop) {
    if (raf) { cancelAnimationFrame(raf); flush(); }
    pending = null;
    movingNodes(false);
    if (typeof origStop === "function") origStop();
  }

  function installCoords() {
    if (typeof window.getXYCoords !== "function") return;
    if (window.getXYCoords._ga) return;
    raw.getXYCoords = raw.getXYCoords || window.getXYCoords;
    window.getXYCoords = function (e) { return toSvg(e); };
    window.getXYCoords._ga = 1;
  }

  function installFns() {
    if (!grabRaw()) return false;
    installCoords();

    window.dragDial = function (dx, dy, x, y, e) { schedule("dial", e); };
    window.startDial = function (x, y, e) {
      movingNodes(true);
      raw.startDial(x, y, e);
    };
    window.stopDial = function () { endGesture(raw.stopDial); };

    window.dragCompass = function (dx, dy, x, y, e) { schedule("compass", e); };
    window.startCompass = function (x, y, e) {
      movingNodes(true);
      raw.startCompass(x, y, e);
    };
    window.stopCompass = function () { endGesture(raw.stopCompass); };

    window.dragTrueIndex = function (dx, dy, x, y, e) { schedule("slide", e); };
    window.startTrueIndex = function (x, y, e) {
      startSvg = toSvg(e);
      movingNodes(true);
      var arc = getArc();
      if (arc) arc.data("origTransform", arc.transform().local);
      raw.startTrueIndex(x, y, e);
    };
    window.stopTrueIndex = function (e) {
      endGesture(function () {
        /* compass did not move, so do not shift its origin */
        var dy = window.yShift || 0;
        window.yShift = 0;
        raw.stopTrueIndex(e);
        window.yShift = dy;
        if (typeof window.windIndexDistance === "function") window.windIndexDistance();
      });
    };

    ["dragDial", "startDial", "stopDial", "dragCompass", "startCompass",
     "stopCompass", "dragTrueIndex", "startTrueIndex", "stopTrueIndex"].forEach(function (n) {
      window[n]._ga = 1;
    });
    return true;
  }

  /* Snap stores the function reference at bind time, so rebind after
     each side load (loadSVG / setupSlideRule). */
  var hookedLoad = false;
  function rebind() {
    function hook(el, move, start, end) {
      if (!el || !el.drag) return;
      try { el.undrag(); } catch (err) {}
      el.drag(move, start, end);
    }
    if (window.tasDial) hook(window.tasDial, window.dragDial, window.startDial, window.stopDial);
    if (window.compass) hook(window.compass, window.dragCompass, window.startCompass, window.stopCompass);
    if (window.trueIndex) hook(window.trueIndex, window.dragTrueIndex, window.startTrueIndex, window.stopTrueIndex);
    var arc = getArc();
    if (arc) hook(arc, window.dragTrueIndex, window.startTrueIndex, window.stopTrueIndex);
  }
  function wrapLoad() {
    if (hookedLoad) { rebind(); return true; }
    if (typeof window.loadSVG !== "function") return false;
    if (!installFns()) return false;
    var orig = window.loadSVG;
    window.loadSVG = function (fragment) {
      var r = orig.apply(this, arguments);
      rebind();
      return r;
    };
    hookedLoad = true;
    rebind();
    return true;
  }

  /* ---------- no voice in any mode ---------- */
  function silence() {
    function noop() {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (err) {}
    try {
      if (window.speechSynthesis && !window.speechSynthesis._gaMuted) {
        var speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
        window.speechSynthesis.speak = function () { /* muted */ };
        window.speechSynthesis._gaMuted = 1;
        window.speechSynthesis._gaOrigSpeak = speak;
      }
    } catch (err) {}
    window.textToSpeech = noop;
    window.speakMessage = noop;
    window.modalTextAudio = noop;
    window.modalTextAudioToggle = noop;
    try { if (window.userProfile && window.userProfile[0]) window.userProfile[0].audioActive = false; } catch (err) {}
    var btn = document.querySelector(".button3.audio, #sound_icon");
    if (btn) {
      var wrap = btn.closest ? btn.closest("button") || btn : btn;
      wrap.style.display = "none";
      wrap.setAttribute("aria-hidden", "true");
    }
  }

  /* ---------- map trainer labels to the clearer names ---------- */
  var NAMES = {
    Simulation: "Free use",
    Practice: "Practice problems",
    Tutorial: "Lessons"
  };
  function prettyMode(text) {
    if (!text) return text;
    var t = String(text).replace(/^\s*Mode:\s*/i, "").trim();
    t = t.replace(/^\s*Tutorial:\s*/i, "Lessons · ");
    t = t.replace(/\bSimulation\b/g, NAMES.Simulation);
    t = t.replace(/\bPractice problems\b/g, NAMES.Practice);
    t = t.replace(/\bPractice\b/g, NAMES.Practice);
    t = t.replace(/\bTutorial\b/g, NAMES.Tutorial);
    return t;
  }

  /* ---------- transform drag for glass bars, zoom keys, popups ---------- */
  function clampToPage(el, x, y) {
    var before = el.style.transform;
    el.style.transform = "translate(" + x + "px," + y + "px)";
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth || 390, vh = window.innerHeight || 844;
    var pad = 6;
    var dx = 0, dy = 0;
    if (r.left < pad) dx = pad - r.left;
    if (r.right > vw - pad) dx = Math.min(dx, (vw - pad) - r.right);
    if (r.top < pad) dy = pad - r.top;
    if (r.bottom > vh - pad) dy = Math.min(dy, (vh - pad) - r.bottom);
    if (r.left + dx < pad) dx = pad - r.left;
    if (r.top + dy < pad) dy = pad - r.top;
    /* never push a box that's larger than the page off the opposite edge more than needed */
    x += dx; y += dy;
    el.style.transform = "translate(" + x + "px," + y + "px)";
    return { x: x, y: y };
  }

  function makeDraggable(el, opts) {
    if (!el || el._gaDrag) return;
    el._gaDrag = 1;
    el.classList.add("e6b-draggable");
    var live = { x: 0, y: 0 }, start = null, gest = null, localRaf = 0, idleT = 0;
    function paint() {
      localRaf = 0;
      if (!gest) return;
      var n = clampToPage(el, gest.x, gest.y);
      live = n;
    }
    function down(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (opts && opts.ignore && opts.ignore(e.target)) return;
      start = { x: e.clientX, y: e.clientY, lx: live.x, ly: live.y, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!start.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 5) return;
        start.moved = true;
        el.classList.add("is-dragging");
        el.style.willChange = "transform";
        if (opts && opts.onStart) opts.onStart();
      }
      gest = { x: start.lx + dx, y: start.ly + dy };
      if (!localRaf) localRaf = requestAnimationFrame(paint);
    }
    function up(e) {
      if (!start) return;
      if (start.moved) {
        if (localRaf) { cancelAnimationFrame(localRaf); paint(); }
        if (e && start.moved) {
          /* swallow the click that would fire after a drag */
          var sink = function (ev) { ev.stopPropagation(); ev.preventDefault(); el.removeEventListener("click", sink, true); };
          el.addEventListener("click", sink, true);
          setTimeout(function () { el.removeEventListener("click", sink, true); }, 400);
        }
      }
      start = null; gest = null;
      el.classList.remove("is-dragging");
      clearTimeout(idleT);
      idleT = setTimeout(function () { el.style.willChange = ""; }, 180);
    }
    var po = { passive: true };
    el.addEventListener("pointerdown", down, po);
    window.addEventListener("pointermove", move, po);
    window.addEventListener("pointerup", up, po);
    window.addEventListener("pointercancel", up, po);
  }

  function interactive(el) {
    if (!el) return false;
    return !!el.closest("button, a, input, select, textarea, label, .e6b-zk, #main-menu-btn, #flip-e6b, .flipside-btn, .button3, .practiceType, .quizType");
  }

  function hookChrome() {
    var bar = document.getElementById("ga-small-chrome");
    if (bar) makeDraggable(bar, { ignore: interactive });
    var zoom = document.getElementById("e6b-zoom");
    if (zoom) makeDraggable(zoom, { ignore: interactive });
  }

  function hookModals() {
    /* drop jQuery UI's left/top dragging — it layouts every move */
    try {
      if (window.jQuery && jQuery.fn && jQuery.fn.draggable) {
        jQuery(".modal, .custom-modal, .walkthrough-modal, .form-popup").each(function () {
          try { jQuery(this).draggable("destroy"); } catch (err) {}
        });
      }
    } catch (err) {}
    var nodes = document.querySelectorAll(".modal, .custom-modal, .walkthrough-modal, .form-popup");
    for (var i = 0; i < nodes.length; i++) {
      makeDraggable(nodes[i], { ignore: interactive });
    }
  }

  function restyleCloses() {
    /* turn Close / close-lookalikes into a glass X, keep the original
       class and click logic so the trainer still dismisses the modal */
    var sels = ".btn-close, .practice-close, .quiz-close, .score-close";
    var btns = document.querySelectorAll(sels);
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b._gaX) continue;
      b._gaX = 1;
      b.classList.add("e6b-x");
      b.setAttribute("aria-label", "Close");
      if (/^\s*close\s*$/i.test(b.textContent || "")) b.innerHTML = '<span aria-hidden="true">&times;</span>';
    }
    /* expand / collapse arrows on the practice and quiz sheets */
    var arrows = document.querySelectorAll(".arrow-icon, #arrow-icon-practice, #arrow-icon-quiz");
    for (var j = 0; j < arrows.length; j++) {
      arrows[j].classList.add("e6b-expand");
      arrows[j].setAttribute("aria-label", "Move or fold this sheet");
    }
  }

  window.gaE6bSmooth = {
    toSvg: toSvg,
    prettyMode: prettyMode,
    silence: silence
  };

  var tries = 0;
  function boot() {
    silence();
    wrapLoad();
    hookChrome();
    hookModals();
    restyleCloses();
    if (!hookedLoad && ++tries < 80) setTimeout(boot, 100);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  window.addEventListener("load", function () {
    silence(); hookChrome(); hookModals(); restyleCloses(); wrapLoad();
  });
})();
