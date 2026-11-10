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
  var sayTimer = null;
  function say(t) { if (!statusEl) return; statusEl.textContent = t; clearTimeout(sayTimer); sayTimer = setTimeout(function () { statusEl.textContent = ""; }, 5000); }

  /* ---------- settings (wheel) ---------- */
  var settings = { decks: 2, eq: "1", tempo: true, cues: true, fx: true, fader: true, theme: "night-club", material: "matte", tilt: false, wave: false, sampler: false, fxu: false, loop: false, tips: false, patterns: false,
    scratch: { preset: "natural", mode: "scratch", sens: 1, weight: 0.5, ret: 0.25, brake: true, slip: false } };
  var SCRATCH_DEFAULT = JSON.parse(JSON.stringify(settings.scratch));
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var k in saved) if (k in settings) settings[k] = saved[k]; } catch (e) {}
  try { settings.scratch = Object.assign({}, SCRATCH_DEFAULT, (saved && saved.scratch) || {}); } catch (e) {}
  if (settings.eq === true) settings.eq = "1"; if (settings.eq === false) settings.eq = "off";
  try { if (saved && saved.pads) { settings.sampler = true; settings.fxu = true; } } catch (e) {}
  var hooks = { after: [], frame: [], load: [] };
  function applySettings() {
    ctlEl.setAttribute("data-decks", String(settings.decks));
    ["tempo", "cues", "fx", "fader"].forEach(function (f) { ctlEl.setAttribute("data-" + f, settings[f] ? "on" : "off"); });
    ctlEl.setAttribute("data-eq", settings.eq);
    ctlEl.setAttribute("data-ctl-theme", settings.theme);
    ctlEl.setAttribute("data-material", settings.material);
    ["wave", "sampler", "fxu", "loop", "patterns"].forEach(function (f) { ctlEl.setAttribute("data-" + f, settings[f] ? "on" : "off"); });
    hooks.after.forEach(function (f) { f(); }); if (!settings.tips) $("tip").hidden = true;
    setTilt(settings.tilt && settings.material !== "matte");
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
    actx.onstatechange = function () { if (actx.state !== "running" && actx.state !== "closed") resumeAudio(); };
    master.connect(actx.destination); master.connect(echoDelay); echoDelay.connect(echoFb); echoFb.connect(echoDelay); echoDelay.connect(echoWet); echoWet.connect(actx.destination);
    return true;
  }

  /* ---------- keep audio running (iOS can suspend or interrupt the audio engine) ---------- */
  function resumeAudio() { if (actx && actx.state !== "running" && actx.state !== "closed") { try { var p = actx.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} } }
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) { document.addEventListener(ev, resumeAudio, true); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) resumeAudio(); });
  window.addEventListener("pageshow", resumeAudio); window.addEventListener("focus", resumeAudio);

  function makeDeck(id, bpm) {
    var d = { id: id, bpm: bpm || 0, audio: new Audio(), url: null, built: false, nodes: null, cues: [null, null, null, null], cuePoint: 0, angle: 0, pk: null, file: null, src: null, owned: false, loop: { on: false, i: 2, start: 0, end: 0 }, dragging: false, tempo: 0,
      el: { wave: $("wave-" + id), platter: $("platter-" + id), disc: $("disc-" + id), time: $("time-" + id), title: $("title-" + id), bpm: $("bpm-" + id), play: $("play-" + id), meter: $("meter-" + id) } };
    d.audio.crossOrigin = "anonymous"; d.audio.loop = true; d.audio.preload = "auto"; d.audio.setAttribute("playsinline", "");
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
      var flt = actx.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 20000; flt.Q.value = 0.8;
      var an = actx.createAnalyser(); an.fftSize = 256; var cross = actx.createGain();
      var elg = actx.createGain(); src.connect(elg); elg.connect(low); low.connect(mid); mid.connect(high); high.connect(flt); var gate = actx.createGain(); flt.connect(gate); gate.connect(an); an.connect(cross); cross.connect(master);
      d.nodes = { gate: gate, elg: elg, low: low, mid: mid, high: high, flt: flt, an: an, cross: cross, data: new Uint8Array(an.fftSize) }; d.built = true;
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
  function posOf(d) { return d.livePos != null ? d.livePos : d.audio.currentTime; }
  function setBpm(d) { d.el.bpm.textContent = d.bpm ? (d.bpm * rate(d)).toFixed(1) : "--"; }

  /* ---------- loading a track onto a deck (Load, Library and Link all come through here) ---------- */
  function loadSource(d, src, o) {
    o = o || {};
    d.audio.pause(); if (d.url && d.owned) URL.revokeObjectURL(d.url);
    d.url = src; d.owned = !!o.blob; d.src = o.meta || null; d.file = o.file || null; d.pk = o.pk || null;
    d.audio.src = src; d.audio.load();
    d.bpm = o.bpm || 0; d.gridOffset = o.bpm ? 0 : null; d.bpmFrom = o.bpm ? "known" : null; d.el.bpm.classList.remove("is-auto"); d.tempo = 0; $("tempo-" + d.id).value = 0; $("tempo-out-" + d.id).textContent = "0%";
    restoreCues(d, o);
    d.loop.on = false; if (typeof loopUi === "function") loopUi(d);
    d.el.title.textContent = o.title || "Track"; setBpm(d); updatePlayUi(d);
    hooks.load.forEach(function (f) { f(d); });
  }


  /* ---------- cues: simple, visible and remembered ---------- */
  var cueNames = ["Save", "Save", "Save", "Save"];
  function snapT(d, t) {                                  // snap to the nearest beat when the tempo is known
    if (!d.bpm || d.gridOffset == null) return t; var b = 60 / d.bpm;
    var n = Math.round((t - d.gridOffset) / b) * b + d.gridOffset; return Math.max(0, Math.min(isFinite(d.audio.duration) ? d.audio.duration - 0.05 : n, n));
  }
  function trackKey(d) {
    var m = d.src; if (!m) return null;
    if (m.kind === "genre") return "g:" + m.id; if (m.kind === "audius") return "a:" + m.id;
    if (m.kind === "file" && d.file) return "f:" + d.file.name + ":" + d.file.size; return null;
  }
  function saveCues(d) {
    var k = trackKey(d); if (!k) return;
    try { var all = JSON.parse(localStorage.getItem("gsdj-cues") || "{}"); all[k] = { c: d.cues, n: d.cueLabels || [], p: d.cuePoint || 0, u: Date.now() };
      var keys = Object.keys(all); if (keys.length > 60) { keys.sort(function (x, y) { return all[x].u - all[y].u; }).slice(0, keys.length - 60).forEach(function (kk) { delete all[kk]; }); }
      localStorage.setItem("gsdj-cues", JSON.stringify(all)); } catch (e) {}
  }
  function restoreCues(d, o) {
    d.cues = [null, null, null, null]; d.cueLabels = [null, null, null, null]; d.cuePoint = 0;
    var k = trackKey(d), saved = null;
    try { if (k) saved = JSON.parse(localStorage.getItem("gsdj-cues") || "{}")[k]; } catch (e) {}
    if (saved) { d.cues = (saved.c || []).slice(0, 4); while (d.cues.length < 4) d.cues.push(null); d.cueLabels = (saved.n || []).slice(0, 4); d.cuePoint = saved.p || 0; }
    else if (o && o.cues) { o.cues.slice(0, 4).forEach(function (c, i) { d.cues[i] = c.time; d.cueLabels[i] = c.name; }); }
    paintCues(d);
  }
  function paintCues(d) {
    document.querySelectorAll("#deck-" + d.id + " .cue").forEach(function (b, i) {
      var t = d.cues[i], on = t != null, sm = b.querySelector("small");
      b.classList.toggle("is-set", on); b.setAttribute("aria-label", on ? "Hot cue " + (i + 1) + (d.cueLabels && d.cueLabels[i] ? ", " + d.cueLabels[i] : "") + " at " + fmt(t) + ". Tap to jump. Hold to clear." : "Hot cue " + (i + 1) + ", empty. Tap to save this spot.");
      if (sm) sm.textContent = on ? ((d.cueLabels && d.cueLabels[i]) || fmt(t)) : "Save";
    });
  }
  var toastTimers = {};
  function toast(d, msg) {
    var el = $("toast-" + d.id); if (!el) return say(msg);
    el.textContent = msg; el.hidden = false; clearTimeout(toastTimers[d.id]); toastTimers[d.id] = setTimeout(function () { el.hidden = true; }, 2600);
    say(msg);
  }
  function firstTimeHelp(d) {
    try { if (localStorage.getItem("gsdj-cue-help")) return; localStorage.setItem("gsdj-cue-help", "1"); } catch (e) { return; }
    setTimeout(function () { toast(d, "Tip: hot cues are bookmarks. Tap an empty one to save this spot, tap it again to jump back. Hold to clear."); }, 1800);
  }
  function wireCues(d) {
    var cb = $("cue-" + d.id), previewing = false, pid = null;
    // Cue: paused = set the return point here and listen while you hold; playing = jump back to the return point and pause
    cb.addEventListener("pointerdown", function (e) {
      if (!d.audio.src) { say("Load a track first. Tap Load."); return; }
      e.preventDefault(); pid = e.pointerId; build(d); ensureCtx(); if (navigator.vibrate) navigator.vibrate(8);
      if (d.audio.paused) {
        d.cuePoint = snapT(d, d.audio.currentTime); saveCues(d); previewing = true; cb.classList.add("is-down");
        d.audio.currentTime = d.cuePoint; d.audio.playbackRate = rate(d); var p = d.audio.play(); if (p && p.catch) p.catch(function () {});
        toast(d, "Cue set at " + fmt(d.cuePoint) + ". Hold to listen, let go to return."); updatePlayUi(d);
      } else {
        d.audio.currentTime = d.cuePoint; d.audio.pause(); updatePlayUi(d); toast(d, "Back at the cue point (" + fmt(d.cuePoint) + "). Press Play to go.");
      }
    });
    function up(e) { if (!previewing || (e && e.pointerId !== undefined && pid !== null && e.pointerId !== pid)) return; previewing = false; cb.classList.remove("is-down"); d.audio.pause(); d.audio.currentTime = d.cuePoint; updatePlayUi(d); }
    cb.addEventListener("pointerup", up); cb.addEventListener("pointercancel", up); cb.addEventListener("pointerleave", up);
    window.addEventListener("blur", function () { up(); });
    // hot cues: tap empty = save here, tap saved = jump, hold saved = clear
    document.querySelectorAll("#deck-" + d.id + " .cue").forEach(function (b) {
      var i = +b.getAttribute("data-cue"), timer = null, held = false;
      b.addEventListener("pointerdown", function () { held = false; clearTimeout(timer); if (d.cues[i] == null) return; timer = setTimeout(function () { held = true; d.cues[i] = null; if (d.cueLabels) d.cueLabels[i] = null; paintCues(d); saveCues(d); toast(d, "Hot cue " + (i + 1) + " cleared."); if (navigator.vibrate) navigator.vibrate([10, 40, 10]); }, 600); });
      function end() { clearTimeout(timer); }
      b.addEventListener("pointerup", end); b.addEventListener("pointerleave", end); b.addEventListener("pointercancel", end);
      b.addEventListener("click", function () {
        if (held || !d.audio.src) { if (!d.audio.src) say("Load a track first. Tap Load."); return; }
        if (d.cues[i] == null) {
          var t = snapT(d, d.audio.currentTime); d.cues[i] = t; if (!d.cueLabels) d.cueLabels = [null, null, null, null]; d.cueLabels[i] = null; paintCues(d); saveCues(d);
          toast(d, "Hot cue " + (i + 1) + " saved at " + fmt(t) + (d.bpm ? " (on the beat)" : "") + ". Tap it again to jump back here."); firstTimeHelp(d);
        } else {
          var was = !d.audio.paused; d.audio.currentTime = d.cues[i]; d.livePos = null;
          b.classList.add("is-hit"); setTimeout(function () { b.classList.remove("is-hit"); }, 180);
          toast(d, "Jumped to hot cue " + (i + 1) + (d.cueLabels && d.cueLabels[i] ? " (" + d.cueLabels[i] + ")" : "") + " at " + fmt(d.cues[i]) + (was ? "" : ". Press Play."));
        }
        if (navigator.vibrate) navigator.vibrate(8);
      });
    });
  }

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
    wireCues(d);
    $("tempo-" + d.id).addEventListener("input", function () { d.tempo = parseFloat(this.value) || 0; $("tempo-out-" + d.id).textContent = (d.tempo > 0 ? "+" : "") + d.tempo.toFixed(1) + "%"; if (!d.dragging) d.audio.playbackRate = rate(d); setBpm(d); });
    ["low", "mid", "high"].forEach(function (b) { ["eq-", "eq2-"].forEach(function (pre) { $(pre + b + "-" + d.id).addEventListener("input", function () { var v = parseFloat(this.value); $("eq-" + b + "-" + d.id).value = v; $("eq2-" + b + "-" + d.id).value = v; if (d.nodes) d.nodes[b].gain.value = v; }); }); });
  });
  $("xfade").addEventListener("input", applyCross);
  $("master").addEventListener("input", function () { if (master) master.gain.value = parseFloat(this.value) / 100; });
  $("echo-btn").addEventListener("click", function () { var on = this.getAttribute("aria-pressed") !== "true"; this.setAttribute("aria-pressed", on ? "true" : "false"); ensureCtx(); if (echoWet) echoWet.gain.value = on ? 0.5 : 0; });

  /* ---------- one animation loop, only while something moves ---------- */
  var raf = null, prev = 0;
  function loopOn() { if (raf == null) { prev = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    var dt = (now - prev) / 1000; prev = now;
    var busy = false;
    decks.forEach(function (d) {
      var playing = !d.audio.paused;
      if (playing || d.dragging) busy = true;
      if (d.loop.on && !d.dragging && playing && d.audio.currentTime >= d.loop.end) d.audio.currentTime = d.loop.start;
      for (var hf = 0; hf < hooks.frame.length; hf++) hooks.frame[hf](d, playing);
      if (playing && !d.dragging) d.angle += rate(d) * (360 / REV_SECONDS) * dt;
      d.el.disc.style.transform = "rotate(" + d.angle.toFixed(1) + "deg)";
      var dur = d.audio.duration, ps = posOf(d); d.el.time.textContent = fmt(ps) + (isFinite(dur) ? " / " + fmt(dur) : "");
      d.el.platter.setAttribute("aria-valuenow", isFinite(dur) && dur > 0 ? String(Math.round(ps / dur * 100)) : "0");
      if (d.nodes && playing) { d.nodes.an.getByteTimeDomainData(d.nodes.data); var s = 0; for (var i = 0; i < d.nodes.data.length; i++) { var v = (d.nodes.data[i] - 128) / 128; s += v * v; } d.el.meter.style.width = clamp(Math.sqrt(s / d.nodes.data.length) * 260, 0, 100) + "%"; }
      else d.el.meter.style.width = "0%";
    });
    raf = busy ? requestAnimationFrame(tick) : null;
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { decks.forEach(function (d) { if (!d.audio.paused) { d.audio.pause(); updatePlayUi(d); } }); } });

  /* ---------- watchdog: if a deck says "playing" but the position stops moving, nudge it ---------- */
  setInterval(function () {
    decks.forEach(function (d) {
      if (d.audio.paused || d.dragging || d.pat) { d.wd = null; return; }
      var t = d.audio.currentTime, now = performance.now(), w = d.wd;
      if (!w || Math.abs(t - w.t) > 0.05) { d.wd = { t: t, at: now, tries: 0 }; return; }
      if (now - w.at > 2200 && !d.loop.on) {
        resumeAudio(); w.at = now; w.tries++;
        if (d.audio.readyState < 3 && d.src && d.src.kind === "audius") { say("Buffering…"); return; }
        if (w.tries <= 3) { var p = d.audio.play(); if (p && p.catch) p.catch(function () {}); say("Nudged deck " + d.id.toUpperCase() + " to keep playing."); }
      }
    });
  }, 1000);

  /* ---------- demo loops (idle) ---------- */
  function loadDemo(d, fn, name) {
    return fn().then(function (buf) {
      if (d.src && d.src.kind !== "demo") return;               // you already loaded your own track: never replace it
      var pk = window.GSDJWave ? window.GSDJWave.fromBuffer(buf) : null;
      loadSource(d, URL.createObjectURL(window.GSDJDemo.bufferToWavBlob(buf)), { blob: true, pk: pk, bpm: d.bpm, title: name + " · short demo", meta: { kind: "demo" } });
    }).catch(function (err) { console.error("demo", err && err.message); d.el.title.textContent = "Demo unavailable. Tap Load."; });
  }
  function startDemos() {
    if (!window.GSDJDemo || !(window.OfflineAudioContext || window.webkitOfflineAudioContext)) { decks.forEach(function (d) { d.el.title.textContent = "Tap Load to add a track"; }); return; }
    Promise.all([loadDemo(byId.a, GSDJDemo.renderHouseLoop, "House loop"), loadDemo(byId.b, GSDJDemo.renderTechnoLoop, "Techno loop")]).then(function () { say("Be the music. Tap the A or B tag for full-length tracks."); });
  }
  if (window.requestIdleCallback) requestIdleCallback(startDemos, { timeout: 2000 }); else setTimeout(startDemos, 300);

  /* ---------- materials: tilt-reactive light (iPad motion or pointer) ---------- */
  var tiltOn = false;
  function setTiltVars(x, y) { ctlEl.style.setProperty("--tx", clamp(x, -1, 1).toFixed(3)); ctlEl.style.setProperty("--ty", clamp(y, -1, 1).toFixed(3)); }
  function onMotion(e) { if (e.gamma == null) return; setTiltVars(e.gamma / 35, (e.beta - 45) / 35); }
  function onPointer(e) { var r = ctlEl.getBoundingClientRect(); setTiltVars((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); }
  function setTilt(on) {
    if (on === tiltOn) return; tiltOn = on;
    if (on) { window.addEventListener("deviceorientation", onMotion); window.addEventListener("pointermove", onPointer, { passive: true }); }
    else { window.removeEventListener("deviceorientation", onMotion); window.removeEventListener("pointermove", onPointer); setTiltVars(0, 0); }
  }
  function toggleTilt() {
    if (settings.tilt) { settings.tilt = false; return; }
    var DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === "function") { // iPad / iPhone: permission needs a tap
      DO.requestPermission().then(function (r) { settings.tilt = r === "granted"; if (r !== "granted") say("Motion access was not allowed. Pointer tilt still works."); applySettings(); drawWheel(); }).catch(function () { settings.tilt = true; applySettings(); drawWheel(); });
    } else settings.tilt = true;
  }


  /* ---------- add-on: loop control ---------- */
  var LOOPS = [1, 2, 4, 8, 16, 32];
  function loopLen(d) { var bpm = d.bpm || 120; return LOOPS[d.loop.i] * 60 / bpm; }            // in track time
  function snapBeat(d, t) { if (!d.bpm || d.gridOffset == null) return t; var b = 60 / d.bpm; return Math.max(0, Math.round((t - d.gridOffset) / b) * b + d.gridOffset); }
  function loopUi(d) { $("loop-n-" + d.id).textContent = LOOPS[d.loop.i]; $("loop-" + d.id).setAttribute("aria-pressed", d.loop.on ? "true" : "false"); }
  decks.forEach(function (d) {
    $("lp-minus-" + d.id).addEventListener("click", function () { d.loop.i = Math.max(0, d.loop.i - 1); if (d.loop.on) d.loop.end = Math.min(d.audio.duration || 1e9, d.loop.start + loopLen(d)); loopUi(d); });
    $("lp-plus-" + d.id).addEventListener("click", function () { d.loop.i = Math.min(LOOPS.length - 1, d.loop.i + 1); if (d.loop.on) d.loop.end = Math.min(d.audio.duration || 1e9, d.loop.start + loopLen(d)); loopUi(d); });
    $("loop-" + d.id).addEventListener("click", function () {
      if (!d.audio.src) return;
      d.loop.on = !d.loop.on;
      if (d.loop.on) { d.loop.start = snapBeat(d, d.audio.currentTime); d.loop.end = Math.min(d.audio.duration || 1e9, d.loop.start + loopLen(d)); say("Loop " + LOOPS[d.loop.i] + " beats."); } else say("Loop off.");
      loopUi(d);
    });
  });

  /* ---------- add-on: first-run tips ---------- */
  var TIPS = [["#play-a", "Tap Play to start a deck."], ["#platter-a", "Drag the disc to scratch."], ["#deck-a .cue", "Hot cues are bookmarks. Tap to save a spot, tap again to jump back."], ["#cue-a", "Cue: hold to listen from the return point, let go to return."], ["#xfade", "Slide the crossfader to blend the decks."], ["#wheel-btn", "Tap the gear to add or remove controls."]], tipI = 0;
  function tipTarget() { while (tipI < TIPS.length) { var el = document.querySelector(TIPS[tipI][0]); if (el && el.getBoundingClientRect().width > 0) return el; tipI++; } return null; }
  function showTip() {
    var tip = $("tip"), el = tipTarget();
    if (!el) { tip.hidden = true; settings.tips = false; applySettings(); return; }
    $("tip-text").textContent = TIPS[tipI][1]; $("tip-next").textContent = tipI >= TIPS.length - 1 ? "Done" : "Next"; tip.hidden = false;
    var r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8), top = r.bottom + 10; if (top + th > innerHeight - 8) top = Math.max(8, r.top - th - 10);
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  function startTips() { tipI = 0; showTip(); }
  function endTips() { $("tip").hidden = true; settings.tips = false; applySettings(); }
  $("tip-next").addEventListener("click", function () { tipI++; if (tipI >= TIPS.length) endTips(); else showTip(); });
  $("tip-skip").addEventListener("click", endTips);


  /* ---------- settings wheel ---------- */
  var ITEM = {
    decks: { icon: "◎", label: function () { return settings.decks + " deck" + (settings.decks > 1 ? "s" : ""); }, on: function () { return settings.decks === 2; }, tap: function () { settings.decks = settings.decks === 2 ? 1 : 2; } },
    eq: { icon: "≋", label: function () { return settings.eq === "off" ? "EQ off" : "EQ " + settings.eq; }, on: function () { return settings.eq !== "off"; }, tap: function () { settings.eq = { "1": "2", "2": "off", "off": "1" }[settings.eq]; } },
    tempo: { icon: "↕", label: function () { return "Tempo"; }, on: function () { return settings.tempo; }, tap: function () { settings.tempo = !settings.tempo; } },
    cues: { icon: "▦", label: function () { return "Cues"; }, on: function () { return settings.cues; }, tap: function () { settings.cues = !settings.cues; } },
    fx: { icon: "∿", label: function () { return "Echo"; }, on: function () { return settings.fx; }, tap: function () { settings.fx = !settings.fx; } },
    fader: { icon: "↔", label: function () { return "Fader"; }, on: function () { return settings.fader; }, tap: function () { settings.fader = !settings.fader; } },
    wave: { icon: "▁▃▆", label: function () { return "Wave"; }, on: function () { return settings.wave; }, tap: function () { settings.wave = !settings.wave; } },
    sampler: { icon: "▣", label: function () { return "Sampler"; }, on: function () { return settings.sampler; }, tap: function () { settings.sampler = !settings.sampler; } },
    fxu: { icon: "✧", label: function () { return "FX"; }, on: function () { return settings.fxu; }, tap: function () { settings.fxu = !settings.fxu; } },
    loop: { icon: "⟲", label: function () { return "Loop"; }, on: function () { return settings.loop; }, tap: function () { settings.loop = !settings.loop; } },
    patterns: { icon: "≈", label: function () { return "Patterns"; }, on: function () { return settings.patterns; }, tap: function () { settings.patterns = !settings.patterns; } },
    tips: { icon: "?", label: function () { return "Tips"; }, on: function () { return settings.tips; }, tap: function () { settings.tips = !settings.tips; if (settings.tips) pendingTips = true; } },
    material: { icon: "▤", label: function () { return { matte: "Matte", carbon: "Carbon", titanium: "Titanium" }[settings.material]; }, on: function () { return settings.material !== "matte"; }, tap: function () { settings.material = { matte: "carbon", carbon: "titanium", titanium: "matte" }[settings.material]; } },
    tilt: { icon: "◭", label: function () { return "Tilt"; }, on: function () { return settings.tilt; }, tap: function () { toggleTilt(); } },
    scratch: { icon: "✺", label: function () { return "Scratch"; }, on: function () { return false; }, tap: function () { if (window.GSDJScratch) { openWheel(false); window.GSDJScratch.openPanel(); } } },
    themes: { icon: "◐", label: function () { return "Themes"; }, on: function () { return false; }, tap: function () { showThemes(true); } },
    full: { icon: "⛶", label: function () { return "Full"; }, on: function () { return !!document.fullscreenElement; }, tap: function () { var el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } }
  };
  var canFull = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  var PAGES = [{ name: "Controls", ids: ["decks", "eq", "tempo", "cues", "fx", "fader", "scratch"] }, { name: "Add-ons", ids: ["wave", "sampler", "fxu", "patterns", "loop", "tips"] }, { name: "Look", ids: ["material", "tilt", "themes"].concat(canFull ? ["full"] : []) }];
  var wheelPage = 0, pendingTips = false, ring = $("wheel-ring");
  function drawWheel() {
    var pg = PAGES[wheelPage]; ring.textContent = ""; $("wheel-title").textContent = pg.name;
    $("wheel-hint").textContent = wheelPage === 1 ? "Extras, off until you add them" : (wheelPage === 0 ? "EQ 2 is compact: bigger discs" : "Tap to add or remove");
    $("wheel-dots").innerHTML = PAGES.map(function (_, i) { return "<i class=\"" + (i === wheelPage ? "on" : "") + "\"></i>"; }).join("");
    pg.ids.forEach(function (id, i) {
      var it = ITEM[id], b = document.createElement("button"); b.type = "button"; b.className = "wheel-item"; b.style.setProperty("--ang", (i * 360 / pg.ids.length) + "deg");
      b.setAttribute("aria-pressed", it.on() ? "true" : "false");
      b.innerHTML = "<b aria-hidden=\"true\">" + it.icon + "</b><span>" + it.label() + "</span>";
      b.addEventListener("click", function () { it.tap(); applySettings(); drawWheel(); });
      ring.appendChild(b);
    });
  }
  $("wheel-next").addEventListener("click", function () { wheelPage = (wheelPage + 1) % PAGES.length; drawWheel(); });
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
  function openWheel(open) { $("wheel").hidden = !open; $("wheel-btn").setAttribute("aria-expanded", open ? "true" : "false"); if (open) { showThemes(false); drawWheel(); } else { $("wheel-btn").focus(); if (pendingTips) { pendingTips = false; startTips(); } } }
  $("wheel-btn").addEventListener("click", function () { openWheel(true); });
  $("wheel-close").addEventListener("click", function () { openWheel(false); });
  $("themes-back").addEventListener("click", function () { showThemes(false); });
  $("wheel").addEventListener("click", function (e) { if (e.target === this) openWheel(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("wheel").hidden) openWheel(false); });

  window.GSDJCtl = { $: $, clamp: clamp, fmt: fmt, say: say, decks: decks, byId: byId, settings: settings, hooks: hooks, ensureCtx: ensureCtx, build: build, rate: rate, snapT: snapT, toast: toast, paintCues: paintCues, saveCues: saveCues, posOf: posOf, setBpm: setBpm, KEY: KEY, SCRATCH_DEFAULT: SCRATCH_DEFAULT, REV_SECONDS: REV_SECONDS,
    updatePlayUi: updatePlayUi, applySettings: applySettings, loadSource: loadSource, loopOn: loopOn, el: ctlEl,
    audio: function () { return { ctx: actx, master: master, echoWet: echoWet }; } };
  window.dispatchEvent(new Event("gsdj-ctl-ready"));
  applySettings(); decks.forEach(setBpm); loopOn();
})();
