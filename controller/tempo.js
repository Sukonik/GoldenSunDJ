/* GoldenSunDJ Controller: tempo detection and tap tempo.
   detect(mono, sampleRate) finds the BPM (70 to 190) and where the first beat lands, from a mono
   copy of the track. It builds a kick-and-onset energy envelope at 100 frames per second, measures
   how well each candidate tempo lines up with it (a comb over its harmonics, with a gentle
   preference for common DJ tempos), then slides the beat grid to the strongest phase.
   Tap tempo: tap the BPM number on a deck four times or more to set tempo and beat phase by hand. */
(function () {
  "use strict";
  var FPS = 100;

  function envelope(x, sr) {
    var hop = Math.round(sr / FPS), n = Math.floor(x.length / hop), e = new Float32Array(n);
    var lp = 0, prev = 0, a = 0.06;                        // one-pole low-pass about 200 Hz at 22 kHz: the kick
    for (var f = 0; f < n; f++) {
      var lo = 0, hi = 0, base = f * hop;
      for (var i = 0; i < hop; i++) { var s = x[base + i]; lp += a * (s - lp); lo += lp * lp; var d = s - prev; prev = s; hi += d * d; }
      e[f] = Math.sqrt(lo / hop) * 1.0 + Math.sqrt(hi / hop) * 0.6;
    }
    // onset strength: positive change of the log-compressed envelope, minus a slow average
    var o = new Float32Array(n), last = 0;
    for (var k = 0; k < n; k++) { var v = Math.log(1 + 40 * e[k]); o[k] = Math.max(0, v - last); last = v; }
    var win = 50, run = 0, out = new Float32Array(n);
    for (var j = 0; j < n; j++) { run += o[j]; if (j >= win) run -= o[j - win]; var mean = run / Math.min(j + 1, win); out[j] = Math.max(0, o[j] - mean); }
    return out;
  }

  function detect(x, sr) {
    return new Promise(function (resolve) {
      try {
        if (!x || x.length < sr * 8) return resolve(null);
        var fps = sr / Math.round(sr / FPS), o = envelope(x, sr), n = o.length, maxLag = Math.ceil(fps * 60 / 70) * 4 + 2, r = new Float32Array(maxLag + 2);
        var lag = 4, step = 8;
        function chunk() {
          var end = Math.min(maxLag, lag + step);
          for (; lag <= end; lag++) { var s = 0, c = 0; for (var i = 0; i + lag < n; i++) { s += o[i] * o[i + lag]; c++; } r[lag] = c ? s / c : 0; }
          if (lag <= maxLag) setTimeout(chunk, 0); else finish();
        }
        function rAt(L) { var i = Math.floor(L), f = L - i; return r[i] * (1 - f) + r[i + 1] * f; }
        function finish() {
          var best = 0, bestBpm = 0, sum = 0, cnt = 0;
          for (var bpm = 70; bpm <= 190; bpm += 0.1) {
            var L = fps * 60 / bpm, sc = rAt(L) + 0.6 * rAt(L * 2) + 0.4 * rAt(L * 3) + 0.3 * rAt(L * 4);
            var prior = Math.exp(-0.5 * Math.pow(Math.log(bpm / 124) / Math.LN2 / 0.75, 2));
            sc *= 0.55 + 0.45 * prior; sum += sc; cnt++;
            if (sc > best) { best = sc; bestBpm = bpm; }
          }
          var conf = best / (sum / cnt || 1);
          // refine: test tempos around the estimate and slide the beat grid to the strongest phase
          function gridScore(bpmC) { var P = fps * 60 / bpmC, bp = 0, bs = -1; for (var ph = 0; ph < P; ph += 1) { var t = 0, m = 0; for (var pos = ph; pos < n - 1; pos += P) { var i0 = Math.floor(pos), fr = pos - i0; t += o[i0] * (1 - fr) + o[i0 + 1] * fr; m++; } t /= m || 1; if (t > bs) { bs = t; bp = ph; } } return { s: bs, ph: bp }; }
          var bestPh = 0, bestSc = -1, refined = bestBpm;
          for (var cand = bestBpm - 0.8; cand <= bestBpm + 0.8; cand += 0.05) { var g = gridScore(cand); if (g.s > bestSc) { bestSc = g.s; bestPh = g.ph; refined = cand; } }
          bestBpm = refined;
          resolve({ bpm: Math.round(bestBpm * 10) / 10, offset: bestPh / fps, confidence: conf });
        }
        chunk();
      } catch (e) { resolve(null); }
    });
  }

  function init() {
    var C = window.GSDJCtl, $ = C.$;
    function apply(d, bpm, offset, how) {
      d.bpm = bpm; d.gridOffset = offset; d.bpmFrom = how; C.setBpm(d);
      var el = d.el.bpm; el.setAttribute("title", how === "tap" ? "Set by tapping. Tap again to change." : how === "auto" ? "Detected automatically. Tap four times to correct it." : "Tap four times to set the tempo by hand.");
      el.classList.toggle("is-auto", how === "auto");
      if (C.settings.wave && window.dispatchEvent) window.dispatchEvent(new Event("gsdj-grid"));
    }
    window.GSDJTempo = { detect: detect, apply: apply };
    C.decks.forEach(function (d) {
      var el = d.el.bpm, taps = [];
      el.setAttribute("role", "button"); el.setAttribute("tabindex", "0"); el.setAttribute("title", "Tap four times to set the tempo by hand.");
      function tap() {
        var now = performance.now(); if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
        taps.push(now); if (navigator.vibrate) navigator.vibrate(6);
        if (taps.length < 4) { C.say("Keep tapping the beat… (" + taps.length + ")"); return; }
        taps = taps.slice(-8); var iv = []; for (var i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
        var avg = iv.reduce(function (a, b) { return a + b; }, 0) / iv.length, bpm = 60000 / avg;
        while (bpm < 70) bpm *= 2; while (bpm > 190) bpm /= 2;
        bpm = Math.round(bpm * 10) / 10 / C.rate(d);                // the number you tap is what you hear, so remove the tempo slider
        var beat = 60 / bpm, p = C.posOf(d), off = ((p % beat) + beat) % beat;
        apply(d, Math.round(bpm * 10) / 10, off, "tap"); C.say("Tempo set to " + (bpm * C.rate(d)).toFixed(1) + " BPM.");
      }
      el.addEventListener("click", tap); el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
    });
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
