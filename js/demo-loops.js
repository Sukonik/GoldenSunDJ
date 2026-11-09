/* GoldenSunDJ — shared demo loops (synthesized with OfflineAudioContext, mono 32 kHz)
   used by Mixer and Controller. Exposes window.GSDJDemo. */
(function () {
  "use strict";
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
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


  window.GSDJDemo = { renderHouseLoop: renderHouseLoop, renderTechnoLoop: renderTechnoLoop, bufferToWavBlob: bufferToWavBlob };
})();
