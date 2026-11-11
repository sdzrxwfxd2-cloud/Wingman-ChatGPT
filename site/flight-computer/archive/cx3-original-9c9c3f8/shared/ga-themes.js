/* Go Around theme switcher — shared by the CX-3 and E6-B trainers.
 *
 * Usage:
 *   <script>window.GA_THEME_STORAGE_KEY = "ga-e6b-theme";</script>
 *   <script src="../shared/ga-themes.js"></script>
 *
 * Remembers the choice in localStorage (works offline). A ?theme=midnight
 * (or amethyst|pearl|champagne) query string overrides and is then saved.
 * Theme ids and html attributes match go-around-design DESIGN.md / §3.1.
 */
(function () {
  var KEY = window.GA_THEME_STORAGE_KEY || "ga-theme";
  var THEMES = {
    midnight:  { theme: "night", pal: "black",  label: "Midnight" },
    amethyst:  { theme: "night", pal: "purple", label: "Amethyst" },
    pearl:     { theme: "day",   pal: "white",  label: "Pearl" },
    champagne: { theme: "day",   pal: "beige",  label: "Champagne" }
  };
  var ORDER = ["midnight", "amethyst", "pearl", "champagne"];

  function apply(id) {
    if (!THEMES[id]) id = "midnight";
    var t = THEMES[id];
    var root = document.documentElement;
    root.setAttribute("data-theme", t.theme);
    root.setAttribute("data-pal", t.pal);
    try { localStorage.setItem(KEY, id); } catch (e) {}
    var buttons = document.querySelectorAll("#ga-theme-switcher button[data-theme-id]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        "aria-pressed",
        buttons[i].getAttribute("data-theme-id") === id ? "true" : "false"
      );
    }
  }

  function fromQuery() {
    try {
      var q = new URLSearchParams(window.location.search).get("theme");
      if (q && THEMES[q]) return q;
    } catch (e) {}
    return null;
  }

  function current() {
    var q = fromQuery();
    if (q) return q;
    try {
      var saved = localStorage.getItem(KEY);
      if (saved && THEMES[saved]) return saved;
    } catch (e) {}
    return "midnight";
  }

  function build() {
    if (document.getElementById("ga-theme-switcher")) return;
    var nav = document.createElement("div");
    nav.id = "ga-theme-switcher";
    nav.setAttribute("role", "group");
    nav.setAttribute("aria-label", "Background theme");
    for (var i = 0; i < ORDER.length; i++) {
      var id = ORDER[i];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-theme-id", id);
      btn.textContent = THEMES[id].label;
      btn.addEventListener("click", function (ev) {
        apply(ev.currentTarget.getAttribute("data-theme-id"));
      });
      nav.appendChild(btn);
    }
    document.body.appendChild(nav);
    apply(current());
  }

  apply(current());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
