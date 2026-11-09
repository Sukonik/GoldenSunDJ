/* GoldenSunDJ Controller. Vanilla. Two (or one) scratch pads, EQ, tempo, hot cues, echo.
   Each deck is an <audio loop> with a Web Audio chain built on first Play:
   source -> low -> mid -> high -> channel gain -> analyser -> crossfade gain -> master -> out.
   Scratching: dragging the pad seeks the audio by angle and bends pitch with drag speed. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var ctlEl = document.querySelector(".ctl");
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var fmt = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  var REV_SECONDS = 60 / 33; // 33 rpm
  var KEY = "gsdj-ctl";
  var statusEl = $("ctl-status");
  function say(t) { if (statusEl) statusEl.textContent = t; }

  /* ---------- settings (wheel) ---------- */
  var settings = { decks: 2, eq: true, tempo: true, cues: true, fx: true, fader: true, theme: "night-club" };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var k in saved) if (k in settings) settings[k] = saved[k]; } catch (e) {}
  function applySettings() {
    ctlEl.setAttribute("data-decks", String(settings.decks));
    ["eq", "tempo", "cues", "fx", "fader"].forEach(function (f) { ctlEl.setAttribute("data-" + f, settings[f] ? "on" : "off"); });
    ctlEl.setAttribute("data-ctl-theme", settings.theme);
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
    applyCross();
  }

  /* ---------- audio ---------- */
  var actx = null, master = null, echoDelay = null, echoWet = null, echoFb = null;
  function ensureCtx() {
    if (actx) { if (actx.state === "suspended") actx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { say("This browser cannot play Web Audio."); return false; }
    actx = new AC(); master = actx.createGain(); master.gain.value = parseFloat($("master").value) / 100;
    echoDelay = actx.createDelay(1); echoDelay.delayTime.value = 0.3; echoFb = actx.createGain(); echoFb.gain.value = 0.4; echoWet = actx.createGain(); echoWet.gain.value = 0;
    master.connect(actx.destination); master.connect(echoDelay); echoDelay.connect(echoFb); echoFb.connect(echoDelay); echoDelay.connect(echoWet); echoWet.connect(actx.destination);
    return true;
  }

  function makeDeck(id, bpm) {
    var d = { id: id, bpm: bpm || 0, audio: new Audio(), url: null, built: false, nodes: null, cues: [null, null, null, null], cuePoint: 0, angle: 0, dragging: false, tempo: 0,
      el: { platter: $("platter-" + id), disc: $("disc-" + id), time: $("time-" + id), title: $("title-" + id), bpm: $("bpm-" + id), play: $("play-" + id), meter: $("meter-" + id) } };
    d.audio.loop = true; d.audio.preload = "auto"; d.audio.setAttribute("playsinline", "");
    return d;
  }
  var decks = [makeDeck("a", 124), makeDeck("b", 128)], byId = { a: decks[0], b: decks[1] };

  function build(d) {
    if (d.built) return true; if (!ensureCtx()) return false;
    try {
      var src = actx.createMediaElementSource(d.audio);
      var low = actx.createBiquadFilter(); low.type = "lowshelf"; low.frequency.value = 200;
      var mid = actx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 0.9;
      var high = actx.createBiquadFilter(); high.type = "highshelf"; high.frequency.value = 4000;
      var an = actx.createAnalyser(); an.fftSize = 256; var cross = actx.createGain();
      src.connect(low); low.connect(mid); mid.connect(high); high.connect(an); an.connect(cross); cross.connect(master);
      d.nodes = { low: low, mid: mid, high: high, an: an, cross: cross, data: new Uint8Array(an.fftSize) }; d.built = true;
      ["low", "mid", "high"].forEach(function (b) { d.nodes[b].gain.value = parseFloat($("eq-" + b + "-" + d.id).value); });
      applyCross(); return true;
    } catch (e) { say("Audio routing failed. Playback still works without EQ."); return false; }
  }
  function applyCross() {
    var x = settings.decks === 2 && settings.fader ? parseFloat($("xfade").value) / 100 : 0; // -1..1
    var ga = settings.decks === 2 && settings.fader ? Math.cos((x + 1) * Math.PI / 4) : 1, gb = settings.decks === 2 && settings.fader ? Math.cos((1 - x) * Math.PI / 4) : 0;
    if (byId.a.nodes) byId.a.nodes.cross.gain.value = ga; if (byId.b.nodes) byId.b.nodes.cross.gain.value = gb;
  }
  function rate(d) { return 1 + d.tempo / 100; }
  function setBpm(d) { d.el.bpm.textContent = d.bpm ? (d.bpm * rate(d)).toFixed(1) : "--"; }

  /* ---------- transport ---------- */
  function updatePlayUi(d) { var on = !d.audio.paused; d.el.play.setAttribute("aria-pressed", on ? "true" : "false"); d.el.play.textContent = on ? "Pause" : "Play"; chip(); loopOn(); }
  function chip() {
    if (!window.GSDJ) return; var n = decks.filter(function (d) { return !d.audio.paused; }).length;
    window.GSDJ.setChip({ text: n ? "◉ " + n + " playing" : "◉ Controller", live: n > 0 });
  }
  function togglePlay(d) {
    if (!d.audio.src) { say("Deck " + d.id.toUpperCase() + " has no track yet. Tap Load."); return; }
    build(d); ensureCtx();
    if (d.audio.paused) { d.audio.playbackRate = rate(d); var p = d.audio.play(); if (p && p.catch) p.catch(function () { say("Tap again to start audio."); }); } else d.audio.pause();
    updatePlayUi(d);
  }
  decks.forEach(function (d) {
    d.el.play.addEventListener("click", function () { togglePlay(d); });
    $("cue-" + d.id).addEventListener("click", function () {
      if (!d.audio.src) return;
      if (d.audio.paused) { d.cuePoint = d.audio.currentTime; say("Cue set at " + fmt(d.cuePoint) + "."); }
      else { d.audio.currentTime = d.cuePoint; d.audio.pause(); updatePlayUi(d); }
      if (navigator.vibrate) navigator.vibrate(8);
    });
    // hot cues: tap = set or jump, hold = clear
    document.querySelectorAll("#deck-" + d.id + " .cue").forEach(function (b) {
      var i = +b.getAttribute("data-cue"), timer = null, held = false;
      b.addEventListener("pointerdown", function () { held = false; timer = setTimeout(function () { held = true; d.cues[i] = null; b.classList.remove("is-set"); say("Cue " + (i + 1) + " cleared."); }, 600); });
      function end() { clearTimeout(timer); }
      b.addEventListener("pointerup", end); b.addEventListener("pointerleave", end); b.addEventListener("pointercancel", end);
      b.addEventListener("click", function () {
        if (held || !d.audio.src) return;
        if (d.cues[i] == null) { d.cues[i] = d.audio.currentTime; b.classList.add("is-set"); say("Cue " + (i + 1) + " set at " + fmt(d.cues[i]) + "."); }
        else { d.audio.currentTime = d.cues[i]; }
        if (navigator.vibrate) navigator.vibrate(8);
      });
    });
    $("tempo-" + d.id).addEventListener("input", function () { d.tempo = parseFloat(this.value) || 0; $("tempo-out-" + d.id).textContent = (d.tempo > 0 ? "+" : "") + d.tempo.toFixed(1) + "%"; if (!d.dragging) d.audio.playbackRate = rate(d); setBpm(d); });
    ["low", "mid", "high"].forEach(function (b) { $("eq-" + b + "-" + d.id).addEventListener("input", function () { if (d.nodes) d.nodes[b].gain.value = parseFloat(this.value); }); });
    $("file-" + d.id).addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      if (d.url) URL.revokeObjectURL(d.url); d.url = URL.createObjectURL(f); d.audio.src = d.url; d.bpm = 0; d.cues = [null, null, null, null];
      document.querySelectorAll("#deck-" + d.id + " .cue").forEach(function (c) { c.classList.remove("is-set"); });
      d.el.title.textContent = f.name; setBpm(d); say("Loaded " + f.name + " on deck " + d.id.toUpperCase() + "."); this.value = "";
    });
  });
  $("xfade").addEventListener("input", applyCross);
  $("master").addEventListener("input", function () { if (master) master.gain.value = parseFloat(this.value) / 100; });
  $("echo-btn").addEventListener("click", function () { var on = this.getAttribute("aria-pressed") !== "true"; this.setAttribute("aria-pressed", on ? "true" : "false"); ensureCtx(); if (echoWet) echoWet.gain.value = on ? 0.5 : 0; });

  /* ---------- scratch pad ---------- */
  function angleOf(d, e) { var r = d.el.platter.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
  decks.forEach(function (d) {
    var last = 0, lastT = 0, wasPlaying = false;
    d.el.platter.addEventListener("pointerdown", function (e) {
      if (!d.audio.src) { say("Load a track or wait for the demo loop."); return; }
      e.preventDefault(); build(d); ensureCtx();
      d.dragging = true; last = angleOf(d, e); lastT = performance.now(); wasPlaying = !d.audio.paused;
      if (!wasPlaying) { d.audio.playbackRate = 1; var p = d.audio.play(); if (p && p.catch) p.catch(function () {}); }
      try { d.el.platter.setPointerCapture(e.pointerId); } catch (x) {} loopOn();
    });
    d.el.platter.addEventListener("pointermove", function (e) {
      if (!d.dragging) return;
      var a = angleOf(d, e), delta = a - last; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; last = a;
      var now = performance.now(), dt = Math.max(8, now - lastT) / 1000; lastT = now;
      d.angle += delta;
      var dur = d.audio.duration; if (isFinite(dur) && dur > 0) { var t = d.audio.currentTime + (delta / 360) * REV_SECONDS; d.audio.currentTime = ((t % dur) + dur) % dur; }
      var vel = (delta / dt) / (360 / REV_SECONDS);            // 1 = normal speed
      d.audio.playbackRate = clamp(Math.abs(vel) < 0.05 ? 0.25 : Math.abs(vel), 0.25, 3);
    });
    function end(e) {
      if (!d.dragging) return; d.dragging = false; d.audio.playbackRate = rate(d);
      if (!wasPlaying) { d.audio.pause(); }
      if (e && e.pointerId !== undefined) { try { d.el.platter.releasePointerCapture(e.pointerId); } catch (x) {} }
      updatePlayUi(d);
    }
    d.el.platter.addEventListener("pointerup", end); d.el.platter.addEventListener("pointercancel", end);
    d.el.platter.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; var dur = d.audio.duration; if (!isFinite(dur) || dur <= 0) return;
      d.audio.currentTime = ((d.audio.currentTime + (e.key === "ArrowRight" ? 0.25 : -0.25)) % dur + dur) % dur; e.preventDefault();
    });
  });

  /* ---------- one animation loop, only while something moves ---------- */
  var raf = null, prev = 0;
  function loopOn() { if (raf == null) { prev = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    var dt = (now - prev) / 1000; prev = now;
    var busy = false;
    decks.forEach(function (d) {
      var playing = !d.audio.paused;
      if (playing || d.dragging) busy = true;
      if (playing && !d.dragging) d.angle += rate(d) * (360 / REV_SECONDS) * dt;
      d.el.disc.style.transform = "rotate(" + d.angle.toFixed(1) + "deg)";
      var dur = d.audio.duration; d.el.time.textContent = fmt(d.audio.currentTime) + (isFinite(dur) ? " / " + fmt(dur) : "");
      d.el.platter.setAttribute("aria-valuenow", isFinite(dur) && dur > 0 ? String(Math.round(d.audio.currentTime / dur * 100)) : "0");
      if (d.nodes && playing) { d.nodes.an.getByteTimeDomainData(d.nodes.data); var s = 0; for (var i = 0; i < d.nodes.data.length; i++) { var v = (d.nodes.data[i] - 128) / 128; s += v * v; } d.el.meter.style.width = clamp(Math.sqrt(s / d.nodes.data.length) * 260, 0, 100) + "%"; }
      else d.el.meter.style.width = "0%";
    });
    raf = busy ? requestAnimationFrame(tick) : null;
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { decks.forEach(function (d) { if (!d.audio.paused) { d.audio.pause(); updatePlayUi(d); } }); } });

  /* ---------- demo loops (idle) ---------- */
  function loadDemo(d, fn, name) {
    return fn().then(function (buf) { d.url = URL.createObjectURL(window.GSDJDemo.bufferToWavBlob(buf)); d.audio.src = d.url; d.el.title.textContent = name + " · synthesized"; setBpm(d); })
      .catch(function (err) { console.error("demo", err && err.message); d.el.title.textContent = "Demo unavailable. Tap Load."; });
  }
  function startDemos() {
    if (!window.GSDJDemo || !(window.OfflineAudioContext || window.webkitOfflineAudioContext)) { decks.forEach(function (d) { d.el.title.textContent = "Tap Load to add a track"; }); return; }
    Promise.all([loadDemo(byId.a, GSDJDemo.renderHouseLoop, "House loop"), loadDemo(byId.b, GSDJDemo.renderTechnoLoop, "Techno loop")]).then(function () { say("Ready. Tap Play, drag a pad to scratch."); });
  }
  if (window.requestIdleCallback) requestIdleCallback(startDemos, { timeout: 2000 }); else setTimeout(startDemos, 300);

  /* ---------- settings wheel ---------- */
  var ITEMS = [
    { id: "decks", icon: "◎", label: function () { return settings.decks + " deck" + (settings.decks > 1 ? "s" : ""); }, on: function () { return settings.decks === 2; }, tap: function () { settings.decks = settings.decks === 2 ? 1 : 2; } },
    { id: "eq", icon: "≋", label: function () { return "EQ"; }, on: function () { return settings.eq; }, tap: function () { settings.eq = !settings.eq; } },
    { id: "tempo", icon: "↕", label: function () { return "Tempo"; }, on: function () { return settings.tempo; }, tap: function () { settings.tempo = !settings.tempo; } },
    { id: "cues", icon: "▦", label: function () { return "Cues"; }, on: function () { return settings.cues; }, tap: function () { settings.cues = !settings.cues; } },
    { id: "fx", icon: "∿", label: function () { return "Echo"; }, on: function () { return settings.fx; }, tap: function () { settings.fx = !settings.fx; } },
    { id: "fader", icon: "↔", label: function () { return "Fader"; }, on: function () { return settings.fader; }, tap: function () { settings.fader = !settings.fader; } },
    { id: "themes", icon: "◐", label: function () { return "Themes"; }, on: function () { return false; }, tap: function () { showThemes(true); } }
  ];
  if (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) {
    ITEMS.push({ id: "full", icon: "⛶", label: function () { return "Full"; }, on: function () { return !!document.fullscreenElement; }, tap: function () {
      var el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } });
  }
  var ring = $("wheel-ring");
  function drawWheel() {
    ring.textContent = "";
    ITEMS.forEach(function (it, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "wheel-item"; b.style.setProperty("--ang", (i * 360 / ITEMS.length) + "deg");
      b.setAttribute("aria-pressed", it.on() ? "true" : "false");
      b.innerHTML = "<b aria-hidden=\"true\">" + it.icon + "</b><span>" + it.label() + "</span>";
      b.addEventListener("click", function () { it.tap(); applySettings(); drawWheel(); });
      ring.appendChild(b);
    });
  }
  var THEMES = [["night-club", "Night Club", "Club black", "#ff9f1c", "#35d0ff"], ["chrome-plate", "Chrome Plate", "Silver deck", "#dfe6ee", "#8fd3ff"], ["neon-grid", "Neon Grid", "Magenta + cyan", "#ff3df0", "#2bf5ff"], ["gold-rush", "Gold Rush", "Gold plate", "#ffc933", "#ff7a1a"],
    ["glacier", "Glacier", "Ice blue", "#6ee7ff", "#a78bff"], ["magma", "Magma", "Hot red", "#ff4d2e", "#ffb03d"], ["violet-haze", "Violet Haze", "Purple haze", "#b56bff", "#ff6bd0"], ["jade-rack", "Jade Rack", "Green rack", "#3dff9a", "#c8ff3d"]];
  function drawThemes() {
    var host = $("ctl-themes"); host.textContent = "";
    THEMES.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.className = "ctl-theme"; b.style.setProperty("--ta", t[3]); b.style.setProperty("--tb", t[4]); b.setAttribute("aria-pressed", settings.theme === t[0] ? "true" : "false");
      b.innerHTML = "<i aria-hidden=\"true\"></i><span>" + t[1] + "<small>" + t[2] + "</small></span>";
      b.addEventListener("click", function () { settings.theme = t[0]; applySettings(); drawThemes(); });
      host.appendChild(b);
    });
  }
  function showThemes(on) { $("themes-sheet").hidden = !on; document.querySelector(".wheel-wrap").style.display = on ? "none" : ""; if (on) drawThemes(); }
  function openWheel(open) { $("wheel").hidden = !open; $("wheel-btn").setAttribute("aria-expanded", open ? "true" : "false"); if (open) { showThemes(false); drawWheel(); } else $("wheel-btn").focus(); }
  $("wheel-btn").addEventListener("click", function () { openWheel(true); });
  $("wheel-close").addEventListener("click", function () { openWheel(false); });
  $("themes-back").addEventListener("click", function () { showThemes(false); });
  $("wheel").addEventListener("click", function (e) { if (e.target === this) openWheel(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("wheel").hidden) openWheel(false); });

  applySettings(); decks.forEach(setBpm); loopOn();
})();
