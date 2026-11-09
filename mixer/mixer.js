/* GoldenSunMixer — two decks, crossfader, echo FX. Vanilla, no dependencies.
   Each deck is an <audio loop> element with a Web Audio chain built lazily
   on its first Play press:
   MediaElementSource -> lowshelf -> peaking -> highshelf -> channel gain
   -> analyser -> crossfade gain -> master gain -> destination.
   Master also taps an echo insert: master -> delay (+ feedback) -> wet -> destination. */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var s = Math.floor(sec);
    var m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }
  function fmtSigned(v) {
    return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
  }
  function fmtDb(v) {
    return (v > 0 ? "+" + v : String(v)) + " dB";
  }

  var statusEl = $("mixer-status");
  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  /* ------------------------------------------------------------------ */
  /* Shared audio context, master and FX                                 */
  /* ------------------------------------------------------------------ */
  var actx = null;
  var masterGain = null;
  var fxNodes = null; // { input, delay, feedback, wet }
  var state = {
    crossfader: 0,
    masterVolume: 90,
    echoOn: false,
    echoMix: 25 // slider 0..50 -> wet 0..0.5
  };

  function ensureContext() {
    if (actx) return actx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();

    masterGain = actx.createGain();
    masterGain.gain.value = state.masterVolume / 100;
    masterGain.connect(actx.destination);

    // Echo insert tapped from master.
    var input = actx.createGain();
    input.gain.value = 1;
    var delay = actx.createDelay(1);
    delay.delayTime.value = 0.28;
    var feedback = actx.createGain();
    feedback.gain.value = 0.35;
    var wet = actx.createGain();
    wet.gain.value = state.echoOn ? state.echoMix / 100 : 0;
    masterGain.connect(input);
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(actx.destination);
    fxNodes = { input: input, delay: delay, feedback: feedback, wet: wet };

    // Apply crossfader to any decks already built.
    decks.forEach(function (d) { applyCrossfadeTo(d); });
    return actx;
  }

  function applyEcho() {
    if (fxNodes) {
      fxNodes.wet.gain.value = state.echoOn ? state.echoMix / 100 : 0;
    }
  }

  function crossGains() {
    var t = (state.crossfader + 50) / 100;
    return {
      a: Math.cos(t * Math.PI * 0.5),
      b: Math.cos((1 - t) * Math.PI * 0.5)
    };
  }
  function applyCrossfadeTo(deck) {
    if (!deck.nodes || !deck.nodes.crossGain) return;
    var g = crossGains();
    deck.nodes.crossGain.gain.value = deck.id === "a" ? g.a : g.b;
  }
  function applyCrossfader() {
    decks.forEach(applyCrossfadeTo);
    var v = state.crossfader;
    var out = $("crossfader-value");
    if (out) out.textContent = v === 0 ? "Center" : (v < 0 ? "A " + Math.abs(v) : "B " + v);
  }

  /* ------------------------------------------------------------------ */
  /* WAV encoder (16-bit PCM)                                            */
  /* ------------------------------------------------------------------ */
  function bufferToWavBlob(buffer) {
    var numCh = Math.min(2, buffer.numberOfChannels);
    var sr = buffer.sampleRate;
    var frames = buffer.length;
    var dataLen = frames * numCh * 2;
    var ab = new ArrayBuffer(44 + dataLen);
    var view = new DataView(ab);
    function writeStr(off, str) {
      for (var i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    }
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataLen, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true);
    view.setUint16(32, numCh * 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, dataLen, true);
    var channels = [];
    for (var c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
    var off = 44;
    for (var i = 0; i < frames; i++) {
      for (var ch = 0; ch < numCh; ch++) {
        var s = clamp(channels[ch][i], -1, 1);
        view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        off += 2;
      }
    }
    return new Blob([view], { type: "audio/wav" });
  }

  /* ------------------------------------------------------------------ */
  /* Synth helpers shared by both demo loops (OfflineAudioContext)       */
  /* ------------------------------------------------------------------ */
  function makeNoiseBuffer(ctx, seconds) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function kick(ctx, dest, t) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  function hat(ctx, dest, t, open, noiseBuf, level) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    var gain = ctx.createGain();
    var peak = typeof level === "number" ? level : 0.22;
    var dur = open ? 0.3 : 0.05;
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function rideTick(ctx, dest, t, noiseBuf) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 9000;
    bp.Q.value = 1.2;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + 0.14);
  }

  function bass(ctx, dest, t, freq, dur) {
    var osc = ctx.createOscillator();
    var lp = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    lp.type = "lowpass";
    lp.frequency.value = 320;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(lp);
    lp.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function chordStab(ctx, dest, t) {
    var freqs = [220, 261.63, 329.63];
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    lp.connect(gain);
    gain.connect(dest);
    freqs.forEach(function (f) {
      var osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  function renderHouseLoop() {
    var bpm = 124;
    var beat = 60 / bpm;
    var duration = beat * 8; // 2 bars of 4/4
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new OC(1, Math.ceil(32000 * duration), 32000);
    var out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);
    var noise = makeNoiseBuffer(ctx, duration);
    var b, step;
    for (b = 0; b < 8; b++) {
      kick(ctx, out, b * beat);
      hat(ctx, out, b * beat + beat / 2, true, noise, 0.2);
    }
    var pattern = [55, 55, 65.41, 49];
    for (step = 0; step < 16; step++) {
      bass(ctx, out, step * (beat / 2), pattern[step % 4], beat / 2 * 0.9);
    }
    chordStab(ctx, out, 4 * beat); // bar 2, beat 1
    return ctx.startRendering();
  }

  function renderTechnoLoop() {
    var bpm = 128;
    var beat = 60 / bpm;
    var duration = beat * 8;
    var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new OC(1, Math.ceil(32000 * duration), 32000);
    var out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);
    var noise = makeNoiseBuffer(ctx, duration);
    var b, step;
    for (b = 0; b < 8; b++) {
      kick(ctx, out, b * beat);
      rideTick(ctx, out, b * beat + beat / 2, noise);
    }
    for (step = 0; step < 32; step++) {
      hat(ctx, out, step * (beat / 4), false, noise, step % 2 === 0 ? 0.18 : 0.1);
    }
    for (step = 0; step < 16; step++) {
      bass(ctx, out, step * (beat / 2), 46.25, beat / 2 * 0.85);
    }
    return ctx.startRendering();
  }

  /* ------------------------------------------------------------------ */
  /* Decks                                                               */
  /* ------------------------------------------------------------------ */
  function makeDeck(id, label, bpm, demoName) {
    return {
      id: id,
      label: label,
      bpm: bpm,
      isDemo: true,
      trackName: demoName,
      cue: 0,
      tempo: 0,
      gainValue: 80,
      eq: { low: 0, mid: 0, high: 0 },
      built: false,
      nodes: null,
      userUrl: null,
      demoUrl: null,
      dragging: false,
      lastValuetextSec: -1,
      els: {
        root: $("deck-" + id),
        audio: $("audio-" + id),
        platter: $("platter-" + id),
        trackName: $("track-name-" + id),
        time: $("time-" + id),
        meter: $("meter-" + id),
        play: $("play-" + id),
        setCue: $("setcue-" + id),
        cueBtn: $("cue-" + id),
        cueReadout: $("cue-readout-" + id),
        file: $("file-" + id),
        tempo: $("tempo-" + id),
        tempoValue: $("tempo-value-" + id),
        gain: $("gain-" + id),
        gainValue: $("gain-value-" + id),
        bpm: $("bpm-" + id),
        eqLow: $("eq-low-" + id),
        eqMid: $("eq-mid-" + id),
        eqHigh: $("eq-high-" + id),
        eqLowValue: $("eq-low-value-" + id),
        eqMidValue: $("eq-mid-value-" + id),
        eqHighValue: $("eq-high-value-" + id)
      }
    };
  }

  var decks = [
    makeDeck("a", "A", 124, "House demo loop"),
    makeDeck("b", "B", 128, "Techno demo loop")
  ];
  var deckById = { a: decks[0], b: decks[1] };

  function deckRate(deck) {
    return 1 + deck.tempo / 100;
  }

  function buildGraph(deck) {
    if (deck.built) return true;
    if (!ensureContext()) return false;
    try {
      var source = actx.createMediaElementSource(deck.els.audio);
      var low = actx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 200;
      low.gain.value = deck.eq.low;
      var mid = actx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1000;
      mid.Q.value = 0.9;
      mid.gain.value = deck.eq.mid;
      var high = actx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 4000;
      high.gain.value = deck.eq.high;
      var channelGain = actx.createGain();
      channelGain.gain.value = deck.gainValue / 100;
      var analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      var crossGain = actx.createGain();
      source.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(channelGain);
      channelGain.connect(analyser);
      analyser.connect(crossGain);
      crossGain.connect(masterGain);
      deck.nodes = {
        source: source, low: low, mid: mid, high: high,
        channelGain: channelGain, analyser: analyser, crossGain: crossGain,
        meterData: new Uint8Array(analyser.fftSize)
      };
      deck.built = true;
      applyCrossfadeTo(deck);
      return true;
    } catch (err) {
      setStatus("Deck " + deck.label + ": audio routing failed. Playback still works without EQ.");
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Session chip + meters                                               */
  /* ------------------------------------------------------------------ */
  function anyPlaying() {
    return decks.some(function (d) { return !d.els.audio.paused; });
  }

  function updateChip() {
    if (!window.GSDJ || !window.GSDJ.setChip) return;
    var playing = decks.filter(function (d) { return !d.els.audio.paused; });
    if (playing.length === 0) {
      window.GSDJ.setChip({ text: "// Mixer ready", live: false });
    } else if (playing.length === 2) {
      window.GSDJ.setChip({ text: "A + B playing", live: true });
    } else {
      var d = playing[0];
      var text = d.isDemo && d.bpm ? d.label + " " + d.bpm + " BPM" : d.label + " playing";
      window.GSDJ.setChip({ text: text, live: true });
    }
  }

  var meterRaf = null;
  function meterLoop() {
    if (!anyPlaying()) {
      meterRaf = null;
      decks.forEach(function (d) { if (d.els.meter) d.els.meter.style.width = "0%"; });
      return;
    }
    decks.forEach(function (d) {
      if (!d.els.meter) return;
      if (!d.built || !d.nodes || d.els.audio.paused) {
        d.els.meter.style.width = "0%";
        return;
      }
      var data = d.nodes.meterData;
      d.nodes.analyser.getByteTimeDomainData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) {
        var v = (data[i] - 128) / 128;
        sum += v * v;
      }
      var rms = Math.sqrt(sum / data.length);
      d.els.meter.style.width = clamp(Math.round(rms * 260), 0, 100) + "%";
    });
    meterRaf = window.requestAnimationFrame(meterLoop);
  }
  function kickMeters() {
    if (meterRaf === null && anyPlaying()) {
      meterRaf = window.requestAnimationFrame(meterLoop);
    }
  }

  function syncDeckUi(deck) {
    var playing = !deck.els.audio.paused;
    deck.els.play.textContent = playing ? "Pause" : "Play";
    deck.els.root.classList.toggle("is-playing", playing);
    updateChip();
    kickMeters();
  }

  /* ------------------------------------------------------------------ */
  /* Per-deck wiring                                                     */
  /* ------------------------------------------------------------------ */
  function updateTimeReadout(deck) {
    var a = deck.els.audio;
    deck.els.time.textContent = fmtTime(a.currentTime) + " / " + fmtTime(a.duration);
    var whole = Math.floor(a.currentTime);
    if (whole !== deck.lastValuetextSec) {
      deck.lastValuetextSec = whole;
      deck.els.platter.setAttribute(
        "aria-valuetext",
        fmtTime(a.currentTime) + " of " + fmtTime(a.duration)
      );
      if (isFinite(a.duration) && a.duration > 0) {
        deck.els.platter.setAttribute(
          "aria-valuenow",
          String(Math.round((a.currentTime / a.duration) * 100))
        );
      }
    }
  }

  function wireDeck(deck) {
    var els = deck.els;
    var audio = els.audio;

    els.play.addEventListener("click", function () {
      if (!audio.paused) {
        audio.pause();
        return;
      }
      buildGraph(deck);
      if (actx && actx.state === "suspended") {
        actx.resume();
      }
      var p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {
          setStatus("Deck " + deck.label + ": playback was blocked. Press Play again.");
          syncDeckUi(deck);
        });
      }
    });

    audio.addEventListener("play", function () { syncDeckUi(deck); });
    audio.addEventListener("pause", function () { syncDeckUi(deck); });
    audio.addEventListener("timeupdate", function () { updateTimeReadout(deck); });
    audio.addEventListener("loadedmetadata", function () { updateTimeReadout(deck); });
    audio.addEventListener("error", function () {
      if (audio.getAttribute("src")) {
        setStatus("Deck " + deck.label + ": could not play this file. Try another audio file.");
      }
    });

    els.setCue.addEventListener("click", function () {
      deck.cue = isFinite(audio.currentTime) ? audio.currentTime : 0;
      els.cueReadout.textContent = "Cue " + fmtTime(deck.cue);
      setStatus("Deck " + deck.label + ": cue set at " + fmtTime(deck.cue) + ".");
    });

    els.cueBtn.addEventListener("click", function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        try { audio.currentTime = clamp(deck.cue, 0, audio.duration); } catch (err) { /* not ready */ }
      }
      updateTimeReadout(deck);
    });

    els.file.addEventListener("change", function () {
      var file = els.file.files && els.file.files[0];
      if (!file) return;
      if (deck.userUrl) URL.revokeObjectURL(deck.userUrl);
      deck.userUrl = URL.createObjectURL(file);
      var wasPlaying = !audio.paused;
      audio.src = deck.userUrl;
      deck.isDemo = false;
      deck.bpm = null;
      deck.trackName = file.name;
      deck.cue = 0;
      els.trackName.textContent = file.name;
      els.cueReadout.textContent = "Cue 0:00";
      if (els.bpm) els.bpm.textContent = "Your file";
      setStatus("Deck " + deck.label + ": loaded '" + file.name + "'.");
      if (wasPlaying) {
        buildGraph(deck);
        var p = audio.play();
        if (p && typeof p.catch === "function") p.catch(function () { syncDeckUi(deck); });
      }
      updateChip();
    });

    els.tempo.addEventListener("input", function () {
      deck.tempo = parseFloat(els.tempo.value) || 0;
      els.tempoValue.textContent = fmtSigned(deck.tempo);
      if (!deck.dragging) audio.playbackRate = deckRate(deck);
    });

    els.gain.addEventListener("input", function () {
      deck.gainValue = parseFloat(els.gain.value) || 0;
      els.gainValue.textContent = String(Math.round(deck.gainValue));
      if (deck.nodes) deck.nodes.channelGain.gain.value = deck.gainValue / 100;
    });

    function wireEq(input, output, key, nodeKey) {
      input.addEventListener("input", function () {
        var v = parseFloat(input.value) || 0;
        deck.eq[key] = v;
        output.textContent = fmtDb(v);
        if (deck.nodes) deck.nodes[nodeKey].gain.value = v;
      });
    }
    wireEq(els.eqLow, els.eqLowValue, "low", "low");
    wireEq(els.eqMid, els.eqMidValue, "mid", "mid");
    wireEq(els.eqHigh, els.eqHighValue, "high", "high");

    /* Platter: drag to bend while playing, scrub while paused. */
    var drag = { startX: 0, startY: 0, lastX: 0 };
    els.platter.addEventListener("pointerdown", function (e) {
      deck.dragging = true;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.lastX = e.clientX;
      try { els.platter.setPointerCapture(e.pointerId); } catch (err) { /* older browser */ }
      e.preventDefault();
    });
    els.platter.addEventListener("pointermove", function (e) {
      if (!deck.dragging) return;
      var dx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      if (audio.paused) {
        if (isFinite(audio.duration) && audio.duration > 0) {
          try {
            audio.currentTime = clamp(audio.currentTime + dx * 0.02, 0, audio.duration);
          } catch (err) { /* not ready */ }
          updateTimeReadout(deck);
        }
      } else {
        var total = (e.clientX - drag.startX) + (e.clientY - drag.startY);
        var bend = clamp(1 + total / 300, 0.4, 2.2);
        audio.playbackRate = deckRate(deck) * bend;
      }
    });
    function endDrag(e) {
      if (!deck.dragging) return;
      deck.dragging = false;
      audio.playbackRate = deckRate(deck);
      if (e && e.pointerId !== undefined) {
        try { els.platter.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
      }
    }
    els.platter.addEventListener("pointerup", endDrag);
    els.platter.addEventListener("pointercancel", endDrag);

    els.platter.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      var step = e.shiftKey ? 5 : 1;
      var delta = e.key === "ArrowRight" ? step : -step;
      try {
        audio.currentTime = clamp(audio.currentTime + delta, 0, audio.duration);
      } catch (err) { /* not ready */ }
      updateTimeReadout(deck);
      e.preventDefault();
    });
  }

  decks.forEach(wireDeck);

  /* ------------------------------------------------------------------ */
  /* Mixer strip wiring                                                  */
  /* ------------------------------------------------------------------ */
  $("crossfader").addEventListener("input", function () {
    state.crossfader = parseFloat(this.value) || 0;
    applyCrossfader();
  });

  $("master-volume").addEventListener("input", function () {
    state.masterVolume = parseFloat(this.value) || 0;
    $("master-value").textContent = String(Math.round(state.masterVolume));
    if (masterGain) masterGain.gain.value = state.masterVolume / 100;
  });

  $("echo-on").addEventListener("change", function () {
    state.echoOn = this.checked;
    applyEcho();
    setStatus(state.echoOn ? "Echo on." : "Echo off.");
  });

  $("echo-mix").addEventListener("input", function () {
    state.echoMix = parseFloat(this.value) || 0;
    $("echo-mix-value").textContent = String(Math.round(state.echoMix)) + "%";
    applyEcho();
  });

  applyCrossfader();

  /* ------------------------------------------------------------------ */
  /* Demo loops: render, encode, load                                    */
  /* ------------------------------------------------------------------ */
  function loadDemo(deck, renderFn, displayName) {
    return renderFn()
      .then(function (buffer) {
        var blob = bufferToWavBlob(buffer);
        deck.demoUrl = URL.createObjectURL(blob);
        deck.els.audio.src = deck.demoUrl;
        deck.els.trackName.textContent = displayName + " · synthesized";
        updateTimeReadout(deck);
      })
      .catch(function () {
        setStatus("Deck " + deck.label + ": the demo loop could not be made in this browser. Load your own file instead.");
      });
  }

  /* Render the demo loops when the browser is idle (mono, 32 kHz: a fraction
     of the memory of stereo 44.1 kHz) so the page paints and responds first. */
  function startDemos() {
    Promise.all([
      loadDemo(deckById.a, renderHouseLoop, "House demo loop"),
      loadDemo(deckById.b, renderTechnoLoop, "Techno demo loop")
    ]).then(function () {
      setStatus("Demo loops ready. Press Play on a deck to start mixing.");
    });
  }
  if (window.OfflineAudioContext || window.webkitOfflineAudioContext) {
    if (window.requestIdleCallback) window.requestIdleCallback(startDemos, { timeout: 2500 });
    else window.setTimeout(startDemos, 300);
  } else {
    setStatus("This browser cannot make the demo loops. Load your own files on the decks instead.");
  }
})();
