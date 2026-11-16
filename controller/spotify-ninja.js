/* GoldenSunDJ Controller: SpotifyNinja mode (Patch 1, the safe shell).
   GoldenSun Controller stays the default and is never changed by this file's code paths:
   the existing audio engine, Library, Load and Audius are not touched. This module only
     1. runs the Spotify tab (the "Switch to SpotifyNinja Controller?" prompt and the return action),
     2. turns controller gestures into tiny JSON packets (window events gsdj:command / gsdj:state / gsdj:modechange),
     3. hosts a MOCK adapter that answers those packets. There is no Spotify sign-in, SDK, token or
        network call in this patch, so nothing plays yet. Patch 2 replaces the mock with the real adapter.
   The packet contract does not mention Spotify's API, so another adapter (djay, Serato, a local
   companion) could consume the same commands later. */
(function () {
  "use strict";
  var V = 1, MODE_GS = "goldensun", MODE_SN = "spotify-ninja", STORE = "gsdj-controller-mode", CUES = "gsdj-ninja-cues";
  var ACTIONS = ["play", "pause", "toggle-play", "seek", "next", "previous", "set-volume", "load-track", "save-cue", "clear-cue", "select-prep-track", "activate-prep-track", "exit-ninja"];
  var CAPS = { seek: true, volume: true, tempo: false, eq: false, scratch: false, two_live_decks: false };

  /* ---------- the packet contract ---------- */
  function now() { return Date.now(); }
  function validate(p) {
    if (!p || typeof p !== "object") return false;
    if (p.v !== V) return false;
    if (p.type === "command") return typeof p.mode === "string" && ACTIONS.indexOf(p.action) !== -1 && (p.deck === undefined || p.deck === "a" || p.deck === "b") && (p.value === undefined || typeof p.value === "object") && typeof p.ts === "number";
    if (p.type === "state") return typeof p.mode === "string" && typeof p.connected === "boolean" && typeof p.paused === "boolean" && typeof p.position_ms === "number" && typeof p.duration_ms === "number" && p.capabilities && typeof p.capabilities === "object";
    if (p.type === "mode") return typeof p.mode === "string" && typeof p.previous === "string" && typeof p.ts === "number";
    return false;
  }
  function send(name, packet) {
    if (!validate(packet)) { if (window.console) console.warn("GSDJ: dropped an invalid packet", packet); return false; }
    window.dispatchEvent(new CustomEvent(name, { detail: packet })); return true;
  }
  function command(action, deck, value, source) { var p = { v: V, type: "command", mode: MODE_SN, action: action, deck: deck, value: value || {}, source: source || "surface", ts: now() }; return send("gsdj:command", p); }

  function init() {
    var C = window.GSDJCtl, $ = C.$, ctl = C.el, menuApi = window.GSDJDeckMenu;
    if (!C || !ctl) return;
    var mode = MODE_GS, adapterTimer = null;

    /* ---------- cue storage, keyed by Spotify URI (local only) ---------- */
    function cueStore() { try { return JSON.parse(localStorage.getItem(CUES) || "{}"); } catch (e) { return {}; } }
    function cuesFor(uri) { var s = cueStore()[uri]; return s ? { c: (s.c || []).slice(0, 4), p: s.p == null ? null : s.p } : { c: [null, null, null, null], p: null }; }
    function saveCues(uri, v) { try { var all = cueStore(); all[uri] = { c: v.c, p: v.p, u: now() }; var keys = Object.keys(all); if (keys.length > 80) keys.sort(function (a, b) { return all[a].u - all[b].u; }).slice(0, keys.length - 80).forEach(function (k) { delete all[k]; }); localStorage.setItem(CUES, JSON.stringify(all)); } catch (e) {} }

    /* ---------- the mock adapter (Patch 1). It never touches audio or the network. ---------- */
    var mock = { paused: true, pos: 0, dur: 213000, vol: 0.85, track: { uri: "spotify:track:preview", title: "SpotifyNinja preview", artist: "Spotify is not connected yet", artwork: "" } };
    function stateFrom(m) { return { v: V, type: "state", mode: MODE_SN, connected: false, paused: m.paused, position_ms: Math.round(m.pos), duration_ms: m.dur, track: m.track, capabilities: CAPS, ts: now() }; }
    function emitState() { send("gsdj:state", stateFrom(mock)); }
    function tickMock() { if (mock.paused) { clearInterval(adapterTimer); adapterTimer = null; return; } mock.pos = Math.min(mock.dur, mock.pos + 500); if (mock.pos >= mock.dur) { mock.paused = true; } emitState(); }
    function setPlaying(on) { mock.paused = !on; if (on && !adapterTimer) adapterTimer = setInterval(tickMock, 500); if (!on) { clearInterval(adapterTimer); adapterTimer = null; } emitState(); }
    window.addEventListener("gsdj:command", function (e) {
      var p = e.detail; if (mode !== MODE_SN || !p || p.mode !== MODE_SN) return;
      switch (p.action) {
        case "toggle-play": setPlaying(mock.paused); break;
        case "play": setPlaying(true); break;
        case "pause": setPlaying(false); break;
        case "seek": mock.pos = Math.max(0, Math.min(mock.dur, (p.value && p.value.position_ms) || 0)); emitState(); break;
        case "set-volume": mock.vol = Math.max(0, Math.min(1, (p.value && p.value.volume) == null ? mock.vol : p.value.volume)); emitState(); break;
        case "save-cue": { var cs = cuesFor(mock.track.uri), ms = (p.value && p.value.position_ms) != null ? p.value.position_ms : mock.pos; if (p.value && p.value.slot === "primary") cs.p = ms; else cs.c[(p.value && p.value.slot) | 0] = ms; saveCues(mock.track.uri, cs); paintCues(); break; }
        case "clear-cue": { var c2 = cuesFor(mock.track.uri); c2.c[(p.value && p.value.slot) | 0] = null; saveCues(mock.track.uri, c2); paintCues(); break; }
        case "exit-ninja": exit(); break;
        default: break;                                            // next, previous, load-track and prep actions arrive with the real adapter
      }
    });

    /* ---------- surface: what the controller shows in this mode ---------- */
    function fmt(ms) { return C.fmt(ms / 1000); }
    function say(deckId, msg) { if (C.toast) C.toast(C.byId[deckId || "a"], msg); else C.say(msg); }
    function paintCues() {
      if (mode !== MODE_SN) return; var d = C.byId.a, cs = cuesFor(mock.track.uri);
      document.querySelectorAll("#deck-a .cue").forEach(function (b, i) { var t = cs.c[i], sm = b.querySelector("small"); b.classList.toggle("is-set", t != null); if (sm) sm.textContent = t != null ? fmt(t) : "Save"; b.setAttribute("aria-label", t != null ? "Spotify cue " + (i + 1) + " at " + fmt(t) + ". Tap to jump. Hold to clear." : "Spotify cue " + (i + 1) + ", empty. Tap to save this spot."); });
    }
    window.addEventListener("gsdj:state", function (e) {
      var s = e.detail; if (mode !== MODE_SN || !s || s.mode !== MODE_SN) return;
      var a = C.byId.a; a.el.title.textContent = s.track.title + " · " + s.track.artist;
      a.el.play.setAttribute("aria-pressed", s.paused ? "false" : "true"); a.el.play.textContent = s.paused ? "Play" : "Pause";
      a.el.time.textContent = fmt(s.position_ms) + " / " + fmt(s.duration_ms); a.el.bpm.textContent = "--";
    });

    // inert groups: controls that cannot work with protected audio are switched off, not hidden, with a reason
    var INERT = ["#deck-a .opt-tempo", "#deck-a .opt-eq", "#deck-a .opt-eq2", "#deck-a .opt-loop", "#deck-a .deck-drawers", "#deck-a .plat-zone", "#deck-b .deck-body", "#deck-b .opt-eq2", "#deck-b .opt-loop", "#deck-b .deck-drawers", "#deck-b .deck-side", ".center .opt-fx", ".center .opt-xfade"];
    function setInert(on) {
      INERT.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-disabled", "true"); } else { el.removeAttribute("inert"); el.removeAttribute("aria-disabled"); } }); });
      ["a", "b"].forEach(function (id) { var t = $("toast-" + id); if (t) t.hidden = true; });
      if (on) { ["a", "b"].forEach(function (id) { document.querySelectorAll("#deck-" + id + " .drawer-x:not([hidden])").forEach(function (dr) { dr.hidden = true; }); document.querySelectorAll("#deck-" + id + " .deck-drawers button").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); }); }
    }
    function addNotes() {
      if (document.querySelector(".ninja-note")) return;
      var make = function (txt) { var n = document.createElement("span"); n.className = "ninja-note"; n.textContent = txt; return n; };
      document.querySelectorAll("#deck-a .opt-tempo").forEach(function (el) { el.appendChild(make("Spotify controlled")); });
      var b = document.querySelector("#deck-b .deck-body"); if (b) { var p = make("Prep Deck. Choosing the next track arrives in a later update."); p.classList.add("ninja-prep"); document.getElementById("deck-b").appendChild(p); }
      var badge = document.createElement("div"); badge.className = "ninja-badge"; badge.id = "ninja-badge"; badge.setAttribute("role", "status");
      badge.innerHTML = '<i aria-hidden="true"></i><span>SpotifyNinja</span><small>Spotify</small>';
      var center = document.querySelector(".center"); if (center) center.insertBefore(badge, center.firstChild);
    }

    /* ---------- intercepts: in this mode, a few controls send packets instead of driving local audio ---------- */
    function inNinja() { return mode === MODE_SN; }
    var holdT = null, held = false;
    function cueButton() {                                                     // the Cue button: paused sets the point, playing returns to it
      var cs = cuesFor(mock.track.uri);
      if (mock.paused) { command("save-cue", "a", { slot: "primary", position_ms: Math.round(mock.pos) }, "cue"); say("a", "Cue point set at " + fmt(mock.pos) + "."); }
      else { var p = cs.p == null ? 0 : cs.p; command("pause", "a", {}, "cue"); command("seek", "a", { position_ms: p }, "cue"); say("a", "Back at the cue point (" + fmt(p) + ")."); }
    }
    function hotCue(i) {
      var cs = cuesFor(mock.track.uri);
      if (cs.c[i] == null) { command("save-cue", "a", { slot: i, position_ms: Math.round(mock.pos) }, "hot-cue"); say("a", "Spotify cue " + (i + 1) + " saved at " + fmt(mock.pos) + "."); }
      else { command("seek", "a", { position_ms: cs.c[i] }, "hot-cue"); say("a", "Jumped to Spotify cue " + (i + 1) + " at " + fmt(cs.c[i]) + "."); }
    }
    document.addEventListener("click", function (e) {
      if (!inNinja()) return;
      var t = e.target.closest && e.target.closest("#play-a, #play-b, .cue, #cue-a, #cue-b"); if (!t) return;
      var deckEl = t.closest(".deck"); var id = deckEl && deckEl.id === "deck-b" ? "b" : "a";
      e.stopImmediatePropagation(); e.preventDefault();
      if (id === "b") { say("b", "Deck B is the Prep Deck. Choosing the next track arrives in a later update."); return; }
      if (t.id === "play-a") { command("toggle-play", "a", {}, "play"); return; }
      var keyboard = e.detail === 0;                                           // pointer taps were already handled on pointerdown
      if (t.id === "cue-a") { if (keyboard) cueButton(); return; }
      if (t.classList.contains("cue")) { if (held) { held = false; return; } hotCue(+t.getAttribute("data-cue")); }
    }, true);
    document.addEventListener("pointerdown", function (e) {
      if (!inNinja()) return;
      var t = e.target.closest && e.target.closest("#cue-a, #cue-b, .cue"); if (!t) return;
      e.stopImmediatePropagation(); if (t.closest("#deck-b")) return;
      if (t.id === "cue-a") { e.preventDefault(); cueButton(); return; }
      held = false; clearTimeout(holdT); var i = +t.getAttribute("data-cue"); if (cuesFor(mock.track.uri).c[i] == null) return;
      holdT = setTimeout(function () { held = true; command("clear-cue", "a", { slot: i }, "hot-cue"); say("a", "Spotify cue " + (i + 1) + " cleared."); }, 600);
    }, true);
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(holdT); }, true); });
    var master = $("master");
    if (master) master.addEventListener("input", function (e) { if (!inNinja()) return; e.stopImmediatePropagation(); command("set-volume", "a", { volume: parseFloat(master.value) / 100 }, "master"); }, true);

    /* ---------- mode switching ---------- */
    function setStatus(html) { var el = $("sn-status"); if (el) el.innerHTML = html; }
    function reflect() {
      var on = mode === MODE_SN; ctl.setAttribute("data-controller-mode", mode);
      var dmEl = menuApi && menuApi.el && menuApi.el.querySelector(".dm"); if (dmEl) dmEl.setAttribute("data-mode", mode);
      var prompt = $("sn-prompt"), act = $("sn-active"); if (prompt) prompt.hidden = on; if (act) act.hidden = !on;
      setStatus(on ? '<p><b>Preview build.</b> Spotify sign-in arrives in the next update, so nothing plays yet. Cue points and the controls you can use here already work, and they are saved on this device.</p>' : '<p>Spotify is not connected. Opening this tab never changes your controller.</p>');
      var badge = $("ninja-badge"); if (badge) badge.hidden = !on;
      if (window.GSDJ && window.GSDJ.setChip) window.GSDJ.setChip({ text: on ? "♫ SpotifyNinja" : "◉ Controller", live: false });
    }
    var returned = { a: false, b: false };
    function enter(source) {
      if (mode === MODE_SN) return; var prev = mode;
      // pause the GoldenSun decks so nothing keeps playing under a play button that now means "Spotify"
      C.decks.forEach(function (d) { if (!d.audio.paused) { d.audio.pause(); C.updatePlayUi(d); } });
      mode = MODE_SN; addNotes(); setInert(true); reflect();
      try { sessionStorage.setItem(STORE, MODE_SN); } catch (e) {}
      emitState(); paintCues();
      C.say("SpotifyNinja is active. Deck A controls Spotify. Deck B prepares what plays next.");
      send("gsdj:modechange", { v: V, type: "mode", mode: MODE_SN, previous: prev, source: source || "prompt", ts: now() });
    }
    function exit(source) {
      if (mode !== MODE_SN) return; var prev = mode;
      setPlaying(false); mode = MODE_GS; setInert(false); reflect();
      try { sessionStorage.removeItem(STORE); } catch (e) {}
      C.decks.forEach(function (d) { C.paintCues(d); C.setBpm(d); C.updatePlayUi(d); d.el.title.textContent = d.el.title.getAttribute("data-gs-title") || d.el.title.textContent; });
      C.say("Back on the GoldenSun Controller."); C.loopOn();
      send("gsdj:modechange", { v: V, type: "mode", mode: MODE_GS, previous: prev, source: source || "return", ts: now() });
    }
    // remember each deck's GoldenSun title so it can come back after the Spotify title replaced it
    var titleWatch = new MutationObserver(function () { if (mode === MODE_GS) C.decks.forEach(function (d) { d.el.title.setAttribute("data-gs-title", d.el.title.textContent); }); });
    C.decks.forEach(function (d) { d.el.title.setAttribute("data-gs-title", d.el.title.textContent); titleWatch.observe(d.el.title, { childList: true, characterData: true, subtree: true }); });

    var sw = $("sn-switch"), keep = $("sn-keep"), ret = $("sn-return");
    if (sw) sw.addEventListener("click", function () { enter("prompt"); if (menuApi) menuApi.close(); });
    if (keep) keep.addEventListener("click", function () { if (menuApi) menuApi.close(); });
    if (ret) ret.addEventListener("click", function () { command("exit-ninja", "a", {}, "pane"); if (menuApi) menuApi.close(); });

    window.GSDJNinja = {
      mode: function () { return mode; }, active: inNinja, enter: enter, exit: exit,
      packet: { validate: validate, command: command, actions: ACTIONS.slice(), version: V },
      openPane: function () { if (menuApi) menuApi.open("a", "spotify"); }
    };
    reflect();
    // within one browser session only: reloading keeps the mode, a new session always starts on GoldenSun
    try { if (sessionStorage.getItem(STORE) === MODE_SN) enter("session"); } catch (e) {}
  }
  if (window.GSDJCtl && window.GSDJDeckMenu) init(); else window.addEventListener("gsdj-ctl-ready", function () { setTimeout(function () { if (window.GSDJDeckMenu) init(); }, 0); }, { once: true });
})();
