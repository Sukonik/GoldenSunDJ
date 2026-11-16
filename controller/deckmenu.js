/* GoldenSunDJ Controller: the deck menu (tap the A or B tag).
   Library: eight full-length genre tracks (about 3 minutes each, built in your browser).
   Load: a file from your device.   Audius: search and stream from Audius (free, no key; the tab's internal id is still "link").
   Spotify: opt-in SpotifyNinja controller mode (see spotify-ninja.js).
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
      '<div class="dm-tabs" role="tablist" aria-label="Where to get a track"><button type="button" role="tab" data-tab="library" aria-selected="true">Library</button><button type="button" role="tab" data-tab="load" aria-selected="false">Load</button><button type="button" role="tab" data-tab="link" aria-selected="false">Audius</button><button type="button" role="tab" data-tab="spotify" aria-selected="false">Spotify</button></div>' +
      '<details class="dm-queue" id="dm-queue"><summary id="dq-sum">Up next</summary><div class="dq-body" id="dq-body"></div></details>' +
      '<section class="dm-pane" data-pane="library"><p class="dm-note">Full-length tracks in eight NAKO GOLD styles, about 3 minutes each. They are built on your device, so the first tap takes a few seconds.</p><ul class="lib-list" id="lib-list"></ul><div class="lib-progress" id="lib-progress" hidden><div class="bar"><i id="lib-bar"></i></div><p id="lib-msg" role="status"></p></div></section>' +
      '<section class="dm-pane" data-pane="load" hidden><p class="dm-note">Pick an audio file from this device. It plays on the deck and never leaves your device.</p><label class="btn dm-file">Choose a file<input type="file" accept="audio/*" id="dm-file" class="visually-hidden"></label></section>' +
      '<section class="dm-pane" data-pane="link" hidden><form class="dm-search" id="dm-search" role="search"><label class="visually-hidden" for="dm-q">Search music</label><input id="dm-q" type="search" placeholder="Search songs, artists, styles" autocomplete="off" enterkeyhint="search"><button class="btn" type="submit">Search</button></form>' +
      '<div class="dm-chips" id="dm-chips" role="group" aria-label="Recommended styles"></div><p class="dm-note" id="dm-status" role="status"></p><ul class="res-list" id="res-list"></ul><p class="dm-credit">Free music from <a href="https://audius.co" target="_blank" rel="noopener">Audius</a>. Tracks belong to their artists, so please support them.</p></section>' +
      '<section class="dm-pane" data-pane="spotify" hidden id="sp-pane"><h3 class="sn-title">SpotifyNinja Controller</h3><p class="dm-note">Control Spotify with the GoldenSunDJ surface. Play, pause, find tracks, save cue positions and use the platter to move through a song. Spotify protects its audio, so tempo, EQ, effects and true scratching remain available only with Library, Device and Audius tracks.</p>' +
      '<div class="sn-card" id="sn-account"></div>' +
      '<div class="sn-prompt" id="sn-prompt"><div class="sn-prompt-head"><i class="nj-ninja" aria-hidden="true"></i><strong>Switch to SpotifyNinja Controller?</strong></div><p>Use the GoldenSunDJ surface to control Spotify playback, seek positions, cue points, track preparation and playlists. Spotify keeps its audio protected, so some GoldenSun effects are unavailable in this mode.</p><div class="sn-btns"><button type="button" class="btn" id="sn-switch">Switch to SpotifyNinja</button><button type="button" class="btn btn--ghost" id="sn-keep">Keep GoldenSun Controller</button></div></div>' +
      '<div class="sn-active" id="sn-active" hidden><strong>SpotifyNinja is active.</strong><p id="sn-active-text">Deck A controls Spotify. Deck B prepares what plays next.</p><div class="sn-btns"><button type="button" class="btn btn--ghost" id="sn-return">Return to GoldenSun Controller</button></div></div>' +
      '<form class="dm-search sn-search" id="sn-search" role="search"><label class="visually-hidden" for="sn-q">Search Spotify</label><input id="sn-q" type="search" placeholder="Search Spotify songs and artists" autocomplete="off" enterkeyhint="search" disabled><button class="btn" type="submit" disabled>Search</button></form>' +
      '<div class="dm-chips" id="sn-chips" role="group" aria-label="Recommended styles"></div><p class="dm-note sn-hint" id="sn-hint" role="status"></p><ul class="res-list" id="sn-results"></ul>' +
      '<div class="sn-status" id="sn-status" role="status"></div></section>' +
      '</div>';
    document.body.appendChild(menu);
    var dm = menu.querySelector(".dm"), title = $("dm-title"), cur = null, opener = null, token = 0, building = false;

    function tab(name) {
      menu.querySelectorAll(".dm-tabs [role=tab]").forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-tab") === name ? "true" : "false"); });
      menu.querySelectorAll(".dm-pane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== name; });
      if (name === "link" && !$("res-list").children.length) recommend(0);
      if (name === "spotify" && window.GSDJNinja && window.GSDJNinja.onSpotifyTab) window.GSDJNinja.onSpotifyTab();
    }
    menu.querySelectorAll(".dm-tabs [role=tab]").forEach(function (t) { t.addEventListener("click", function () { tab(t.getAttribute("data-tab")); }); });
    function open(d, from, first, opts) { cur = d; opener = from; title.textContent = "Deck " + d.id.toUpperCase(); menu.hidden = false; tab(first || "library"); refreshQueue(); if (opts && opts.queue) { var q = $("dm-queue"); q.open = true; q.scrollIntoView({ block: "nearest" }); } $("dm-close").focus(); }
    function close() { token++; building = false; setBusy(false); menu.hidden = true; if (opener) opener.focus(); }
    window.GSDJDeckMenu = { open: function (deckId, tabName, opts) { open(C.byId[deckId] || C.decks[0], null, tabName, opts); }, close: close, tab: tab, el: menu, refreshQueue: refreshQueue };
    $("dm-close").addEventListener("click", close);
    menu.addEventListener("click", function (e) { if (e.target === menu) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) close(); });
    C.decks.forEach(function (d) { var tag = $("tag-" + d.id), ld = $("load-" + d.id); tag.addEventListener("click", function () { open(d, tag); }); ld.addEventListener("click", function () { open(d, ld); }); d.audio.addEventListener("error", function () { if (d.audio.src && d.src && d.src.kind === "audius") C.say("Could not play that stream. Try another track."); }); });

    /* ---------- Up next (GoldenSun Controller): a queue you choose. Next and Previous follow it; they never wander to another style. ---------- */
    var GQ = { items: [], hist: { a: [], b: [] }, last: { a: null, b: null }, shuffle: false };
    function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
    function noteLoad(d, desc, fromNav) { if (!fromNav && GQ.last[d.id]) { var h = GQ.hist[d.id]; h.push(GQ.last[d.id]); if (h.length > 20) h.shift(); } GQ.last[d.id] = desc; }
    function enqueueDesc(desc) {
      if (GQ.items.some(function (x) { return x.kind === desc.kind && x.id === desc.id && x.url === desc.url; })) { C.say("That track is already up next."); return; }
      if (GQ.shuffle) GQ.items.splice(Math.floor(Math.random() * (GQ.items.length + 1)), 0, desc); else GQ.items.push(desc);
      C.say("Added to Up next (" + GQ.items.length + ").", "q"); refreshQueue();
    }
    function loadDesc(d, desc, fromNav) {
      if (desc.kind === "audius") { C.loadSource(d, API + "/tracks/" + encodeURIComponent(desc.id) + "/stream?app_name=" + APP, { title: desc.title, meta: { kind: "audius", id: desc.id } }); noteLoad(d, desc, fromNav); C.say("Loaded " + desc.title + " on deck " + d.id.toUpperCase() + "."); return Promise.resolve(); }
      if (desc.kind === "file") { C.loadSource(d, desc.url, { blob: true, file: desc.file, title: desc.title, meta: { kind: "file" } }); noteLoad(d, desc, fromNav); C.say("Loaded " + desc.title + " on deck " + d.id.toUpperCase() + "."); return Promise.resolve(); }
      if (building) { C.say("A track is still being built. Try again in a moment."); return Promise.resolve(); }
      building = true; C.say("Building " + desc.title + "…");
      return window.GSDJGenres.render(desc.id, function () {}).then(function (r) { building = false; C.loadSource(d, URL.createObjectURL(r.blob), { blob: true, pk: r.peaks, bpm: r.bpm, title: r.title, cues: r.cues, meta: { kind: "genre", id: desc.id } }); noteLoad(d, desc, fromNav); C.say("Loaded " + r.title + " on deck " + d.id.toUpperCase() + "."); }).catch(function () { building = false; C.say("Could not build that track here."); });
    }
    var nav = {
      hasNext: function () { return GQ.items.length > 0; },
      nextReason: function () { return "Nothing is up next on this controller. Tap Queue beside tracks in Library or Audius to line them up."; },
      next: function (id) { var d = C.byId[id] || C.decks[0]; if (!GQ.items.length) { C.say(nav.nextReason()); return; } var desc = GQ.items.shift(); refreshQueue(); loadDesc(d, desc); },
      previous: function (id) {
        var d = C.byId[id] || C.decks[0], h = GQ.hist[d.id];
        if ((d.audio.currentTime || 0) > 3 || !h.length) { d.audio.currentTime = 0; d.livePos = null; C.say(h.length || (d.audio.currentTime || 0) > 3 ? "Back to the start." : "Back to the start. There is no earlier track on this deck yet."); return; }
        var back = h.pop(); if (GQ.last[d.id]) GQ.items.unshift(GQ.last[d.id]); refreshQueue(); loadDesc(d, back, true);
      },
      shuffle: function () { GQ.shuffle = !GQ.shuffle; if (GQ.shuffle && GQ.items.length > 1) shuf(GQ.items); refreshQueue(); },
      shuffleOn: function () { return GQ.shuffle; }
    };
    window.GSDJDeckMenu.nav = nav;
    function gsView() { return { label: "Up next", items: GQ.items.map(function (x, i) { return { title: x.title, sub: x.kind === "genre" ? "Library" : x.kind === "audius" ? "Audius" : "Your file", remove: function () { GQ.items.splice(i, 1); refreshQueue(); } }; }), shuffle: GQ.shuffle, onShuffle: function () { nav.shuffle(); }, onClear: GQ.items.length ? function () { GQ.items = []; refreshQueue(); } : null, empty: "Nothing queued. Tap Queue beside a track in Library or Audius. Next and Previous follow this list." }; }
    function refreshQueue() {
      var N = window.GSDJNinja, v = N && N.active() && window.GSDJNinjaTools ? window.GSDJNinjaTools.queueView() : gsView(), body = $("dq-body"); if (!body) return;
      $("dq-sum").textContent = v.label + " (" + v.items.length + ")"; body.textContent = "";
      var bar = document.createElement("div"); bar.className = "dq-bar";
      var sh = document.createElement("button"); sh.type = "button"; sh.className = "chip"; sh.textContent = "Shuffle"; sh.setAttribute("aria-pressed", v.shuffle ? "true" : "false"); sh.addEventListener("click", function () { v.onShuffle(); }); bar.appendChild(sh);
      if (v.onClear) { var cl = document.createElement("button"); cl.type = "button"; cl.className = "chip"; cl.textContent = "Clear"; cl.addEventListener("click", v.onClear); bar.appendChild(cl); }
      body.appendChild(bar);
      if (!v.items.length) { var em = document.createElement("p"); em.className = "dm-note"; em.textContent = v.empty; body.appendChild(em); return; }
      var ul = document.createElement("ul"); ul.className = "dq-list";
      v.items.forEach(function (it, i) { var li = document.createElement("li"), t = document.createElement("span"); t.innerHTML = "<strong></strong><small></small>"; t.firstChild.textContent = (i + 1) + ". " + it.title; t.lastChild.textContent = it.sub || ""; var x = document.createElement("button"); x.type = "button"; x.className = "chip"; x.textContent = "✕"; x.setAttribute("aria-label", "Remove " + it.title); x.addEventListener("click", it.remove); li.appendChild(t); li.appendChild(x); ul.appendChild(li); });
      body.appendChild(ul);
    }
    window.addEventListener("gsdj:modechange", refreshQueue);

    /* ---------- Library ---------- */
    var list = $("lib-list");
    function mmss(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    window.GSDJGenres.list().forEach(function (g) {
      var li = document.createElement("li"); li.innerHTML = '<button type="button" class="lib-item" data-id="' + g.id + '"><span class="lib-name">' + g.name + '<small>' + g.sub + '</small></span><span class="lib-meta">' + g.bpm + ' BPM · ' + g.key + ' · ' + mmss(g.seconds) + '</span><span class="lib-go">Load</span></button><button type="button" class="res-sub lib-q" data-id="' + g.id + '" aria-label="Add ' + g.name + ' to Up next">Queue</button>';
      list.appendChild(li);
    });
    function setBusy(b) { list.querySelectorAll("button").forEach(function (x) { x.disabled = b; }); $("lib-progress").hidden = !b; }
    list.addEventListener("click", function (e) {
      var q = e.target.closest(".lib-q"); if (q) { var g = window.GSDJGenres.list().filter(function (x) { return x.id === q.getAttribute("data-id"); })[0]; if (g) enqueueDesc({ kind: "genre", id: g.id, title: g.name }); return; }
      var btn = e.target.closest(".lib-item"); if (!btn || building) return; var id = btn.getAttribute("data-id"), d = cur, my = ++token;
      building = true; setBusy(true); $("lib-bar").style.width = "4%"; $("lib-msg").textContent = "Building your track…";
      var names = { intro: "Intro", build: "Build up", build2: "Build up", drop: "Drop", brk: "Break", "break": "Breakdown", outro: "Outro" };
      window.GSDJGenres.render(id, function (p, sec) { if (my !== token) return; $("lib-bar").style.width = Math.max(4, Math.round(p * 100)) + "%"; $("lib-msg").textContent = "Building: " + (names[sec] || "Finishing") + "…"; })
        .then(function (r) {
          if (my !== token) return; building = false; setBusy(false);
          C.loadSource(d, URL.createObjectURL(r.blob), { blob: true, pk: r.peaks, bpm: r.bpm, title: r.title, cues: r.cues, meta: { kind: "genre", id: id } }); noteLoad(d, { kind: "genre", id: id, title: r.title });
          C.say("Loaded " + r.title + " on deck " + d.id.toUpperCase() + "."); menu.hidden = true; if (opener) opener.focus();
        }).catch(function () { if (my !== token) return; building = false; setBusy(false); $("lib-msg").textContent = "Could not build that track here."; $("lib-progress").hidden = false; });
    });

    /* ---------- Load ---------- */
    $("dm-file").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return; var d = cur;
      var fu = URL.createObjectURL(f); C.loadSource(d, fu, { blob: true, file: f, title: f.name, meta: { kind: "file" } }); noteLoad(d, { kind: "file", url: fu, file: f, title: f.name });
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
          C.loadSource(d, url, { title: t.title + " · " + (t.user && t.user.name || "Audius"), meta: { kind: "audius", id: t.id } }); noteLoad(d, { kind: "audius", id: t.id, title: t.title + " · " + (t.user && t.user.name || "Audius") });
          C.say("Loaded " + t.title + " on deck " + d.id.toUpperCase() + "."); close();
        });
        var link = document.createElement("a"); link.className = "res-link"; link.target = "_blank"; link.rel = "noopener"; link.textContent = "Audius ↗"; link.href = t.permalink ? "https://audius.co" + t.permalink : "https://audius.co/search/" + encodeURIComponent(t.title);
        var qb = document.createElement("button"); qb.type = "button"; qb.className = "res-sub"; qb.textContent = "Queue"; qb.setAttribute("aria-label", "Add " + t.title + " to Up next"); qb.addEventListener("click", function () { enqueueDesc({ kind: "audius", id: t.id, title: t.title + " · " + (t.user && t.user.name || "Audius") }); });
        li.appendChild(img); li.appendChild(txt); li.appendChild(link); li.appendChild(load); li.appendChild(qb); $("res-list").appendChild(li);
      });
    }
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
