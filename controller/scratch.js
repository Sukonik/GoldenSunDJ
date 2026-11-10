/* GoldenSunDJ Controller: scratch engine.
   Scratching plays a decoded copy of the track through an AudioWorklet that reads the audio at any
   speed, forward or backward, with smooth interpolation (no seeking, so no glitches). A small platter
   model turns finger movement into playback speed the same way every time:
     speed = finger angular velocity / 33 rpm x Sensitivity, smoothed by Weight,
     held finger = stopped record, let go = the motor spins back up over Return time.
   While you scratch the normal player keeps running silently, so Slip mode can drop you back "on time".
   If the worklet is not available (or a track is too big), the disc falls back to Bend (a gentle pitch nudge). */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$, clamp = C.clamp, settings = C.settings;
    var NOMINAL = 360 / C.REV_SECONDS;            // 33 rpm in degrees per second (about 198)
    var SR = 22050, MAX_BYTES = 30e6, workletReady = null;

    var WORKLET = [
      "class P extends AudioWorkletProcessor{constructor(){super();this.d=null;this.sr=22050;this.pos=0;this.r=0;this.t=0;this.g=0;this.tg=0;this.on=false;this.tau=0.006;this.n=0;",
      "this.port.onmessage=(e)=>{var m=e.data;if(m.t==='load'){this.d=m.data;this.sr=m.sr;}else if(m.t==='start'){this.pos=m.pos*this.sr;this.r=m.rate;this.t=m.rate;this.tg=1;this.g=0;this.on=true;}",
      "else if(m.t==='rate'){this.t=m.r;}else if(m.t==='tau'){this.tau=m.tau;}else if(m.t==='stop'){this.tg=0;}}}",
      "process(i,o){var out=o[0][0];var n=out.length;if(!this.on||!this.d){out.fill(0);return true;}",
      "var d=this.d,len=d.length,ratio=this.sr/sampleRate,a=1-Math.exp(-1/(sampleRate*this.tau)),ga=1-Math.exp(-1/(sampleRate*0.004));",
      "for(var k=0;k<n;k++){this.r+=(this.t-this.r)*a;this.g+=(this.tg-this.g)*ga;var p=this.pos,i0=Math.floor(p),f=p-i0;",
      "var a0=d[((i0%len)+len)%len],a1=d[(((i0+1)%len)+len)%len];out[k]=(a0+(a1-a0)*f)*this.g;this.pos+=this.r*ratio;if(this.pos>=len)this.pos-=len;else if(this.pos<0)this.pos+=len;}",
      "if(++this.n%6===0)this.port.postMessage({p:this.pos/this.sr});",
      "if(this.tg===0&&this.g<0.001){this.on=false;this.port.postMessage({p:this.pos/this.sr,stopped:true});}return true;}}",
      "registerProcessor('gsdj-scratch',P);"
    ].join("");

    function ensureWorklet() {
      if (workletReady) return workletReady;
      var ctx = C.audio().ctx;
      if (!ctx || !ctx.audioWorklet || typeof AudioWorkletNode === "undefined") return (workletReady = Promise.resolve(false));
      var url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
      workletReady = ctx.audioWorklet.addModule(url).then(function () { return true; }).catch(function () { return false; });
      return workletReady;
    }

    /* ---------- prepare a deck: decode a light mono copy for scratching ---------- */
    function prepare(d) {
      if (d.scr && d.scr.state === "ready") return Promise.resolve(true);
      if (d.scr && d.scr.promise) return d.scr.promise;
      d.scr = { state: "loading", token: (d.scr && d.scr.token || 0) + 1 };
      var my = d.scr.token, st = d.scr;
      st.promise = (function () {
        if (!C.ensureCtx()) return Promise.resolve(false);
        C.build(d);
        return ensureWorklet().then(function (ok) {
          if (!ok || !d.nodes) throw new Error("no worklet");
          var src = d.file ? Promise.resolve(d.file) : fetch(d.url).then(function (r) { if (!r.ok) throw new Error("bad"); return r.blob(); });
          return src;
        }).then(function (blob) {
          if (blob.size > MAX_BYTES) throw new Error("big");
          return blob.arrayBuffer();
        }).then(function (ab) {
          var off = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, SR, SR);
          return new Promise(function (res, rej) { var p = off.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
        }).then(function (buf) {
          if (st.token !== my || d.scr !== st) return false;
          var n = buf.length, mono = new Float32Array(n), ch = buf.numberOfChannels;
          for (var c = 0; c < ch; c++) { var a = buf.getChannelData(c); for (var i = 0; i < n; i++) mono[i] += a[i] / ch; }
          if (!d.scr.node) {
            var node = new AudioWorkletNode(C.audio().ctx, "gsdj-scratch", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
            node.connect(d.nodes.low); node.port.onmessage = function (e) { if (e.data && typeof e.data.p === "number" && d.touch) d.livePos = e.data.p; if (e.data && e.data.stopped && d.scr) d.scr.stopped = true; };
            d.scr.node = node;
          }
          d.scr.node.port.postMessage({ t: "load", data: mono, sr: buf.sampleRate }, [mono.buffer]);
          d.scr.state = "ready"; return true;
        }).catch(function (err) { if (d.scr === st) { st.state = err && err.message === "big" ? "big" : "off"; } return false; });
      })();
      return st.promise;
    }
    // a new track invalidates the decoded copy
    C.hooks.load.push(function (d) {
      if (d.scr && d.scr.node) d.scr.node.port.postMessage({ t: "stop" });
      d.scr = { state: "idle", node: d.scr && d.scr.node, token: ((d.scr && d.scr.token) || 0) + 1 };
      var small = (d.owned && !d.file) || (d.file && d.file.size < MAX_BYTES);       // generated loops and local files: ready before you need it
      if (small) { var go = function () { if (d.scr && d.scr.state === "idle") prepare(d); }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 800); }
    });

    /* ---------- feel presets (the same numbers give the same result every time) ---------- */
    var PRESETS = {
      natural: { name: "Natural", mode: "scratch", sens: 1.0, weight: 0.5, ret: 0.25, brake: true },
      tight:   { name: "Tight",   mode: "scratch", sens: 1.2, weight: 0.15, ret: 0.12, brake: true },
      heavy:   { name: "Heavy",   mode: "scratch", sens: 0.9, weight: 0.85, ret: 0.5, brake: true },
      bend:    { name: "Bend",    mode: "bend",    sens: 0.6, weight: 0.5, ret: 0.3, brake: false }
    };
    function sc() { return settings.scratch; }
    function weightTau(w) { return 0.008 + w * 0.085; }                // 8 ms (tight) to 93 ms (heavy)

    /* ---------- the platter model ---------- */
    function angleOf(d, e) { var r = d.el.platter.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
    var touching = [], raf = null, prev = 0;
    function frame(now) {
      var dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000)); prev = now;
      touching.forEach(function (d) {
        var t = d.touch; if (!t) return;
        var s = sc(), vMeas = t.acc / dt; t.acc = 0;                    // degrees per second since the last frame
        var rMeas = vMeas / NOMINAL * s.sens;
        var tau = t.holdBrake ? Math.max(0.02, s.brake ? weightTau(s.weight) * 0.6 + 0.02 : 1.2) : weightTau(s.weight);
        // a held record slows with the brake time until the finger starts to move
        if (t.holdBrake && Math.abs(rMeas) > 0.08) t.holdBrake = false;
        t.r += (rMeas - t.r) * (1 - Math.exp(-dt / tau));
        d.angle += t.r * NOMINAL * dt;
        if (t.mode === "scratch" && d.scr && d.scr.node) d.scr.node.port.postMessage({ t: "rate", r: t.r });
        else if (t.mode === "bend") d.audio.playbackRate = clamp(C.rate(d) * (1 + t.r * 0.35), 0.5, 1.6);
      });
      raf = touching.length ? requestAnimationFrame(frame) : null;
    }
    function startLoop() { if (raf == null) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

    function begin(d, e) {
      var s = sc();
      if (!d.audio.src) { C.say("Load a track first. Tap Load."); return; }
      C.build(d); C.ensureCtx();
      var wasPlaying = !d.audio.paused, mode = s.mode;
      var t = { id: e.pointerId, a: angleOf(d, e), acc: 0, wasPlaying: wasPlaying, r: wasPlaying ? C.rate(d) : 0, holdBrake: s.brake && wasPlaying, mode: mode, wall: performance.now(), startPos: d.audio.currentTime };
      d.touch = t; d.dragging = true;
      try { d.el.platter.setPointerCapture(e.pointerId); } catch (x) {}
      if (touching.indexOf(d) < 0) touching.push(d);
      if (mode === "scratch") {
        var st = d.scr && d.scr.state;
        if (st === "ready") engage(d);
        else if (st === "big" || st === "off") { t.mode = "bend"; C.say(st === "big" ? "Long track: using Bend. Load a shorter one to scratch." : "Scratching needs a newer browser. Using Bend."); }
        else { t.mode = "bend"; C.say("Getting ready to scratch… (bend for now)"); prepare(d).then(function (ok) { if (ok && d.touch === t) { t.mode = "scratch"; engage(d); } else if (ok) C.say("Ready. Scratch away."); }); }
      }
      if (!wasPlaying && t.mode === "bend") { d.audio.playbackRate = 1; }
      C.loopOn(); startLoop();
    }
    function engage(d) {
      var t = d.touch; if (!t || !d.scr || !d.scr.node) return;
      var ctx = C.audio().ctx, now = ctx.currentTime;
      d.scr.node.port.postMessage({ t: "tau", tau: 0.006 });
      d.scr.node.port.postMessage({ t: "start", pos: d.audio.currentTime, rate: t.r });
      d.livePos = d.audio.currentTime; d.audio.playbackRate = C.rate(d);
      d.nodes.elg.gain.cancelScheduledValues(now); d.nodes.elg.gain.setTargetAtTime(0, now, 0.004);   // silence the normal player, it keeps running (slip)
      t.engaged = true;
    }

    function release(d, e) {
      var t = d.touch; if (!t) return;
      var s = sc(), ctx = C.audio().ctx;
      if (e && e.pointerId !== undefined) { try { d.el.platter.releasePointerCapture(e.pointerId); } catch (x) {} }
      var target = t.wasPlaying ? C.rate(d) : 0, ret = Math.max(0.05, s.ret);
      if (t.mode === "bend" || !t.engaged) {
        d.audio.playbackRate = C.rate(d); finishTouch(d); return;
      }
      // spin the motor back up over the Return time
      d.scr.node.port.postMessage({ t: "tau", tau: ret / 3 });
      d.scr.node.port.postMessage({ t: "rate", r: target });
      t.releasing = true; t.rEnd = performance.now() + ret * 1000 * 1.6;
      // not in Slip mode: park the normal player where the record will be when the motor is back at speed
      if (t.wasPlaying && !s.slip) { var pos = d.livePos != null ? d.livePos : d.audio.currentTime; var dur = d.audio.duration; var predicted = pos + target * ret + (t.r - target) * (ret / 3) * (1 - Math.exp(-3)) + 0.06; if (isFinite(dur) && dur > 0) predicted = ((predicted % dur) + dur) % dur; try { d.audio.currentTime = predicted; } catch (x) {} }
      t.r = target;                                                // the model no longer follows the finger
      var idx = touching.indexOf(d); if (idx >= 0) touching.splice(idx, 1);
      // wait until the worklet reaches the target speed, then hand back to the normal player
      var tick = function () {
        if (d.touch !== t) return;
        d.angle += t.r * NOMINAL * 0.016;
        if (performance.now() >= t.rEnd) { handBack(d, t); return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    function handBack(d, t) {
      var ctx = C.audio().ctx, now = ctx.currentTime, s = sc();
      var pos = d.livePos != null ? d.livePos : d.audio.currentTime;
      if (t.wasPlaying) {
        d.nodes.elg.gain.cancelScheduledValues(now); d.nodes.elg.gain.setTargetAtTime(1, now, 0.006);
        d.scr.node.port.postMessage({ t: "stop" });
      } else {
        try { d.audio.currentTime = pos; } catch (x) {}
        d.nodes.elg.gain.cancelScheduledValues(now); d.nodes.elg.gain.setValueAtTime(1, now);
        d.scr.node.port.postMessage({ t: "stop" });
      }
      finishTouch(d);
    }
    function finishTouch(d) {
      var i = touching.indexOf(d); if (i >= 0) touching.splice(i, 1);
      d.touch = null; d.dragging = false; d.livePos = null; d.audio.playbackRate = C.rate(d); C.updatePlayUi(d);
    }

    C.decks.forEach(function (d) {
      var pl = d.el.platter;
      pl.addEventListener("pointerdown", function (e) { if (d.touch) return; e.preventDefault(); begin(d, e); });
      pl.addEventListener("pointermove", function (e) {
        var t = d.touch; if (!t || t.releasing || e.pointerId !== t.id) return;
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
        evs.forEach(function (ev) { var a = angleOf(d, ev), delta = a - t.a; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; t.a = a; t.acc += delta; });
      });
      function end(e) { var t = d.touch; if (!t || t.releasing) return; release(d, e); }
      pl.addEventListener("pointerup", end); pl.addEventListener("pointercancel", end);
      pl.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; var dur = d.audio.duration; if (!isFinite(dur) || dur <= 0) return;
        d.audio.currentTime = ((d.audio.currentTime + (e.key === "ArrowRight" ? 0.25 : -0.25)) % dur + dur) % dur; e.preventDefault();
      });
      // streamed tracks: prepare once they start playing, so the first scratch is ready
      d.audio.addEventListener("playing", function () { if (d.src && d.src.kind === "audius" && d.scr && d.scr.state === "idle") prepare(d); });
      // warm up on the first look so the first scratch is instant
      pl.addEventListener("pointerenter", function () { if (d.audio.src && sc().mode === "scratch" && d.scr && d.scr.state === "idle") prepare(d); }, { once: true });
    });

    /* ---------- settings panel ---------- */
    var panel = document.createElement("div"); panel.className = "dm-scrim sp-scrim"; panel.hidden = true;
    panel.innerHTML = '<div class="dm sp" role="dialog" aria-modal="true" aria-labelledby="sp-title"><header class="dm-head"><h2 id="sp-title">Scratch feel</h2><button type="button" class="dx-close" id="sp-close" aria-label="Close">✕</button></header>' +
      '<p class="dm-note">Pick a feel, then fine-tune. The same settings give the same result every time.</p>' +
      '<div class="dm-chips" id="sp-presets" role="group" aria-label="Preset"></div>' +
      '<div class="sp-rows" id="sp-rows"></div>' +
      '<div class="dm-chips sp-toggles"><button type="button" class="chip" id="sp-brake" aria-pressed="true">Stop on touch</button><button type="button" class="chip" id="sp-slip" aria-pressed="false">Slip mode</button></div>' +
      '<p class="dm-note" id="sp-help">Slip mode: when you let go, the track jumps back to where it would have been, so you stay on the beat.</p>' +
      '<div class="sp-foot"><button type="button" class="tbtn" id="sp-reset">Reset to Natural</button><span id="sp-state" role="status"></span></div></div>';
    document.body.appendChild(panel);
    var ROWS = [["sens", "Sensitivity", 0.4, 2, 0.05, "how far the record moves for each turn of your finger"], ["weight", "Weight", 0, 1, 0.05, "light and snappy, or heavy and smooth"], ["ret", "Return time", 0.05, 0.8, 0.05, "how fast the motor spins back up when you let go (seconds)"]];
    var rows = $("sp-rows");
    ROWS.forEach(function (r) {
      var row = document.createElement("div"); row.className = "sp-row";
      row.innerHTML = '<label for="sp-' + r[0] + '">' + r[1] + '<small>' + r[5] + '</small></label><input type="range" id="sp-' + r[0] + '" min="' + r[2] + '" max="' + r[3] + '" step="' + r[4] + '"><output id="sp-' + r[0] + '-o"></output>';
      rows.appendChild(row);
      row.querySelector("input").addEventListener("input", function () { sc()[r[0]] = parseFloat(this.value); sc().preset = "custom"; save(); sync(); });
    });
    var pre = $("sp-presets");
    Object.keys(PRESETS).forEach(function (k) { var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = PRESETS[k].name; b.setAttribute("data-p", k); b.addEventListener("click", function () { apply(k); }); pre.appendChild(b); });
    function apply(k) { var p = PRESETS[k]; Object.assign(sc(), { preset: k, mode: p.mode, sens: p.sens, weight: p.weight, ret: p.ret, brake: p.brake }); save(); sync(); }
    function save() { try { localStorage.setItem(C.KEY, JSON.stringify(settings)); } catch (e) {} }
    function sync() {
      var s = sc(); ROWS.forEach(function (r) { var inp = $("sp-" + r[0]); inp.value = s[r[0]]; $("sp-" + r[0] + "-o").textContent = r[0] === "ret" ? s[r[0]].toFixed(2) + " s" : s[r[0]].toFixed(2); });
      Array.prototype.forEach.call(pre.children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-p") === s.preset ? "true" : "false"); });
      $("sp-brake").setAttribute("aria-pressed", s.brake ? "true" : "false"); $("sp-slip").setAttribute("aria-pressed", s.slip ? "true" : "false");
      $("sp-state").textContent = s.mode === "bend" ? "Bend mode: drag to nudge the tempo" : "Scratch mode";
    }
    $("sp-brake").addEventListener("click", function () { sc().brake = !sc().brake; sc().preset = "custom"; save(); sync(); });
    $("sp-slip").addEventListener("click", function () { sc().slip = !sc().slip; save(); sync(); });
    $("sp-reset").addEventListener("click", function () { apply("natural"); });
    function open() { sync(); panel.hidden = false; $("sp-close").focus(); }
    function close() { panel.hidden = true; var g = $("wheel-btn"); if (g) g.focus(); }
    $("sp-close").addEventListener("click", close); panel.addEventListener("click", function (e) { if (e.target === panel) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });

    window.GSDJScratch = { openPanel: open, presets: PRESETS };
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
