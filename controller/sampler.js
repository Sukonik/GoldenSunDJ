/* GoldenSunDJ Controller: Sampler and FX add-ons (two separate drawers per deck).
   Sampler: 6 banks of 8 synthesized pads, with arrows and numbered bank chips.
   FX: an XY pad (filter and echo) plus Echo, Brake, Filter and Gate buttons. All sounds are original. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$, clamp = C.clamp, settings = C.settings;
    function A() { return C.audio(); }
    var noiseBuf = null;
    function noise(c) { if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); var a = noiseBuf.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; } return noiseBuf; }
    function env(g, t, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    function hz(base, semi) { return base * Math.pow(2, semi / 12); }

    /* ----- voices: (ctx, dest, t) ----- */
    function sweep(c, d, t, f0, f1, dur, v, type) { var o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.5); env(g, t, v, dur); o.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.02); }
    function nz(c, d, t, type, f, q, v, dur) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; env(g, t, v, dur); s.connect(fl); fl.connect(g); g.connect(d); s.start(t); s.stop(t + dur + 0.02); }
    function saw(c, d, t, f, dur, v, type, cut) { var o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(); o.type = type || "sawtooth"; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.setValueAtTime(cut || 2400, t); fl.frequency.exponentialRampToValueAtTime(300, t + dur); env(g, t, v, dur); o.connect(fl); fl.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.02); }
    function chord(c, d, t, base, semis) { semis.forEach(function (s) { saw(c, d, t, hz(base, s), 0.5, 0.16, "sawtooth", 3200); saw(c, d, t, hz(base, s) * 1.006, 0.5, 0.1, "sawtooth", 3200); }); }
    function clap(c, d, t) { [0, 0.011, 0.023].forEach(function (x) { nz(c, d, t + x, "bandpass", 1500, 1, 0.5, 0.09); }); nz(c, d, t + 0.03, "bandpass", 1300, 0.8, 0.3, 0.18); }
    function k808(c, d, t, f) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.95, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1.15); }
    function pluck(c, d, t, f) { saw(c, d, t, f, 0.55, 0.3, "triangle", 5000); saw(c, d, t, f * 2, 0.3, 0.1, "sine", 5000); }
    var BANKS = [
      { name: "Drums", pads: [
        ["Kick", function (c, d, t) { sweep(c, d, t, 155, 44, 0.34, 0.95); nz(c, d, t, "highpass", 3000, 0.7, 0.2, 0.02); }],
        ["Snare", function (c, d, t) { nz(c, d, t, "highpass", 1800, 0.7, 0.6, 0.16); sweep(c, d, t, 190, 170, 0.1, 0.4, "triangle"); }],
        ["Clap", function (c, d, t) { clap(c, d, t); }],
        ["Rim", function (c, d, t) { sweep(c, d, t, 1700, 900, 0.05, 0.5, "square"); nz(c, d, t, "bandpass", 2500, 2, 0.3, 0.04); }],
        ["Tom Lo", function (c, d, t) { sweep(c, d, t, 140, 80, 0.32, 0.8); }],
        ["Tom Hi", function (c, d, t) { sweep(c, d, t, 230, 130, 0.26, 0.75); }],
        ["Crash", function (c, d, t) { nz(c, d, t, "highpass", 4500, 0.7, 0.45, 1.2); }],
        ["Snap", function (c, d, t) { nz(c, d, t, "bandpass", 2800, 3, 0.5, 0.06); }] ] },
      { name: "Hats and Perc", pads: [
        ["Closed", function (c, d, t) { nz(c, d, t, "highpass", 7000, 0.7, 0.4, 0.045); }],
        ["Open", function (c, d, t) { nz(c, d, t, "highpass", 6000, 0.7, 0.35, 0.35); }],
        ["Pedal", function (c, d, t) { nz(c, d, t, "highpass", 5000, 0.7, 0.3, 0.09); }],
        ["Shaker", function (c, d, t) { nz(c, d, t, "bandpass", 6500, 1, 0.35, 0.12); }],
        ["Cowbell", function (c, d, t) { sweep(c, d, t, 560, 540, 0.3, 0.35, "square"); sweep(c, d, t, 845, 800, 0.3, 0.3, "square"); }],
        ["Conga", function (c, d, t) { sweep(c, d, t, 330, 220, 0.22, 0.7); }],
        ["Clave", function (c, d, t) { sweep(c, d, t, 2500, 2400, 0.08, 0.5); }],
        ["Tamb", function (c, d, t) { nz(c, d, t, "highpass", 8500, 1, 0.35, 0.15); }] ] },
      { name: "808 and Bass", pads: [
        ["808 F", function (c, d, t) { k808(c, d, t, 43.65); }], ["808 G", function (c, d, t) { k808(c, d, t, 49); }], ["808 Bb", function (c, d, t) { k808(c, d, t, 58.27); }], ["808 C", function (c, d, t) { k808(c, d, t, 65.41); }],
        ["Bass C", function (c, d, t) { saw(c, d, t, 65.41, 0.5, 0.6, "sawtooth", 700); }], ["Bass Eb", function (c, d, t) { saw(c, d, t, 77.78, 0.5, 0.6, "sawtooth", 700); }], ["Bass F", function (c, d, t) { saw(c, d, t, 87.31, 0.5, 0.6, "sawtooth", 700); }], ["Bass G", function (c, d, t) { saw(c, d, t, 98, 0.5, 0.6, "sawtooth", 700); }] ] },
      { name: "Stabs and Leads", pads: [
        ["Am", function (c, d, t) { chord(c, d, t, 220, [0, 3, 7]); }], ["F", function (c, d, t) { chord(c, d, t, 174.61, [0, 4, 7]); }], ["C", function (c, d, t) { chord(c, d, t, 261.63, [0, 4, 7]); }], ["G", function (c, d, t) { chord(c, d, t, 196, [0, 4, 7]); }],
        ["Lead C", function (c, d, t) { saw(c, d, t, 523.25, 0.5, 0.28, "sawtooth", 3600); }], ["Lead E", function (c, d, t) { saw(c, d, t, 659.25, 0.5, 0.28, "sawtooth", 3600); }], ["Lead G", function (c, d, t) { saw(c, d, t, 783.99, 0.5, 0.28, "sawtooth", 3600); }], ["Lead A", function (c, d, t) { saw(c, d, t, 880, 0.5, 0.28, "sawtooth", 3600); }] ] },
      { name: "Keys", pads: [0, 2, 4, 7, 9, 12, 14, 16].map(function (s) { var names = ["C", "D", "E", "G", "A", "C2", "D2", "E2"]; var i = [0, 2, 4, 7, 9, 12, 14, 16].indexOf(s); return [names[i], function (c, d, t) { pluck(c, d, t, hz(261.63, s)); }]; }) },
      { name: "Hits and Risers", pads: [
        ["Zap", function (c, d, t) { sweep(c, d, t, 1800, 90, 0.3, 0.3, "sawtooth"); }],
        ["Laser", function (c, d, t) { sweep(c, d, t, 2400, 300, 0.22, 0.3, "square"); }],
        ["Impact", function (c, d, t) { sweep(c, d, t, 90, 30, 1.2, 0.9); nz(c, d, t, "lowpass", 2500, 0.7, 0.35, 0.9); }],
        ["Riser", function (c, d, t) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); s.loop = true; fl.type = "bandpass"; fl.Q.value = 2; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(7000, t + 1.6); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 1.6); g.gain.linearRampToValueAtTime(0.0001, t + 1.7); s.connect(fl); fl.connect(g); g.connect(d); s.start(t); s.stop(t + 1.7); }],
        ["Down", function (c, d, t) { sweep(c, d, t, 1200, 60, 1, 0.35, "sawtooth"); }],
        ["Siren", function (c, d, t) { var o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain(); o.type = "sine"; o.frequency.value = 900; l.frequency.value = 3; lg.gain.value = 250; l.connect(lg); lg.connect(o.frequency); env(g, t, 0.3, 1.2); o.connect(g); g.connect(d); o.start(t); l.start(t); o.stop(t + 1.25); l.stop(t + 1.25); }],
        ["Horn", function (c, d, t) { saw(c, d, t, 233, 0.9, 0.35, "sawtooth", 1500); saw(c, d, t, 349, 0.9, 0.3, "sawtooth", 1500); }],
        ["Stop", function (c, d, t) { sweep(c, d, t, 600, 30, 0.6, 0.4, "triangle"); }] ] }
    ];
    var RELEASERS = [];
    // never leave an effect stuck on: let go of everything when a touch ends anywhere, the page loses focus, or it is hidden
    ["pointerup", "pointercancel"].forEach(function (ev) { window.addEventListener(ev, function (e) { RELEASERS.forEach(function (f) { f(e.pointerId); }); }, true); });   // only the finger that lifted
    window.addEventListener("blur", function () { RELEASERS.forEach(function (f) { f(); }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) RELEASERS.forEach(function (f) { f(); }); });
    var PCOL = ["#ff4d6d", "#ff6a3d", "#ff9f1c", "#ffd21a", "#b6ff1a", "#3dff9a", "#35d0ff", "#b56bff"];

    C.decks.forEach(function (d) {
      var deck = $("deck-" + d.id), L = d.id.toUpperCase();
      /* ---------- Sampler drawer ---------- */
      var sd = document.createElement("div"); sd.className = "drawer-x drawer-samp"; sd.hidden = true; sd.setAttribute("role", "dialog"); sd.setAttribute("aria-label", "Deck " + L + " sampler");
      sd.innerHTML = '<div class="dx-top"><button type="button" class="dx-arrow" data-dir="-1" aria-label="Previous bank">‹</button><div class="dx-title"><strong class="bank-name"></strong><span class="bank-count"></span></div><button type="button" class="dx-arrow" data-dir="1" aria-label="Next bank">›</button><button type="button" class="dx-close" aria-label="Close sampler">✕</button></div><div class="bank-nums" role="tablist" aria-label="Sampler banks"></div><div class="pd-grid"></div>';
      deck.appendChild(sd);
      var bank = 0, grid = sd.querySelector(".pd-grid"), nums = sd.querySelector(".bank-nums");
      BANKS.forEach(function (b, i) { var n = document.createElement("button"); n.type = "button"; n.className = "bank-num"; n.textContent = String(i + 1); n.setAttribute("role", "tab"); n.setAttribute("aria-label", "Bank " + (i + 1) + ": " + b.name); n.addEventListener("click", function () { show(i); }); nums.appendChild(n); });
      function show(i) {
        bank = (i + BANKS.length) % BANKS.length; var b = BANKS[bank];
        sd.querySelector(".bank-name").textContent = b.name; sd.querySelector(".bank-count").textContent = (bank + 1) + " / " + BANKS.length;
        Array.prototype.forEach.call(nums.children, function (n, k) { n.setAttribute("aria-selected", k === bank ? "true" : "false"); });
        grid.textContent = "";
        b.pads.forEach(function (p, k) {
          var btn = document.createElement("button"); btn.type = "button"; btn.className = "pd-pad"; btn.style.setProperty("--pc", PCOL[k]); btn.innerHTML = "<i>" + (k + 1) + "</i><span>" + p[0] + "</span>";
          btn.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!C.ensureCtx()) return; var a = A(); p[1](a.ctx, a.master, a.ctx.currentTime); btn.classList.add("is-hit"); if (navigator.vibrate) navigator.vibrate(6); });
          ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, function () { btn.classList.remove("is-hit"); }); });
          grid.appendChild(btn);
        });
      }
      sd.querySelectorAll(".dx-arrow").forEach(function (a) { a.addEventListener("click", function () { show(bank + parseInt(a.getAttribute("data-dir"), 10)); }); });
      // swipe left/right on the pads changes bank
      var sx = null; grid.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true }); grid.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 70) show(bank + (dx < 0 ? 1 : -1)); });
      show(0);

      /* ---------- FX drawer ---------- */
      var fd = document.createElement("div"); fd.className = "drawer-x drawer-fxu"; fd.hidden = true; fd.setAttribute("role", "dialog"); fd.setAttribute("aria-label", "Deck " + L + " effects");
      fd.innerHTML = '<div class="dx-top"><div class="dx-title"><strong>FX</strong><span>Deck ' + L + '</span></div><button type="button" class="dx-close" aria-label="Close effects">✕</button></div>' +
        '<div class="fx-body"><div class="xy" role="application" aria-label="XY effect pad. Left to right sweeps the filter, bottom to top adds echo."><i class="xy-dot"></i><em class="ax ax-x">Filter →</em><em class="ax ax-y">Echo ↑</em></div>' +
        '<div class="fx-tiles"><button type="button" class="fxt" data-fx="echo"><b>≋</b><span>Echo</span></button><button type="button" class="fxt" data-fx="brake"><b>⏷</b><span>Brake</span></button><button type="button" class="fxt" data-fx="filter"><b>◗</b><span>Filter</span></button><button type="button" class="fxt" data-fx="gate"><b>▥</b><span>Gate</span></button></div></div>' +
        '<p class="fx-hint">Press and hold. Let go to return to normal.</p>';
      deck.appendChild(fd);
      function filterTo(hz) { if (d.nodes) d.nodes.flt.frequency.setTargetAtTime(hz, A().ctx.currentTime, 0.05); }
      function echoLevel() { return $("echo-btn").getAttribute("aria-pressed") === "true" ? 0.5 : 0; }
      fd.querySelectorAll(".fxt").forEach(function (b) {
        var kind = b.getAttribute("data-fx"), prev = 1, gateTimer = null;
        function armGate() { if (!d.nodes || !b.classList.contains("is-down")) return; var g = d.nodes.gate.gain, t = A().ctx.currentTime, step = 60 / ((d.bpm || 120) * C.rate(d)) / 2; g.cancelScheduledValues(t); for (var i = 0; i < 8; i++) g.setValueAtTime(i % 2 ? 0.0001 : 1, t + i * step); g.setValueAtTime(1, t + 8 * step); }
        function on() {
          C.ensureCtx(); C.build(d); b.classList.add("is-down"); var a = A();
          if (kind === "echo" && a.echoWet) a.echoWet.gain.value = 0.85;
          if (kind === "brake") { prev = C.rate(d); d.audio.playbackRate = Math.max(0.0625, prev * 0.45); }
          if (kind === "filter") filterTo(450);
          if (kind === "gate" && d.nodes) { armGate(); gateTimer = setInterval(armGate, 900); }
        }
        function off() {
          b.classList.remove("is-down"); var a = A(); if (!a.ctx) return;
          if (kind === "echo" && a.echoWet) a.echoWet.gain.value = echoLevel();
          if (kind === "brake") d.audio.playbackRate = C.rate(d);
          if (kind === "filter") filterTo(20000);
          if (kind === "gate" && d.nodes) { clearInterval(gateTimer); gateTimer = null; d.nodes.gate.gain.cancelScheduledValues(a.ctx.currentTime); d.nodes.gate.gain.setValueAtTime(1, a.ctx.currentTime); d.nodes.gate.gain.value = 1; }
        }
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); b._pid = e.pointerId; on(); }); ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { b.addEventListener(ev, function () { if (b.classList.contains("is-down")) off(); }); });
        RELEASERS.push(function (pid) { if (b.classList.contains("is-down") && (pid == null || pid === b._pid)) off(); });
      });
      var xy = fd.querySelector(".xy"), dot = xy.querySelector(".xy-dot"), xyDown = false, xyPid = null;
      function xyMove(e) { var r = xy.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width, 0, 1), y = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); dot.style.left = x * 100 + "%"; dot.style.top = (1 - y) * 100 + "%"; filterTo(200 * Math.pow(100, x)); var a = A(); if (a.echoWet) a.echoWet.gain.value = y * 0.85; }
      xy.addEventListener("pointerdown", function (e) { e.preventDefault(); C.ensureCtx(); C.build(d); xyDown = true; xyPid = e.pointerId; xy.classList.add("is-down"); try { xy.setPointerCapture(e.pointerId); } catch (x) {} xyMove(e); });
      xy.addEventListener("pointermove", function (e) { if (xyDown) xyMove(e); });
      function xyUp() { if (!xyDown) return; xyDown = false; xy.classList.remove("is-down"); dot.style.left = "50%"; dot.style.top = "50%"; filterTo(20000); var a = A(); if (a.echoWet) a.echoWet.gain.value = echoLevel(); }
      xy.addEventListener("pointerup", xyUp); xy.addEventListener("pointercancel", xyUp);
      RELEASERS.push(function (pid) { if (xyDown && (pid == null || pid === xyPid)) xyUp(); });

      /* ---------- open / close (only one drawer per deck at a time) ---------- */
      function setOpen(which, open) {
        var drawer = which === "samp" ? sd : fd, btn = $((which === "samp" ? "samp-" : "fx-") + d.id), other = which === "samp" ? fd : sd, otherBtn = $((which === "samp" ? "fx-" : "samp-") + d.id);
        if (open) { deck.querySelectorAll(".drawer-x").forEach(function (x) { if (x !== drawer) x.hidden = true; }); deck.querySelectorAll(".deck-drawers button").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); }
        drawer.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
      }
      $("samp-" + d.id).addEventListener("click", function () { setOpen("samp", sd.hidden); });
      $("fx-" + d.id).addEventListener("click", function () { setOpen("fx", fd.hidden); });
      sd.querySelector(".dx-close").addEventListener("click", function () { setOpen("samp", false); });
      fd.querySelector(".dx-close").addEventListener("click", function () { setOpen("fx", false); });
      C.hooks.after.push(function () { if (!settings.sampler) setOpen("samp", false); if (!settings.fxu) setOpen("fx", false); });
    });
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
