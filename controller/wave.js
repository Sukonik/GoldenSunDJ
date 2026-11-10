/* GoldenSunDJ Controller: Wave add-on. A waveform strip per deck.
   Overview shows the whole track with beat bars, hot cue flags, the loop region, elapsed and
   remaining time. Zoom shows a close-up around the playhead for precise cueing and scrubbing.
   Drag to scrub, tap a cue flag to jump to it. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$, clamp = C.clamp, fmt = C.fmt, settings = C.settings;
    var PPS = 50, ZOOM_SECONDS = 10;

    function fromBuffer(buf) {
      var ch = buf.getChannelData(0), n = ch.length, dur = n / buf.sampleRate, pps = Math.min(PPS, 20000 / Math.max(1, dur)), bins = Math.max(8, Math.floor(dur * pps)), out = new Float32Array(bins), per = n / bins, step = Math.max(1, Math.floor(per / 24));
      for (var b = 0; b < bins; b++) { var m = 0, from = Math.floor(b * per), to = Math.min(n, Math.floor((b + 1) * per)); for (var i = from; i < to; i += step) { var v = Math.abs(ch[i]); if (v > m) m = v; } out[b] = m; }
      var top = 0; for (var k = 0; k < bins; k++) if (out[k] > top) top = out[k]; if (top > 0) for (var q = 0; q < bins; q++) out[q] /= top;
      return { data: out, pps: pps };
    }
    window.GSDJWave = { fromBuffer: fromBuffer };

    function decodeBlob(d, blob) {
      if (blob.size > 45e6) { C.say("This track is large, so its waveform is skipped."); return Promise.resolve(); }
      if (!C.ensureCtx()) return Promise.resolve();
      var ctx = C.audio().ctx;
      return blob.arrayBuffer().then(function (ab) { return ctx.decodeAudioData(ab); }).then(function (buf) { d.pk = fromBuffer(buf); draw(d); }).catch(function () { C.say("Could not read this track's waveform."); });
    }
    function ensurePeaks(d) {
      if (d.pk || d.analyzing) return;
      if (d.file) { d.analyzing = true; decodeBlob(d, d.file).then(function () { d.analyzing = false; }); }
    }
    function analyzeRemote(d) {
      if (d.pk || d.analyzing || !d.src || d.src.kind !== "audius") return;
      d.analyzing = true; C.say("Loading the waveform…"); draw(d);
      fetch(d.url).then(function (r) { if (!r.ok) throw new Error("bad"); return r.blob(); }).then(function (b) {
        return decodeBlob(d, b);
      })
        .catch(function () { C.say("Could not load the waveform for this stream."); }).then(function () { d.analyzing = false; draw(d); });
    }

    function draw(d) {
      var cv = $("wave-" + d.id); if (!cv || !settings.wave) return;
      var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      var cs = getComputedStyle(cv), col = cs.getPropertyValue("--dk").trim() || "#ff9f1c";
      var dur = d.audio.duration, cur = C.posOf(d) || 0, have = isFinite(dur) && dur > 0;
      var tStart = 0, tSpan = have ? dur : 1;
      if (d.zoom && have) { tSpan = Math.min(ZOOM_SECONDS, dur); tStart = clamp(cur - tSpan / 2, 0, Math.max(0, dur - tSpan)); }
      var mid = h / 2, top = 14, bot = 14, ah = h - top - bot, pk = d.pk;
      function xOf(t) { return (t - tStart) / tSpan * w; }
      // beat bars
      var bpm = d.bpm || 0, goff = d.gridOffset || 0;                    // the grid lives in track time
      if (bpm && have) {
        var beat = 60 / bpm, barLen = beat * 4, first = Math.floor((tStart - goff) / beat) * beat + goff;
        for (var tb = first; tb <= tStart + tSpan + beat; tb += beat) {
          var isBar = Math.abs((tb - goff) / barLen - Math.round((tb - goff) / barLen)) < 0.001, x = xOf(tb);
          if (!isBar && tSpan > 40) continue; if (isBar && w / (tSpan / barLen) < 7) continue;
          g.fillStyle = isBar ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.08)"; g.fillRect(Math.round(x), top, 1, ah);
        }
      }
      // waveform bars
      if (pk && have) {
        for (var px = 0; px < w; px += 2) {
          var t0 = tStart + px / w * tSpan, t1 = tStart + (px + 2) / w * tSpan, i0 = Math.floor(t0 * pk.pps), i1 = Math.max(i0 + 1, Math.ceil(t1 * pk.pps)), m = 0;
          for (var i = i0; i < i1 && i < pk.data.length; i++) if (pk.data[i] > m) m = pk.data[i];
          var bh = Math.max(2, m * ah);
          g.fillStyle = t0 <= cur ? col : "rgba(255,255,255,.3)"; g.fillRect(px, mid - bh / 2, 1.6, bh);
        }
      } else {
        g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, mid - 1, w, 2);
        g.fillStyle = "rgba(255,255,255,.7)"; g.font = "600 12px " + cs.fontFamily; g.textAlign = "center";
        g.fillText(d.analyzing ? "Loading waveform…" : (d.src && d.src.kind === "audius" ? "Tap to load this stream's waveform" : "Waveform not available"), w / 2, mid + 4);
      }
      // loop region
      if (d.loop.on && have) { var lx = xOf(d.loop.start), lw = (d.loop.end - d.loop.start) / tSpan * w; g.fillStyle = "rgba(255,255,255,.16)"; g.fillRect(lx, top, lw, ah); g.fillStyle = col; g.fillRect(lx, top, 2, ah); g.fillRect(lx + lw - 2, top, 2, ah); }
      // hot cue flags
      g.font = "800 10px " + cs.fontFamily; g.textAlign = "center";
      for (var ci = 0; ci < 4; ci++) { var ct = d.cues[ci]; if (ct == null || !have) continue; var cx = xOf(ct); if (cx < -8 || cx > w + 8) continue; g.fillStyle = col; g.fillRect(Math.round(cx), 0, 2, h); g.fillRect(Math.round(cx), 0, 14, 13); g.fillStyle = "#0a0b0f"; g.fillText(String(ci + 1), Math.round(cx) + 8, 10); if (d.cueLabels && d.cueLabels[ci]) { g.font = "700 10px " + cs.fontFamily; g.textAlign = "left"; g.fillStyle = "#fff"; g.fillText(d.cueLabels[ci], Math.round(cx) + 17, 10); g.textAlign = "center"; g.font = "800 10px " + cs.fontFamily; } }
      // return point (Cue button)
      if (have && d.cuePoint > 0) { var rx = xOf(d.cuePoint); if (rx >= -8 && rx <= w + 8) { g.fillStyle = "#fff"; g.fillRect(Math.round(rx), top, 1, ah); g.beginPath(); g.moveTo(rx - 5, h); g.lineTo(rx + 5, h); g.lineTo(rx, h - 8); g.fill(); } }
      // playhead
      var px0 = xOf(cur); g.fillStyle = "#fff"; g.fillRect(Math.round(px0) - 1, 0, 2, h); g.beginPath(); g.moveTo(px0 - 5, 0); g.lineTo(px0 + 5, 0); g.lineTo(px0, 6); g.fill();
      // time labels
      g.font = "700 11px " + cs.fontFamily; g.textBaseline = "alphabetic";
      function label(txt, x, align) { var tw = g.measureText(txt).width + 10; var lx2 = align === "left" ? x : x - tw; g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(lx2, h - 15, tw, 14); g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(txt, lx2 + 5, h - 4); }
      if (have) { label(fmt(cur), 2, "left"); label("-" + fmt(dur - cur), w - 2, "right"); if (d.zoom) label("ZOOM " + Math.round(tSpan) + "s", w / 2 - 28, "left"); }
    }

    // interaction: drag to scrub, tap a cue flag to jump
    C.decks.forEach(function (d) {
      var cv = $("wave-" + d.id), zoomBtn = $("zoom-" + d.id); if (!cv) return;
      var down = false, lastX = 0, moved = 0;
      function tAt(e) { var r = cv.getBoundingClientRect(), dur = d.audio.duration; if (!isFinite(dur) || dur <= 0) return null; var span = d.zoom ? Math.min(ZOOM_SECONDS, dur) : dur, st = d.zoom ? clamp((d.audio.currentTime || 0) - span / 2, 0, Math.max(0, dur - span)) : 0; return st + clamp((e.clientX - r.left) / r.width, 0, 1) * span; }
      cv.addEventListener("pointerdown", function (e) {
        if (!d.pk && d.src && d.src.kind === "audius") { analyzeRemote(d); return; }
        down = true; moved = 0; lastX = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
        var t = tAt(e); if (t == null) return;
        // flag hit test
        for (var i = 0; i < 4; i++) { if (d.cues[i] != null && Math.abs(t - d.cues[i]) < (d.zoom ? ZOOM_SECONDS : d.audio.duration) * 14 / cv.clientWidth) { d.audio.currentTime = d.cues[i]; draw(d); down = false; return; } }
        if (!d.zoom) { d.audio.currentTime = t; draw(d); }
      });
      cv.addEventListener("pointermove", function (e) {
        if (!down) return; var dur = d.audio.duration; if (!isFinite(dur) || dur <= 0) return; moved += Math.abs(e.clientX - lastX);
        if (d.zoom) { var span = Math.min(ZOOM_SECONDS, dur); d.audio.currentTime = clamp(d.audio.currentTime - (e.clientX - lastX) / cv.clientWidth * span, 0, dur); }
        else d.audio.currentTime = tAt(e);
        lastX = e.clientX; draw(d);
      });
      function up() { down = false; } cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      zoomBtn.addEventListener("click", function () { d.zoom = !d.zoom; zoomBtn.setAttribute("aria-pressed", d.zoom ? "true" : "false"); draw(d); });
    });

    C.decks.forEach(function (d) { ["loadedmetadata", "durationchange", "seeked"].forEach(function (ev) { d.audio.addEventListener(ev, function () { if (settings.wave) draw(d); }); }); });
    window.addEventListener("gsdj-grid", function () { C.decks.forEach(draw); });
    C.hooks.frame.push(function (d, playing) { if (settings.wave && (playing || d.dragging)) draw(d); });
    C.hooks.load.push(function (d) { d.analyzing = false; if (settings.wave) { ensurePeaks(d); } draw(d); });
    C.hooks.after.push(function () { C.decks.forEach(function (d) { if (settings.wave) { ensurePeaks(d); draw(d); } }); });
    window.addEventListener("resize", function () { if (settings.wave) C.decks.forEach(draw); });
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
