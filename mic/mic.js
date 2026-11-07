/* GoldenSunMic — mic recorder. Vanilla, no dependencies.
   Records with MediaRecorder, shows a live RMS level meter via an
   AnalyserNode, keeps takes in memory as blob URLs, and exports WAV
   by decoding the take and encoding 16-bit PCM in this file. */
(function () {
  "use strict";

  var recordBtn = document.getElementById("record-btn");
  var statusEl = document.getElementById("mic-status");
  var timerEl = document.getElementById("mic-timer");
  var levelFill = document.getElementById("level-fill");
  var takesList = document.getElementById("takes-list");
  var takesEmpty = document.getElementById("takes-empty");

  if (!recordBtn || !statusEl || !timerEl || !levelFill || !takesList) return;

  var MIME_CANDIDATES = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    ""
  ];

  var stream = null;
  var recorder = null;
  var chunks = [];
  var audioCtx = null;
  var analyser = null;
  var sourceNode = null;
  var rafId = null;
  var timerId = null;
  var startedAt = 0;
  var lastShownSecond = -1;
  var isRecording = false;
  var takeCount = 0;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setChip(text, live) {
    if (window.GSDJ && typeof window.GSDJ.setChip === "function") {
      window.GSDJ.setChip({ text: text, live: live });
    }
  }

  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds));
    var minutes = Math.floor(s / 60);
    var seconds = s % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function formatSize(bytes) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  function extensionFor(mimeType) {
    if (!mimeType) return "audio";
    if (mimeType.indexOf("mp4") !== -1) return "mp4";
    if (mimeType.indexOf("webm") !== -1) return "webm";
    if (mimeType.indexOf("ogg") !== -1) return "ogg";
    var part = mimeType.split("/")[1];
    if (part) return part.split(";")[0];
    return "audio";
  }

  function pickMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    for (var i = 0; i < MIME_CANDIDATES.length; i++) {
      var candidate = MIME_CANDIDATES[i];
      if (!candidate) return "";
      try {
        if (MediaRecorder.isTypeSupported(candidate)) return candidate;
      } catch (err) {
        /* keep trying the next candidate */
      }
    }
    return "";
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function updateTimer() {
    var elapsed = (Date.now() - startedAt) / 1000;
    var shown = Math.floor(elapsed);
    timerEl.textContent = formatTime(elapsed);
    if (shown !== lastShownSecond) {
      lastShownSecond = shown;
      setChip("● REC " + formatTime(elapsed), true);
    }
  }

  function drawLevel() {
    if (!isRecording || !analyser) return;
    var data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
      var v = (data[i] - 128) / 128;
      sum += v * v;
    }
    var rms = Math.sqrt(sum / data.length);
    levelFill.style.width = Math.min(100, rms * 100) + "%";
    levelFill.classList.toggle("is-clipping", rms > 0.9);
    rafId = requestAnimationFrame(drawLevel);
  }

  function stopStream() {
    if (stream) {
      var tracks = stream.getTracks();
      for (var i = 0; i < tracks.length; i++) tracks[i].stop();
      stream = null;
    }
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (err) { /* already gone */ }
      sourceNode = null;
    }
    analyser = null;
  }

  function resetRecorderUi() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    levelFill.style.width = "0%";
    levelFill.classList.remove("is-clipping");
    timerEl.textContent = "0:00";
    lastShownSecond = -1;
    recordBtn.textContent = "Record";
    recordBtn.setAttribute("aria-pressed", "false");
    recordBtn.classList.remove("is-recording");
  }

  function handleMicError(error) {
    var name = error && error.name ? error.name : "Error";
    if (name === "NotAllowedError") {
      setStatus("Microphone access is blocked. Allow the microphone in your browser's site settings for this page, then press Record again.");
    } else if (name === "NotFoundError") {
      setStatus("No microphone was found on this device. Connect one, then press Record again.");
    } else {
      setStatus("The microphone could not be started (" + name + "). Check that no other app is using it, then try again.");
    }
  }

  function triggerDownload(url, filename) {
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* -- WAV encoding: decode result -> 16-bit PCM RIFF file ------------- */
  function writeText(view, offset, text) {
    for (var i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  }

  function encodeWav(buffer) {
    var channels = Math.min(2, buffer.numberOfChannels);
    var sampleRate = buffer.sampleRate;
    var frames = buffer.length;
    var bytesPerSample = 2;
    var dataSize = frames * channels * bytesPerSample;
    var out = new ArrayBuffer(44 + dataSize);
    var view = new DataView(out);
    writeText(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeText(view, 8, "WAVE");
    writeText(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeText(view, 36, "data");
    view.setUint32(40, dataSize, true);
    var channelData = [];
    for (var c = 0; c < channels; c++) channelData.push(buffer.getChannelData(c));
    var offset = 44;
    for (var i = 0; i < frames; i++) {
      for (var ch = 0; ch < channels; ch++) {
        var sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([out], { type: "audio/wav" });
  }

  function downloadWav(take) {
    var ctx = ensureAudioContext();
    if (!ctx) {
      setStatus("WAV conversion is not available for this take in this browser. Use Download original instead — it keeps the full recording.");
      return;
    }
    take.blob.arrayBuffer().then(function (raw) {
      return ctx.decodeAudioData(raw);
    }).then(function (decoded) {
      var wavBlob = encodeWav(decoded);
      var url = URL.createObjectURL(wavBlob);
      triggerDownload(url, "take-" + take.number + ".wav");
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      setStatus(take.name + " downloaded as WAV.");
    }).catch(function () {
      setStatus("WAV conversion is not available for this take in this browser. Use Download original instead — it keeps the full recording.");
    });
  }

  function updateEmptyState() {
    if (!takesEmpty) return;
    takesEmpty.hidden = takesList.children.length > 0;
  }

  function appendTake(blob, mimeType) {
    takeCount += 1;
    var number = takeCount;
    var ext = extensionFor(mimeType || blob.type);
    var take = {
      number: number,
      name: "Take " + number,
      blob: blob,
      url: URL.createObjectURL(blob),
      ext: ext
    };

    var card = document.createElement("article");
    card.className = "take-card";

    var head = document.createElement("div");
    head.className = "take-head";
    var title = document.createElement("h3");
    title.textContent = take.name;
    var timeMeta = document.createElement("span");
    timeMeta.className = "take-meta";
    timeMeta.textContent = "Recorded at " + new Date().toLocaleTimeString([], {
      hour: "numeric", minute: "2-digit", second: "2-digit"
    });
    var durationMeta = document.createElement("span");
    durationMeta.className = "take-meta tnum";
    durationMeta.textContent = "0:00";
    var sizeMeta = document.createElement("span");
    sizeMeta.className = "take-meta tnum";
    sizeMeta.textContent = formatSize(blob.size);
    head.appendChild(title);
    head.appendChild(timeMeta);
    head.appendChild(durationMeta);
    head.appendChild(sizeMeta);

    var player = document.createElement("audio");
    player.controls = true;
    player.src = take.url;
    player.preload = "metadata";
    player.addEventListener("loadedmetadata", function () {
      if (isFinite(player.duration)) {
        durationMeta.textContent = formatTime(player.duration);
      }
    });

    var actions = document.createElement("div");
    actions.className = "take-actions";

    var wavBtn = document.createElement("button");
    wavBtn.type = "button";
    wavBtn.className = "btn";
    wavBtn.textContent = "Download WAV";
    wavBtn.addEventListener("click", function () { downloadWav(take); });

    var origBtn = document.createElement("button");
    origBtn.type = "button";
    origBtn.className = "btn btn--ghost";
    origBtn.textContent = "Download ." + ext;
    origBtn.addEventListener("click", function () {
      triggerDownload(take.url, "take-" + number + "." + ext);
    });

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--ghost";
    deleteBtn.textContent = "Delete take";
    deleteBtn.addEventListener("click", function () {
      URL.revokeObjectURL(take.url);
      card.remove();
      updateEmptyState();
      setStatus(take.name + " deleted. Press Record to make another one.");
    });

    actions.appendChild(wavBtn);
    actions.appendChild(origBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(head);
    card.appendChild(player);
    card.appendChild(actions);
    takesList.appendChild(card);
    updateEmptyState();
    return take;
  }

  function startRecording() {
    setStatus("Asking for microphone access. Allow it in your browser to start recording.");
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (micStream) {
      stream = micStream;
      var ctx = ensureAudioContext();
      if (ctx) {
        sourceNode = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        sourceNode.connect(analyser);
      }
      var mimeType = pickMimeType();
      chunks = [];
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType: mimeType }) : new MediaRecorder(stream);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }
      recorder.addEventListener("dataavailable", function (event) {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("stop", function () {
        var type = recorder.mimeType || mimeType || (chunks[0] && chunks[0].type) || "";
        var blob = new Blob(chunks, { type: type });
        chunks = [];
        recorder = null;
        isRecording = false;
        stopStream();
        resetRecorderUi();
        if (blob.size > 0) {
          appendTake(blob, type);
          setChip("✦ Take saved", false);
          setStatus("Take saved. Press Record to make another one.");
        } else {
          setChip("✦ Mic ready", false);
          setStatus("That recording was empty. Press Record and try again.");
        }
      });
      recorder.start();
      isRecording = true;
      startedAt = Date.now();
      lastShownSecond = -1;
      timerEl.textContent = "0:00";
      recordBtn.textContent = "Stop";
      recordBtn.setAttribute("aria-pressed", "true");
      recordBtn.classList.add("is-recording");
      setChip("● REC 0:00", true);
      setStatus("Recording. Press Stop when you are done.");
      timerId = setInterval(updateTimer, 250);
      if (analyser) rafId = requestAnimationFrame(drawLevel);
    }).catch(function (error) {
      stopStream();
      handleMicError(error);
    });
  }

  function stopRecording() {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function" ||
      typeof MediaRecorder === "undefined") {
    setStatus("Recording is not available here. It needs a secure (HTTPS) page in a current browser.");
    recordBtn.disabled = true;
    return;
  }

  recordBtn.addEventListener("click", function () {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  updateEmptyState();
})();
