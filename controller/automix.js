/* GoldenSunDJ Controller: Auto-mix and fades for GoldenSun tracks (Library, Device file, Audius). v23.
   Auto-mix (settings wheel, Add-ons page): when the playing deck is about to end, the next track mixes in on the other deck:
   it comes from the other deck if a track is waiting there, otherwise from the Up next list. Tempos are synced first (within 8%),
   the other deck starts, and the crossfader glides across. This uses the real Web Audio mixer, so it is only for tracks GoldenSunDJ
   can play itself. SpotifyNinja never does this: it uses Ninja Switch, one track at a time. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl; if (!C) return; var $ = C.$, settings = C.settings;
    var FK = "gsdj-gs-fade", fadeLen = 4, timers = {}, mixing = null, asked = {};
    try { var v = parseFloat(localStorage.getItem(FK)); if (v >= 0.5 && v <= 8) fadeLen = v; } catch (e) {}
    function setFadeLen(x) { fadeLen = Math.max(0.5, Math.min(8, x)); try { localStorage.setItem(FK, String(fadeLen)); } catch (e) {} }
    function applyGain(d) { if (!d.nodes || !d.nodes.vg) return; d.nodes.vg.gain.setTargetAtTime(d.muted ? 0 : (d.vol == null ? 1 : d.vol), C.audio().ctx.currentTime, 0.015); }
    function fade(d) {                                                    // fade this deck out, or back in if it is faded out
      C.ensureCtx(); C.build(d); clearInterval(timers[d.id]);
      var from = d.vol == null ? 1 : d.vol, out = from > 0.05, to = out ? 0 : (d.fadeBack || 1); if (out) d.fadeBack = from; d.muted = false;
      var t0 = performance.now(), ms = fadeLen * 1000;
      timers[d.id] = setInterval(function () { var k = Math.min(1, (performance.now() - t0) / ms); d.vol = out ? from * Math.pow(1 - k, 2) : to * Math.pow(k, 2); applyGain(d); if (k >= 1) { clearInterval(timers[d.id]); d.vol = to; applyGain(d); } }, 40);
      return out;
    }
    function other(d) { return d.id === "a" ? C.byId.b : C.byId.a; }
    function real(d) { return !!(d.audio.src && d.src && d.src.kind !== "demo"); }
    function playing(d) { return real(d) && !d.audio.paused && isFinite(d.audio.duration) && d.audio.duration > 0; }
    function fire(el) { el.dispatchEvent(new Event("input", { bubbles: true })); }
    function tick() {
      if (!settings.automix || mixing || settings.decks !== 2 || (window.GSDJNinja && window.GSDJNinja.active())) return;
      var mixLen = Math.max(4, fadeLen), menu = window.GSDJDeckMenu;
      [C.byId.a, C.byId.b].forEach(function (d) {
        if (mixing || !playing(d)) return;
        if (d.audio.loop) { d.audio.loop = false; C.updatePlayUi(d); C.say("Auto-mix turned Repeat off so tracks can finish and hand over."); } var o = other(d), rem = d.audio.duration - d.audio.currentTime;
        var ready = real(o) && o.audio.paused && o.audio.currentTime < 2;
        if (!ready && rem <= 50 && !asked[d.id + d.audio.src] && menu && menu.nav && menu.nav.hasNext() && !playing(o)) { asked[d.id + d.audio.src] = 1; C.say("Auto-mix: getting the next track ready on deck " + o.id.toUpperCase() + "."); menu.nav.next(o.id); return; }
        if (ready && rem <= mixLen + 0.4) startMix(d, o, mixLen);
      });
    }
    function startMix(d, o, len) {
      mixing = { from: d, to: o };
      if (d.bpm && o.bpm) { var sb = $("deck-" + o.id).querySelector(".tm-sync"); if (sb) sb.click(); }
      var xf = $("xfade"), a = d.id === "a" ? -100 : 100, b = -a; xf.value = a; fire(xf);
      o.el.play.click(); C.say("Auto-mix: " + (o.el.title.textContent || "next track") + " is coming in on deck " + o.id.toUpperCase() + ".");
      var t0 = performance.now(), iv = setInterval(function () {
        var k = Math.min(1, (performance.now() - t0) / (len * 1000)); xf.value = Math.round(a + (b - a) * k); fire(xf);
        if (k >= 1) { clearInterval(iv); d.audio.pause(); C.updatePlayUi(d); mixing = null; }
      }, 50);
    }
    setInterval(tick, 500);
    window.GSDJAutomix = { fade: fade, fadeLen: function () { return fadeLen; }, setFadeLen: setFadeLen, changed: function (on) { C.say(on ? "Auto-mix on. When a track nears its end, the next one mixes in on the other deck (from that deck, or from Up next)." : "Auto-mix off."); } };
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
