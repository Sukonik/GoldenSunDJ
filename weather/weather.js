/* GoldenSunDJ — DJ weather dashboard. Open-Meteo (no key). Location stays in this browser. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var DEFAULT = { name: "Long Beach, NY", lat: 40.5884, lon: -73.6579 };
  var state = { place: null, data: null, aqi: null, units: "imperial" };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function T(f) { return state.units === "metric" ? Math.round((f - 32) * 5 / 9) : Math.round(f); }
  function TU() { return state.units === "metric" ? "°C" : "°F"; }
  function S(mph) { return state.units === "metric" ? Math.round(mph * 1.609) : Math.round(mph); }
  function SU() { return state.units === "metric" ? "km/h" : "mph"; }
  function clock(iso) { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
  function hour(iso) { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric" }); }
  function day(iso, i) { return i === 0 ? "Today" : new Date(iso + "T12:00").toLocaleDateString("en-US", { weekday: "short" }); }
  function describe(c) {
    if (c === 0) return "Clear"; if (c <= 2) return "Partly cloudy"; if (c === 3) return "Overcast";
    if (c === 45 || c === 48) return "Fog"; if (c >= 51 && c <= 57) return "Drizzle";
    if (c >= 61 && c <= 67) return "Rain"; if (c >= 71 && c <= 77) return "Snow";
    if (c >= 80 && c <= 82) return "Showers"; if (c >= 95) return "Thunderstorm"; return "Cloudy";
  }
  function score(p) {
    var s = 100;
    s -= Math.max(0, p.wind - 8) * 2;
    s -= Math.max(0, (p.gust || 0) - 20) * 0.8;
    if (p.feels < 50) s -= (50 - p.feels) * 1.6; else if (p.feels > 82) s -= (p.feels - 82) * 2.2;
    s -= (p.pop || 0) * 0.3;
    if (p.precip > 0.01) s -= 20;
    if (p.code >= 95) s -= 30;
    if (p.uv > 8) s -= (p.uv - 8) * 2;
    if (!p.day) s -= 10;
    s = Math.max(0, Math.min(100, Math.round(s)));
    var tone = s >= 80 ? "prime" : s >= 60 ? "good" : s >= 40 ? "fair" : "skip";
    return { score: s, tone: tone, label: { prime: "Great day to play outside", good: "Good to get out", fair: "Short session outside", skip: "Stay in and mix" }[tone] };
  }

  /* ---- data ---- */
  function url(p) {
    return "https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m,wind_gusts_10m,uv_index" +
      "&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,is_day,wind_speed_10m,wind_gusts_10m,uv_index,relative_humidity_2m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset" +
      "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&forecast_days=7&timezone=auto";
  }
  function getJSON(u) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(u, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    });
  }
  function shape(raw) {
    var c = raw.current, h = raw.hourly, d = raw.daily, start = 0, i;
    for (i = 0; i < h.time.length; i++) { if (h.time[i] >= c.time.slice(0, 13)) { start = i; break; } }
    var hours = [];
    for (i = start; i < h.time.length; i++) {
      var o = { time: h.time[i], temp: h.temperature_2m[i], feels: h.apparent_temperature[i], pop: h.precipitation_probability[i] || 0,
        precip: h.precipitation[i] || 0, code: h.weather_code[i], day: !!h.is_day[i], wind: h.wind_speed_10m[i], gust: h.wind_gusts_10m[i],
        uv: h.uv_index[i] || 0, hum: h.relative_humidity_2m[i] };
      o.ride = score(o); hours.push(o);
    }
    var now = { temp: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
      code: c.weather_code, day: !!c.is_day, precip: c.precipitation || 0, uv: c.uv_index || 0, pop: hours[0] ? hours[0].pop : 0, time: c.time };
    now.ride = score(now);
    var days = d.time.map(function (t, k) {
      var x = { date: t, code: d.weather_code[k], hi: d.temperature_2m_max[k], lo: d.temperature_2m_min[k], pop: d.precipitation_probability_max[k] || 0,
        precip: d.precipitation_sum[k], wind: d.wind_speed_10m_max[k], gust: d.wind_gusts_10m_max[k], uv: d.uv_index_max[k] || 0, sunrise: d.sunrise[k], sunset: d.sunset[k] };
      x.ride = score({ feels: (d.apparent_temperature_max[k] + d.apparent_temperature_min[k]) / 2, wind: x.wind * 0.75, gust: x.gust, pop: x.pop,
        precip: x.precip > 0.1 ? x.precip : 0, uv: x.uv, day: true, code: x.code });
      return x;
    });
    return { now: now, hours: hours, days: days };
  }

  /* ---- rendering ---- */
  function bestWindow(hours) {
    var best = null, span = 3, lim = Math.min(hours.length, 48) - span;
    for (var i = 0; i <= lim; i++) {
      var sum = 0, ok = true;
      for (var j = 0; j < span; j++) { if (!hours[i + j].day) ok = false; sum += hours[i + j].ride.score; }
      if (ok && (!best || sum > best.sum)) best = { i: i, sum: sum };
    }
    if (!best) return null;
    var a = hours[best.i], b = hours[best.i + span - 1];
    var dayName = new Date(a.time).toLocaleDateString("en-US", { weekday: "long" });
    return { text: dayName + " · " + hour(a.time) + " – " + hour(new Date(new Date(b.time).getTime() + 3600000)), avg: Math.round(best.sum / span), hour: a };
  }
  function tile(title, big, note, tone) {
    var t = el("article", "panel tile-x"); if (tone) t.setAttribute("data-tone", tone);
    t.appendChild(el("p", "label", title)); t.appendChild(el("p", "tile-big", big)); t.appendChild(el("p", "tile-note", note));
    return t;
  }
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function skyKind(c) { return c >= 95 ? "storm" : (c >= 71 && c <= 77) || c === 85 || c === 86 ? "snow" : (c >= 51 && c <= 67) || (c >= 80 && c <= 82) ? "rain" : c === 45 || c === 48 ? "fog" : c >= 2 ? "cloudy" : "clear"; }
  function paintSky(n) {
    var sky = $("#sky"); if (!sky) return;
    var k = skyKind(n.code); sky.className = "sky sky-" + k + (n.day ? "" : " is-night"); sky.textContent = "";
    function add(cls) { var e = document.createElement("span"); e.className = cls; sky.appendChild(e); return e; }
    add(n.day ? "orb sun" : "orb moon");
    if (!n.day) add("stars");
    if (k !== "clear") { add("cloud c1"); add("cloud c2"); add("cloud c3"); }
    if (k === "rain" || k === "storm") add("rain");
    if (k === "snow") add("snow");
    if (k === "storm") add("flash");
  }
  function countUp(node, to, unit) {
    if (REDUCED) { node.textContent = to + unit; return; }
    var t0 = performance.now(), dur = 700;
    function step(t) { var p = Math.min(1, (t - t0) / dur); node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + unit; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function stagger(parent) { Array.prototype.forEach.call(parent.children, function (c, i) { c.classList.add("animate-rise"); c.style.animationDelay = Math.min(i, 14) * 45 + "ms"; }); }

  function render() {
    var D = state.data; if (!D) return;
    var n = D.now, today = D.days[0];
    $("#now-place").textContent = state.place.name;
    countUp($("#now-temp"), T(n.temp), TU()); paintSky(n);
    $("#now-desc").textContent = describe(n.code);
    $("#now-meta").textContent = "Feels " + T(n.feels) + TU() + " · Wind " + S(n.wind) + " " + SU() + " · Humidity " + Math.round(n.hum) + "%";
    var sc = $("#now-score"); sc.setAttribute("data-tone", n.ride.tone);
    $("#score-num").textContent = n.ride.score; $("#score-lab").textContent = n.ride.label;
    var ring = $("#score-ring"); ring.style.setProperty("--p", "0"); requestAnimationFrame(function () { requestAnimationFrame(function () { ring.style.setProperty("--p", String(n.ride.score)); }); });

    // best window
    var bw = bestWindow(D.hours), best = $("#best"); best.textContent = "";
    if (bw) {
      best.appendChild(el("p", "best-when", bw.text));
      best.appendChild(el("p", "tile-note", "Best 3-hour daylight window in the next 48 hours. Average score " + bw.avg + " / 100."));
    } else best.appendChild(el("p", "tile-note", "No good daylight window in the next 48 hours. Plan an indoor session."));

    // event desk
    var tiles = $("#tiles"); tiles.textContent = "";
    var w = n.wind, g = n.gust || 0;
    tiles.appendChild(tile("Wind & sound", S(w) + " " + SU() + " · gusts " + S(g),
      g > 25 ? "Gusty. Tie down stands and skip tall speakers." : w > 15 ? "Windy. Sound will carry away; secure gear." : w > 8 ? "Use windscreens on mics." : "Calm. Sound carries clean.", g > 25 || w > 15 ? "skip" : w > 8 ? "fair" : "prime"));
    var rain6 = Math.max.apply(null, D.hours.slice(0, 6).map(function (h) { return h.pop; }));
    tiles.appendChild(tile("Rain risk", rain6 + "% next 6 h", rain6 >= 60 ? "Likely wet. Bring a tent or move indoors." : rain6 >= 30 ? "Chance of showers. Pack covers for gear." : "Dry window. Good to set up.", rain6 >= 60 ? "skip" : rain6 >= 30 ? "fair" : "prime"));
    var hot = n.temp > 90, cold = n.temp < 40, humid = n.hum > 80;
    tiles.appendChild(tile("Gear safety", T(n.temp) + TU() + " · " + Math.round(n.hum) + "% humidity",
      hot ? "Hot. Keep laptops and controllers in shade." : cold ? "Cold drains batteries. Keep gear warm." : humid ? "Humid. Bag your controller between sets." : "Gear-friendly conditions.", hot || cold ? "fair" : humid ? "fair" : "prime"));
    tiles.appendChild(tile("UV index", today.uv.toFixed(1) + " today", today.uv >= 8 ? "Very high. Shade your screens, sunscreen on." : today.uv >= 5 ? "High. Screens wash out in direct sun." : "Easy on you and your screens.", today.uv >= 8 ? "skip" : today.uv >= 5 ? "fair" : "prime"));
    var gh = new Date(new Date(today.sunset).getTime() - 3600000);
    tiles.appendChild(tile("Golden hour", clock(gh) + " – " + clock(today.sunset), "Sunrise " + clock(today.sunrise) + " · Sunset " + clock(today.sunset) + ". Best light for video.", "prime"));
    if (state.aqi != null) {
      var a = state.aqi, lab = a <= 50 ? "Good" : a <= 100 ? "Moderate" : a <= 150 ? "Unhealthy for some" : "Unhealthy";
      tiles.appendChild(tile("Air quality", "AQI " + Math.round(a) + " · " + lab, a <= 100 ? "Fine for a long outdoor set." : "Limit long sessions outside.", a <= 50 ? "prime" : a <= 100 ? "fair" : "skip"));
    }

    stagger(tiles);
    // hourly
    var hl = $("#hourly"); hl.textContent = "";
    D.hours.slice(0, 24).forEach(function (h) {
      var li = el("li", "hr"); li.setAttribute("data-tone", h.ride.tone);
      li.appendChild(el("span", "hr-time", hour(h.time)));
      li.appendChild(el("strong", "hr-temp", T(h.temp) + "°"));
      li.appendChild(el("span", "hr-desc", describe(h.code)));
      var bar = el("span", "hr-bar"); var fill = el("i"); fill.style.height = Math.max(4, h.pop) + "%"; bar.appendChild(fill); li.appendChild(bar);
      li.appendChild(el("span", "hr-meta", h.pop + "% · " + S(h.wind) + " " + SU()));
      hl.appendChild(li);
    });
    stagger(hl);
    // daily
    var dl = $("#daily"); dl.textContent = "";
    D.days.forEach(function (d, i) {
      var li = el("li", "dy"); li.setAttribute("data-tone", d.ride.tone);
      li.appendChild(el("strong", "dy-day", day(d.date, i)));
      li.appendChild(el("span", "dy-desc", describe(d.code)));
      li.appendChild(el("span", "dy-temp", T(d.hi) + "° / " + T(d.lo) + "°"));
      li.appendChild(el("span", "dy-meta", d.pop + "% rain · wind " + S(d.wind) + " " + SU()));
      li.appendChild(el("span", "pill", d.ride.score + " · " + d.ride.label));
      dl.appendChild(li);
    });
    stagger(dl);
    $("#wx-dash").hidden = false;
    $("#wx-status").textContent = "Updated " + new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " for " + state.place.name + ".";
    if (window.GSDJ) window.GSDJ.setChip({ text: "☀ " + T(n.temp) + TU() });
  }

  function load(p) {
    state.place = p; store("gsdj-place", JSON.stringify(p));
    $("#wx-status").textContent = "Loading the forecast for " + p.name + "…";
    state.aqi = null;
    getJSON("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + p.lat + "&longitude=" + p.lon + "&current=us_aqi")
      .then(function (j) { if (j && j.current && isFinite(j.current.us_aqi)) { state.aqi = j.current.us_aqi; render(); } }).catch(function () {});
    return getJSON(url(p)).then(function (raw) {
      if (!raw.current || !raw.hourly || !raw.daily) throw new Error("bad data");
      state.data = shape(raw); render();
    }).catch(function () {
      $("#wx-status").textContent = "Could not load the forecast. Check your connection and try again.";
    });
  }

  /* ---- places ---- */
  function savedPlaces() { try { return JSON.parse(store("gsdj-places")) || []; } catch (e) { return []; } }
  function savePlace(p) {
    var list = savedPlaces().filter(function (x) { return x.name !== p.name; }); list.unshift(p);
    store("gsdj-places", JSON.stringify(list.slice(0, 6))); renderSaved();
  }
  function renderSaved() {
    var host = $("#saved-places"); host.textContent = "";
    savedPlaces().forEach(function (p) {
      var b = el("button", "chip", p.name); b.type = "button";
      b.addEventListener("click", function () { load(p); });
      host.appendChild(b);
    });
  }
  function choose(p) { savePlace(p); $("#place-results").hidden = true; $("#place-q").value = ""; load(p); }
  function search(q) {
    var list = $("#place-results"); list.textContent = ""; list.hidden = false;
    list.appendChild(el("li", "pr-note", "Searching…"));
    getJSON("https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=" + encodeURIComponent(q)).then(function (j) {
      list.textContent = "";
      var rs = (j && j.results) || [];
      if (!rs.length) { list.appendChild(el("li", "pr-note", "No places found. Try a nearby city.")); return; }
      rs.forEach(function (r) {
        var name = r.name + (r.admin1 ? ", " + r.admin1 : "") + (r.country_code ? " · " + r.country_code : "");
        var li = el("li"); var b = el("button", "pr-btn", name); b.type = "button";
        b.addEventListener("click", function () { choose({ name: name, lat: r.latitude, lon: r.longitude }); });
        li.appendChild(b); list.appendChild(li);
      });
    }).catch(function () { list.textContent = ""; list.appendChild(el("li", "pr-note", "Search is unavailable right now.")); });
  }
  function locate() {
    if (!navigator.geolocation) { $("#wx-status").textContent = "Location is not supported on this device."; return; }
    $("#wx-status").textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      choose({ name: "Your location", lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, function () { $("#wx-status").textContent = "Location is off. Search a city instead."; }, { timeout: 8000, maximumAge: 600000 });
  }

  function setUnits(u) {
    state.units = u; store("gsdj-units", u);
    document.querySelectorAll("[data-units]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-units") === u ? "true" : "false"); });
    render();
  }

  function init() {
    state.units = store("gsdj-units") === "metric" ? "metric" : "imperial";
    document.querySelectorAll("[data-units]").forEach(function (b) { b.addEventListener("click", function () { setUnits(b.getAttribute("data-units")); }); });
    setUnits(state.units);
    $("#place-form").addEventListener("submit", function (e) { e.preventDefault(); var q = $("#place-q").value.trim(); if (q.length > 1) search(q); });
    $("#locate").addEventListener("click", locate);
    renderSaved();
    var p; try { p = JSON.parse(store("gsdj-place")); } catch (e) {}
    load(p && isFinite(p.lat) && isFinite(p.lon) ? p : DEFAULT);
  }
  init();
})();
