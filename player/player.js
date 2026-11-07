(function () {
  "use strict";

  var STORAGE_KEY = "gsdj-setlist-v1";

  var SEED = [
    { title: "Opening groove", artist: "Example artist", bpm: 122, key: "8A", durationSec: 330, notes: "Fade in over the last bars of the intro track.", example: true },
    { title: "Peak-time driver", artist: "Example artist", bpm: 126, key: "8A", durationSec: 375, notes: "Biggest energy of the night — lights up.", example: true },
    { title: "Closing anthem", artist: "Example artist", bpm: 120, key: "5A", durationSec: 285, notes: "Let it play out in full, no mix out.", example: true }
  ];

  function makeId() {
    return "t-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function seedTracks() {
    return SEED.map(function (t) {
      return {
        id: makeId() + "-" + t.title.length,
        title: t.title,
        artist: t.artist,
        bpm: t.bpm,
        key: t.key,
        durationSec: t.durationSec,
        notes: t.notes,
        example: true
      };
    });
  }

  function loadTracks() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      /* storage unavailable or corrupt — fall through to seed */
    }
    return seedTracks();
  }

  var tracks = loadTracks();
  var editingId = null;

  var listEl = document.getElementById("track-list");
  var emptyEl = document.getElementById("empty-state");
  var hintBar = document.getElementById("hint-bar");
  var removeExamplesBtn = document.getElementById("remove-examples");
  var statusEl = document.getElementById("status");
  var form = document.getElementById("add-form");
  var formError = document.getElementById("form-error");
  var statTracks = document.getElementById("stat-tracks");
  var statRuntime = document.getElementById("stat-runtime");
  var statBpm = document.getElementById("stat-bpm");

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch (err) {
      /* storage unavailable — list still works for this session */
    }
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function formatDuration(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function formatTotal(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    if (s < 3600) return formatDuration(s);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    return h + ":" + (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }

  function parseDuration(str) {
    var m = /^(\d{1,3}):([0-5]\d)$/.exec(String(str || "").trim());
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }

  function totalSeconds() {
    return tracks.reduce(function (sum, t) { return sum + (t.durationSec || 0); }, 0);
  }

  function render() {
    var total = totalSeconds();
    var totalFmt = formatTotal(total);
    var count = tracks.length;

    if (statTracks) statTracks.textContent = String(count);
    if (statRuntime) statRuntime.textContent = totalFmt;
    if (statBpm) {
      var withBpm = tracks.filter(function (t) { return typeof t.bpm === "number" && !isNaN(t.bpm); });
      if (withBpm.length) {
        var avg = withBpm.reduce(function (s, t) { return s + t.bpm; }, 0) / withBpm.length;
        statBpm.textContent = String(Math.round(avg));
      } else {
        statBpm.textContent = "—";
      }
    }

    if (window.GSDJ && typeof window.GSDJ.setChip === "function") {
      window.GSDJ.setChip({ text: "★ " + count + (count === 1 ? " track" : " tracks") + " · " + totalFmt });
    }

    var hasExamples = tracks.some(function (t) { return t.example; });
    if (hintBar) hintBar.hidden = !hasExamples;
    if (emptyEl) emptyEl.hidden = count !== 0;

    if (!listEl) return;
    listEl.innerHTML = "";

    tracks.forEach(function (track, idx) {
      var li = document.createElement("li");
      li.className = "track-row";
      li.setAttribute("data-id", track.id);

      var pos = document.createElement("span");
      pos.className = "track-pos tnum";
      pos.textContent = String(idx + 1);
      pos.setAttribute("aria-hidden", "true");
      li.appendChild(pos);

      var order = document.createElement("div");
      order.className = "track-order";

      var handle = document.createElement("button");
      handle.type = "button";
      handle.className = "drag-handle";
      handle.textContent = "⠿";
      handle.setAttribute("aria-label", "Reorder " + track.title);
      handle.setAttribute("data-drag-id", track.id);
      order.appendChild(handle);

      var upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "move-btn";
      upBtn.textContent = "↑";
      upBtn.setAttribute("aria-label", "Move " + track.title + " up");
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", function () { moveTrack(track.id, -1); });
      order.appendChild(upBtn);

      var downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "move-btn";
      downBtn.textContent = "↓";
      downBtn.setAttribute("aria-label", "Move " + track.title + " down");
      downBtn.disabled = idx === tracks.length - 1;
      downBtn.addEventListener("click", function () { moveTrack(track.id, 1); });
      order.appendChild(downBtn);

      li.appendChild(order);

      var main = document.createElement("div");
      main.className = "track-main";

      var titleLine = document.createElement("div");
      titleLine.className = "track-title-line";
      var strong = document.createElement("strong");
      strong.className = "track-title";
      strong.textContent = track.title;
      titleLine.appendChild(strong);
      if (track.artist) {
        var artist = document.createElement("span");
        artist.className = "track-artist";
        artist.textContent = track.artist;
        titleLine.appendChild(artist);
      }
      if (track.example) {
        var badge = document.createElement("span");
        badge.className = "badge-example";
        badge.textContent = "Example";
        titleLine.appendChild(badge);
      }
      main.appendChild(titleLine);

      var meta = document.createElement("div");
      meta.className = "meta-row";
      if (typeof track.bpm === "number" && track.bpm) {
        var bpmChip = document.createElement("span");
        bpmChip.className = "meta-chip tnum";
        bpmChip.textContent = track.bpm + " BPM";
        meta.appendChild(bpmChip);
      }
      if (track.key) {
        var keyChip = document.createElement("span");
        keyChip.className = "meta-chip";
        keyChip.textContent = "Key " + track.key;
        meta.appendChild(keyChip);
      }
      var durChip = document.createElement("span");
      durChip.className = "meta-chip tnum";
      durChip.textContent = formatDuration(track.durationSec);
      meta.appendChild(durChip);
      main.appendChild(meta);

      if (track.notes && editingId !== track.id) {
        var notesP = document.createElement("p");
        notesP.className = "track-notes";
        notesP.textContent = track.notes;
        main.appendChild(notesP);
      }

      if (editingId === track.id) {
        var editor = document.createElement("div");
        editor.className = "note-editor";
        var ta = document.createElement("textarea");
        ta.value = track.notes || "";
        ta.setAttribute("aria-label", "Note for " + track.title);
        ta.id = "note-edit-" + track.id;
        editor.appendChild(ta);
        var actions = document.createElement("div");
        actions.className = "note-editor-actions";
        var saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn";
        saveBtn.textContent = "Save note";
        saveBtn.addEventListener("click", function () {
          track.notes = ta.value.trim();
          editingId = null;
          save();
          render();
          setStatus("Note saved for '" + track.title + "'.");
        });
        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn--ghost";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", function () {
          editingId = null;
          render();
        });
        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        editor.appendChild(actions);
        main.appendChild(editor);
      }

      var rowActions = document.createElement("div");
      rowActions.className = "row-actions";
      if (editingId !== track.id) {
        var editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn--ghost";
        editBtn.textContent = "Edit note";
        editBtn.addEventListener("click", function () {
          editingId = track.id;
          render();
          var el = document.getElementById("note-edit-" + track.id);
          if (el) el.focus();
        });
        rowActions.appendChild(editBtn);
      }
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn--ghost";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function () {
        var title = track.title;
        tracks = tracks.filter(function (t) { return t.id !== track.id; });
        if (editingId === track.id) editingId = null;
        save();
        render();
        setStatus("Deleted '" + title + "'.");
      });
      rowActions.appendChild(delBtn);
      main.appendChild(rowActions);

      li.appendChild(main);
      listEl.appendChild(li);
    });

    attachDragHandlers();
  }

  function moveTrack(id, delta) {
    var idx = tracks.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return;
    var next = idx + delta;
    if (next < 0 || next >= tracks.length) return;
    var tmp = tracks[idx];
    tracks[idx] = tracks[next];
    tracks[next] = tmp;
    save();
    render();
    setStatus("Moved '" + tmp.title + "'.");
  }

  /* Pointer drag on the handle */
  function attachDragHandlers() {
    if (!listEl) return;
    var handles = listEl.querySelectorAll(".drag-handle");
    handles.forEach(function (handle) {
      handle.addEventListener("pointerdown", onDragStart);
    });
  }

  function onDragStart(event) {
    if (event.button != null && event.button !== 0) return;
    var handle = event.currentTarget;
    var row = handle.closest(".track-row");
    if (!row || !listEl) return;
    event.preventDefault();
    try { handle.setPointerCapture(event.pointerId); } catch (err) {}

    var startY = event.clientY;
    var draggingId = row.getAttribute("data-id");
    row.classList.add("is-dragging");
    row.style.position = "relative";
    row.style.zIndex = "5";

    function onMove(ev) {
      var dy = ev.clientY - startY;
      row.style.transform = "translateY(" + dy + "px)";
      var rows = Array.prototype.slice.call(listEl.querySelectorAll(".track-row:not(.is-dragging)"));
      var rowRect = row.getBoundingClientRect();
      var mid = rowRect.top + rowRect.height / 2;
      var target = null;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].getBoundingClientRect();
        var rMid = r.top + r.height / 2;
        if (mid < rMid) { target = rows[i]; break; }
      }
      var beforeTop = row.offsetTop;
      var beforeIndex = Array.prototype.indexOf.call(listEl.children, row);
      if (target) {
        if (target !== row.nextSibling) listEl.insertBefore(row, target);
      } else {
        if (listEl.lastChild !== row) listEl.appendChild(row);
      }
      var afterIndex = Array.prototype.indexOf.call(listEl.children, row);
      if (afterIndex !== beforeIndex) {
        var afterTop = row.offsetTop;
        startY += (afterTop - beforeTop);
        row.style.transform = "translateY(" + (ev.clientY - startY) + "px)";
      }
    }

    function onUp(ev) {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      row.classList.remove("is-dragging");
      row.style.transform = "";
      row.style.position = "";
      row.style.zIndex = "";
      var orderedIds = Array.prototype.map.call(
        listEl.querySelectorAll(".track-row"),
        function (el) { return el.getAttribute("data-id"); }
      );
      var reordered = [];
      orderedIds.forEach(function (id) {
        var found = tracks.find(function (t) { return t.id === id; });
        if (found) reordered.push(found);
      });
      // Include any missing (safety)
      tracks.forEach(function (t) {
        if (reordered.indexOf(t) === -1) reordered.push(t);
      });
      tracks = reordered;
      void draggingId;
      save();
      render();
      setStatus("Setlist reordered.");
    }

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  function showError(msg) {
    if (!formError) return;
    if (msg) {
      formError.textContent = msg;
      formError.hidden = false;
    } else {
      formError.textContent = "";
      formError.hidden = true;
    }
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      showError("");
      var titleEl = document.getElementById("f-title");
      var artistEl = document.getElementById("f-artist");
      var bpmEl = document.getElementById("f-bpm");
      var keyEl = document.getElementById("f-key");
      var durationEl = document.getElementById("f-duration");
      var notesEl = document.getElementById("f-notes");

      var title = titleEl ? titleEl.value.trim() : "";
      var artist = artistEl ? artistEl.value.trim() : "";
      var bpmRaw = bpmEl ? bpmEl.value.trim() : "";
      var keyVal = keyEl ? keyEl.value.trim() : "";
      var durationRaw = durationEl ? durationEl.value.trim() : "";
      var notes = notesEl ? notesEl.value.trim() : "";

      if (!title) {
        showError("Title is required. Add a title for the track.");
        if (titleEl) titleEl.focus();
        return;
      }
      if (!durationRaw) {
        showError("Duration is required. Use minutes:seconds, like 5:30.");
        if (durationEl) durationEl.focus();
        return;
      }
      if (!/^\d{1,3}:[0-5]\d$/.test(durationRaw)) {
        showError("Duration needs minutes:seconds, like 5:30.");
        if (durationEl) durationEl.focus();
        return;
      }
      var bpm = null;
      if (bpmRaw !== "") {
        var parsedBpm = Number(bpmRaw);
        if (!Number.isFinite(parsedBpm) || parsedBpm < 40 || parsedBpm > 240) {
          showError("BPM needs a number between 40 and 240, or leave it blank.");
          if (bpmEl) bpmEl.focus();
          return;
        }
        bpm = Math.round(parsedBpm);
      }

      var durationSec = parseDuration(durationRaw);
      tracks.push({
        id: makeId(),
        title: title,
        artist: artist,
        bpm: bpm,
        key: keyVal,
        durationSec: durationSec,
        notes: notes,
        example: false
      });
      save();
      render();
      form.reset();
      setStatus("Added '" + title + "'.");
      if (titleEl) titleEl.focus();
    });
  }

  if (removeExamplesBtn) {
    removeExamplesBtn.addEventListener("click", function () {
      tracks = tracks.filter(function (t) { return !t.example; });
      save();
      render();
      setStatus("Examples removed.");
    });
  }

  function download(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  var exportTextBtn = document.getElementById("export-text");
  if (exportTextBtn) {
    exportTextBtn.addEventListener("click", function () {
      var total = totalSeconds();
      var lines = [];
      lines.push("GoldenSunDJ setlist");
      lines.push("Total runtime: " + formatTotal(total) + " · " + tracks.length + (tracks.length === 1 ? " track" : " tracks"));
      lines.push("");
      tracks.forEach(function (t, i) {
        var parts = [];
        parts.push(formatDuration(t.durationSec));
        if (typeof t.bpm === "number" && t.bpm) parts.push(t.bpm + " BPM");
        if (t.key) parts.push("Key " + t.key);
        var headline = (i + 1) + ". " + t.title;
        if (t.artist) headline += " — " + t.artist;
        headline += " (" + parts.join(", ") + ")";
        lines.push(headline);
        if (t.notes) lines.push("   " + t.notes);
      });
      download("setlist.txt", lines.join("\n") + "\n", "text/plain;charset=utf-8");
      setStatus("Exported setlist as text.");
    });
  }

  var exportJsonBtn = document.getElementById("export-json");
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", function () {
      var payload = {
        exportedFrom: "GoldenSunDJ Player",
        totalSeconds: totalSeconds(),
        tracks: tracks
      };
      download("setlist.json", JSON.stringify(payload, null, 2) + "\n", "application/json;charset=utf-8");
      setStatus("Exported setlist as JSON.");
    });
  }

  var printBtn = document.getElementById("print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", function () { window.print(); });
  }

  // Initial save of seed if nothing was stored, so reload keeps the same ids
  try {
    if (!window.localStorage.getItem(STORAGE_KEY)) save();
  } catch (err) {}

  render();
})();
