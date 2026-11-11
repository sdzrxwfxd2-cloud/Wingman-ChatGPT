/* Shared CX-3 / E6-B page chrome: follow the site theme, embed sizing,
   and a in-flow back button to the Calculator page. No position:fixed. */
(function () {
  var map = {
    midnight: ["night", "black"],
    amethyst: ["night", "purple"],
    pearl: ["day", "white"],
    champagne: ["day", "beige"]
  };

  function applyId(id) {
    if (!map[id]) return;
    var m = map[id];
    var root = document.documentElement;
    root.setAttribute("data-theme", m[0]);
    root.setAttribute("data-pal", m[1]);
    root.setAttribute("data-cx3-bw", m[0] === "day" ? "day" : "night");
  }

  function idFromAttrs(theme, pal) {
    if (theme === "day") return (pal === "beige" || pal === "warm") ? "champagne" : "pearl";
    if (theme === "night") return pal === "purple" ? "amethyst" : "midnight";
    return null;
  }

  function syncFromParent() {
    try {
      if (window.parent && window.parent !== window) {
        var p = window.parent.document.documentElement;
        var id = idFromAttrs(p.getAttribute("data-theme"), p.getAttribute("data-pal"));
        if (id) applyId(id);
      }
    } catch (e) {}
  }

  function isEmbed() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("embed") === "1") return true;
    } catch (e) {}
    return window.self !== window.top;
  }

  function fromCalculator() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("from") === "calculator") return true;
    } catch (e) {}
    return true; /* standalone pages open from the Calculator expand button */
  }

  function tellHeight() {
    try {
      var h = Math.ceil(document.body.getBoundingClientRect().height);
      if (!h) return;
      if (window.frameElement) window.frameElement.style.height = h + "px";
    } catch (e) {}
  }

  function buildBack() {
    if (isEmbed()) return;
    if (document.querySelector(".ga-fc-bar")) return;
    if (!fromCalculator()) return;
    var bar = document.createElement("p");
    bar.className = "ga-fc-bar";
    var a = document.createElement("a");
    a.className = "ga-fc-back";
    a.href = "/index.html#calculator";
    a.setAttribute("aria-label", "Back to Calculator");
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Calculator';
    bar.appendChild(a);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (isEmbed()) document.documentElement.classList.add("ga-embed");
  syncFromParent();
  try {
    if (window.parent && window.parent !== window) {
      new window.parent.MutationObserver(syncFromParent).observe(
        window.parent.document.documentElement,
        { attributes: true, attributeFilter: ["data-theme", "data-pal"] }
      );
    }
  } catch (e) {}

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(function () {
    buildBack();
    tellHeight();
    setTimeout(tellHeight, 200);
    setTimeout(tellHeight, 800);
  });
  addEventListener("load", function () {
    tellHeight();
    setTimeout(tellHeight, 200);
  });
  try { new ResizeObserver(tellHeight).observe(document.body); } catch (e) {}
})();
