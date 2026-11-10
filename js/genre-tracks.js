/* GoldenSunDJ — full-length genre tracks (2 to 4 minutes), synthesized in the browser.
   Eight styles that follow the NAKO GOLD site styles: Gold, Trance, House, Techno,
   Pulsewave, Synthpop, Eurodance, Nightdrive. Each track is an arrangement
   (intro, build, drop, break, build, drop, outro) rendered section by section with an
   OfflineAudioContext (mono, 24 kHz) so memory stays small, then joined into one WAV Blob.
   Exposes window.GSDJGenres = { list, render(id, onProgress) }. All sounds are original synth patterns. */
(function () {
  "use strict";
  var SR = 24000, PPS = 50;
  var MIN = [0, 2, 3, 5, 7, 8, 10], MAJ = [0, 2, 4, 5, 7, 9, 11];
  function hz(root, semi) { return root * Math.pow(2, semi / 12); }
  function OC(secs) { var C = window.OfflineAudioContext || window.webkitOfflineAudioContext; return new C(1, Math.max(1, Math.ceil(SR * secs)), SR); }

  var G = {
    gold:      { name: "Gold",      sub: "Euphoric EDM",   bpm: 128, root: 55.0,   key: "A minor",  scale: MIN, prog: [0, 5, 2, 6], kick: "four", clap: true,  hat: "off", bass: "roll",   chord: "gate",  lead: "hook",  hook: [4, -1, 2, 4, 5, -1, 4, 2, 0, -1, 2, -1, 4, 2, -1, 0] },
    trance:    { name: "Trance",    sub: "Rolling and uplifting", bpm: 138, root: 82.41, key: "E minor", scale: MIN, prog: [0, 5, 3, 4], kick: "four", clap: false, hat: "off", bass: "roll",   chord: "pad",   lead: "arp",   hook: [] },
    house:     { funk: true, name: "House",     sub: "Funky stabs",    bpm: 124, root: 65.41,  key: "C minor",  scale: MIN, prog: [0, 3, 5, 4], kick: "four", clap: true,  hat: "off", bass: "offbeat", chord: "stab",  lead: "none",  hook: [] },
    techno:    { name: "Techno",    sub: "Hypnotic and dark", bpm: 130, root: 87.31, key: "F minor", scale: MIN, prog: [0, 0, 6, 0], kick: "four", clap: false, hat: "16",  bass: "sub",    chord: "none",  lead: "acid",  hook: [] },
    pulsewave: { name: "Pulsewave", sub: "Retro pulse",    bpm: 112, root: 73.42,  key: "D minor",  scale: MIN, prog: [0, 5, 2, 6], kick: "four", clap: true,  hat: "8",   bass: "gate",   chord: "pad",   lead: "arp",   hook: [] },
    synthpop:  { name: "Synthpop",  sub: "Bright and bouncy", bpm: 118, root: 65.41, key: "C major", scale: MAJ, prog: [0, 4, 5, 3], kick: "four", clap: true,  hat: "8",   bass: "offbeat", chord: "stab8", lead: "hook",  hook: [4, 4, -1, 2, 4, -1, 5, 4, 2, -1, 0, 2, 4, -1, 2, -1] },
    eurodance: { name: "Eurodance", sub: "Big hooks",      bpm: 140, root: 55.0,   key: "A minor",  scale: MIN, prog: [0, 5, 3, 4], kick: "four", clap: true,  hat: "16",  bass: "offbeat", chord: "stab",  lead: "hook",  hook: [7, -1, 7, 4, 5, -1, 4, 2, 7, -1, 7, 9, 8, -1, 7, 4] },
    nightdrive:{ name: "Nightdrive",sub: "Dark and cruising", bpm: 100, root: 61.74, key: "B minor", scale: MIN, prog: [0, 5, 2, 6], kick: "half", clap: true,  hat: "8",   bass: "gate",   chord: "pad",   lead: "hook",  hook: [4, -1, -1, 2, 4, -1, 5, -1, 4, -1, -1, 2, 0, -1, 2, -1] }
  };
  var ORDER = ["gold", "trance", "house", "techno", "pulsewave", "synthpop", "eurodance", "nightdrive"];

  function plan(g) {
    var total = Math.max(64, Math.round(g.bpm * 3.1 / 4 / 8) * 8);          // about 3 minutes
    var fixed = 8 + 8 + 16 + 8 + 8;                                          // intro, build, break, build2, outro
    var drop = Math.max(16, Math.round((total - fixed) / 2 / 4) * 4);
    return [["intro", 8], ["build", 8], ["drop", drop], ["break", 16], ["build2", 8], ["drop", drop], ["outro", 8]];
  }
  function secondsOf(g) { var bars = 0; plan(g).forEach(function (p) { bars += p[1]; }); return bars * 4 * 60 / g.bpm; }
  function list() { return ORDER.map(function (id) { var g = G[id]; return { id: id, name: g.name, sub: g.sub, bpm: g.bpm, key: g.key, seconds: Math.round(secondsOf(g)) }; }); }

  /* ---------- voices ---------- */
  var noiseBuf;
  function noise(c) { if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); var a = noiseBuf.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; } return noiseBuf; }
  function env(g, t, peak, dur, atk) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + (atk || 0.003)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function kick(c, d, t, v) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.11); env(g, t, v, 0.34); o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.36); }
  function nz(c, d, t, type, f, q, v, dur) { var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; env(g, t, v, dur); s.connect(fl); fl.connect(g); g.connect(d); s.start(t); s.stop(t + dur + 0.02); }
  function clap(c, d, t, v) { [0, 0.011, 0.023].forEach(function (x) { nz(c, d, t + x, "bandpass", 1500, 1, v, 0.09); }); nz(c, d, t + 0.03, "bandpass", 1300, 0.8, v * 0.6, 0.18); }
  function snare(c, d, t, v) { nz(c, d, t, "highpass", 1800, 0.7, v, 0.16); var o = c.createOscillator(), g = c.createGain(); o.frequency.value = 190; env(g, t, v * 0.5, 0.1); o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.12); }
  function hat(c, d, t, v, open) { nz(c, d, t, "highpass", 7000, 0.7, v, open ? 0.2 : 0.045); }
  function tone(c, d, t, f, dur, v, type, cut, atk, rel) {
    var o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(Math.max(120, cut * 0.35), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (atk || 0.006)); g.gain.setValueAtTime(v, t + Math.max(atk || 0.006, dur - (rel || 0.04))); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.02); return o;
  }
  function pad(c, d, t, freqs, dur, v) { freqs.forEach(function (f) { [-6, 6].forEach(function (dt) { var o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = dt; fl.type = "lowpass"; fl.frequency.value = 1300; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.5, dur * 0.3)); g.gain.setValueAtTime(v, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(fl); fl.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.02); }); }); }
  function riser(c, d, t, dur, v) {
    var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c); s.loop = true; fl.type = "bandpass"; fl.Q.value = 2; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur); s.connect(fl); fl.connect(g); g.connect(d); s.start(t); s.stop(t + dur);
    var o = c.createOscillator(), g2 = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + dur); g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(v * 0.35, t + dur); o.connect(g2); g2.connect(d); o.start(t); o.stop(t + dur);
  }
  function impact(c, d, t) { var o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8); env(g, t, 0.9, 1.2); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1.25); nz(c, d, t, "lowpass", 2500, 0.7, 0.35, 0.9); }

  /* ---------- one section ---------- */
  function semiAt(g, deg) { var n = g.scale.length, o = Math.floor(deg / n); return g.scale[((deg % n) + n) % n] + 12 * o; }
  function chordFreqs(g, deg, oct) { return [0, 2, 4].map(function (k) { return hz(g.root * oct, semiAt(g, deg + k)); }); }

  function renderSection(g, name, bars) {
    var beat = 60 / g.bpm, step = beat / 4, bar = beat * 4, secs = bars * bar, c = OC(secs);
    var master = c.createGain(); master.gain.value = 0.8; var lim = c.createDynamicsCompressor(); lim.threshold.value = -10; lim.ratio.value = 6; master.connect(lim); lim.connect(c.destination);
    function bus(v) { var b = c.createGain(); b.gain.value = v; b.connect(master); return b; }
    var kb = bus(0.9), db = bus(0.55), bb = bus(0.55), cb = bus(0.5), lb = bus(0.4), fx = bus(0.6);
    var on = { kick: name !== "break", drums: name !== "break", bass: name === "drop" || name === "outro" || name === "build" || name === "build2", chord: name !== "intro", lead: name === "drop" || name === "break", full: name === "drop" };
    var i, b, s;
    for (b = 0; b < bars; b++) {
      var deg = g.prog[Math.floor(b % 4)], t0 = b * bar, rootHz = hz(g.root, semiAt(g, deg));
      var lastBars = bars - b <= 2, introSparse = name === "intro" && b < 4;
      for (s = 0; s < 16; s++) {
        var t = t0 + s * step, beatStep = s % 4 === 0, offStep = s % 4 === 2;
        // kick + sidechain
        var kickHere = (g.kick === "four" && beatStep) || (g.kick === "half" && (s === 0 || s === 8) ) ;
        if (on.kick && kickHere && !(name === "build" && b === bars - 1 && s > 7)) {
          kick(c, kb, t, 1);
          [bb, cb].forEach(function (x) { x.gain.setValueAtTime(0.3, t); x.gain.linearRampToValueAtTime(x === bb ? 0.55 : 0.5, t + beat * 0.5); });
        }
        if (!on.drums || introSparse && !beatStep) continue;
        // hats
        if (g.hat === "off" && offStep) hat(c, db, t, 0.3, true);
        if (g.hat === "8" && s % 2 === 0) hat(c, db, t, offStep ? 0.3 : 0.18, false);
        if (g.hat === "16") hat(c, db, t, s % 4 === 2 ? 0.3 : (s % 2 ? 0.1 : 0.17), false);
        if (g.hat === "off" && s % 2 === 1 && on.full) hat(c, db, t, 0.07, false);
        // clap / snare on 2 and 4
        if (g.clap && (s === 4 || s === 12) && (on.full || name === "outro" || name === "build" || name === "build2")) clap(c, db, t, 0.5);
        if (!g.clap && (s === 4 || s === 12) && on.full && g.hat === "off") snare(c, db, t, 0.25);
        // snare roll in the build
        if ((name === "build" || name === "build2") && lastBars) { var dens = b === bars - 1 ? 1 : 2; if (s % dens === 0 && (b === bars - 1 || s % 4 === 0)) snare(c, db, t, 0.18 + 0.4 * (s / 16)); }
        // bass
        if (on.bass) {
          var f = rootHz;
          if (g.bass === "roll" && s % 4 !== 0) tone(c, bb, t, f * 2, step * 0.9, 0.7, "sawtooth", 500, 0.004, 0.02);
          if (g.bass === "offbeat" && (offStep || s === 0 || (g.funk && s === 10))) tone(c, bb, t, offStep ? f * 2 : f, step * (offStep ? 1.8 : 1.4), 0.8, "sawtooth", 600, 0.005, 0.03);
          if (g.bass === "gate" && s % 2 === 0) tone(c, bb, t, f * ((s / 2) % 4 === 3 ? 2 : 1), step * 1.7, 0.75, "square", 520, 0.004, 0.03);
          if (g.bass === "sub" && s === 0) tone(c, bb, t, f / 1, bar * 0.95, 0.85, "sine", 400, 0.01, 0.05);
          if (g.bass === "sub" && s % 4 === 2) tone(c, bb, t, f * 2, step * 1.5, 0.35, "sawtooth", 380, 0.004, 0.02);
        }
        // chords
        if (on.chord) {
          var fr = chordFreqs(g, deg, 4);
          if (g.chord === "stab" && (s === 3 || s === 6 || s === 10 || s === 13) && name !== "break") fr.forEach(function (x) { tone(c, cb, t, x, step * 1.4, 0.22, "square", 2600, 0.003, 0.03); });
          if (g.chord === "stab8" && s % 2 === 0 && name !== "break") fr.forEach(function (x) { tone(c, cb, t, x, step * 1.6, 0.18, "square", 2800, 0.003, 0.03); });
          if (g.chord === "gate" && name !== "break" && s % 4 !== 1) fr.forEach(function (x) { tone(c, cb, t, x, step * 0.9, 0.18, "sawtooth", 3200, 0.003, 0.02); tone(c, cb, t, x * 1.007, step * 0.9, 0.12, "sawtooth", 3200, 0.003, 0.02); });
        }
        // leads
        if (on.lead && g.lead !== "none") {
          if (g.lead === "arp" && (name === "drop" || name === "break")) { var fa = chordFreqs(g, deg, 8); tone(c, lb, t, fa[s % 3] * (s % 6 > 2 ? 2 : 1), step * 1.3, 0.3, "sawtooth", 3600, 0.003, 0.03); }
          if (g.lead === "acid" && name === "drop") { var fc = hz(g.root * 2, semiAt(g, [0, 0, 7, 0, 3, 0, 5, 0][Math.floor(s / 2) % 8] % 7)); var o = tone(c, lb, t, fc, step * 0.9, 0.3, "sawtooth", 600 + 2400 * ((b % 4) / 3 + s / 32), 0.003, 0.02); }
          if (g.lead === "hook" && s % 2 === 0) { var idx = ((b % 2) * 8 + s / 2) | 0, dg = g.hook[idx]; if (dg !== undefined && dg >= 0 && (name === "drop" || (name === "break" && b % 2 === 0))) tone(c, lb, t, hz(g.root * 8, semiAt(g, dg + deg)), step * 1.8, 0.3, g.name === "Synthpop" ? "square" : "sawtooth", 3000, 0.004, 0.04); }
        }
      }
      // pads
      if (on.chord && (g.chord === "pad" || name === "break" || name === "intro" && b >= 4)) pad(c, cb, t0, chordFreqs(g, deg, 2), bar, 0.12);
    }
    if (name === "build" || name === "build2") riser(c, fx, 0, secs, 0.5);
    if (name === "drop") impact(c, fx, 0);
    return c.startRendering().then(function (buf) { return buf.getChannelData(0); });
  }

  /* ---------- peaks + WAV ---------- */
  function toInt16(f) { var out = new Int16Array(f.length); for (var i = 0; i < f.length; i++) { var v = Math.max(-1, Math.min(1, f[i])); out[i] = v < 0 ? v * 32768 : v * 32767; } return out; }
  function peaksOf(f, out) { var per = SR / PPS; for (var b = 0; b * per < f.length; b++) { var m = 0, from = Math.floor(b * per), to = Math.min(f.length, Math.floor((b + 1) * per)); for (var i = from; i < to; i += 8) { var v = Math.abs(f[i]); if (v > m) m = v; } out.push(m); } }
  function wavBlob(chunks, frames) {
    var head = new ArrayBuffer(44), v = new DataView(head);
    function w(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    w(0, "RIFF"); v.setUint32(4, 36 + frames * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, frames * 2, true);
    return new Blob([head].concat(chunks.map(function (c) { return c.buffer; })), { type: "audio/wav" });
  }

  function render(id, onProgress) {
    var g = G[id]; if (!g) return Promise.reject(new Error("unknown genre"));
    var secs = plan(g), cache = {}, chunks = [], pk = [], frames = 0, done = 0, marks = [], tt = 0, beatS = 60 / g.bpm, seenDrop = 0;
    secs.forEach(function (sc) { var nm = sc[0], when = tt; tt += sc[1] * 4 * beatS; if (nm === "build") marks.push({ name: "Build", time: when }); else if (nm === "drop") { seenDrop++; marks.push({ name: seenDrop === 1 ? "Drop" : "Drop 2", time: when }); } else if (nm === "break") marks.push({ name: "Break", time: when }); });
    var steps = secs.length;
    function next(i) {
      if (i >= steps) {
        var peaks = new Float32Array(pk), top = 0; for (var k = 0; k < peaks.length; k++) if (peaks[k] > top) top = peaks[k]; if (top > 0) for (var q = 0; q < peaks.length; q++) peaks[q] /= top;
        return Promise.resolve({ blob: wavBlob(chunks, frames), peaks: { data: peaks, pps: PPS }, duration: frames / SR, title: g.name + " · " + g.key + " · full track", bpm: g.bpm, cues: marks.slice(0, 4) });
      }
      var nm = secs[i][0], bars = secs[i][1], key = nm + bars;
      if (onProgress) onProgress(i / steps, nm);
      var job = cache[key] ? Promise.resolve(cache[key]) : renderSection(g, nm, bars).then(function (f) { var o = { i16: toInt16(f), pk: [] }; peaksOf(f, o.pk); cache[key] = o; return o; });
      return job.then(function (o) { chunks.push(o.i16); frames += o.i16.length; for (var j = 0; j < o.pk.length; j++) pk.push(o.pk[j]); return new Promise(function (r) { setTimeout(r, 0); }).then(function () { return next(i + 1); }); });
    }
    return next(0).then(function (res) { if (onProgress) onProgress(1, "done"); return res; });
  }

  window.GSDJGenres = { list: list, render: render };
})();
