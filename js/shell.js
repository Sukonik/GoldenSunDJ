/* ==========================================================================
   GoldenSunDJ — shell script. Vanilla, no dependencies.
   Owns: the drawer, the theme switcher, the session chip, the footer year.
   Exposes window.GSDJ = { setTheme(name), setChip({ text, live }), theme() }
   for the app scripts. Every lookup is guarded — a page missing any piece
   of the shell still runs without errors.
   ========================================================================== */
(function () {
  "use strict";

  var THEMES = ["master", "house", "synthpop", "techno", "eurodance"];
  var STORAGE_KEY = "gsdj-theme";

  function isTheme(name) {
    return THEMES.indexOf(name) !== -1;
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "master";
  }

  function markSwatches() {
    var active = currentTheme();
    var swatches = document.querySelectorAll("[data-set-theme]");
    for (var i = 0; i < swatches.length; i++) {
      var on = swatches[i].getAttribute("data-set-theme") === active;
      swatches[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function setTheme(name) {
    if (!isTheme(name)) return;
    document.documentElement.setAttribute("data-theme", name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch (err) {
      /* storage unavailable (private mode, file://) — theme still applies */
    }
    markSwatches();
  }

  function storedTheme() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      return isTheme(saved) ? saved : null;
    } catch (err) {
      return null;
    }
  }

  function setChip(opts) {
    if (!opts) return;
    var text = document.getElementById("session-chip-text");
    var chip = document.getElementById("session-chip");
    var dot = chip ? chip.querySelector(".chip-dot") : null;
    if (!dot && !text) {
      dot = document.querySelector("#session-chip .chip-dot");
    }
    if (typeof opts.text === "string" && text) {
      text.textContent = opts.text;
    }
    if (typeof opts.live === "boolean" && dot) {
      dot.classList.toggle("is-live", opts.live);
    }
  }

  function initTheme() {
    var saved = storedTheme();
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
    var swatches = document.querySelectorAll("[data-set-theme]");
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener("click", function () {
        setTheme(this.getAttribute("data-set-theme"));
      });
    }
    markSwatches();
  }

  function initChipDefault() {
    var chip = document.getElementById("session-chip");
    var from = null;
    if (document.body && document.body.getAttribute("data-chip")) {
      from = document.body.getAttribute("data-chip");
    } else if (chip && chip.getAttribute("data-chip")) {
      from = chip.getAttribute("data-chip");
    }
    if (from) {
      setChip({ text: from });
    }
  }

  function initDrawer() {
    var drawer = document.getElementById("drawer");
    var scrim = document.getElementById("scrim");
    var openBtn = document.getElementById("menu-btn");
    if (!drawer) return;

    function setOpen(open) {
      drawer.classList.toggle("is-open", open);
      if (scrim) scrim.classList.toggle("is-open", open);
      if (document.body) document.body.classList.toggle("drawer-open", open);
      if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = drawer.querySelector("a, button");
        if (first) first.focus();
      } else if (openBtn) {
        openBtn.focus();
      }
    }

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(!drawer.classList.contains("is-open"));
      });
    }
    if (scrim) {
      scrim.addEventListener("click", function () { setOpen(false); });
    }
    var closeBtn = drawer.querySelector("[data-drawer-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () { setOpen(false); });
    }
    var links = drawer.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () { setOpen(false); });
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  function initYear() {
    var year = document.getElementById("year");
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  }

  window.GSDJ = {
    setTheme: setTheme,
    setChip: setChip,
    theme: currentTheme
  };

  function init() {
    initTheme();
    initChipDefault();
    initDrawer();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
