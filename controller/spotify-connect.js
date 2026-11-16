/* GoldenSunDJ: the Spotify connection (SpotifyNinja Patch 2).
   - Login: Authorization Code with PKCE, entirely in the browser. No client secret exists in GoldenSunDJ.
     The login page is Spotify's own, so your password is only ever typed on Spotify.
   - Tokens live in sessionStorage (this browser session only). Close the browser and you reconnect.
   - Playback: the official Spotify Web Playback SDK makes this page a Spotify Connect device (Premium required).
   - GoldenSunDJ never downloads, decodes, records or caches Spotify audio.
   spotify-ninja.js owns the controller side and calls the API below. */
(function () {
  "use strict";
  var SCOPES = "streaming user-read-private user-read-email user-read-playback-state user-modify-playback-state";
  var AUTH = "https://accounts.spotify.com/authorize", TOKEN = "https://accounts.spotify.com/api/token", API = "https://api.spotify.com/v1";
  var TOK = "gsdj-sp-token", ERR = "gsdj-sp-error", PKCE = "gsdj-sp-pkce", CID = "gsdj-spotify-client-id";
  var me = null, player = null, deviceId = null, readyP = null, last = null, timer = null;

  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function tokens() { try { return JSON.parse(ss(TOK) || "null"); } catch (e) { return null; } }
  function note() { window.dispatchEvent(new CustomEvent("gsdj:spotify", { detail: { connected: connected(), user: me } })); }
  function say(msg) { if (api.onMessage) api.onMessage(msg); }

  /* ---------- configuration ---------- */
  function clientId() { var c = window.GSDJ_SPOTIFY && window.GSDJ_SPOTIFY.clientId; return (c && String(c).trim()) || (ls(CID) || "").trim(); }
  function redirectUri() { return new URL("spotify-callback.html", location.href).href.split("#")[0].split("?")[0]; }

  /* ---------- PKCE ---------- */
  var CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); var s = ""; for (var i = 0; i < n; i++) s += CH[a[i] % CH.length]; return s; }
  function b64url(buf) { var b = new Uint8Array(buf), s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function challenge(v) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)).then(b64url); }

  function connect() {
    var id = clientId(); if (!id) return Promise.reject(new Error("no client id"));
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("This browser cannot sign in to Spotify here (it needs a secure page)."));
    var verifier = rand(96), state = rand(24);
    return challenge(verifier).then(function (ch) {
      ls(PKCE, JSON.stringify({ verifier: verifier, state: state, clientId: id, redirect: redirectUri(), returnTo: location.pathname + location.search + "#spotify", t: Date.now() }));
      var u = new URL(AUTH);
      u.search = new URLSearchParams({ response_type: "code", client_id: id, scope: SCOPES, redirect_uri: redirectUri(), state: state, code_challenge_method: "S256", code_challenge: ch }).toString();
      location.assign(u.href);
    });
  }

  /* ---------- tokens ---------- */
  var refreshing = null;
  function token() {
    var t = tokens(); if (!t) return Promise.reject(new Error("not connected"));
    if (t.expires_at - 60000 > Date.now()) return Promise.resolve(t.access_token);
    if (!t.refresh_token) { disconnect(); return Promise.reject(new Error("expired")); }
    if (refreshing) return refreshing;
    refreshing = fetch(TOKEN, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: clientId() }).toString() })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "refresh failed"); return j; }); })
      .then(function (j) { ss(TOK, JSON.stringify({ access_token: j.access_token, refresh_token: j.refresh_token || t.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, scope: j.scope || t.scope })); refreshing = null; return j.access_token; })
      .catch(function (e) { refreshing = null; disconnect(); say("Your Spotify session ended. Connect Spotify again."); throw e; });
    return refreshing;
  }
  function connected() { return !!tokens(); }

  /* ---------- Web API ---------- */
  function call(method, path, body, retry) {
    return token().then(function (tk) {
      return fetch(path.indexOf("http") === 0 ? path : API + path, { method: method, headers: Object.assign({ Authorization: "Bearer " + tk }, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      if (r.status === 401 && !retry) { var t = tokens(); if (t) { t.expires_at = 0; ss(TOK, JSON.stringify(t)); } return call(method, path, body, true); }
      if (r.status === 204) return null;
      return r.text().then(function (txt) { var j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {} if (!r.ok) { var err = new Error((j && j.error && (j.error.message || j.error)) || ("Spotify error " + r.status)); err.status = r.status; throw err; } return j; });
    });
  }
  function loadUser() {
    return call("GET", "/me").then(function (j) { me = { id: j.id, name: j.display_name || j.id, premium: j.product === "premium", product: j.product, country: j.country }; note(); return me; });
  }
  function search(q) {
    return call("GET", "/search?" + new URLSearchParams({ q: q, type: "track", limit: "25", market: "from_token" }).toString()).then(function (j) {
      return ((j && j.tracks && j.tracks.items) || []).filter(function (t) { return t && t.uri && !t.is_local; }).map(function (t) {
        var imgs = (t.album && t.album.images) || [], img = imgs.length ? imgs[imgs.length - 1].url : "";
        return { uri: t.uri, id: t.id, title: t.name, artist: (t.artists || []).map(function (a) { return a.name; }).join(", "), duration_ms: t.duration_ms, art: img, url: t.external_urls && t.external_urls.spotify, playable: t.is_playable !== false };
      });
    });
  }

  /* ---------- playback (Web Playback SDK) ---------- */
  function loadSDK() {
    return new Promise(function (res, rej) {
      if (window.Spotify && window.Spotify.Player) return res();
      window.onSpotifyWebPlaybackSDKReady = res;
      var s = document.createElement("script"); s.src = "https://sdk.scdn.co/spotify-player.js"; s.async = true; s.onerror = function () { rej(new Error("The Spotify player could not be loaded. Check your connection.")); };
      document.head.appendChild(s);
    });
  }
  function emit(st) { if (api.onState) api.onState(st); }
  function track(t) { if (!t) return null; var imgs = (t.album && t.album.images) || []; return { uri: t.uri, title: t.name, artist: (t.artists || []).map(function (a) { return a.name; }).join(", "), artwork: imgs.length ? imgs[0].url : "" }; }
  function pump() {
    if (timer) return;
    timer = setInterval(function () {
      if (!last || last.paused) { clearInterval(timer); timer = null; return; }
      var pos = Math.min(last.duration, last.position + (Date.now() - last.at)); emit({ paused: false, position_ms: pos, duration_ms: last.duration, track: last.track });
    }, 500);
  }
  function ensurePlayer() {
    if (readyP) return readyP;
    readyP = loadSDK().then(function () {
      return new Promise(function (res, rej) {
        player = new window.Spotify.Player({ name: "GoldenSunDJ", volume: 0.8, getOAuthToken: function (cb) { token().then(cb, function () { cb(""); }); } });
        player.addListener("ready", function (e) { deviceId = e.device_id; res(deviceId); });
        player.addListener("not_ready", function () { deviceId = null; say("Spotify lost the connection to this device. Reconnecting may help."); });
        player.addListener("initialization_error", function (e) { rej(new Error(e.message || "This browser cannot play Spotify here.")); });
        player.addListener("authentication_error", function () { rej(new Error("Spotify rejected the login. Connect Spotify again.")); });
        player.addListener("account_error", function () { rej(new Error("Spotify Premium is required to play music here.")); });
        player.addListener("playback_error", function (e) { say("Spotify could not play that: " + (e && e.message ? e.message : "playback error") + "."); });
        player.addListener("player_state_changed", function (s) {
          if (!s) { last = null; emit({ paused: true, position_ms: 0, duration_ms: 0, track: null }); return; }
          var tr = track(s.track_window && s.track_window.current_track);
          last = { paused: !!s.paused, position: s.position, duration: s.duration, track: tr, at: Date.now() };
          emit({ paused: last.paused, position_ms: s.position, duration_ms: s.duration, track: tr }); if (!last.paused) pump();
        });
        Promise.resolve(player.connect()).then(function (ok) { if (ok === false) rej(new Error("Spotify could not start the player in this browser.")); });
      });
    }).catch(function (e) { readyP = null; throw e; });
    return readyP;
  }
  function activate() { try { if (player && player.activateElement) player.activateElement(); } catch (e) {} }          // must run inside a tap (iOS and iPad autoplay rules)
  function start(uri, position_ms) {
    return ensurePlayer().then(function (id) { activate(); return call("PUT", "/me/player", { device_ids: [id], play: false }).catch(function () {}).then(function () { return call("PUT", "/me/player/play?device_id=" + encodeURIComponent(id), { uris: [uri], position_ms: position_ms || 0 }); }); });
  }
  function disconnect() {
    try { if (player) player.disconnect(); } catch (e) {} player = null; deviceId = null; readyP = null; last = null; me = null; clearInterval(timer); timer = null;
    ss(TOK, null); note();
  }

  /* ---------- packets from the controller ---------- */
  function handle(p) {
    var v = p.value || {};
    var need = function () { if (!player || !deviceId) { say("Spotify is still starting. Try again in a moment."); return false; } return true; };
    switch (p.action) {
      case "toggle-play": case "play": case "pause":
        if (!need()) return; activate();
        if (!last) { say("Search for a track and tap Load first."); return; }
        if (p.action === "play") player.resume(); else if (p.action === "pause") player.pause(); else player.togglePlay(); break;
      case "seek": if (need() && last) player.seek(Math.max(0, Math.round(v.position_ms || 0))); break;
      case "set-volume": if (player) player.setVolume(Math.max(0, Math.min(1, v.volume == null ? 0.8 : v.volume))); break;
      case "next": if (need()) player.nextTrack(); break;
      case "previous": if (need()) player.previousTrack(); break;
      case "load-track": if (v.uri) start(v.uri, v.position_ms).catch(function (e) { say(e && e.message ? e.message : "Spotify could not load that track."); }); break;
      default: break;
    }
  }

  var api = {
    configured: function () { return !!clientId(); }, clientId: clientId, setClientId: function (id) { ls(CID, id ? String(id).trim() : null); }, redirectUri: redirectUri, scopes: SCOPES,
    connect: connect, disconnect: disconnect, connected: connected, user: function () { return me; }, loadUser: loadUser, token: token,
    search: search, ensurePlayer: ensurePlayer, activate: activate, ready: function () { return !!(player && deviceId); }, handle: handle,
    lastError: function () { return ss(ERR); }, clearError: function () { ss(ERR, null); },
    onState: null, onMessage: null
  };
  window.GSDJSpotify = api;
  if (connected()) loadUser().catch(function () {});
})();
