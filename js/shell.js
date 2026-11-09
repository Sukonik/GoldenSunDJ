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


  /* ---- Journey bar + weather (v2) ------------------------------------- */
  var STEPS = [
    ["Get out", "weather"], ["Record", "mic/"], ["Produce", "sampler/"],
    ["Master", null], ["Distribute", null], ["Mix", "mixer/"],
    ["Play", "player/"], ["Get found", null]
  ];

  function rootPrefix() {
    var a = document.querySelector(".brand");
    return a && /^\.\.\//.test(a.getAttribute("href") || "") ? "../" : "";
  }

  var WX_CODES = {0:"Clear",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Fog",51:"Drizzle",53:"Drizzle",55:"Drizzle",61:"Rain",63:"Rain",65:"Heavy rain",71:"Snow",73:"Snow",75:"Heavy snow",80:"Showers",81:"Showers",82:"Heavy showers",95:"Thunderstorm",96:"Thunderstorm",99:"Thunderstorm"};

  function verdict(w) {
    if (w.code >= 95) return "Storm risk. Stay in and mix.";
    if (w.code >= 51 || w.wind > 30) return "Wet or windy. Record indoors today.";
    if (w.temp < 0 || w.temp > 35) return "Extreme temps. Short session outside.";
    return "Good day to get out and record.";
  }

  function loadWeather(cb) {
    function done(w) { cb(w); }
    try {
      var c = JSON.parse(localStorage.getItem("gsdj-wx") || "null");
      if (c && Date.now() - c.t < 15 * 60 * 1000) return done(c.w);
    } catch (e) {}
    if (!navigator.geolocation) return cb(null, "Location not supported");
    navigator.geolocation.getCurrentPosition(function (pos) {
      var u = "https://api.open-meteo.com/v1/forecast?latitude=" + pos.coords.latitude +
        "&longitude=" + pos.coords.longitude +
        "&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph";
      fetch(u).then(function (r) { return r.json(); }).then(function (j) {
        var cur = j.current;
        var tempF = Math.round(cur.temperature_2m);
        var w = { temp: Math.round((tempF - 32) * 5 / 9), tempF: tempF, wind: Math.round(cur.wind_speed_10m * 1.609),
                  code: cur.weather_code, label: WX_CODES[cur.weather_code] || "Weather" };
        try { localStorage.setItem("gsdj-wx", JSON.stringify({ t: Date.now(), w: w })); } catch (e) {}
        done(w);
      }).catch(function () { cb(null, "Weather unavailable"); });
    }, function () { cb(null, "Location off. Tap to retry."); }, { timeout: 8000, maximumAge: 600000 });
  }

  function paintWeather(w, err) {
    var nodes = document.querySelectorAll("[data-wx]");
    for (var i = 0; i < nodes.length; i++) {
      var kind = nodes[i].getAttribute("data-wx");
      if (!w) { nodes[i].textContent = kind === "chip" ? "☀ Weather" : (err || "Tap to check the weather"); continue; }
      nodes[i].textContent = kind === "chip"
        ? "☀ " + w.tempF + "°F"
        : w.tempF + "°F · " + w.label + " · wind " + w.wind + " km/h — " + verdict(w);
    }
  }

  function initWeather() {
    var targets = document.querySelectorAll("[data-wx-btn]");
    for (var i = 0; i < targets.length; i++) {
      targets[i].addEventListener("click", function () { loadWeather(paintWeather); });
    }
    try { if (localStorage.getItem("gsdj-wx")) loadWeather(paintWeather); } catch (e) {}
  }

  function initJourney() {
    if (document.body.hasAttribute("data-no-journey")) return;
    var header = document.querySelector(".site-header");
    if (!header) return;
    var pre = rootPrefix();
    var path = location.pathname;
    var nav = document.createElement("nav");
    nav.className = "journey-bar";
    nav.setAttribute("aria-label", "Your session path");
    var html = '<ol class="wrap journey-list">';
    for (var i = 0; i < STEPS.length; i++) {
      var name = STEPS[i][0], href = STEPS[i][1];
      var num = '<span class="journey-num">' + (i + 1) + "</span>";
      if (href && href !== "weather") {
        var here = path.indexOf("/" + href) !== -1;
        html += '<li><a href="' + pre + href + '"' + (here ? ' aria-current="step"' : "") + ">" + num + name + "</a></li>";
      } else if (href === "weather") {
        html += '<li><a href="' + pre + 'index.html#get-out">' + num + name + "</a></li>";
      } else {
        html += '<li><a href="' + pre + 'index.html#journey" class="is-soon">' + num + name + "</a></li>";
      }
    }
    nav.innerHTML = html + "</ol>";
    header.insertAdjacentElement("afterend", nav);
    var inner = header.querySelector(".site-header-inner");
    var chip = document.getElementById("session-chip");
    if (inner && chip && !inner.querySelector("[data-wx='chip']")) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "wx-chip"; b.setAttribute("data-wx", "chip");
      b.setAttribute("data-wx-btn", ""); b.setAttribute("aria-label", "Check local weather");
      b.textContent = "☀ Weather";
      inner.insertBefore(b, chip);
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
    initJourney();
    initWeather();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
