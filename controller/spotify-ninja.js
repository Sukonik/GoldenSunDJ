/* GoldenSunDJ Controller: SpotifyNinja mode.
   GoldenSun Controller stays the default and its audio engine, Library, Load and Audius are not touched
   by anything here. This module
     1. runs the Spotify tab: connect to Spotify, search, the "Switch to SpotifyNinja Controller?" prompt, return,
     2. turns controller gestures into tiny JSON packets (browser events gsdj:command / gsdj:state / gsdj:modechange),
     3. answers those packets with the real Spotify adapter (spotify-connect.js) when connected,
        or with a silent PREVIEW adapter when not, so the controls can be tried without an account.
   The packet contract does not mention Spotify, so another adapter (djay, Serato, a local companion) could use it. */
(function () {
  "use strict";
  var V = 1, MODE_GS = "goldensun", MODE_SN = "spotify-ninja", STORE = "gsdj-controller-mode", CUES = "gsdj-ninja-cues";
  var ACTIONS = ["play", "pause", "toggle-play", "seek", "next", "previous", "set-volume", "load-track", "set-repeat", "save-cue", "clear-cue", "select-prep-track", "activate-prep-track", "exit-ninja"];
  var CAPS = { seek: true, volume: true, tempo: false, eq: false, scratch: false, two_live_decks: false };

  /* ---------- the packet contract ---------- */
  function now() { return Date.now(); }
  function validate(p) {
    if (!p || typeof p !== "object" || p.v !== V) return false;
    if (p.type === "command") return typeof p.mode === "string" && ACTIONS.indexOf(p.action) !== -1 && (p.deck === undefined || p.deck === "a" || p.deck === "b") && (p.value === undefined || typeof p.value === "object") && typeof p.ts === "number";
    if (p.type === "state") return typeof p.mode === "string" && typeof p.connected === "boolean" && typeof p.paused === "boolean" && typeof p.position_ms === "number" && typeof p.duration_ms === "number" && !!p.capabilities && typeof p.capabilities === "object";
    if (p.type === "mode") return typeof p.mode === "string" && typeof p.previous === "string" && typeof p.ts === "number";
    return false;
  }
  function send(name, packet) {
    if (!validate(packet)) { if (window.console) console.warn("GSDJ: dropped an invalid packet", packet); return false; }
    window.dispatchEvent(new CustomEvent(name, { detail: packet })); return true;
  }
  function command(action, deck, value, source) { return send("gsdj:command", { v: V, type: "command", mode: MODE_SN, action: action, deck: deck, value: value || {}, source: source || "surface", ts: now() }); }

  function init() {
    var C = window.GSDJCtl, $ = C.$, ctl = C.el, menuApi = window.GSDJDeckMenu, SP = window.GSDJSpotify || null;
    if (!C || !ctl) return;
    var mode = MODE_GS, adapterTimer = null, pendingTrack = null;

    /* ---------- cue storage, keyed by Spotify URI (local only) ---------- */
    function cueStore() { try { return JSON.parse(localStorage.getItem(CUES) || "{}"); } catch (e) { return {}; } }
    function cuesFor(uri) { var s = cueStore()[uri]; return s ? { c: (s.c || []).slice(0, 4), p: s.p == null ? null : s.p } : { c: [null, null, null, null], p: null }; }
    function saveCues(uri, v) { try { var all = cueStore(); all[uri] = { c: v.c, p: v.p, u: now() }; var keys = Object.keys(all); if (keys.length > 80) keys.sort(function (a, b) { return all[a].u - all[b].u; }).slice(0, keys.length - 80).forEach(function (k) { delete all[k]; }); localStorage.setItem(CUES, JSON.stringify(all)); } catch (e) {} }

    /* ---------- what the surface currently shows (fed by gsdj:state, from either adapter) ---------- */
    var cur = { paused: true, pos: 0, dur: 213000, track: { uri: "spotify:track:preview", title: "SpotifyNinja preview", artist: "Spotify is not connected yet", artwork: "" }, connected: false };
    function real() { return !!(SP && SP.connected() && SP.ready()); }

    /* ---------- preview adapter: silent, no network, used until you connect Spotify ---------- */
    var mock = { paused: true, pos: 0, dur: 213000, vol: 0.85, repeat: "off", track: cur.track };
    function mockState() { return { v: V, type: "state", mode: MODE_SN, connected: false, paused: mock.paused, position_ms: Math.round(mock.pos), duration_ms: mock.dur, track: mock.track, repeat: mock.repeat, capabilities: CAPS, ts: now() }; }
    function emitMock() { send("gsdj:state", mockState()); }
    function tickMock() { if (mock.paused) { clearInterval(adapterTimer); adapterTimer = null; return; } mock.pos = Math.min(mock.dur, mock.pos + 500); if (mock.pos >= mock.dur) mock.paused = true; emitMock(); }
    function mockPlaying(on) { mock.paused = !on; if (on && !adapterTimer) adapterTimer = setInterval(tickMock, 500); if (!on) { clearInterval(adapterTimer); adapterTimer = null; } emitMock(); }
    function mockHandle(p) {
      switch (p.action) {
        case "toggle-play": mockPlaying(mock.paused); break;
        case "play": mockPlaying(true); break;
        case "pause": mockPlaying(false); break;
        case "seek": mock.pos = Math.max(0, Math.min(mock.dur, (p.value && p.value.position_ms) || 0)); emitMock(); break;
        case "set-repeat": mock.repeat = (p.value && p.value.state) === "track" ? "track" : "off"; emitMock(); break;
        case "set-volume": mock.vol = Math.max(0, Math.min(1, (p.value && p.value.volume) == null ? mock.vol : p.value.volume)); break;
        default: break;
      }
    }

    /* ---------- one command listener: cues and mode are handled here, the rest goes to the adapter ---------- */
    window.addEventListener("gsdj:command", function (e) {
      var p = e.detail; if (mode !== MODE_SN || !p || p.mode !== MODE_SN) return;
      var v = p.value || {};
      switch (p.action) {
        case "save-cue": { var cs = cuesFor(cur.track.uri), ms = v.position_ms != null ? v.position_ms : cur.pos; if (v.slot === "primary") cs.p = ms; else cs.c[v.slot | 0] = ms; saveCues(cur.track.uri, cs); paintCues(); break; }
        case "clear-cue": { var c2 = cuesFor(cur.track.uri); c2.c[v.slot | 0] = null; saveCues(cur.track.uri, c2); paintCues(); break; }
        case "exit-ninja": exit(); break;
        case "load-track": case "play": case "pause": case "toggle-play": case "seek": case "set-volume": case "set-repeat": case "next": case "previous":
          if (real()) SP.handle(p); else if (p.action !== "load-track") mockHandle(p); break;
        default: break;                                              // prep-deck actions arrive with the Prep Deck
      }
    });

    /* ---------- surface: what the controller shows in this mode ---------- */
    function fmt(ms) { return C.fmt(ms / 1000); }
    function say(deckId, msg) { if (C.toast) C.toast(C.byId[deckId || "a"], msg); else C.say(msg); }
    function paintCues() {
      if (mode !== MODE_SN) return; var cs = cuesFor(cur.track.uri);
      document.querySelectorAll("#deck-a .cue").forEach(function (b, i) { var t = cs.c[i], sm = b.querySelector("small"); b.classList.toggle("is-set", t != null); if (sm) sm.textContent = t != null ? fmt(t) : "Save"; b.setAttribute("aria-label", t != null ? "Spotify cue " + (i + 1) + " at " + fmt(t) + ". Tap to jump. Hold to clear." : "Spotify cue " + (i + 1) + ", empty. Tap to save this spot."); });
    }
    window.addEventListener("gsdj:state", function (e) {
      var s = e.detail; if (!s || s.mode !== MODE_SN) return;
      var trackChanged = !!(s.track && s.track.uri !== cur.track.uri);
      cur = { paused: s.paused, pos: s.position_ms, dur: s.duration_ms, track: s.track || cur.track, connected: s.connected, repeat: s.repeat || cur.repeat || "off" };
      if (mode !== MODE_SN) return;
      var a = C.byId.a; a.el.title.textContent = cur.track.title + " · " + cur.track.artist;
      a.el.play.setAttribute("aria-pressed", s.paused ? "false" : "true"); a.el.play.textContent = s.paused ? "Play" : "Pause";
      if (!scrub) a.el.time.textContent = fmt(s.position_ms) + " / " + fmt(s.duration_ms);
      showTempo(); if (trackChanged) paintCues(); drawTimeline(); spinOn();
    });
    if (SP) {
      SP.onState = function (st) { send("gsdj:state", { v: V, type: "state", mode: MODE_SN, connected: true, paused: st.paused, position_ms: Math.round(st.position_ms || 0), duration_ms: Math.round(st.duration_ms || 0), track: st.track || cur.track, repeat: st.repeat || "off", capabilities: CAPS, ts: now() }); };
      SP.onMessage = function (m) { say("a", m); renderAll(); };
    }

    // controls that cannot work with protected audio are switched off, not hidden, with a reason
    var INERT = ["#deck-a .opt-tempo", "#deck-a .opt-eq", "#deck-a .opt-eq2", "#loop-a", "#deck-a .deck-drawers", "#deck-b .deck-body", "#deck-b .opt-eq2", "#deck-b .opt-loop", "#deck-b .deck-drawers", "#deck-b .deck-side", ".center .opt-fx", ".center .opt-xfade"];
    function setInert(on) {
      INERT.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-disabled", "true"); } else { el.removeAttribute("inert"); el.removeAttribute("aria-disabled"); } }); });
      ["a", "b"].forEach(function (id) { var t = $("toast-" + id); if (t) t.hidden = true; });
      if (on) { ["a", "b"].forEach(function (id) { document.querySelectorAll("#deck-" + id + " .drawer-x:not([hidden])").forEach(function (dr) { dr.hidden = true; }); document.querySelectorAll("#deck-" + id + " .deck-drawers button").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); }); }
    }
    function addNotes() {
      if (document.querySelector(".ninja-note")) return;
      var make = function (txt) { var n = document.createElement("span"); n.className = "ninja-note"; n.textContent = txt; return n; };
      document.querySelectorAll("#deck-a .opt-tempo").forEach(function (el) { el.appendChild(make("Spotify controlled")); });
      var b = document.querySelector("#deck-b .deck-body"); if (b) { var pr = make("Prep Deck. Choosing the next track arrives in a later update."); pr.classList.add("ninja-prep"); document.getElementById("deck-b").appendChild(pr); }
      var badge = document.createElement("div"); badge.className = "ninja-badge"; badge.id = "ninja-badge"; badge.setAttribute("role", "status");
      badge.innerHTML = '<i aria-hidden="true"></i><span>SpotifyNinja</span><small>Spotify</small>';
      var center = document.querySelector(".center"); if (center) center.insertBefore(badge, center.firstChild);
    }

    /* ---------- intercepts: in this mode, a few controls send packets instead of driving local audio ---------- */
    function inNinja() { return mode === MODE_SN; }
    var holdT = null, held = false;
    function cueButton() {                                                     // the Cue button: paused sets the point, playing returns to it
      var cs = cuesFor(cur.track.uri);
      if (cur.paused) { command("save-cue", "a", { slot: "primary", position_ms: Math.round(cur.pos) }, "cue"); say("a", "Cue point set at " + fmt(cur.pos) + "."); }
      else { var p = cs.p == null ? 0 : cs.p; command("pause", "a", {}, "cue"); command("seek", "a", { position_ms: p }, "cue"); say("a", "Back at the cue point (" + fmt(p) + ")."); }
    }
    function hotCue(i) {
      var cs = cuesFor(cur.track.uri);
      if (cs.c[i] == null) { command("save-cue", "a", { slot: i, position_ms: Math.round(cur.pos) }, "hot-cue"); say("a", "Spotify cue " + (i + 1) + " saved at " + fmt(cur.pos) + "."); }
      else { command("seek", "a", { position_ms: cs.c[i] }, "hot-cue"); say("a", "Jumped to Spotify cue " + (i + 1) + " at " + fmt(cs.c[i]) + "."); }
    }
    document.addEventListener("click", function (e) {
      if (!inNinja()) return;
      var t = e.target.closest && e.target.closest("#play-a, #play-b, .cue, #cue-a, #cue-b, #bj-back-a, #bj-fwd-a, #bj-back-b, #bj-fwd-b, #bpm-a, #bpm-b"); if (!t) return;
      var deckEl = t.closest(".deck"), id = deckEl && deckEl.id === "deck-b" ? "b" : "a";
      e.stopImmediatePropagation(); e.preventDefault();
      if (id === "b") { say("b", "Deck B is the Prep Deck. Choosing the next track arrives in a later update."); return; }
      if (t.id === "bj-back-a") { beatJump(-1); return; } if (t.id === "bj-fwd-a") { beatJump(1); return; } if (t.id === "bpm-a") { tapTempo(); return; }
      if (t.id === "play-a") { if (SP) SP.activate(); command("toggle-play", "a", {}, "play"); return; }
      var keyboard = e.detail === 0;                                           // pointer taps were already handled on pointerdown
      if (t.id === "cue-a") { if (keyboard) cueButton(); return; }
      if (t.classList.contains("cue")) { if (held) { held = false; return; } hotCue(+t.getAttribute("data-cue")); }
    }, true);
    document.addEventListener("pointerdown", function (e) {
      if (!inNinja()) return;
      var t = e.target.closest && e.target.closest("#cue-a, #cue-b, .cue"); if (!t) return;
      e.stopImmediatePropagation(); if (t.closest("#deck-b")) return;
      if (t.id === "cue-a") { e.preventDefault(); cueButton(); return; }
      held = false; clearTimeout(holdT); var i = +t.getAttribute("data-cue"); if (cuesFor(cur.track.uri).c[i] == null) return;
      holdT = setTimeout(function () { held = true; command("clear-cue", "a", { slot: i }, "hot-cue"); say("a", "Spotify cue " + (i + 1) + " cleared."); }, 600);
    }, true);
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(holdT); }, true); });
    var master = $("master");
    if (master) master.addEventListener("input", function (e) { if (!inNinja()) return; e.stopImmediatePropagation(); command("set-volume", "a", { volume: parseFloat(master.value) / 100 }, "master"); }, true);


    /* ---------- tap tempo and beat jump (Spotify gives no tempo, so you tap it; saved per track on this device) ---------- */
    var TEMPOS = "gsdj-ninja-tempo", taps = [];
    function tempoStore() { try { return JSON.parse(localStorage.getItem(TEMPOS) || "{}"); } catch (e) { return {}; } }
    function tempoFor(uri) { return tempoStore()[uri] || null; }
    function showTempo() { var t = tempoFor(cur.track.uri); C.byId.a.el.bpm.textContent = t ? t.bpm.toFixed(1) : "--"; }
    function tapTempo() {
      var n = performance.now(); if (taps.length && n - taps[taps.length - 1] > 2000) taps = [];
      taps.push(n); if (navigator.vibrate) navigator.vibrate(6);
      if (taps.length < 4) { say("a", "Keep tapping the beat… (" + taps.length + ")"); return; }
      taps = taps.slice(-8); var iv = []; for (var i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
      var bpm = 60000 / (iv.reduce(function (a, b) { return a + b; }, 0) / iv.length); while (bpm < 70) bpm *= 2; while (bpm > 190) bpm /= 2;
      bpm = Math.round(bpm * 10) / 10; var beat = 60000 / bpm, off = ((cur.pos % beat) + beat) % beat;
      try { var all = tempoStore(); all[cur.track.uri] = { bpm: bpm, off: off, u: now() }; var ks = Object.keys(all); if (ks.length > 80) ks.sort(function (a, b) { return all[a].u - all[b].u; }).slice(0, ks.length - 80).forEach(function (k) { delete all[k]; }); localStorage.setItem(TEMPOS, JSON.stringify(all)); } catch (e) {}
      showTempo(); drawTimeline(); say("a", "Tempo set to " + bpm.toFixed(1) + " BPM for this track.");
    }
    function beatJump(dir) {
      var t = tempoFor(cur.track.uri); if (!t) { say("a", "Tap the BPM number four times to set the tempo first, then jump by beats."); return; }
      var beats = C.loops()[C.byId.a.loop.i], beat = 60000 / t.bpm, np = cur.pos + dir * beats * beat;
      np = Math.round((np - t.off) / beat) * beat + t.off; np = Math.max(0, Math.min(Math.max(0, cur.dur - 50), np));
      command("seek", "a", { position_ms: Math.round(np) }, "beat-jump"); say("a", (dir > 0 ? "Jumped ahead " : "Jumped back ") + beats + " beat" + (beats > 1 ? "s" : "") + ".");
    }

    /* ---------- timeline strip (there is no waveform for Spotify audio, so this shows position, cues and beats) ---------- */
    var scrub = null;
    function shownPos() { return scrub ? scrub.pos : cur.pos; }
    function drawTimeline() {
      if (mode !== MODE_SN || !C.settings.wave) return;
      var cv = $("wave-a"); if (!cv) return; var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      var cs = getComputedStyle(cv), col = cs.getPropertyValue("--dk").trim() || "#ff9f1c", dur = Math.max(1, cur.dur), pos = Math.max(0, Math.min(dur, shownPos()));
      var top = 16, bh = 18, by = Math.round(h / 2 - bh / 2) + 2, px = pos / dur * w, tp = tempoFor(cur.track.uri);
      g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.roundRect ? g.roundRect(0, by, w, bh, 9) : g.rect(0, by, w, bh); g.fill();
      g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(0, by, Math.max(bh, px), bh, 9) : g.rect(0, by, px, bh); g.fill();
      if (tp) { var beat = 60000 / tp.bpm, bar = beat * 4, step = w / (dur / bar) < 7 ? bar * 4 : bar; for (var t = tp.off; t < dur; t += step) { var x = Math.round(t / dur * w); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x, by - 4, 1, bh + 8); } }
      var cs2 = cuesFor(cur.track.uri); g.font = "800 10px " + cs.fontFamily; g.textAlign = "center";
      for (var i = 0; i < 4; i++) { var c = cs2.c[i]; if (c == null) continue; var cx = Math.round(c / dur * w); g.fillStyle = col; g.fillRect(cx, 0, 2, h); g.fillRect(cx, 0, 14, 13); g.fillStyle = "#0a0b0f"; g.fillText(String(i + 1), cx + 8, 10); }
      if (cs2.p != null) { var rx = cs2.p / dur * w; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(rx - 5, h); g.lineTo(rx + 5, h); g.lineTo(rx, h - 8); g.fill(); }
      g.fillStyle = "#fff"; g.fillRect(Math.round(px) - 1, 6, 2, h - 6); g.beginPath(); g.moveTo(px - 5, 0); g.lineTo(px + 5, 0); g.lineTo(px, 6); g.fill();
      g.font = "700 11px " + cs.fontFamily; var l1 = fmt(pos), l2 = "-" + fmt(Math.max(0, dur - pos)), tw1 = g.measureText(l1).width + 10, tw2 = g.measureText(l2).width + 10;
      g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(2, h - 15, tw1, 14); g.fillRect(w - 2 - tw2, h - 15, tw2, 14); g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(l1, 7, h - 4); g.fillText(l2, w - tw2 + 3, h - 4);
    }
    (function wireTimeline() {
      var cv = $("wave-a"); if (!cv) return; var down = null;
      function posAt(e) { var r = cv.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * Math.max(1, cur.dur); }
      function tlDown(e) {
        var dur = Math.max(1, cur.dur), r = cv.getBoundingClientRect(), x = e.clientX - r.left, cs2 = cuesFor(cur.track.uri);
        for (var i = 0; i < 4; i++) { var c = cs2.c[i]; if (c != null && Math.abs(c / dur * r.width - x) < 14) { command("seek", "a", { position_ms: c }, "timeline"); say("a", "Jumped to Spotify cue " + (i + 1) + "."); return; } }
        down = { id: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch (x2) {} scrub = { pos: posAt(e), timeline: true }; drawTimeline();
      }
      // handled here (not on the canvas) so the GoldenSun waveform handler, which seeks local audio, never sees the touch
      document.addEventListener("pointerdown", function (e) { if (mode === MODE_SN && e.target === cv) { e.stopImmediatePropagation(); tlDown(e); } }, true);
      cv.addEventListener("pointermove", function (e) { if (down && scrub && scrub.timeline) { scrub.pos = posAt(e); drawTimeline(); C.byId.a.el.time.textContent = fmt(scrub.pos) + " / " + fmt(cur.dur); } });
      function up() { if (!down) return; down = null; if (scrub && scrub.timeline) { var p = scrub.pos; scrub = null; command("seek", "a", { position_ms: Math.round(p) }, "timeline"); } }
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", function () { down = null; scrub = null; drawTimeline(); });
      window.addEventListener("resize", function () { if (mode === MODE_SN) drawTimeline(); });
    })();

    /* ---------- Ninja Scrub: touch the disc to preview a position, one seek when you let go ---------- */
    var ang = 0, spinRaf = null, spinPrev = 0, REV_MS = 12000;                  // one turn of the disc is 12 s of the song, faster when you spin fast
    function discTurn() { C.byId.a.angle = ang; C.byId.a.el.disc.style.transform = "rotate(" + ang.toFixed(1) + "deg)"; }
    function spinOn() { if (spinRaf == null && mode === MODE_SN && (!cur.paused || scrub)) { spinPrev = performance.now(); spinRaf = requestAnimationFrame(spinTick); } }
    function spinTick(t) { var dt = Math.min(0.05, (t - spinPrev) / 1000); spinPrev = t; if (mode !== MODE_SN || (cur.paused && !scrub)) { spinRaf = null; return; } if (!scrub || !scrub.disc) { ang += 198 * dt * (cur.paused ? 0 : 1); discTurn(); } spinRaf = requestAnimationFrame(spinTick); }
    (function wireScrub() {
      var pl = C.byId.a.el.platter; function angleOf(e) { var r = pl.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
      document.addEventListener("pointerdown", function (e) { if (mode !== MODE_SN) return; var p = e.target.closest && e.target.closest(".platter"); if (!p) return; e.stopImmediatePropagation(); if (p.id !== "platter-a") { say("b", "Deck B is the Prep Deck. Choosing the next track arrives in a later update."); return; } e.preventDefault(); begin(e); }, true);
      function begin(e) {
        if (scrub) return; var was = !cur.paused;
        scrub = { disc: true, id: e.pointerId, a: angleOf(e), pos: cur.pos, was: was, t: performance.now() };
        try { pl.setPointerCapture(e.pointerId); } catch (x) {}
        if (was) command("pause", "a", {}, "scrub"); say("a", "Turn the disc to move through the song. It jumps there when you let go."); spinOn(); drawTimeline();
      }
      pl.addEventListener("pointermove", function (e) {
        if (!scrub || !scrub.disc || e.pointerId !== scrub.id) return; var a = angleOf(e), d = a - scrub.a; if (d > 180) d -= 360; if (d < -180) d += 360; scrub.a = a;
        var n = performance.now(), dt = Math.max(8, n - scrub.t) / 1000; scrub.t = n; var mult = 1 + Math.min(3, Math.abs(d) / dt / 360);
        scrub.pos = Math.max(0, Math.min(Math.max(0, cur.dur - 50), scrub.pos + d / 360 * REV_MS * mult)); ang += d; discTurn();
        C.byId.a.el.time.textContent = fmt(scrub.pos) + " / " + fmt(cur.dur); drawTimeline();
      });
      function end(e) {
        if (!scrub || !scrub.disc) return; if (e && e.pointerId !== undefined && e.pointerId !== scrub.id) return; var s = scrub; scrub = null;
        try { pl.releasePointerCapture(s.id); } catch (x) {}
        command("seek", "a", { position_ms: Math.round(s.pos) }, "scrub"); if (s.was) command("play", "a", {}, "scrub"); say("a", "Jumped to " + fmt(s.pos) + "."); spinOn(); drawTimeline();
      }
      pl.addEventListener("pointerup", end); pl.addEventListener("pointercancel", end);
      document.addEventListener("keydown", function (e) { if (mode !== MODE_SN || e.target !== pl) return; if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; e.stopImmediatePropagation(); e.preventDefault(); command("seek", "a", { position_ms: Math.max(0, Math.min(Math.max(0, cur.dur - 50), Math.round(cur.pos + (e.key === "ArrowRight" ? 5000 : -5000)))) }, "scrub"); }, true);
    })();

    /* ---------- the Spotify tab ---------- */
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function mmss(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    var account = $("sn-account"), results = $("sn-results"), hint = $("sn-hint"), form = $("sn-search"), q = $("sn-q");
    function setStatus(html) { var el = $("sn-status"); if (el) el.innerHTML = html; }
    function renderAccount() {
      if (!account) return;
      if (!SP) { account.innerHTML = '<p class="dm-note">Spotify sign-in is not available in this build.</p>'; return; }
      var err = SP.lastError(), html = "";
      if (err) html += '<p class="sn-err" role="alert">' + esc(err) + "</p>";
      if (!SP.configured()) {
        html += '<strong>Connect your Spotify account</strong><p>Spotify Premium is required. GoldenSunDJ will request permission to play music and control playback. Your password is entered only on Spotify.</p>' +
          '<div class="sn-setup"><p><b>One-time setup (the site owner):</b></p><ol><li>Open the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify Developer Dashboard</a> and create an app (choose <i>Web Playback SDK</i>).</li><li>Add this exact Redirect URI:<br><code id="sn-ru">' + esc(SP.redirectUri()) + '</code> <button type="button" class="chip" id="sn-copy">Copy</button></li><li>Paste the app\'s <b>Client ID</b> below. It is public, and no client secret is ever needed.</li></ol>' +
          '<form class="dm-search" id="sn-cid-form"><label class="visually-hidden" for="sn-cid">Spotify Client ID</label><input id="sn-cid" type="text" autocomplete="off" spellcheck="false" placeholder="Spotify Client ID"><button class="btn" type="submit">Save</button></form></div>' +
          '<div class="sn-btns"><button type="button" class="btn" disabled>Connect Spotify</button></div>';
      } else if (!SP.connected()) {
        html += '<strong>Connect your Spotify account</strong><p>Spotify Premium is required. GoldenSunDJ will request permission to play music and control playback. Your password is entered only on Spotify.</p><div class="sn-btns"><button type="button" class="btn" id="sn-connect">Connect Spotify</button><button type="button" class="chip" id="sn-cid-change">Change Client ID</button></div>';
      } else {
        var u = SP.user();
        html += '<strong>' + (u ? "Connected as " + esc(u.name) : "Connected to Spotify") + '</strong>' +
          (u && !u.premium ? '<p class="sn-err">This Spotify account is not Premium. Spotify only lets Premium accounts play music in a web page, so you can search but not play.</p>' : '<p>SpotifyNinja is ready. Deck A controls Spotify; Deck B prepares the next track.</p>') +
          '<div class="sn-btns"><button type="button" class="btn btn--ghost" id="sn-disconnect">Disconnect Spotify</button></div>';
      }
      account.innerHTML = html;
      var c = $("sn-connect"); if (c) c.addEventListener("click", function () { SP.clearError(); c.disabled = true; c.textContent = "Opening Spotify…"; SP.connect().catch(function (er) { c.disabled = false; c.textContent = "Connect Spotify"; setStatus('<p class="sn-err">' + esc(er.message || "Could not start the login.") + "</p>"); }); });
      var d = $("sn-disconnect"); if (d) d.addEventListener("click", function () { var wasNinja = inNinja(); SP.disconnect(); results.textContent = ""; if (wasNinja) mockPlaying(false); renderAll(); setStatus('<p>Disconnected. To remove GoldenSunDJ from your Spotify account completely, open <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noopener">spotify.com/account/apps</a>.</p>'); });
      var ch = $("sn-cid-change"); if (ch) ch.addEventListener("click", function () { SP.setClientId(null); renderAll(); });
      var cf = $("sn-cid-form"); if (cf) cf.addEventListener("submit", function (ev) { ev.preventDefault(); var v = $("sn-cid").value.trim(); if (!/^[A-Za-z0-9]{16,64}$/.test(v)) { setStatus('<p class="sn-err">That does not look like a Spotify Client ID (letters and numbers, usually 32 characters).</p>'); return; } SP.setClientId(v); renderAll(); });
      var cp = $("sn-copy"); if (cp) cp.addEventListener("click", function () { var t = $("sn-ru").textContent; (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = "Copied"; }, function () { cp.textContent = "Select and copy"; }); });
    }
    var GENRES = [["Gold", 'genre:"edm"'], ["Trance", 'genre:"trance"'], ["House", 'genre:"house"'], ["Techno", 'genre:"techno"'], ["Pulsewave", 'genre:"synthwave"'], ["Synthpop", 'genre:"synth-pop"'], ["Eurodance", 'genre:"eurodance"'], ["Nightdrive", "night drive synthwave"]], chips = $("sn-chips"), genreIdx = -1;
    GENRES.forEach(function (g, i) { var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = g[0]; b.addEventListener("click", function () { runGenre(i); }); chips.appendChild(b); });
    function runSearch(query, label) {
      if (!SP || !SP.connected()) return; hint.textContent = "Finding " + label + "…"; results.textContent = "";
      SP.search(query).then(showResults).catch(function (er) { hint.textContent = er && er.status === 403 ? "Spotify said this account is not allowed to use the app yet. In development mode, add the account under User Management in the Spotify Dashboard." : "Search is unavailable right now. " + (er && er.message ? er.message : ""); });
    }
    function runGenre(i) { genreIdx = i; Array.prototype.forEach.call(chips.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); }); runSearch(GENRES[i][1], GENRES[i][0] + " tracks"); }
    function renderSearch() {
      var on = !!(SP && SP.connected()); q.disabled = !on; form.querySelector("button").disabled = !on; Array.prototype.forEach.call(chips.children, function (c) { c.disabled = !on; });
      hint.textContent = on ? (SP.user() && !SP.user().premium ? "Premium is required to play. You can still search." : "Search Spotify, then tap Load. Playing a Spotify track uses SpotifyNinja mode.") : "Connect Spotify above to search and load tracks, the same way as Audius.";
    }
    function renderAll() {
      renderAccount(); renderSearch();
      var on = mode === MODE_SN, prompt = $("sn-prompt"), act = $("sn-active"); if (prompt) prompt.hidden = on; if (act) act.hidden = !on;
      var txt = $("sn-active-text"); if (txt) txt.textContent = real() ? "SpotifyNinja is ready. Deck A controls Spotify; Deck B prepares the next track." : (SP && SP.connected() ? "Starting the Spotify player…" : "Deck A controls Spotify. Deck B prepares what plays next. This is a silent preview until you connect Spotify.");
      if (on && !(SP && SP.connected())) setStatus('<p><b>Preview.</b> Nothing plays until Spotify is connected. Cue points and the controls you can use here already work, and they are saved on this device.</p>');
      else if (!on && !(SP && SP.connected())) setStatus("<p>Spotify is not connected. Opening this tab never changes your controller.</p>");
    }
    function showResults(list) {
      results.textContent = "";
      if (!list.length) { hint.textContent = "No tracks found. Try another search."; return; }
      var prem = !(SP.user() && !SP.user().premium);
      hint.textContent = list.length + " tracks." + (prem ? " Tap Load to put one on Deck A." : " Premium is required to play them.");
      list.forEach(function (t) {
        var li = document.createElement("li"), img = document.createElement("img"); img.alt = ""; img.width = 44; img.height = 44; img.loading = "lazy"; if (t.art) img.src = t.art; else img.className = "no-art";
        var txt = document.createElement("span"); txt.className = "res-text"; var a = document.createElement("strong"); a.textContent = t.title; var b = document.createElement("small"); b.textContent = t.artist + " · " + mmss(t.duration_ms); txt.appendChild(a); txt.appendChild(b);
        var load = document.createElement("button"); load.type = "button"; load.className = "res-load"; load.textContent = "Load"; load.disabled = !prem || !t.playable;
        load.addEventListener("click", function () { loadTrack(t); });
        li.appendChild(img); li.appendChild(txt); li.appendChild(load); results.appendChild(li);
      });
    }
    function loadTrack(t) {
      if (!inNinja()) {                                                        // opening or searching never switches modes; Load asks first
        pendingTrack = t; setStatus("<p><b>" + esc(t.title) + "</b> is ready. Press <b>Switch to SpotifyNinja</b> above to load it on Deck A.</p>");
        var p = $("sn-prompt"); if (p) { p.scrollIntoView({ block: "nearest" }); p.classList.add("is-flash"); setTimeout(function () { p.classList.remove("is-flash"); }, 1200); } return;
      }
      SP.activate(); command("load-track", "a", { uri: t.uri, position_ms: 0 }, "search");
      cur.track = { uri: t.uri, title: t.title, artist: t.artist, artwork: t.art || "" }; C.byId.a.el.title.textContent = t.title + " · " + t.artist; paintCues();
      say("a", "Loading " + t.title + "…"); if (menuApi) menuApi.close();
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = q.value.trim(); if (v.length < 2 || !SP || !SP.connected()) return; Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute("aria-pressed", "false"); }); runSearch(v, "“" + v + "”"); });
    function onSpotifyTab() { if (SP && SP.connected() && !results.children.length) runGenre(genreIdx < 0 ? 0 : genreIdx); }
    window.addEventListener("gsdj:spotify", function () { renderAll(); var pane = $("sp-pane"); if (pane && !pane.hidden) onSpotifyTab(); });

    /* ---------- mode switching ---------- */
    function reflect() {
      var on = mode === MODE_SN; ctl.setAttribute("data-controller-mode", mode);
      var dmEl = menuApi && menuApi.el && menuApi.el.querySelector(".dm"); if (dmEl) dmEl.setAttribute("data-mode", mode);
      var badge = $("ninja-badge"); if (badge) badge.hidden = !on;
      if (window.GSDJ && window.GSDJ.setChip) window.GSDJ.setChip({ text: on ? "♫ SpotifyNinja" : "◉ Controller", live: false });
      renderAll();
    }
    function enter(source) {
      if (mode === MODE_SN) return; var prev = mode;
      // pause the GoldenSun decks so nothing keeps playing under a play button that now means "Spotify"
      C.decks.forEach(function (d) { if (!d.audio.paused) { d.audio.pause(); C.updatePlayUi(d); } });
      mode = MODE_SN; addNotes(); setInert(true); reflect(); showTempo(); drawTimeline(); spinOn();
      try { sessionStorage.setItem(STORE, MODE_SN); } catch (e) {}
      if (SP && SP.connected()) {                                              // start the real player inside this tap
        SP.activate();
        SP.ensurePlayer().then(function () { SP.activate(); renderAll(); say("a", "SpotifyNinja is ready. Deck A controls Spotify; Deck B prepares the next track."); if (pendingTrack) { var t = pendingTrack; pendingTrack = null; loadTrack(t); } })
          .catch(function (er) { say("a", er && er.message ? er.message : "Spotify could not start. Using the preview."); renderAll(); });
      } else C.say("SpotifyNinja is active. Deck A controls Spotify. Deck B prepares what plays next.");
      emitMock(); paintCues();
      send("gsdj:modechange", { v: V, type: "mode", mode: MODE_SN, previous: prev, source: source || "prompt", ts: now() });
    }
    function exit(source) {
      if (mode !== MODE_SN) return; var prev = mode;
      if (real()) SP.handle({ action: "pause", value: {} }); mockPlaying(false);
      mode = MODE_GS; setInert(false); reflect();
      try { sessionStorage.removeItem(STORE); } catch (e) {}
      C.decks.forEach(function (d) { C.paintCues(d); C.setBpm(d); C.updatePlayUi(d); d.el.title.textContent = d.el.title.getAttribute("data-gs-title") || d.el.title.textContent; });
      C.say("Back on the GoldenSun Controller."); C.loopOn();
      send("gsdj:modechange", { v: V, type: "mode", mode: MODE_GS, previous: prev, source: source || "return", ts: now() });
    }
    // remember each deck's GoldenSun title so it can come back after the Spotify title replaced it
    var titleWatch = new MutationObserver(function () { if (mode === MODE_GS) C.decks.forEach(function (d) { d.el.title.setAttribute("data-gs-title", d.el.title.textContent); }); });
    C.decks.forEach(function (d) { d.el.title.setAttribute("data-gs-title", d.el.title.textContent); titleWatch.observe(d.el.title, { childList: true, characterData: true, subtree: true }); });

    var sw = $("sn-switch"), keep = $("sn-keep"), ret = $("sn-return");
    if (sw) sw.addEventListener("click", function () { var hadPending = !!pendingTrack; enter("prompt"); if (menuApi && !hadPending) menuApi.close(); else if (menuApi && !(SP && SP.connected())) menuApi.close(); });
    if (keep) keep.addEventListener("click", function () { pendingTrack = null; if (menuApi) menuApi.close(); });
    if (ret) ret.addEventListener("click", function () { command("exit-ninja", "a", {}, "pane"); if (menuApi) menuApi.close(); });

    window.GSDJNinja = {
      mode: function () { return mode; }, active: inNinja, enter: enter, exit: exit,
      packet: { validate: validate, command: command, actions: ACTIONS.slice(), version: V },
      openPane: function () { if (menuApi) menuApi.open("a", "spotify"); }, onSpotifyTab: onSpotifyTab,
      surface: { cur: function () { return cur; }, pos: shownPos }
    };
    reflect();
    // back from the Spotify login page: open the Spotify tab so the result is visible
    var fromLogin = location.hash === "#spotify";
    if (fromLogin) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} setTimeout(function () { window.GSDJNinja.openPane(); }, 300); }
    // within one browser session only: reloading keeps the mode, a new session always starts on GoldenSun
    try { if (sessionStorage.getItem(STORE) === MODE_SN && !fromLogin) enter("session"); } catch (e) {}
  }
  if (window.GSDJCtl && window.GSDJDeckMenu) init(); else window.addEventListener("gsdj-ctl-ready", function () { setTimeout(function () { if (window.GSDJDeckMenu) init(); }, 0); }, { once: true });
})();
