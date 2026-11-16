/* GoldenSunDJ Controller: Ninja tools (v22). The "imitation crab DJ controls" of SpotifyNinja.
   Spotify's audio is protected, so GoldenSunDJ never touches the sound itself. These controls look like DJ controls but only
   send transport commands (play, pause, seek, volume, load) through the packet contract in spotify-ninja.js:
     Scratch   -> Ninja Scrub   (spotify-ninja.js)       Tempo     -> Ninja BPM (tap tempo, beat jump)
     FX        -> Ninja FX      Smoke Fade, Shadow Mute, Shuriken Skip, Vanish, Teleport
     Sampler   -> Ninja Pads    cues, moves, mute, fade (no overlapping audio)
     Crossfader-> Ninja Switch  fade the live track down, load the prepared track at its start, fade up. One track at a time.
     EQ knobs  -> Ninja Macros  Jump size, Fade length, Scrub sensitivity
     Deck B    -> Prep Deck     the next track, its start point, and the Up next queue
   Nothing here mixes or overlaps Spotify audio. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, N = window.GSDJNinja; if (!C || !N) return;
    var $ = C.$, A = C.byId.a, B = C.byId.b, ctl = C.el;
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    function on() { return N.active(); }
    function cur() { return N.surface.cur(); }
    function cmd(a, deck, v, src) { return N.packet.command(a, deck || "a", v || {}, src || "ninja"); }
    function say(m, d) { N.say(d || "a", m); }
    function fmt(ms) { return N.fmt(ms); }
    function Trk() { return window.GSDJTrack || null; }
    function menu() { return window.GSDJDeckMenu || null; }

    /* =============== Up next: the Prep Deck (deck B) and the queue =============== */
    var QK = "gsdj-ninja-queue", Q = { q: [], prep: null, hist: [], shuffle: false };
    try { var sv = JSON.parse(sessionStorage.getItem(QK) || "null"); if (sv) { Q.q = sv.q || []; Q.prep = sv.prep || null; Q.hist = sv.hist || []; Q.shuffle = !!sv.shuffle; } } catch (e) {}
    function save() { try { sessionStorage.setItem(QK, JSON.stringify(Q)); } catch (e) {} }
    function startFor(t) { var cs = N.core.cuesFor(t.uri); return cs.p != null ? cs.p : 0; }        // a saved Cue point is where the track starts
    function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    function ensurePrep() { if (!Q.prep && Q.q.length) { var t = Q.q.shift(); Q.prep = { track: t, start: startFor(t) }; } }
    function known(uri) { return (Q.prep && Q.prep.track.uri === uri) || Q.q.some(function (x) { return x.uri === uri; }); }
    function changed() { save(); renderPrep(); var m = menu(); if (m && m.refreshQueue) m.refreshQueue(); refreshPads(); }
    function enqueue(t) {
      if (known(t.uri)) { say("That track is already up next.", "b"); return; }
      if (!Q.prep) { Q.prep = { track: t, start: startFor(t) }; say("Up next on Deck B: " + t.title + ".", "b"); }
      else { if (Q.shuffle) Q.q.splice(Math.floor(Math.random() * (Q.q.length + 1)), 0, t); else Q.q.push(t); say("Added to Up next (" + (Q.q.length + 1) + " tracks).", "b"); }
      changed();
    }
    function prep(t) {
      Q.q = Q.q.filter(function (x) { return x.uri !== t.uri; });
      if (Q.prep && Q.prep.track.uri !== t.uri) Q.q.unshift(Q.prep.track);
      Q.prep = { track: t, start: startFor(t) }; say("Deck B is ready: " + t.title + " starts at " + fmt(Q.prep.start) + ".", "b"); changed();
    }
    function pushHistory(t) { if (!t || !t.uri) return; if (Q.hist.length && Q.hist[Q.hist.length - 1].uri === t.uri) return; Q.hist.push(t); if (Q.hist.length > 20) Q.hist.shift(); save(); }
    function hasNext() { ensurePrep(); return !!Q.prep; }
    function nextReason() { return hasNext() ? "" : "Nothing is up next. Use Prep or Queue in the Spotify tab to line up tracks."; }
    function next() {                                                  // a hard cut to what is up next. Ninja Switch is the faded version.
      ensurePrep(); if (!Q.prep) { say(nextReason()); return false; }
      var n = Q.prep; Q.prep = null; ensurePrep(); N.core.playTrack(n.track, n.start); changed(); return true;
    }
    function previous() {
      var c = cur(); if (c.pos > 3000 || !Q.hist.length) { cmd("seek", "a", { position_ms: 0 }, "previous"); say(c.pos > 3000 ? "Back to the start." : "Back to the start. There is no earlier track yet."); return true; }
      var h = Q.hist.pop(), live = c.track;
      if (Q.prep) Q.q.unshift(Q.prep.track);
      Q.prep = live && live.uri && live.uri.indexOf("preview") === -1 ? { track: live, start: 0 } : null;
      N.core.playTrack(h, 0, false, true); changed(); return true;
    }
    function toggleShuffle() { Q.shuffle = !Q.shuffle; if (Q.shuffle && Q.q.length > 1) shuf(Q.q); say(Q.shuffle ? "Shuffle on. The Up next list is mixed up." : "Shuffle off.", "b"); changed(); return Q.shuffle; }
    function clearQueue() { Q.q = []; say("Up next list cleared.", "b"); changed(); }
    function setStart(ms) {
      if (!Q.prep) { say("Choose a next track first. In the Spotify tab, tap Prep.", "b"); return; }
      var dur = Q.prep.track.duration_ms || 0; Q.prep.start = Math.max(0, Math.min(Math.max(0, dur - 3000), Math.round(ms))); say("Next track starts at " + fmt(Q.prep.start) + ".", "b"); changed();
    }
    function queueView() {
      var items = [];
      if (Q.prep) items.push({ title: Q.prep.track.title, sub: Q.prep.track.artist + " · Deck B, starts at " + fmt(Q.prep.start), remove: function () { Q.prep = null; ensurePrep(); changed(); } });
      Q.q.forEach(function (t, i) { items.push({ title: t.title, sub: t.artist, remove: function () { Q.q.splice(i, 1); changed(); } }); });
      return { label: "Up next", items: items, shuffle: Q.shuffle, onShuffle: toggleShuffle, onClear: items.length ? function () { Q.prep = null; Q.q = []; say("Up next list cleared.", "b"); changed(); } : null, empty: "Nothing queued. In the Spotify tab, tap Prep or Queue next to a track." };
    }

    /* =============== levels and fades (volume commands only) =============== */
    var master = $("master"), curVol = master ? parseInt(master.value, 10) / 100 : 0.85, fadeTimer = null, fading = null;
    function baseVol() { return master ? parseInt(master.value, 10) / 100 : 0.85; }
    function setVol(v) { curVol = v; cmd("set-volume", "a", { volume: Math.max(0, Math.min(1, v)) }, "ninja-fx"); }
    function cancelFade() { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } if (fading) { fading.res(false); fading = null; } }
    function fadeTo(target, secs) {
      cancelFade(); var from = curVol, t0 = performance.now(), ms = Math.max(60, secs * 1000);
      return new Promise(function (res) {
        fading = { res: res };
        fadeTimer = setInterval(function () {
          var k = Math.min(1, (performance.now() - t0) / ms), lvl = target < from ? target + (from - target) * Math.pow(1 - k, 2) : from + (target - from) * Math.pow(k, 2);
          setVol(lvl); if (k >= 1) { clearInterval(fadeTimer); fadeTimer = null; fading = null; res(true); }
        }, 80);
      });
    }
    window.addEventListener("gsdj:command", function (e) { var p = e.detail; if (!p || p.mode !== "spotify-ninja" || p.action !== "set-volume" || p.source === "ninja-fx") return; if (p.value && p.value.volume != null) curVol = p.value.volume; if (p.source === "master" || p.source === "track-circle") cancelFade(); refreshPads(); });
    var iosNoted = false;
    function iosNote() { if (isIOS && !iosNoted) { iosNoted = true; say("On iPhone and iPad the volume of a web page may not change Spotify. Fades still time the pause, but you may not hear them."); } }

    /* =============== Ninja FX =============== */
    var muteHeld = false;
    function teleport() { var cs = N.core.cuesFor(cur().track.uri), t = cs.p != null ? cs.p : (cs.c.filter(function (x) { return x != null; })[0]); if (t == null) t = 0; cmd("seek", "a", { position_ms: t }, "teleport"); say(cs.p != null || t ? "Teleported to " + fmt(t) + "." : "No cue saved yet, so back to the start."); }
    function smokeFade() { iosNote(); var L = N.macros.fade; say("Smoke Fade over " + L + " seconds."); fadeTo(0, L).then(function (ok) { if (!ok) return; cmd("pause", "a", {}, "smoke-fade"); setTimeout(function () { setVol(baseVol()); }, 500); }); }
    function fadeToggle() { iosNote(); var L = N.macros.fade; if (curVol > 0.05) { say("Fading out over " + L + " seconds."); fadeTo(0, L); } else { say("Fading in over " + L + " seconds."); fadeTo(baseVol(), L); } }
    var FX = [
      { id: "smoke", icon: "☁", label: "Smoke Fade", tip: "Fade out, then pause", tap: smokeFade },
      { id: "shadow", icon: "◐", label: "Shadow Mute", tip: "Hold to mute", hold: true },
      { id: "skip", icon: "✦", label: "Shuriken Skip", tip: "Cut to the next track", tap: function () { if (!hasNext()) { say(nextReason()); return; } next(); } },
      { id: "vanish", icon: "◌", label: "Vanish", tip: "Pause now. Tap again to return", tap: function () { cmd("toggle-play", "a", {}, "vanish"); }, on: function () { return cur().paused; } },
      { id: "teleport", icon: "⇱", label: "Teleport", tip: "Jump to your Cue point", tap: teleport }
    ];

    /* =============== Ninja Pads =============== */
    function T(id) { var t = Trk(); if (t) t.run(id); }
    function TS(id) { var t = Trk(); return !!(t && t.isOn(id)); }
    function cuePad(i) { N.core.hotCue(i); }
    var PBANKS = [
      { name: "Cues", pads: [
        ["Cue 1", function () { cuePad(0); }, function () { return N.core.cuesFor(cur().track.uri).c[0] != null; }], ["Cue 2", function () { cuePad(1); }, function () { return N.core.cuesFor(cur().track.uri).c[1] != null; }],
        ["Cue 3", function () { cuePad(2); }, function () { return N.core.cuesFor(cur().track.uri).c[2] != null; }], ["Cue 4", function () { cuePad(3); }, function () { return N.core.cuesFor(cur().track.uri).c[3] != null; }],
        ["−10 s", function () { T("back"); }], ["+10 s", function () { T("fwd"); }],
        ["Mute", function () { T("mute"); }, function () { return TS("mute"); }], ["Fade", fadeToggle, function () { return curVol < 0.05; }] ] },
      { name: "Moves", pads: [
        ["Restart", function () { T("restart"); }], ["Repeat", function () { T("repeat"); }, function () { return TS("repeat"); }], ["Previous", previous],
        ["Next", function () { if (!hasNext()) { say(nextReason()); return; } next(); }], ["Shuffle", toggleShuffle, function () { return Q.shuffle; }],
        ["Up next", function () { var m = menu(); if (m) m.open("a", "spotify", { queue: true }); }] ] }
    ];
    var PCOL = ["#ffc933", "#ffb12a", "#ff9f1c", "#ffd86b", "#8ee07a", "#35d0ff", "#b56bff", "#ff6bd0"], padBank = 0, padsEl = null, padBtns = [];
    function buildPads() {
      var drawer = document.querySelector("#deck-a .drawer-samp"); if (!drawer || drawer.querySelector(".ninja-pads")) return;
      var wrap = document.createElement("div"); wrap.className = "ninja-pads";
      wrap.innerHTML = '<div class="np-top"><strong class="np-title">Ninja Pads</strong><div class="np-banks" role="tablist" aria-label="Pad banks"></div></div><div class="np-grid"></div><p class="np-hint">Pads send playback commands to Spotify. They never play sounds of their own.</p>';
      drawer.appendChild(wrap); padsEl = wrap;
      var banks = wrap.querySelector(".np-banks");
      PBANKS.forEach(function (b, i) { var x = document.createElement("button"); x.type = "button"; x.className = "bank-num"; x.setAttribute("role", "tab"); x.textContent = b.name; x.addEventListener("click", function () { showBank(i); }); banks.appendChild(x); });
      showBank(0);
    }
    function showBank(i) {
      padBank = i; var b = PBANKS[i], grid = padsEl.querySelector(".np-grid"); grid.textContent = ""; grid.setAttribute("data-n", String(b.pads.length)); padBtns = [];
      Array.prototype.forEach.call(padsEl.querySelectorAll(".np-banks button"), function (x, k) { x.setAttribute("aria-selected", k === i ? "true" : "false"); });
      b.pads.forEach(function (p, k) {
        var btn = document.createElement("button"); btn.type = "button"; btn.className = "pd-pad"; btn.style.setProperty("--pc", PCOL[k % PCOL.length]); btn.innerHTML = "<i>" + (k + 1) + "</i><span>" + p[0] + "</span>";
        var fire = function () { btn.classList.add("is-hit"); setTimeout(function () { btn.classList.remove("is-hit"); }, 140); if (navigator.vibrate) navigator.vibrate(6); p[1](); setTimeout(refreshPads, 30); };
        btn.addEventListener("pointerdown", function (e) { e.preventDefault(); fire(); }); btn.addEventListener("click", function (e) { if (e.detail === 0) fire(); });
        grid.appendChild(btn); padBtns.push([btn, p[2]]);
      });
      refreshPads();
    }
    function refreshPads() { padBtns.forEach(function (x) { if (x[1]) x[0].setAttribute("aria-pressed", x[1]() ? "true" : "false"); }); refreshFx(); }

    var fxEls = [];
    function buildFx() {
      var drawer = document.querySelector("#deck-a .drawer-fxu"); if (!drawer || drawer.querySelector(".ninja-fx")) return;
      var wrap = document.createElement("div"); wrap.className = "ninja-fx"; wrap.innerHTML = '<div class="np-top"><strong class="np-title">Ninja FX</strong></div><div class="nfx-tiles"></div><p class="np-hint">Transport effects. They change playback, not the sound itself. Shadow Mute: press and hold.</p>';
      drawer.appendChild(wrap); var tiles = wrap.querySelector(".nfx-tiles");
      FX.forEach(function (f) {
        var b = document.createElement("button"); b.type = "button"; b.className = "fxt nfx"; b.title = f.tip; b.setAttribute("aria-label", f.label + ". " + f.tip); b.innerHTML = "<b aria-hidden=\"true\">" + f.icon + "</b><span>" + f.label + "</span>";
        if (f.hold) {
          var down = false, release = function () { if (!down) return; down = false; muteHeld = false; b.classList.remove("is-down"); setVol(baseVol()); };
          b.addEventListener("pointerdown", function (e) { e.preventDefault(); cancelFade(); down = true; muteHeld = true; b._pid = e.pointerId; b.classList.add("is-down"); setVol(0); });
          ["pointerup", "pointercancel"].forEach(function (ev) { window.addEventListener(ev, function (e) { if (down && e.pointerId === b._pid) release(); }, true); });
          window.addEventListener("blur", release); document.addEventListener("visibilitychange", function () { if (document.hidden) release(); });
          b.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !down) { e.preventDefault(); down = true; b.classList.add("is-down"); setVol(0); } });
          b.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Enter") release(); });
        } else {
          var fire = function () { b.classList.add("is-hit"); setTimeout(function () { b.classList.remove("is-hit"); }, 160); if (navigator.vibrate) navigator.vibrate(6); f.tap(); setTimeout(refreshFx, 40); };
          b.addEventListener("pointerdown", function (e) { e.preventDefault(); fire(); }); b.addEventListener("click", function (e) { if (e.detail === 0) fire(); });
        }
        tiles.appendChild(b); fxEls.push([b, f]);
      });
    }
    function refreshFx() { fxEls.forEach(function (x) { if (x[1].on) x[0].setAttribute("aria-pressed", x[1].on() ? "true" : "false"); }); }

    /* =============== Ninja BPM and Ninja Macros =============== */
    var macroSets = [];
    function buildBpm() {
      var host = document.querySelector("#deck-a .opt-tempo"); if (!host || host.querySelector(".nbpm")) return;
      var n = document.createElement("div"); n.className = "nbpm";
      n.innerHTML = '<label>Ninja BPM</label><button type="button" class="nbpm-tap" aria-label="Tap the beat to set the tempo">TAP</button><output class="nbpm-out tnum" aria-live="off">--</output><small>Tap 4 times. Powers beat jumps.</small>';
      host.appendChild(n); n.querySelector(".nbpm-tap").addEventListener("click", function () { N.core.tapTempo(); sync(); });
      new MutationObserver(sync).observe(A.el.bpm, { childList: true, characterData: true, subtree: true });
    }
    function buildMacros() {
      [["#deck-a .opt-eq", "v"], ["#deck-a .opt-eq2", "h"]].forEach(function (cfg) {
        var host = document.querySelector(cfg[0]); if (!host || host.querySelector(".nm")) return;
        var defs = [["jump", "Jump", "Jump size in beats", 0, C.loops().length - 1, 1], ["fade", "Fade", "Fade length in seconds", 0.5, 8, 0.5], ["sens", "Scrub", "Scrub sensitivity", 0.5, 2, 0.1]], set = {};
        defs.forEach(function (d) {
          var el = document.createElement(cfg[1] === "v" ? "div" : "label"); el.className = (cfg[1] === "v" ? "eqcol " : "") + "nm nm-" + d[0];
          var inp = '<input type="range" ' + (cfg[1] === "v" ? 'class="vslider" ' : "") + 'min="' + d[3] + '" max="' + d[4] + '" step="' + d[5] + '" aria-label="' + d[2] + '">';
          el.innerHTML = cfg[1] === "v" ? inp + '<span class="nm-l">' + d[1] + ' <b class="nm-o"></b></span>' : '<span class="nm-l">' + d[1] + ' <b class="nm-o"></b></span>' + inp;
          host.appendChild(el); var input = el.querySelector("input"); set[d[0]] = { input: input, out: el.querySelector(".nm-o") };
          input.addEventListener("input", function () { setMacro(d[0], parseFloat(input.value)); });
        });
        macroSets.push(set);
      });
      sync();
      ["lp-minus-a", "lp-plus-a"].forEach(function (id) { var b = $(id); if (b) b.addEventListener("click", function () { setTimeout(sync, 0); }); });
    }
    function setMacro(k, v) {
      if (k === "jump") { A.loop.i = Math.max(0, Math.min(C.loops().length - 1, Math.round(v))); $("loop-n-a").textContent = C.loops()[A.loop.i]; }
      else if (k === "fade") N.macros.fade = v; else N.macros.sens = v;
      N.saveMacros(); sync();
    }
    function sync() {
      var vals = { jump: A.loop.i, fade: N.macros.fade, sens: N.macros.sens }, txt = { jump: C.loops()[A.loop.i] + " beats", fade: N.macros.fade + " s", sens: "×" + N.macros.sens.toFixed(1) };
      macroSets.forEach(function (set) { Object.keys(set).forEach(function (k) { if (parseFloat(set[k].input.value) !== vals[k]) set[k].input.value = vals[k]; set[k].out.textContent = txt[k]; }); });
      var o = document.querySelector("#deck-a .nbpm-out"); if (o) o.textContent = A.el.bpm.textContent;
    }

    /* =============== Prep Deck (deck B) =============== */
    function renderPrep() {
      if (!on()) return; var p = Q.prep;
      B.el.title.textContent = p ? "Next · " + p.track.title + " · " + p.track.artist : "Next · nothing chosen yet";
      B.el.bpm.textContent = p && N.core.tempoFor(p.track.uri) ? N.core.tempoFor(p.track.uri).bpm.toFixed(1) : "--";
      B.el.time.textContent = p ? fmt(p.start) : "--";
      var cs = p ? N.core.cuesFor(p.track.uri) : null;
      document.querySelectorAll("#deck-b .cue").forEach(function (b, i) { var t = cs ? cs.c[i] : null, sm = b.querySelector("small"); b.classList.toggle("is-set", t != null); b.setAttribute("aria-pressed", t != null && p && p.start === t ? "true" : "false"); if (sm) sm.textContent = t != null ? fmt(t) : "–"; b.setAttribute("aria-label", t != null ? "Start the next track at cue " + (i + 1) + ", " + fmt(t) : "Cue " + (i + 1) + " is empty on this track"); });
      B.el.play.textContent = "Switch"; B.el.play.setAttribute("aria-pressed", switching ? "true" : "false"); B.el.play.setAttribute("aria-label", "Ninja Switch: fade the live track out and bring in the next track");
      var cb = $("cue-b"); if (cb) { cb.textContent = "Start"; cb.setAttribute("title", "Start the next track from the beginning"); }
      drawPrep();
    }
    function drawPrep() {
      if (!on() || !C.settings.wave) return; var cv = $("wave-b"); if (!cv) return; var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      var cs = getComputedStyle(cv), col = cs.getPropertyValue("--dk").trim() || "#35d0ff", p = Q.prep, bh = 18, by = Math.round(h / 2 - bh / 2) + 2;
      g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.roundRect ? g.roundRect(0, by, w, bh, 9) : g.rect(0, by, w, bh); g.fill();
      g.font = "700 11px " + cs.fontFamily; g.textAlign = "center";
      if (!p) { g.fillStyle = "rgba(255,255,255,.75)"; g.fillText("Next track: tap Prep in the Spotify tab", w / 2, by + 13); return; }
      var dur = Math.max(1, p.track.duration_ms || 1), x = Math.round(p.start / dur * w), tcs = N.core.cuesFor(p.track.uri);
      g.fillStyle = col; g.globalAlpha = .35; g.fillRect(x, by, w - x, bh); g.globalAlpha = 1;
      g.font = "800 10px " + cs.fontFamily; for (var i = 0; i < 4; i++) { var c = tcs.c[i]; if (c == null) continue; var cx = Math.round(c / dur * w); g.fillStyle = col; g.fillRect(cx, 0, 2, h); g.fillRect(cx, 0, 14, 13); g.fillStyle = "#0a0b0f"; g.fillText(String(i + 1), cx + 8, 10); }
      g.fillStyle = "#fff"; g.fillRect(x - 1, 6, 2, h - 6); g.beginPath(); g.moveTo(x - 5, 0); g.lineTo(x + 5, 0); g.lineTo(x, 6); g.fill();
      g.font = "700 11px " + cs.fontFamily; var l1 = "START " + fmt(p.start), tw = g.measureText(l1).width + 10; g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(2, h - 15, tw, 14); g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(l1, 7, h - 4);
    }
    (function wirePrepStrip() {
      var cv = $("wave-b"), down = false; if (!cv) return;
      function posAt(e) { var r = cv.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * ((Q.prep && Q.prep.track.duration_ms) || 1); }
      document.addEventListener("pointerdown", function (e) { if (!on() || e.target !== cv) return; e.stopImmediatePropagation(); if (!Q.prep) { say(N.core.PREP_MSG, "b"); return; } down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} Q.prep.start = Math.round(posAt(e)); drawPrep(); }, true);
      cv.addEventListener("pointermove", function (e) { if (down && Q.prep) { Q.prep.start = Math.round(posAt(e)); B.el.time.textContent = fmt(Q.prep.start); drawPrep(); } });
      function up() { if (down) { down = false; setStart(Q.prep ? Q.prep.start : 0); } } cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      window.addEventListener("resize", function () { if (on()) drawPrep(); });
    })();
    function deckB(t) {                                                // called by spotify-ninja.js for taps on deck B's controls
      var id = t.id;
      if (id === "play-b") { doSwitch(); return true; }
      if (id === "cue-b") { setStart(0); return true; }
      if (t.classList && t.classList.contains("cue")) { var i = +t.getAttribute("data-cue"); if (!Q.prep) { say("Choose a next track first. In the Spotify tab, tap Prep.", "b"); return true; } var c = N.core.cuesFor(Q.prep.track.uri).c[i]; if (c == null) { say("Cue " + (i + 1) + " is empty on this track. Load it on Deck A once and save cues, or use the arrows to move the start.", "b"); return true; } setStart(c); return true; }
      if (id === "bj-back-b" || id === "bj-fwd-b") { if (!Q.prep) { say("Choose a next track first. In the Spotify tab, tap Prep.", "b"); return true; } setStart(Q.prep.start + (id === "bj-fwd-b" ? 5000 : -5000)); return true; }
      if (id === "bpm-b") { say("Tap BPM works on the live track. When Deck B goes live, tap its tempo there.", "b"); return true; }
      return false;
    }

    /* =============== Ninja Switch (the crossfader, one track at a time) =============== */
    var switching = false, xf = $("xfade"), xfSaved = null;
    function waitFor(uri, ms) {
      return new Promise(function (res) {
        var done = false, to = setTimeout(function () { fin(false); }, ms);
        function fin(ok) { if (done) return; done = true; clearTimeout(to); window.removeEventListener("gsdj:state", h); res(ok); }
        function h(e) { var s = e.detail; if (s && s.track && s.track.uri === uri) fin(true); } window.addEventListener("gsdj:state", h);
      });
    }
    function doSwitch() {
      if (switching) return; ensurePrep();
      if (!Q.prep) { say("Choose a next track first. In the Spotify tab, tap Prep next to a track.", "b"); xfBack(); return; }
      if (!N.core.real()) { say("Connect Spotify to switch tracks. This preview is silent.", "b"); xfBack(); return; }
      iosNote(); switching = true; if (xf) xf.value = 100; renderPrep();
      var n = Q.prep, L = N.macros.fade, wasPlaying = !cur().paused;
      say("Ninja Switch: fading out, then " + n.track.title + ".");
      var go = function () {
        Q.prep = null; ensurePrep(); setVol(0); N.core.playTrack(n.track, n.start, true); changed();
        waitFor(n.track.uri, 6000).then(function () { return fadeTo(baseVol(), L); }).then(function () { finish(); });
      };
      var finish = function () { switching = false; xfBack(); renderPrep(); say("Now playing " + n.track.title + "."); };
      if (wasPlaying) fadeTo(0, L).then(function (ok) { if (!ok) { switching = false; xfBack(); renderPrep(); return; } go(); }); else go();
    }
    function xfBack() { if (xf) xf.value = -100; }
    document.addEventListener("input", function (e) {
      if (!on()) return;
      if (e.target === xf) { e.stopImmediatePropagation(); if (switching) { xf.value = 100; return; } if (+xf.value >= 85) C.say("Let go to switch to the next track."); return; }
    }, true);
    document.addEventListener("change", function (e) { if (!on() || e.target !== xf) return; e.stopImmediatePropagation(); if (switching) return; if (+xf.value >= 85) doSwitch(); else xfBack(); }, true);

    /* =============== labels and mode switching =============== */
    var LABELS = [["#samp-a", "Ninja Pads"], ["#fx-a", "Ninja FX"], [".master label", "Spotify Master"], [".opt-xfade label", "Ninja Switch"], ["#deck-a .opt-tempo > label", "Ninja BPM"]];
    function relabel(onNow) {
      LABELS.forEach(function (x) { var el = document.querySelector(x[0]); if (!el) return; if (el.getAttribute("data-gs") == null) el.setAttribute("data-gs", el.textContent); el.textContent = onNow ? x[1] : el.getAttribute("data-gs"); });
      var ends = document.querySelectorAll(".xf-ends span"); if (ends.length === 2) { if (ends[0].getAttribute("data-gs") == null) { ends[0].setAttribute("data-gs", ends[0].textContent); ends[1].setAttribute("data-gs", ends[1].textContent); } ends[0].textContent = onNow ? "LIVE" : ends[0].getAttribute("data-gs"); ends[1].textContent = onNow ? "NEXT" : ends[1].getAttribute("data-gs"); }
      var lt = $("loop-a"); if (lt) { var first = lt.firstChild; if (first && first.nodeType === 3) { if (lt.getAttribute("data-gs-t") == null) lt.setAttribute("data-gs-t", first.nodeValue); first.nodeValue = onNow ? "Jump " : lt.getAttribute("data-gs-t"); } }
      var db = document.querySelector("#deck-b .deck-actions"); if (db) db.setAttribute("data-ninja", onNow ? "1" : "");
      var star = document.querySelector("#deck-a .plat-label"); if (star && !star.querySelector(".nj-star")) { var i = document.createElement("i"); i.className = "nj-star nj-plat"; i.setAttribute("aria-hidden", "true"); star.appendChild(i); }
    }
    function onMode(isOn) {
      relabel(isOn);
      if (isOn) {
        buildPads(); buildFx(); buildBpm(); buildMacros();
        if (xf) { if (xfSaved == null) xfSaved = xf.value; xf.value = -100; }
        var note = document.querySelector(".master .ninja-note"); if (!note) { note = document.createElement("span"); note.className = "ninja-note"; note.textContent = isIOS ? "On iPhone and iPad, use the device volume buttons." : "Spotify volume"; document.querySelector(".master").appendChild(note); }
        curVol = baseVol(); ensurePrep(); renderPrep(); sync();
      } else {
        cancelFade(); switching = false;
        if (xf && xfSaved != null) { xf.value = xfSaved; xfSaved = null; xf.dispatchEvent(new Event("input", { bubbles: true })); }
        var m = menu(); if (m && m.refreshQueue) m.refreshQueue();
      }
    }
    window.addEventListener("gsdj:modechange", function (e) { onMode(e.detail && e.detail.mode === "spotify-ninja"); });
    window.addEventListener("gsdj:state", function (e) { if (on()) { ctl.setAttribute("data-sp-playing", e.detail && !e.detail.paused ? "1" : "0"); refreshPads(); } });
    window.addEventListener("gsdj:modechange", function (e) { if (!(e.detail && e.detail.mode === "spotify-ninja")) ctl.removeAttribute("data-sp-playing"); });
    window.addEventListener("pagehide", function () { save(); });

    window.GSDJNinjaTools = {
      deckB: deckB, prep: prep, enqueue: enqueue, pushHistory: pushHistory, queueView: queueView, renderPrep: renderPrep,
      nav: { next: next, previous: previous, hasNext: hasNext, nextReason: nextReason, shuffle: toggleShuffle, shuffleOn: function () { return Q.shuffle; }, clear: clearQueue },
      prepStart: function () { return Q.prep ? { start: Q.prep.start, dur: Q.prep.track.duration_ms } : null; }, setStart: setStart, doSwitch: doSwitch, fadeTo: fadeTo
    };
    if (on()) onMode(true);
  }
  if (window.GSDJNinja) init(); else window.addEventListener("gsdj-ninja-ready", init, { once: true });
})();
