/* GoldenSunDJ Controller: the deck menu (tap the A or B tag).
   Library: eight full-length genre tracks (about 3 minutes each, built in your browser).
   Load: a file from your device.   Link: search and stream from Audius (free, no key).
   Tracks from Audius belong to their artists; each result links back to Audius. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$;
    var API = "https://api.audius.co/v1", APP = "GoldenSunDJ";
    var menu = document.createElement("div"); menu.className = "dm-scrim"; menu.hidden = true;
    menu.innerHTML =
      '<div class="dm" role="dialog" aria-modal="true" aria-labelledby="dm-title">' +
      '<header class="dm-head"><h2 id="dm-title">Deck A</h2><button type="button" class="dx-close" id="dm-close" aria-label="Close">✕</button></header>' +
      '<div class="dm-tabs" role="tablist" aria-label="Where to get a track"><button type="button" role="tab" data-tab="library" aria-selected="true">Library</button><button type="button" role="tab" data-tab="load" aria-selected="false">Load</button><button type="button" role="tab" data-tab="link" aria-selected="false">Link</button></div>' +
      '<section class="dm-pane" data-pane="library"><p class="dm-note">Full-length tracks in eight NAKO GOLD styles, about 3 minutes each. They are built on your device, so the first tap takes a few seconds.</p><ul class="lib-list" id="lib-list"></ul><div class="lib-progress" id="lib-progress" hidden><div class="bar"><i id="lib-bar"></i></div><p id="lib-msg" role="status"></p></div></section>' +
      '<section class="dm-pane" data-pane="load" hidden><p class="dm-note">Pick an audio file from this device. It plays on the deck and never leaves your device.</p><label class="btn dm-file">Choose a file<input type="file" accept="audio/*" id="dm-file" class="visually-hidden"></label></section>' +
      '<section class="dm-pane" data-pane="link" hidden><form class="dm-search" id="dm-search" role="search"><label class="visually-hidden" for="dm-q">Search music</label><input id="dm-q" type="search" placeholder="Search songs, artists, styles" autocomplete="off" enterkeyhint="search"><button class="btn" type="submit">Search</button></form>' +
      '<div class="dm-chips" id="dm-chips" role="group" aria-label="Recommended styles"></div><p class="dm-note" id="dm-status" role="status"></p><ul class="res-list" id="res-list"></ul><p class="dm-credit">Free music from <a href="https://audius.co" target="_blank" rel="noopener">Audius</a>. Tracks belong to their artists, so please support them.</p></section>' +
      '</div>';
    document.body.appendChild(menu);
    var dm = menu.querySelector(".dm"), title = $("dm-title"), cur = null, opener = null, token = 0, building = false;

    function tab(name) {
      menu.querySelectorAll(".dm-tabs [role=tab]").forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-tab") === name ? "true" : "false"); });
      menu.querySelectorAll(".dm-pane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== name; });
      if (name === "link" && !$("res-list").children.length) recommend(0);
    }
    menu.querySelectorAll(".dm-tabs [role=tab]").forEach(function (t) { t.addEventListener("click", function () { tab(t.getAttribute("data-tab")); }); });
    function open(d, from) { cur = d; opener = from; title.textContent = "Deck " + d.id.toUpperCase(); menu.hidden = false; tab("library"); $("dm-close").focus(); }
    function close() { token++; building = false; setBusy(false); menu.hidden = true; if (opener) opener.focus(); }
    $("dm-close").addEventListener("click", close);
    menu.addEventListener("click", function (e) { if (e.target === menu) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) close(); });
    C.decks.forEach(function (d) { var tag = $("tag-" + d.id); tag.addEventListener("click", function () { open(d, tag); }); d.audio.addEventListener("error", function () { if (d.audio.src && d.src && d.src.kind === "audius") C.say("Could not play that stream. Try another track."); }); });

    /* ---------- Library ---------- */
    var list = $("lib-list");
    function mmss(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    window.GSDJGenres.list().forEach(function (g) {
      var li = document.createElement("li"); li.innerHTML = '<button type="button" class="lib-item" data-id="' + g.id + '"><span class="lib-name">' + g.name + '<small>' + g.sub + '</small></span><span class="lib-meta">' + g.bpm + ' BPM · ' + g.key + ' · ' + mmss(g.seconds) + '</span><span class="lib-go">Load</span></button>';
      list.appendChild(li);
    });
    function setBusy(b) { list.querySelectorAll("button").forEach(function (x) { x.disabled = b; }); $("lib-progress").hidden = !b; }
    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".lib-item"); if (!btn || building) return; var id = btn.getAttribute("data-id"), d = cur, my = ++token;
      building = true; setBusy(true); $("lib-bar").style.width = "4%"; $("lib-msg").textContent = "Building your track…";
      var names = { intro: "Intro", build: "Build up", build2: "Build up", drop: "Drop", brk: "Break", "break": "Breakdown", outro: "Outro" };
      window.GSDJGenres.render(id, function (p, sec) { if (my !== token) return; $("lib-bar").style.width = Math.max(4, Math.round(p * 100)) + "%"; $("lib-msg").textContent = "Building: " + (names[sec] || "Finishing") + "…"; })
        .then(function (r) {
          if (my !== token) return; building = false; setBusy(false);
          C.loadSource(d, URL.createObjectURL(r.blob), { blob: true, pk: r.peaks, bpm: r.bpm, title: r.title, meta: { kind: "genre", id: id } });
          C.say("Loaded " + r.title + " on deck " + d.id.toUpperCase() + "."); menu.hidden = true; if (opener) opener.focus();
        }).catch(function () { if (my !== token) return; building = false; setBusy(false); $("lib-msg").textContent = "Could not build that track here."; $("lib-progress").hidden = false; });
    });

    /* ---------- Load ---------- */
    $("dm-file").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return; var d = cur;
      C.loadSource(d, URL.createObjectURL(f), { blob: true, file: f, title: f.name, meta: { kind: "file" } });
      C.say("Loaded " + f.name + " on deck " + d.id.toUpperCase() + "."); this.value = ""; close();
    });

    /* ---------- Link (Audius, no key) ---------- */
    var STYLES = [["Gold", { genre: "Electronic" }], ["Trance", { genre: "Trance" }], ["House", { genre: "House" }], ["Techno", { genre: "Techno" }], ["Pulsewave", { query: "synthwave" }], ["Synthpop", { query: "synthpop" }], ["Eurodance", { query: "eurodance" }], ["Nightdrive", { query: "night drive synthwave" }]];
    var chips = $("dm-chips");
    STYLES.forEach(function (s, i) { var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = s[0]; b.addEventListener("click", function () { recommend(i); }); chips.appendChild(b); });
    function api(path, params) {
      var q = new URLSearchParams(Object.assign({ app_name: APP }, params));
      return fetch(API + path + "?" + q.toString()).then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.json(); }).then(function (j) { return j.data || []; });
    }
    function status(t) { $("dm-status").textContent = t; }
    function recommend(i) {
      Array.prototype.forEach.call(chips.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      var s = STYLES[i][1]; status("Finding " + STYLES[i][0] + " tracks…"); $("res-list").textContent = "";
      var p = s.genre ? api("/tracks/trending", { genre: s.genre, time: "week", limit: 25 }) : api("/tracks/search", { query: s.query, limit: 25 });
      p.then(show).catch(function () { status("Music search is unavailable right now. Check your connection."); });
    }
    $("dm-search").addEventListener("submit", function (e) {
      e.preventDefault(); var q = $("dm-q").value.trim(); if (q.length < 2) return;
      Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      status("Searching…"); $("res-list").textContent = "";
      api("/tracks/search", { query: q, limit: 25 }).then(show).catch(function () { status("Music search is unavailable right now. Check your connection."); });
    });
    function show(tracks) {
      var ok = tracks.filter(function (t) { return t && t.id && t.is_streamable !== false && !(t.access && t.access.stream === false) && t.duration >= 45; });
      $("res-list").textContent = "";
      if (!ok.length) { status("No tracks found. Try another search."); return; }
      status(ok.length + " tracks. Tap Load to put one on deck " + (cur ? cur.id.toUpperCase() : "") + ".");
      ok.forEach(function (t) {
        var li = document.createElement("li"), art = t.artwork && (t.artwork["150x150"] || t.artwork["480x480"]);
        var img = document.createElement("img"); img.alt = ""; img.width = 44; img.height = 44; img.loading = "lazy"; if (art) img.src = art; else img.className = "no-art";
        var txt = document.createElement("span"); txt.className = "res-text";
        var a = document.createElement("strong"); a.textContent = t.title; var b = document.createElement("small"); b.textContent = (t.user && t.user.name ? t.user.name : "Unknown") + " · " + mmss(Math.round(t.duration)) + (t.genre ? " · " + t.genre : "");
        txt.appendChild(a); txt.appendChild(b);
        var load = document.createElement("button"); load.type = "button"; load.className = "res-load"; load.textContent = "Load";
        load.addEventListener("click", function () {
          var d = cur, url = API + "/tracks/" + encodeURIComponent(t.id) + "/stream?app_name=" + APP;
          C.loadSource(d, url, { title: t.title + " · " + (t.user && t.user.name || "Audius"), meta: { kind: "audius", id: t.id } });
          C.say("Loaded " + t.title + " on deck " + d.id.toUpperCase() + "."); close();
        });
        var link = document.createElement("a"); link.className = "res-link"; link.target = "_blank"; link.rel = "noopener"; link.textContent = "Audius ↗"; link.href = t.permalink ? "https://audius.co" + t.permalink : "https://audius.co/search/" + encodeURIComponent(t.title);
        li.appendChild(img); li.appendChild(txt); li.appendChild(link); li.appendChild(load); $("res-list").appendChild(li);
      });
    }
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
