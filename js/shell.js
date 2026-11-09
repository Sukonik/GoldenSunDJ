/* ==========================================================================
   GoldenSunDJ shell (v3). Vanilla, no dependencies.
   Owns: drawer, themes (swatches built here), session chip, journey bar,
   weather (Open-Meteo, no key). Exposes window.GSDJ for the app scripts.
   ========================================================================== */
(function () {
  "use strict";

  var THEMES = [
    { id: "gold-disc",    name: "Golden Hour",    sub: "Gold CD",         a: "#ffc933", b: "#ff8a1f", c: "#5c3a00" },
    { id: "silver-cd",    name: "Moonchrome",    sub: "Silver CD",         a: "#dfe6ee", b: "#8fd3ff", c: "#3b4a5e" },
    { id: "rainbow-cd",   name: "Prism Pop",   sub: "Rainbow CD",         a: "#ff5fd2", b: "#35e0ff", c: "#4b1fa8" },
    { id: "cobalt-disc",  name: "Blue Hour",  sub: "Cobalt CD",         a: "#4d8dff", b: "#00e0ff", c: "#10268f" },
    { id: "studio-black", name: "Amber Studio", sub: "Studio cans", a: "#ff9f1c", b: "#ffd166", c: "#2e1c08" },
    { id: "pink-cans",    name: "Bubblegum Bass",    sub: "Pink cans", a: "#ff5fa8", b: "#ffb3d9", c: "#6b0f45" },
    { id: "mint-buds",    name: "Mint Drop",    sub: "Earbuds",    a: "#3dffb8", b: "#3dc6ff", c: "#0b5a43" },
    { id: "sunset-cans",  name: "Ember Cans",  sub: "Sunset cans", a: "#ff6a2b", b: "#ffc93d", c: "#7a1f08" }
  ];
  // v1-v4 theme ids -> current ids (so saved choices keep working)
  var LEGACY = { master: "gold-disc", house: "sunset-cans", synthpop: "pink-cans", techno: "mint-buds", eurodance: "cobalt-disc", trance: "rainbow-cd", chrome: "silver-cd", sunset: "sunset-cans" };
  var KEY = "gsdj-theme";
  var root = document.documentElement;

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function isTheme(id) { return THEMES.some(function (t) { return t.id === id; }); }
  function currentTheme() { return root.getAttribute("data-theme") || "gold-disc"; }

  function markThemes() {
    var id = currentTheme();
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-set-theme") === id ? "true" : "false");
    });
  }
  function setTheme(id) {
    if (!isTheme(id)) return;
    root.setAttribute("data-theme", id);
    store(KEY, id);
    markThemes();
  }
  // Apply the saved choice immediately (page default otherwise).
  (function () {
    var s = store(KEY);
    if (LEGACY[s]) s = LEGACY[s];
    root.setAttribute("data-theme", isTheme(s) ? s : "gold-disc");
  })();

  function buildSwatches() {
    document.querySelectorAll(".swatches").forEach(function (host) {
      host.innerHTML = "";
      THEMES.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "swatch"; b.setAttribute("data-set-theme", t.id);
        b.style.setProperty("--sw-a", t.a); b.style.setProperty("--sw-b", t.b); b.style.setProperty("--sw-c", t.c);
        b.innerHTML = '<span class="swatch-dot" aria-hidden="true"></span><span>' + t.name + "<small>" + t.sub + "</small></span>";
        b.addEventListener("click", function () { setTheme(t.id); });
        host.appendChild(b);
      });
    });
    markThemes();
  }

  function setChip(opts) {
    if (!opts) return;
    var text = document.getElementById("session-chip-text");
    var dot = document.querySelector("#session-chip .chip-dot");
    if (typeof opts.text === "string" && text) text.textContent = opts.text;
    if (typeof opts.live === "boolean" && dot) dot.classList.toggle("is-live", opts.live);
  }
  function initChipDefault() {
    var chip = document.getElementById("session-chip");
    var from = (document.body && document.body.getAttribute("data-chip")) || (chip && chip.getAttribute("data-chip"));
    if (from) setChip({ text: from });
  }

  var drawerApi = { open: function () {} };
  function initDrawer() {
    var drawer = document.getElementById("drawer");
    var scrim = document.getElementById("scrim");
    var openBtn = document.getElementById("menu-btn");
    if (!drawer) return;
    function setOpen(open) {
      drawer.classList.toggle("is-open", open);
      if (scrim) scrim.classList.toggle("is-open", open);
      document.body.classList.toggle("drawer-open", open);
      if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var f = drawer.querySelector("a, button"); if (f) f.focus(); }
      else if (openBtn) openBtn.focus();
    }
    drawerApi.open = function () { setOpen(true); };
    if (openBtn) openBtn.addEventListener("click", function () { setOpen(!drawer.classList.contains("is-open")); });
    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
    var closeBtn = drawer.querySelector("[data-drawer-close]");
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false); });
  }

  /* ---- weather ----------------------------------------------------------- */
  var DEFAULT_PLACE = { name: "Long Beach, NY", lat: 40.5884, lon: -73.6579 };
  var CACHE_MS = 10 * 60 * 1000;

  function describe(c) {
    if (c === 0) return "Clear"; if (c <= 2) return "Partly cloudy"; if (c === 3) return "Overcast";
    if (c === 45 || c === 48) return "Fog"; if (c >= 51 && c <= 57) return "Drizzle";
    if (c >= 61 && c <= 67) return "Rain"; if (c >= 71 && c <= 77) return "Snow";
    if (c >= 80 && c <= 82) return "Showers"; if (c >= 95) return "Thunderstorm"; return "Cloudy";
  }
  function score(p) { // 0-100 "get out" score, inputs °F / mph / % / in
    var s = 100;
    s -= Math.max(0, p.wind - 8) * 2;
    if (p.feels < 50) s -= (50 - p.feels) * 1.6; else if (p.feels > 82) s -= (p.feels - 82) * 2.2;
    s -= (p.pop || 0) * 0.3;
    if (p.precip > 0.01) s -= 20;
    if (p.code >= 95) s -= 30;
    if (!p.day) s -= 10;
    s = Math.max(0, Math.min(100, Math.round(s)));
    var tone = s >= 80 ? "prime" : s >= 60 ? "good" : s >= 40 ? "fair" : "skip";
    var label = { prime: "Great day to record outside", good: "Good to get out", fair: "Short session outside", skip: "Stay in and mix" }[tone];
    return { score: s, tone: tone, label: label };
  }

  function place() {
    try { var p = JSON.parse(store("gsdj-place")); if (p && isFinite(p.lat) && isFinite(p.lon)) return p; } catch (e) {}
    return DEFAULT_PLACE;
  }
  function fetchWeather(p) {
    var key = "gsdj-wx-" + p.lat.toFixed(2) + "," + p.lon.toFixed(2);
    try {
      var hit = JSON.parse(sessionStorage.getItem(key));
      if (hit && Date.now() - hit.t < CACHE_MS) return Promise.resolve(shape(hit.raw, p));
    } catch (e) {}
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon +
      "&current=temperature_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m" +
      "&hourly=temperature_2m,precipitation_probability,weather_code,is_day" +
      "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=2&timezone=auto";
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }).then(function (raw) {
      if (!raw.current || !raw.hourly) throw new Error("bad data");
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), raw: raw })); } catch (e) {}
      return shape(raw, p);
    });
  }
  function shape(raw, p) {
    var c = raw.current;
    var now = { temp: Math.round(c.temperature_2m), feels: c.apparent_temperature, wind: Math.round(c.wind_speed_10m),
      code: c.weather_code, day: !!c.is_day, precip: c.precipitation || 0, pop: 0 };
    now.ride = score(now);
    var hours = [], h = raw.hourly, start = 0;
    for (var i = 0; i < h.time.length; i++) { if (h.time[i] >= c.time.slice(0, 13)) { start = i; break; } }
    for (var j = start + 1; j < Math.min(h.time.length, start + 7); j++) {
      hours.push({ hour: new Date(h.time[j]).toLocaleTimeString("en-US", { hour: "numeric" }), temp: Math.round(h.temperature_2m[j]),
        pop: h.precipitation_probability[j] || 0, code: h.weather_code[j] });
    }
    return { place: p, now: now, hours: hours };
  }

  var wxState = { data: null, error: null };
  function paintWeather() {
    var d = wxState.data;
    document.querySelectorAll(".wx-chip").forEach(function (chip) {
      var t = chip.querySelector(".wx-chip-text");
      if (d) { chip.setAttribute("data-tone", d.now.ride.tone); t.innerHTML = d.now.temp + "°F<span class=\"wx-score\"> · " + d.now.ride.score + "</span>";
        chip.setAttribute("aria-label", "Weather in " + d.place.name + ": " + d.now.temp + " degrees, " + describe(d.now.code) + ". " + d.now.ride.label + ". Tap for the full weather dashboard."); }
      else { chip.removeAttribute("data-tone"); t.textContent = wxState.error ? "Weather offline" : "Weather…"; }
    });
    var card = document.querySelector("[data-wx-card]");
    if (!card) return;
    var q = function (s) { return card.querySelector(s); };
    if (!d) {
      q("[data-wx-headline]").textContent = wxState.error || "Loading weather…";
      return;
    }
    q("[data-wx-place]").textContent = d.place.name;
    q("[data-wx-temp]").textContent = d.now.temp + "°F";
    q("[data-wx-desc]").textContent = describe(d.now.code) + " · wind " + d.now.wind + " mph";
    q("[data-wx-headline]").textContent = d.now.ride.label;
    q("[data-wx-score]").textContent = d.now.ride.score + " / 100";
    card.setAttribute("data-tone", d.now.ride.tone);
    q("[data-wx-hours]").innerHTML = d.hours.map(function (h) {
      return "<li><span>" + h.hour + "</span><strong>" + h.temp + "°</strong><span>" + h.pop + "%</span></li>";
    }).join("");
  }
  function loadWeather(p) {
    wxState.error = null;
    return fetchWeather(p).then(function (d) { wxState.data = d; paintWeather(); })
      .catch(function () { wxState.data = null; wxState.error = "Weather unavailable. Check your connection."; paintWeather(); });
  }
  function useMyLocation() {
    if (!navigator.geolocation) { wxState.error = "Location not supported on this device."; paintWeather(); return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      var p = { name: "Your location", lat: pos.coords.latitude, lon: pos.coords.longitude };
      store("gsdj-place", JSON.stringify(p));
      loadWeather(p);
    }, function () {
      wxState.error = "Location is off, showing " + DEFAULT_PLACE.name + ".";
      loadWeather(place());
    }, { timeout: 8000, maximumAge: 600000 });
  }
  function initWeather() {
    document.querySelectorAll("[data-wx-locate]").forEach(function (b) { b.addEventListener("click", useMyLocation); });
    document.querySelectorAll(".wx-chip").forEach(function (b) {
      b.addEventListener("click", function () { if (!document.body.hasAttribute("data-wx-page")) location.href = prefix() + "weather/"; });
    });
    loadWeather(place()); // never prompts; uses saved or default location
  }

  /* ---- journey bar + header controls ------------------------------------------- */
  var STEPS = [
    ["Get out", "weather/"], ["Record", "mic/"], ["Produce", "sampler/"], ["Master", null],
    ["Distribute", null], ["Mix", "mixer/"], ["Play", "player/"], ["Get found", null]
  ];
  function prefix() {
    var a = document.querySelector(".brand");
    return a && /^\.\.\//.test(a.getAttribute("href") || "") ? "../" : "";
  }
  function initHeader() {
    var header = document.querySelector(".site-header");
    var inner = header && header.querySelector(".site-header-inner");
    if (!inner) return;
    var menu = document.getElementById("menu-btn");
    if (!inner.querySelector(".wx-chip")) {
      var w = document.createElement("button");
      w.type = "button"; w.className = "wx-chip";
      w.innerHTML = '<span class="wx-dot" aria-hidden="true"></span><span class="wx-chip-text">Weather…</span>';
      inner.insertBefore(w, document.getElementById("session-chip") || menu);
    }
    if (!inner.querySelector(".theme-btn")) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "icon-btn theme-btn"; t.setAttribute("aria-label", "Choose theme");
      t.innerHTML = '<span class="theme-dot"></span>';
      t.addEventListener("click", function () { drawerApi.open(); });
      inner.insertBefore(t, menu);
    }
    if (document.body.hasAttribute("data-no-journey")) return;
    var pre = prefix(), path = location.pathname, html = '<ol class="wrap journey-list">';
    STEPS.forEach(function (s, i) {
      var num = '<span class="journey-num">' + (i + 1) + "</span>";
      if (!s[1]) { html += '<li><a class="is-soon" href="' + pre + 'index.html#journey">' + num + s[0] + "</a></li>"; return; }
      var here = s[1].indexOf("/") === s[1].length - 1 && path.indexOf("/" + s[1]) !== -1;
      html += '<li><a href="' + pre + s[1] + '"' + (here ? ' aria-current="step"' : "") + ">" + num + s[0] + "</a></li>";
    });
    var nav = document.createElement("nav");
    nav.className = "journey-bar"; nav.setAttribute("aria-label", "Your session path");
    nav.innerHTML = html + "</ol>";
    header.insertAdjacentElement("afterend", nav);
  }

  function initMarks() {
    var fw = document.querySelector(".site-footer .wrap");
    if (fw && !fw.querySelector(".footer-mark")) {
      var d = document.createElement("div"); d.className = "footer-mark";
      d.innerHTML = '<span class="sun-mark" style="--mark:84px" aria-hidden="true"></span><span class="wordmark">GoldenSun <span class="dj">DJ</span></span>';
      fw.insertBefore(d, fw.firstChild);
    }
    var dr = document.getElementById("drawer");
    if (dr && !dr.querySelector(".drawer-mark")) {
      var m = document.createElement("span"); m.className = "sun-mark drawer-mark"; m.style.setProperty("--mark", "120px"); m.setAttribute("aria-hidden", "true"); dr.appendChild(m);
    }
  }
  function initYear() { var y = document.getElementById("year"); if (y) y.textContent = String(new Date().getFullYear()); }

  window.GSDJ = { setTheme: setTheme, setChip: setChip, theme: currentTheme, themes: THEMES };

  function init() {
    buildSwatches(); initChipDefault(); initDrawer(); initHeader(); initMarks(); initYear(); initWeather();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
