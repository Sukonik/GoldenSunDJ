/* GoldenSunDJ — Notes. Everything stays in this browser (localStorage). */
(function () {
  "use strict";
  var KEY = "gsdj-notes", DRAFT = "gsdj-note-draft";
  var TYPES = { lyrics: "Lyrics", idea: "Idea", suno: "Suno prompt", setlist: "Setlist", gig: "Gig" };
  var KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  var $ = function (s) { return document.querySelector(s); };
  var state = { id: null, type: "lyrics", filter: "all", confirm: null };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function load() { try { var a = JSON.parse(store(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function persist(list) { store(KEY, JSON.stringify(list)); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function say(t) { $("#n-status").textContent = t; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function current() {
    return { id: state.id, type: state.type, title: $("#n-title").value.trim(), body: $("#n-body").value, bpm: $("#n-bpm").value, key: $("#n-key").value, tags: $("#n-tags").value.trim() };
  }
  function fill(n) {
    state.id = n.id || null; setType(n.type || "lyrics");
    $("#n-title").value = n.title || ""; $("#n-body").value = n.body || ""; $("#n-bpm").value = n.bpm || ""; $("#n-key").value = n.key || ""; $("#n-tags").value = n.tags || "";
    counts();
  }
  function setType(t) {
    state.type = TYPES[t] ? t : "lyrics";
    document.querySelectorAll("#types [data-type]").forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-type") === state.type ? "true" : "false"); });
  }
  function asText(n) {
    var head = (n.title || "Untitled") + "\n" + TYPES[n.type] + (n.bpm ? " · " + n.bpm + " BPM" : "") + (n.key ? " · Key " + n.key : "") + (n.tags ? " · " + n.tags : "");
    return head + "\n\n" + n.body;
  }
  function counts() {
    var b = $("#n-body").value, words = (b.match(/\S+/g) || []).length, lines = b ? b.split("\n").length : 0;
    $("#counts").textContent = lines + " lines · " + words + " words";
  }
  function saveDraft() { store(DRAFT, JSON.stringify(current())); }

  function copyText(text, okMsg) {
    function done() { say(okMsg || "Copied."); }
    function fallback() {
      var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) { say("Copy failed. Select the text and copy it manually."); }
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function slug(s) { return (s || "note").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "note"; }

  function save() {
    var n = current();
    if (!n.title && !n.body.trim()) { say("Nothing to save yet."); return; }
    if (!n.title) n.title = (n.body.trim().split("\n")[0] || "Untitled").slice(0, 60);
    var list = load(), i;
    n.updated = Date.now();
    if (n.id) { for (i = 0; i < list.length; i++) if (list[i].id === n.id) { list[i] = n; break; } if (i === list.length) list.unshift(n); }
    else { n.id = uid(); list.unshift(n); }
    state.id = n.id; $("#n-title").value = n.title; persist(list); store(DRAFT, null); render(); say("Saved on this device.");
  }
  function insert(text) {
    var ta = $("#n-body"), s = ta.selectionStart || 0, e = ta.selectionEnd || 0, v = ta.value;
    var pre = v.slice(0, s), post = v.slice(e);
    var lead = pre && !/\n$/.test(pre) ? "\n" : "";
    ta.value = pre + lead + text + "\n" + post;
    var pos = (pre + lead + text + "\n").length; ta.focus(); ta.setSelectionRange(pos, pos); counts(); saveDraft();
  }
  function insertWeather() {
    var p; try { p = JSON.parse(store("gsdj-place")); } catch (e) {}
    p = p && isFinite(p.lat) && isFinite(p.lon) ? p : { name: "Long Beach, NY", lat: 40.5884, lon: -73.6579 };
    say("Getting the weather…");
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon + "&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph")
      .then(function (r) { return r.json(); }).then(function (j) {
        var c = j.current, d = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        insert("[" + d + " · " + p.name + " · " + Math.round(c.temperature_2m) + "°F · wind " + Math.round(c.wind_speed_10m) + " mph]"); say("Weather added.");
      }).catch(function () { say("Could not get the weather right now."); });
  }
  function sunoTemplate() {
    var bpm = $("#n-bpm").value, key = $("#n-key").value;
    insert("STYLE: \nMOOD: \nTEMPO: " + (bpm || "___") + " BPM · KEY: " + (key || "___") + "\nINSTRUMENTS: \nVOCALS: \n\nLYRICS:\n[Verse]\n\n[Chorus]\n");
  }

  /* ---- saved list ---- */
  function render() {
    var list = load(), q = $("#sv-q").value.trim().toLowerCase();
    $("#sv-count").textContent = list.length ? "(" + list.length + ")" : "";
    var f = $("#filters"); f.textContent = "";
    ["all"].concat(Object.keys(TYPES)).forEach(function (t) {
      var b = el("button", "chip", t === "all" ? "All" : TYPES[t]); b.type = "button"; b.setAttribute("aria-pressed", state.filter === t ? "true" : "false");
      b.addEventListener("click", function () { state.filter = t; render(); }); f.appendChild(b);
    });
    var host = $("#note-list"); host.textContent = "";
    var shown = list.filter(function (n) {
      if (state.filter !== "all" && n.type !== state.filter) return false;
      return !q || (n.title + " " + n.body + " " + (n.tags || "")).toLowerCase().indexOf(q) !== -1;
    });
    if (!shown.length) { host.appendChild(el("li", "empty", list.length ? "No notes match." : "No saved notes yet. Write something and press Save.")); return; }
    shown.forEach(function (n) {
      var li = el("li", "note" + (n.id === state.id ? " is-open" : ""));
      var top = el("div", "note-top"); top.appendChild(el("strong", "note-title", n.title || "Untitled")); top.appendChild(el("span", "badge", TYPES[n.type] || "Note")); li.appendChild(top);
      li.appendChild(el("p", "note-snip", (n.body || "").replace(/\s+/g, " ").slice(0, 110)));
      li.appendChild(el("p", "note-date", new Date(n.updated || Date.now()).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + (n.bpm ? " · " + n.bpm + " BPM" : "") + (n.key ? " · " + n.key : "")));
      var row = el("div", "note-actions");
      var open = el("button", "chip", "Open"); open.type = "button"; open.addEventListener("click", function () { fill(n); render(); say("Opened “" + (n.title || "Untitled") + "”."); window.scrollTo({ top: 0, behavior: "smooth" }); });
      var cp = el("button", "chip", "Copy"); cp.type = "button"; cp.addEventListener("click", function () { copyText(asText(n), "Copied “" + (n.title || "Untitled") + "”."); });
      var del = el("button", "chip chip--danger", state.confirm === n.id ? "Tap again to delete" : "Delete"); del.type = "button";
      del.addEventListener("click", function () {
        if (state.confirm !== n.id) { state.confirm = n.id; render(); return; }
        persist(load().filter(function (x) { return x.id !== n.id; })); state.confirm = null; if (state.id === n.id) state.id = null; render(); say("Deleted.");
      });
      row.appendChild(open); row.appendChild(cp); row.appendChild(del); li.appendChild(row); host.appendChild(li);
    });
  }

  function init() {
    KEYS.forEach(function (k) { var o = el("option", "", k); o.value = k; var m = el("option", "", k + "m"); m.value = k + "m"; $("#n-key").appendChild(o); $("#n-key").appendChild(m); });
    document.querySelectorAll("#types [data-type]").forEach(function (b) { b.addEventListener("click", function () { setType(b.getAttribute("data-type")); saveDraft(); }); });
    document.querySelectorAll("[data-ins]").forEach(function (b) { b.addEventListener("click", function () { insert(b.getAttribute("data-ins")); }); });
    $("#ins-suno").addEventListener("click", sunoTemplate); $("#ins-wx").addEventListener("click", insertWeather);
    ["#n-title", "#n-body", "#n-bpm", "#n-key", "#n-tags"].forEach(function (s) { $(s).addEventListener("input", function () { counts(); saveDraft(); }); });
    $("#save").addEventListener("click", save);
    $("#copy").addEventListener("click", function () { var n = current(); if (!n.body && !n.title) { say("Nothing to copy yet."); return; } copyText(asText(n)); });
    $("#download").addEventListener("click", function () { var n = current(); download(slug(n.title) + ".txt", asText(n)); say("Downloaded."); });
    $("#new").addEventListener("click", function () { fill({}); store(DRAFT, null); render(); say("New note."); $("#n-title").focus(); });
    $("#sv-q").addEventListener("input", render);
    $("#copy-all").addEventListener("click", function () { var l = load(); if (!l.length) { say("No saved notes."); return; } copyText(l.map(asText).join("\n\n---\n\n"), "Copied all notes."); });
    $("#dl-all").addEventListener("click", function () { var l = load(); if (!l.length) { say("No saved notes."); return; } download("goldensundj-notes.md", l.map(function (n) { return "## " + (n.title || "Untitled") + "\n\n" + asText(n); }).join("\n\n---\n\n"), "text/markdown"); say("Downloaded."); });
    window.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } });
    var d; try { d = JSON.parse(store(DRAFT)); } catch (e) {}
    if (d && (d.title || d.body)) { fill(d); say("Restored your draft."); } else fill({});
    render();
  }
  init();
})();
