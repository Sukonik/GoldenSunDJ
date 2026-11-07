"use strict";

/* GoldenSunSampler — 16 synthesized pads, per-pad samples, step sequencer.
   Every sound is play(ctx, dest, when, { rate, gain }) so the same code
   runs in the live AudioContext and in an OfflineAudioContext for export. */

/* ---------- Shared helpers ---------- */

var noiseCache = new WeakMap();

function noiseBuffer(ctx) {
  var cached = noiseCache.get(ctx);
  if (cached) return cached;
  var len = Math.floor(ctx.sampleRate);
  var buf = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseCache.set(ctx, buf);
  return buf;
}

function rateOf(semitones) { return Math.pow(2, semitones / 12); }

function envGain(ctx, dest, when, peak, attack, decay) {
  var g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  g.connect(dest);
  return g;
}

function noiseSrc(ctx) {
  var src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  return src;
}

function tone(ctx, type, freq) {
  var osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  return osc;
}

function filter(ctx, type, freq, q) {
  var f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (q !== undefined) f.Q.value = q;
  return f;
}

/* ---------- The kit: 16 synthesized sounds ---------- */

var KIT = [
  { name: "Kick", play: function (ctx, dest, when, o) {
      var osc = tone(ctx, "sine", 150 * o.rate);
      osc.frequency.setValueAtTime(150 * o.rate, when);
      osc.frequency.exponentialRampToValueAtTime(40 * o.rate, when + 0.11);
      var g = envGain(ctx, dest, when, o.gain, 0.002, 0.25);
      osc.connect(g); osc.start(when); osc.stop(when + 0.3);
  } },
  { name: "Snare", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var bp = filter(ctx, "bandpass", 1800 * o.rate, 0.8);
      var ng = envGain(ctx, dest, when, o.gain * 0.9, 0.001, 0.13);
      n.connect(bp); bp.connect(ng); n.start(when); n.stop(when + 0.16);
      var osc = tone(ctx, "triangle", 180 * o.rate);
      var og = envGain(ctx, dest, when, o.gain * 0.6, 0.001, 0.09);
      osc.connect(og); osc.start(when); osc.stop(when + 0.11);
  } },
  { name: "Clap", play: function (ctx, dest, when, o) {
      var bp = filter(ctx, "bandpass", 1200 * o.rate, 1.5);
      bp.connect(dest);
      [0, 0.02, 0.04].forEach(function (off, i) {
        var n = noiseSrc(ctx);
        var g = envGain(ctx, bp, when + off, o.gain * (i === 2 ? 1 : 0.7), 0.001, i === 2 ? 0.18 : 0.03);
        n.connect(g); n.start(when + off); n.stop(when + off + 0.25);
      });
  } },
  { name: "Closed Hat", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var hp = filter(ctx, "highpass", 8000 * o.rate);
      var g = envGain(ctx, dest, when, o.gain * 0.6, 0.001, 0.05);
      n.connect(hp); hp.connect(g); n.start(when); n.stop(when + 0.08);
  } },
  { name: "Open Hat", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var hp = filter(ctx, "highpass", 8000 * o.rate);
      var g = envGain(ctx, dest, when, o.gain * 0.55, 0.001, 0.4);
      n.connect(hp); hp.connect(g); n.start(when); n.stop(when + 0.45);
  } },
  { name: "Rimshot", play: function (ctx, dest, when, o) {
      var osc = tone(ctx, "square", 1700 * o.rate);
      var g = envGain(ctx, dest, when, o.gain * 0.5, 0.001, 0.04);
      osc.connect(g); osc.start(when); osc.stop(when + 0.06);
      var n = noiseSrc(ctx);
      var hp = filter(ctx, "highpass", 4000);
      var ng = envGain(ctx, dest, when, o.gain * 0.4, 0.001, 0.02);
      n.connect(hp); hp.connect(ng); n.start(when); n.stop(when + 0.04);
  } },
  { name: "Shaker", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var hp = filter(ctx, "highpass", 6000 * o.rate);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(o.gain * 0.5, when + 0.02);
      g.gain.exponentialRampToValueAtTime(o.gain * 0.2, when + 0.05);
      g.gain.exponentialRampToValueAtTime(o.gain * 0.45, when + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
      n.connect(hp); hp.connect(g); g.connect(dest);
      n.start(when); n.stop(when + 0.14);
  } },
  { name: "Hi Tom", play: function (ctx, dest, when, o) { tom(ctx, dest, when, o, 220, 140); } },
  { name: "Mid Tom", play: function (ctx, dest, when, o) { tom(ctx, dest, when, o, 165, 110); } },
  { name: "Low Tom", play: function (ctx, dest, when, o) { tom(ctx, dest, when, o, 120, 75); } },
  { name: "Crash", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var hp = filter(ctx, "highpass", 5000 * o.rate);
      var g = envGain(ctx, dest, when, o.gain * 0.7, 0.002, 1.2);
      n.connect(hp); hp.connect(g); n.start(when); n.stop(when + 1.3);
  } },
  { name: "Sub Drop", play: function (ctx, dest, when, o) {
      var osc = tone(ctx, "sine", 90 * o.rate);
      osc.frequency.setValueAtTime(90 * o.rate, when);
      osc.frequency.exponentialRampToValueAtTime(30 * o.rate, when + 0.45);
      var g = envGain(ctx, dest, when, o.gain, 0.004, 0.5);
      osc.connect(g); osc.start(when); osc.stop(when + 0.55);
  } },
  { name: "Bass Note", play: function (ctx, dest, when, o) {
      var osc = tone(ctx, "sawtooth", 55 * o.rate);
      var lp = filter(ctx, "lowpass", 300 * o.rate, 2);
      var g = envGain(ctx, dest, when, o.gain * 0.9, 0.004, 0.3);
      osc.connect(lp); lp.connect(g); osc.start(when); osc.stop(when + 0.35);
  } },
  { name: "Pluck", play: function (ctx, dest, when, o) {
      var osc = tone(ctx, "square", 440 * o.rate);
      var lp = filter(ctx, "lowpass", 2400 * o.rate);
      var g = envGain(ctx, dest, when, o.gain * 0.6, 0.002, 0.18);
      osc.connect(lp); lp.connect(g); osc.start(when); osc.stop(when + 0.22);
  } },
  { name: "Chord Stab", play: function (ctx, dest, when, o) {
      var lp = filter(ctx, "lowpass", 600 * o.rate, 1);
      lp.frequency.setValueAtTime(3200 * o.rate, when);
      lp.frequency.exponentialRampToValueAtTime(600 * o.rate, when + 0.22);
      var g = envGain(ctx, dest, when, o.gain * 0.4, 0.003, 0.25);
      lp.connect(g);
      [220, 277, 330].forEach(function (f) {
        var osc = tone(ctx, "sawtooth", f * o.rate);
        osc.detune.value = (Math.random() * 10 - 5);
        osc.connect(lp); osc.start(when); osc.stop(when + 0.3);
      });
  } },
  { name: "Perc Tick", play: function (ctx, dest, when, o) {
      var n = noiseSrc(ctx);
      var bp = filter(ctx, "bandpass", 3000 * o.rate, 4);
      var ng = envGain(ctx, dest, when, o.gain * 0.6, 0.001, 0.03);
      n.connect(bp); bp.connect(ng); n.start(when); n.stop(when + 0.05);
      var osc = tone(ctx, "sine", 900 * o.rate);
      var og = envGain(ctx, dest, when, o.gain * 0.4, 0.001, 0.05);
      osc.connect(og); osc.start(when); osc.stop(when + 0.07);
  } }
];

function tom(ctx, dest, when, o, from, to) {
  var osc = tone(ctx, "sine", from * o.rate);
  osc.frequency.setValueAtTime(from * o.rate, when);
  osc.frequency.exponentialRampToValueAtTime(to * o.rate, when + 0.18);
  var g = envGain(ctx, dest, when, o.gain * 0.85, 0.002, 0.28);
  osc.connect(g); osc.start(when); osc.stop(when + 0.32);
}

/* ---------- Pad state ---------- */

var KEY_ROWS = ["1234", "qwer", "asdf", "zxcv"];
var KEYMAP = {};
KEY_ROWS.join("").split("").forEach(function (k, i) { KEYMAP[k] = i; });

var pads = KIT.map(function (sound) {
  return { synthName: sound.name, sample: null, sampleName: "", volume: 80, pitch: 0 };
});

var selected = 0;
var bpm = 120;

/* ---------- Audio context (lazy, one shared) ---------- */

var audioCtx = null;
var master = null;

function ensureCtx() {
  if (!audioCtx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function triggerPad(index, ctx, dest, when) {
  var pad = pads[index];
  var o = { rate: rateOf(pad.pitch), gain: (pad.volume / 100) * 0.9 };
  if (pad.sample) {
    var src = ctx.createBufferSource();
    src.buffer = pad.sample;
    src.playbackRate.value = o.rate;
    var g = ctx.createGain();
    g.gain.value = o.gain;
    src.connect(g); g.connect(dest);
    src.start(when);
  } else {
    KIT[index].play(ctx, dest, when, o);
  }
}

function playLive(index) {
  var ctx = ensureCtx();
  triggerPad(index, ctx, master, ctx.currentTime);
  flashPad(index);
}

/* ---------- DOM ---------- */

var padGrid = document.getElementById("pad-grid");
var seqGrid = document.getElementById("seq-grid");
var statusEl = document.getElementById("status");
var selectedNameEl = document.getElementById("selected-name");
var volumeEl = document.getElementById("pad-volume");
var volumeOut = document.getElementById("pad-volume-out");
var pitchEl = document.getElementById("pad-pitch");
var pitchOut = document.getElementById("pad-pitch-out");
var fileEl = document.getElementById("pad-file");
var playBtn = document.getElementById("play-btn");
var tempoEl = document.getElementById("tempo");
var tempoOut = document.getElementById("tempo-out");

function setStatus(msg) { statusEl.textContent = msg; }

function padLabel(index) {
  var pad = pads[index];
  return pad.sample ? pad.sampleName : pad.synthName;
}

var padEls = [];

pads.forEach(function (pad, i) {
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pad";
  btn.setAttribute("aria-pressed", i === selected ? "true" : "false");
  if (i === selected) btn.classList.add("is-selected");

  var name = document.createElement("span");
  name.className = "pad-name";
  name.textContent = pad.synthName;
  name.title = pad.synthName;

  var key = document.createElement("span");
  key.className = "pad-key";
  key.textContent = "Key " + KEY_ROWS.join("").charAt(i).toUpperCase();

  btn.appendChild(name);
  btn.appendChild(key);
  btn.setAttribute("aria-label", "Play and select " + pad.synthName);

  btn.addEventListener("pointerdown", function () {
    selectPad(i);
    playLive(i);
  });
  btn.addEventListener("dragover", function (e) {
    e.preventDefault();
    btn.classList.add("is-drop");
  });
  btn.addEventListener("dragleave", function () { btn.classList.remove("is-drop"); });
  btn.addEventListener("drop", function (e) {
    e.preventDefault();
    btn.classList.remove("is-drop");
    selectPad(i);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadSample(i, e.dataTransfer.files[0]);
  });

  padGrid.appendChild(btn);
  padEls.push({ btn: btn, name: name });
});

function flashPad(index) {
  var el = padEls[index].btn;
  el.classList.add("is-hit");
  window.setTimeout(function () { el.classList.remove("is-hit"); }, 120);
}

function refreshPadLabel(index) {
  var pad = pads[index];
  padEls[index].name.textContent = padLabel(index);
  padEls[index].name.title = pad.sample ? pad.sampleName + " (loaded sample)" : pad.synthName;
  rowHeadEls[index].textContent = padLabel(index);
  rowHeadEls[index].title = padLabel(index);
}

function selectPad(index) {
  selected = index;
  padEls.forEach(function (el, i) {
    el.btn.classList.toggle("is-selected", i === index);
    el.btn.setAttribute("aria-pressed", i === index ? "true" : "false");
  });
  rowHeadEls.forEach(function (el, i) {
    el.classList.toggle("is-selected", i === index);
  });
  var pad = pads[index];
  selectedNameEl.textContent = padLabel(index);
  volumeEl.value = pad.volume;
  volumeOut.textContent = pad.volume;
  pitchEl.value = pad.pitch;
  pitchOut.textContent = formatPitch(pad.pitch);
}

function formatPitch(v) { return (v > 0 ? "+" + v : String(v)) + " st"; }

volumeEl.addEventListener("input", function () {
  pads[selected].volume = Number(volumeEl.value);
  volumeOut.textContent = volumeEl.value;
});

pitchEl.addEventListener("input", function () {
  pads[selected].pitch = Number(pitchEl.value);
  pitchOut.textContent = formatPitch(pads[selected].pitch);
});

fileEl.addEventListener("change", function () {
  if (fileEl.files && fileEl.files[0]) loadSample(selected, fileEl.files[0]);
  fileEl.value = "";
});

function loadSample(index, file) {
  var ctx = ensureCtx();
  file.arrayBuffer().then(function (buf) {
    return ctx.decodeAudioData(buf);
  }).then(function (decoded) {
    pads[index].sample = decoded;
    pads[index].sampleName = file.name;
    refreshPadLabel(index);
    if (index === selected) selectedNameEl.textContent = file.name;
    setStatus(file.name + " is loaded on the " + pads[index].synthName + " pad. Tap the pad to hear it.");
    playLive(index);
  }).catch(function () {
    setStatus("That file could not be read as audio. Try a WAV, MP3 or M4A file.");
  });
}

/* ---------- Keyboard ---------- */

document.addEventListener("keydown", function (e) {
  var t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  var idx = KEYMAP[e.key.toLowerCase()];
  if (idx === undefined) return;
  selectPad(idx);
  playLive(idx);
});

/* ---------- Sequencer grid ---------- */

var pattern = pads.map(function () {
  return [false, false, false, false, false, false, false, false,
          false, false, false, false, false, false, false, false];
});

var rowHeadEls = [];
var stepEls = [];   // stepEls[pad][step]
var numEls = [];

(function buildGrid() {
  var corner = document.createElement("span");
  corner.className = "seq-corner";
  corner.setAttribute("aria-hidden", "true");
  seqGrid.appendChild(corner);

  for (var s = 0; s < 16; s++) {
    var num = document.createElement("span");
    num.className = "seq-num tnum";
    num.textContent = s + 1;
    if (s % 4 === 0 && s !== 0) num.dataset.groupStart = "true";
    seqGrid.appendChild(num);
    numEls.push(num);
  }

  pads.forEach(function (pad, p) {
    var head = document.createElement("button");
    head.type = "button";
    head.className = "seq-rowhead";
    head.textContent = pad.synthName;
    head.title = pad.synthName;
    head.setAttribute("aria-label", "Select and play " + pad.synthName);
    head.addEventListener("click", function () {
      selectPad(p);
      playLive(p);
    });
    seqGrid.appendChild(head);
    rowHeadEls.push(head);
    if (p === selected) head.classList.add("is-selected");

    stepEls.push([]);
    for (var st = 0; st < 16; st++) {
      (function (padIdx, stepIdx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "seq-step";
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", KIT[padIdx].name + " step " + (stepIdx + 1));
        if (stepIdx % 4 === 0 && stepIdx !== 0) b.dataset.groupStart = "true";
        b.addEventListener("click", function () {
          pattern[padIdx][stepIdx] = !pattern[padIdx][stepIdx];
          b.setAttribute("aria-pressed", pattern[padIdx][stepIdx] ? "true" : "false");
          if (pattern[padIdx][stepIdx]) {
            selectPad(padIdx);
            playLive(padIdx);
          }
        });
        seqGrid.appendChild(b);
        stepEls[padIdx].push(b);
      })(p, st);
    }
  });
})();

function patternHasSteps() {
  return pattern.some(function (row) { return row.some(Boolean); });
}

/* ---------- Transport + lookahead scheduler ---------- */

var playing = false;
var schedTimer = null;
var rafId = null;
var currentStep = 0;
var nextStepTime = 0;
var drawnStep = -1;

function stepDur() { return 60 / bpm / 4; }

function setChip(text, live) {
  if (window.GSDJ && window.GSDJ.setChip) window.GSDJ.setChip({ text: text, live: live });
}

function schedulerTick() {
  while (nextStepTime < audioCtx.currentTime + 0.12) {
    scheduleStep(currentStep, nextStepTime);
    nextStepTime += stepDur();
    currentStep = (currentStep + 1) % 16;
  }
}

function scheduleStep(step, when) {
  for (var p = 0; p < 16; p++) {
    if (pattern[p][step]) triggerPad(p, audioCtx, master, when);
  }
}

function drawPlayhead() {
  if (!playing) return;
  var ahead = nextStepTime - stepDur();
  var step = currentStep === 0 ? 15 : currentStep - 1;
  /* If the audio clock is still inside the previous step, hold that column. */
  if (audioCtx.currentTime < ahead) step = step === 0 ? 15 : step - 1;
  if (step !== drawnStep) {
    clearPlayhead();
    drawnStep = step;
    numEls[step].classList.add("is-now");
    for (var p = 0; p < 16; p++) stepEls[p][step].classList.add("is-now");
    for (var f = 0; f < 16; f++) if (pattern[f][step]) flashPad(f);
  }
  rafId = window.requestAnimationFrame(drawPlayhead);
}

function clearPlayhead() {
  numEls.forEach(function (el) { el.classList.remove("is-now"); });
  stepEls.forEach(function (row) { row.forEach(function (el) { el.classList.remove("is-now"); }); });
  drawnStep = -1;
}

function startPlayback() {
  ensureCtx();
  playing = true;
  currentStep = 0;
  drawnStep = -1;
  nextStepTime = audioCtx.currentTime + 0.06;
  schedTimer = window.setInterval(schedulerTick, 25);
  rafId = window.requestAnimationFrame(drawPlayhead);
  playBtn.textContent = "Stop";
  playBtn.setAttribute("aria-pressed", "true");
  setChip("● Playing · " + bpm + " BPM", true);
  setStatus("Playing at " + bpm + " BPM. Tap steps to change the pattern while it plays.");
}

function stopPlayback() {
  playing = false;
  if (schedTimer) window.clearInterval(schedTimer);
  if (rafId) window.cancelAnimationFrame(rafId);
  schedTimer = null; rafId = null;
  clearPlayhead();
  playBtn.textContent = "Play";
  playBtn.setAttribute("aria-pressed", "false");
  setChip("● " + bpm + " BPM", false);
  setStatus("Stopped. Press play to hear the pattern again.");
}

playBtn.addEventListener("click", function () {
  if (playing) stopPlayback(); else startPlayback();
});

tempoEl.addEventListener("input", function () {
  bpm = Number(tempoEl.value);
  tempoOut.textContent = bpm + " BPM";
  if (playing) setChip("● Playing · " + bpm + " BPM", true);
  else setChip("● " + bpm + " BPM", false);
});

document.getElementById("clear-btn").addEventListener("click", function () {
  pattern.forEach(function (row, p) {
    row.forEach(function (_, s) {
      row[s] = false;
      stepEls[p][s].setAttribute("aria-pressed", "false");
    });
  });
  setStatus("Pattern cleared. Tap some steps on to build a new one.");
});

/* ---------- Export one bar as WAV ---------- */

function encodeWav(buffer) {
  var channels = Math.min(buffer.numberOfChannels, 2);
  var rate = buffer.sampleRate;
  var frames = buffer.length;
  var bytesPerSample = 2;
  var blockAlign = channels * bytesPerSample;
  var dataSize = frames * blockAlign;
  var ab = new ArrayBuffer(44 + dataSize);
  var v = new DataView(ab);
  function str(off, s) { for (var i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); }
  str(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, channels, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * blockAlign, true); v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, dataSize, true);
  var chans = [];
  for (var c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));
  var off = 44;
  for (var i = 0; i < frames; i++) {
    for (var ch = 0; ch < channels; ch++) {
      var s = Math.max(-1, Math.min(1, chans[ch][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

document.getElementById("export-btn").addEventListener("click", function () {
  if (!patternHasSteps()) {
    setStatus("The pattern is empty. Tap some steps on, then export.");
    return;
  }
  var dur = stepDur();
  var barDur = dur * 16;
  var offCtx = new OfflineAudioContext(2, Math.ceil(barDur * 44100), 44100);
  var offMaster = offCtx.createGain();
  offMaster.gain.value = 0.9;
  offMaster.connect(offCtx.destination);
  for (var s = 0; s < 16; s++) {
    for (var p = 0; p < 16; p++) {
      if (pattern[p][s]) triggerPad(p, offCtx, offMaster, s * dur);
    }
  }
  setStatus("Rendering the pattern…");
  offCtx.startRendering().then(function (rendered) {
    var blob = encodeWav(rendered);
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "goldensun-sampler-pattern.wav";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    setStatus("Pattern exported as WAV (one bar, " + bpm + " BPM).");
  }).catch(function () {
    setStatus("Export did not finish. Try again, or lower the tempo and retry.");
  });
});

/* ---------- Init ---------- */

selectPad(0);
