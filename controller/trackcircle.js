/* GoldenSunDJ Controller: the Track circle (beside the gear in the center strip).
   A radial menu of everyday track controls for ONE deck at a time: the target. The target is shown in the
   button ("TRACK A", "TRACK B", or "LIVE" / "NEXT" in SpotifyNinja) and by a colored outline on that deck.
   Page 1 is Transport, page 2 is Level, page 3 is Queue (Previous, Next, Shuffle, Up next). Sliders open in a small panel under the circle, never around the ring.
   The same buttons work on normal tracks (through the Web Audio engine) and on Spotify (through gsdj:command packets).
   Performance functions (loops, beat jump, scrub, timeline, cues) stay on the decks themselves. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$, clamp = C.clamp, fmt = C.fmt;
    var btn = $("track-btn"), idEl = $("track-id"); if (!C || !btn) return;
    var target = "a", page = 0, openSlider = null, spVol = 0.85, spMuted = false, volT = null;
    function N() { return window.GSDJNinja || null; }
    function ninja() { var n = N(); return !!(n && n.active()); }
    function deck() { return C.byId[target]; }
    var fbT = null;
    function toast(msg) { if (!scrim.hidden) { var w = $("tc-why"); if (w) { w.textContent = msg; clearTimeout(fbT); fbT = setTimeout(function () { w.textContent = reason(); }, 2400); } return; } if (C.toast) C.toast(deck(), msg); else C.say(msg); }
    function cmd(action, value) { var n = N(); return n && n.packet.command(action, target, value || {}, "track-circle"); }
    function live() { var n = N(); return n && n.surface ? n.surface.cur() : { pos: 0, dur: 0, paused: true, repeat: "off" }; }

    /* ---------- the target: button label and a colored outline on the deck ---------- */
    function paintTarget() {
      document.querySelectorAll(".deck").forEach(function (d) { d.classList.toggle("is-target", d.id === "deck-" + target); });
      var nj = ninja(), top = btn.querySelector(".tb-top");
      if (nj) { top.textContent = target === "a" ? "LIVE" : "NEXT"; idEl.hidden = true; }
      else { top.textContent = "TRACK"; idEl.hidden = false; idEl.textContent = target.toUpperCase(); }
      btn.setAttribute("aria-label", "Track controls for " + (nj ? (target === "a" ? "the live Spotify track" : "the next track") : "deck " + target.toUpperCase()));
    }
    function setTarget(id) { if (id === "b" && C.settings.decks === 1) id = "a"; target = id; paintTarget(); if (!scrim.hidden) draw(); }
    document.addEventListener("pointerdown", function (e) { if (!scrim.hidden) return; var d = e.target.closest && e.target.closest(".deck"); if (d && d.id !== "deck-" + target) setTarget(d.id === "deck-b" ? "b" : "a"); }, true);
    window.addEventListener("gsdj:modechange", function () { paintTarget(); if (!scrim.hidden) draw(); });

    /* ---------- what each control does, per mode ---------- */
    function hasTrack() { return ninja() ? true : !!deck().audio.src; }
    function reason() {
      if (ninja()) return "";
      return hasTrack() ? "" : "Load a track on this deck first.";
    }
    function T() { return window.GSDJNinjaTools || null; }
    function nav() { return ninja() ? (T() && T().nav) : (window.GSDJDeckMenu && window.GSDJDeckMenu.nav); }
    var NEXT_ONLY = "That control works on the live track. Switch the target to LIVE.";
    var ITEMS = [
      { page: 0, id: "restart", icon: "⏮", label: "Restart", on: function () { return false; }, tap: function () {
          if (ninja() && target === "b") { T().setStart(0); return; }
          if (ninja()) { cmd("seek", { position_ms: 0 }); toast("Back to the start."); }
          else { var d = deck(); d.audio.currentTime = 0; d.livePos = null; toast("Back to the start."); } } },
      { page: 0, id: "back", icon: "⏪", label: "−10 s", on: function () { return false; }, tap: function () { skip(-10); } },
      { page: 0, id: "fwd", icon: "⏩", label: "+10 s", on: function () { return false; }, tap: function () { skip(10); } },
      { page: 0, id: "repeat", icon: "↻", label: "Repeat", on: function () { return ninja() ? live().repeat === "track" : deck().audio.loop; }, why: function () { return ninja() && target === "b" ? NEXT_ONLY : ""; }, tap: function () {
          if (ninja()) { var next = live().repeat === "track" ? "off" : "track"; cmd("set-repeat", { state: next }); toast(next === "track" ? "Repeat this track: on." : "Repeat: off."); }
          else { var d = deck(); d.audio.loop = !d.audio.loop; toast(d.audio.loop ? "Repeat on. The track plays again when it ends." : "Repeat off. The track stops when it ends."); C.updatePlayUi(d); } } },
      { page: 1, id: "mute", icon: "⊘", label: "Mute", on: function () { return ninja() ? spMuted : !!deck().muted; }, why: function () { return ninja() && target === "b" ? NEXT_ONLY : ""; }, tap: function () { toggleMute(); } },
      { page: 1, id: "volume", icon: "♪", label: "Volume", on: function () { return openSlider === "volume"; }, why: function () { return ninja() && target === "b" ? NEXT_ONLY : ""; }, tap: function () { showSlider(openSlider === "volume" ? null : "volume"); } },
      { page: 1, id: "fade", icon: "☁", label: "Fade", on: function () { return ninja() ? !!(T() && T().faded()) : (deck().vol != null && deck().vol < 0.05); }, why: function () { return ninja() && target === "b" ? NEXT_ONLY : (!ninja() && !deck().audio.src ? "Load a track on this deck first." : ""); }, tap: function () {
          if (ninja()) { T().fadeToggle(); return; } var am = window.GSDJAutomix; if (am) { var out = am.fade(deck()); toast(out ? "Fading out over " + am.fadeLen() + " seconds." : "Fading in over " + am.fadeLen() + " seconds."); } } },
      { page: 1, id: "fadelen", icon: "⏱", label: "Fade length", on: function () { return openSlider === "fade"; }, tap: function () { showSlider(openSlider === "fade" ? null : "fade"); } },
      { page: 2, id: "prev", icon: "⏮", label: "Previous", on: function () { return false; }, why: function () { return ninja() && target === "b" ? NEXT_ONLY : ""; }, tap: function () { var n = nav(); if (n) n.previous(target); } },
      { page: 2, id: "next", icon: "⏭", label: "Next", on: function () { return false; }, why: function () { var n = nav(); return n && n.hasNext(target) ? "" : (n ? n.nextReason() : "No queue here yet."); }, tap: function () { var n = nav(); if (n) n.next(target); } },
      { page: 2, id: "shuffle", icon: "⤮", label: "Shuffle", on: function () { var n = nav(); return !!(n && n.shuffleOn()); }, tap: function () { var n = nav(); if (n) { n.shuffle(); toast(n.shuffleOn() ? "Shuffle on." : "Shuffle off."); } } },
      { page: 2, id: "auto", only: "ninja", icon: "⇥", label: "Auto-next", on: function () { return !!(T() && T().auto.on()); }, why: function () { return target === "b" ? NEXT_ONLY : ""; }, tap: function () { var on = T().auto.toggle(); toast(on ? "Auto-next on. Near the end of a track, Ninja Switch brings in what is up next." : "Auto-next off."); } },
      { page: 2, id: "queue", icon: "☰", label: "Up next", on: function () { return false; }, tap: function () { close(); var m = window.GSDJDeckMenu; if (m) m.open(target, ninja() ? "spotify" : "link", { queue: true }); } }
    ];
    var PAGE_NAMES = ["Transport", "Level", "Queue"];
    function skip(sec) {
      if (ninja() && target === "b") { var ps = T() && T().prepStart(); if (ps) T().setStart(ps.start + sec * 1000); else toast("Choose a next track first. In the Spotify tab, tap Prep."); return; }
      if (ninja()) { var s = live(), p = Math.max(0, Math.min(Math.max(0, s.dur - 50), s.pos + sec * 1000)); cmd("seek", { position_ms: Math.round(p) }); toast((sec > 0 ? "+" : "−") + Math.abs(sec) + " seconds."); return; }
      var d = deck(), dur = d.audio.duration, t = d.audio.currentTime + sec; t = isFinite(dur) && dur > 0 ? Math.max(0, Math.min(dur - 0.05, t)) : Math.max(0, t);
      d.audio.currentTime = t; d.livePos = null; toast((sec > 0 ? "+" : "−") + Math.abs(sec) + " seconds.");
    }
    function applyDeckGain(d) { if (!d.nodes || !d.nodes.vg) return; var ctx = C.audio().ctx; d.nodes.vg.gain.setTargetAtTime(d.muted ? 0 : (d.vol == null ? 1 : d.vol), ctx.currentTime, 0.015); }
    function toggleMute() {
      if (ninja()) { spMuted = !spMuted; cmd("set-volume", { volume: spMuted ? 0 : spVol }); toast(spMuted ? "Muted." : "Sound back on."); return; }
      var d = deck(); C.ensureCtx(); C.build(d); d.muted = !d.muted; applyDeckGain(d); toast(d.muted ? "Deck " + d.id.toUpperCase() + " muted." : "Deck " + d.id.toUpperCase() + " sound back on.");
    }

    /* ---------- the slider panel (under the circle) ---------- */
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var box = document.createElement("div"); box.className = "wheel-scrim tc-scrim"; box.id = "track-wheel"; box.hidden = true; var scrim = box;
    box.innerHTML = '<div class="tc-box"><div class="wheel-wrap tc-wrap" role="dialog" aria-modal="true" aria-label="Track controls"><div class="wheel" id="tc-ring"></div>' +
      '<div class="wheel-center"><button type="button" class="tc-target" id="tc-target" aria-label="Switch the target deck"></button><span id="tc-page"></span><span class="tc-why" id="tc-why"></span></div></div>' +
      '<div class="tc-side"><div class="tc-panel" id="tc-panel" hidden><label for="tc-vol" id="tc-vol-l">Volume</label><div class="tc-row"><input type="range" id="tc-vol" min="0" max="100" step="1"><output id="tc-vol-o" class="tnum"></output></div><p class="tc-note" id="tc-note" hidden></p></div><div class="tc-panel" id="tc-fpanel" hidden><label for="tc-fadelen">Fade length</label><div class="tc-row"><input type="range" id="tc-fadelen" min="0.5" max="8" step="0.5"><output id="tc-fade-o" class="tnum"></output></div></div>' +
      '<div class="tc-foot"><button type="button" class="tbtn" id="tc-next">Level ▸</button><button type="button" class="tbtn" id="tc-done">Done</button></div></div></div>';
    C.el.appendChild(box);                                                      // inside the controller so it uses the controller theme colors
    var ring = $("tc-ring"), panel = $("tc-panel"), vol = $("tc-vol"), volO = $("tc-vol-o"), note = $("tc-note");
    function curVol() { return ninja() ? spVol : (deck().vol == null ? 1 : deck().vol); }
    var fpanel = $("tc-fpanel"), flen = $("tc-fadelen"), fo = $("tc-fade-o");
    function fadeLenNow() { return ninja() ? N().macros.fade : (window.GSDJAutomix ? window.GSDJAutomix.fadeLen() : 4); }
    flen.addEventListener("input", function () { var v = parseFloat(flen.value); fo.textContent = v + " s"; if (ninja()) { N().macros.fade = v; N().saveMacros(); } else if (window.GSDJAutomix) window.GSDJAutomix.setFadeLen(v); });
    function showSlider(which) {
      fpanel.hidden = which !== "fade"; if (which === "fade") { flen.value = fadeLenNow(); fo.textContent = fadeLenNow() + " s"; }
      openSlider = which; panel.hidden = which !== "volume"; if (which === "volume") { var v = Math.round(curVol() * 100); vol.value = v; volO.textContent = v + "%"; var nj = ninja(); note.hidden = !(nj && isIOS); note.textContent = nj && isIOS ? "On iPhone and iPad, the volume from a web page may not change how loud Spotify is. If it does not, use the device volume buttons." : ""; }
      draw();
    }
    vol.addEventListener("input", function () {
      var v = parseInt(vol.value, 10) / 100; volO.textContent = Math.round(v * 100) + "%";
      if (ninja()) { spVol = v; spMuted = false; var m = $("master"); if (m) m.value = Math.round(v * 100); clearTimeout(volT); volT = setTimeout(function () { cmd("set-volume", { volume: v }); }, 80); }
      else { var d = deck(); C.ensureCtx(); C.build(d); d.vol = v; d.muted = false; applyDeckGain(d); }
      draw();
    });

    /* ---------- drawing the ring ---------- */
    function draw() {
      var items = ITEMS.filter(function (i) { return i.page === page && (!i.only || (i.only === "ninja") === ninja()); }), why = reason(); ring.textContent = "";
      $("tc-target").innerHTML = (ninja() ? '<i class="nj-star tc-star nj-spin" aria-hidden="true"></i>' + (target === "a" ? "LIVE" : "NEXT") : "TRACK " + target.toUpperCase()) + " <i aria-hidden=\"true\">⇄</i>";
      $("tc-page").textContent = PAGE_NAMES[page]; $("tc-next").textContent = PAGE_NAMES[(page + 1) % PAGE_NAMES.length] + " ▸"; $("tc-why").textContent = why;
      items.forEach(function (it, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "wheel-item"; b.style.setProperty("--ang", (i * 360 / items.length) + "deg");
        var iw = why || (it.why ? it.why() : ""), off = !!iw; b.setAttribute("aria-pressed", !off && it.on() ? "true" : "false"); if (off) { b.setAttribute("aria-disabled", "true"); b.classList.add("is-off"); }
        b.innerHTML = '<b aria-hidden="true">' + it.icon + "</b><span>" + it.label + (it.id === "volume" ? "" : "") + "</span>";
        b.addEventListener("click", function () { var w2 = why || (it.why ? it.why() : ""); if (w2) { toast(w2); return; } it.tap(); draw(); });
        ring.appendChild(b);
      });
      var d = deck(); document.querySelectorAll(".deck").forEach(function (x) { x.classList.toggle("is-target", x.id === "deck-" + target); });
      if (openSlider === "volume") { var v = Math.round(curVol() * 100); if (parseInt(vol.value, 10) !== v) vol.value = v; volO.textContent = v + "%"; }
    }
    function open() { paintTarget(); page = 0; openSlider = null; panel.hidden = true; fpanel.hidden = true; box.hidden = false; btn.setAttribute("aria-expanded", "true"); draw(); var f = ring.querySelector("button"); if (f) f.focus(); }
    function close() { box.hidden = true; panel.hidden = true; fpanel.hidden = true; openSlider = null; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    btn.addEventListener("click", open);
    $("tc-done").addEventListener("click", close); box.addEventListener("click", function (e) { if (e.target === box) close(); });
    $("tc-next").addEventListener("click", function () { page = (page + 1) % PAGE_NAMES.length; openSlider = null; panel.hidden = true; fpanel.hidden = true; draw(); });
    $("tc-target").addEventListener("click", function () { if (C.settings.decks === 1) { toast("Only one deck is on. Turn on 2 decks in the settings wheel to use deck B."); return; } setTarget(target === "a" ? "b" : "a"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
    // when a track ends and Repeat is off, make sure the play button says so
    C.decks.forEach(function (d) { d.audio.addEventListener("ended", function () { C.updatePlayUi(d); }); });
    // the gear wheel and the Track circle never open together
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#wheel-btn") && !box.hidden) close(); }, true);

    function asA(fn) { var keep = target; target = "a"; try { return fn(); } finally { target = keep; } }
    window.GSDJTrack = { open: open, close: close, target: function () { return target; }, setTarget: setTarget,
      run: function (id) { var it = ITEMS.filter(function (x) { return x.id === id; })[0]; if (it) asA(function () { it.tap(); }); },          // Ninja Pads use these on the live deck
      isOn: function (id) { var it = ITEMS.filter(function (x) { return x.id === id; })[0]; return it ? asA(function () { return !!it.on(); }) : false; } };
    paintTarget();
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
