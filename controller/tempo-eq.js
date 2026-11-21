/* GoldenSunDJ Controller: easier tempo and EQ sliders (v26).
   Tempo: the slider covers -10% to +10% in 1% steps, with a big readout between - and + buttons (tap and hold to repeat).
   Double-tap the slider to return to 0%. Tempo Overdrive (settings wheel, Controls page) lets you go much further: tap the readout and
   the Overdrive panel opens with a wide -80% to +80% slider, steppers, quick chips and an exact number box. Beyond +-10% the readout turns magenta.
   EQ: every slider shows its dB value next to its name, and double-tap returns it to 0. */
(function () {
  "use strict";
  function init() {
    var C = window.GSDJCtl, $ = C.$, ctl = C.el;
    function fmtT(t) { return (t > 0 ? "+" : t < 0 ? "−" : "") + (Math.abs(t) % 1 ? Math.abs(t).toFixed(1) : Math.abs(t)) + "%"; }
    function toast(d, m) { if (C.toast) C.toast(d, m); else C.say(m); }

    /* ---------- tempo controls ---------- */
    C.decks.forEach(function (d) {
      var sl = $("tempo-" + d.id), out = $("tempo-out-" + d.id), host = sl.parentNode;
      var wrap = document.createElement("div"); wrap.className = "tslider"; host.insertBefore(wrap, sl); wrap.appendChild(sl);
      var row = document.createElement("div"); row.className = "tempo-read"; host.insertBefore(row, out.nextSibling || null);
      function mk(txt, label, dir) {
        var b = document.createElement("button"); b.type = "button"; b.className = "tstep"; b.textContent = txt; b.setAttribute("aria-label", label);
        var t1 = null, t2 = null;
        function act() { var v = Math.round(d.tempo); if (d.tempo % 1 && dir > 0) v = Math.floor(d.tempo); if (d.tempo % 1 && dir < 0) v = Math.ceil(d.tempo); C.setTempo(d, v + dir); }
        function stop() { clearTimeout(t1); clearInterval(t2); }
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); act(); t1 = setTimeout(function () { t2 = setInterval(act, 90); }, 380); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { b.addEventListener(ev, stop); });
        b.addEventListener("click", function (e) { if (e.detail === 0) act(); });
        return b;
      }
      var minus = mk("−", "Tempo down 1 percent", -1), plus = mk("+", "Tempo up 1 percent", 1);
      row.appendChild(minus); row.appendChild(out); row.appendChild(plus);
      out.setAttribute("role", "button"); out.setAttribute("tabindex", "0"); out.setAttribute("title", "Tempo. Turn on Overdrive in the settings wheel to type a tempo.");
      out.addEventListener("click", function () { if (C.settings.overdrive) openOd(d); else toast(d, "Slider: −10% to +10%. Turn on Tempo Overdrive in the settings wheel to go up to ±80%."); });
      out.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); out.click(); } });
      sl.addEventListener("dblclick", function () { C.setTempo(d, 0); });
      sl.setAttribute("aria-label", "Deck " + d.id.toUpperCase() + " tempo, percent");
      C.setTempo(d, d.tempo || 0);
    });

    /* ---------- Tempo Overdrive panel ---------- */
    var od = document.createElement("div"); od.className = "od-scrim"; od.hidden = true;
    od.innerHTML = '<div class="od" role="dialog" aria-modal="true" aria-labelledby="od-title"><header class="od-head"><div><strong id="od-title">Tempo Overdrive</strong><span id="od-deck">Deck A</span></div><button type="button" class="dx-close" id="od-x" aria-label="Close">✕</button></header>' +
      '<output class="od-val tnum" id="od-val" aria-live="polite">0%</output><p class="od-bpm" id="od-bpm"></p>' +
      '<div class="od-rangewrap"><input type="range" id="od-range" min="-80" max="80" step="1" aria-label="Overdrive tempo, percent"><span class="od-zone" aria-hidden="true"></span></div><div class="od-scale" aria-hidden="true"><span>−80</span><span>−10</span><span>0</span><span>+10</span><span>+80</span></div>' +
      '<div class="od-steps" role="group" aria-label="Fine steps"><button type="button" data-d="-10">−10</button><button type="button" data-d="-1">−1</button><button type="button" data-d="1">+1</button><button type="button" data-d="10">+10</button></div>' +
      '<div class="od-chips" role="group" aria-label="Quick tempos"></div>' +
      '<form class="od-form" id="od-form"><label for="od-in">Exact tempo %</label><input id="od-in" type="number" inputmode="decimal" min="-80" max="80" step="0.1" enterkeyhint="done"><button type="submit" class="tbtn">Set</button></form>' +
      '<div class="od-foot"><button type="button" class="tbtn" id="od-reset">Back to 0%</button><button type="button" class="tbtn" id="od-done">Done</button></div></div>';
    ctl.appendChild(od);
    var cur = null, chips = od.querySelector(".od-chips");
    [-50, -25, -10, 0, 10, 25, 50].forEach(function (v) { var b = document.createElement("button"); b.type = "button"; b.textContent = v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0"; b.addEventListener("click", function () { if (cur) C.setTempo(cur, v); }); chips.appendChild(b); });
    function paint() {
      if (!cur) return; $("od-val").textContent = fmtT(cur.tempo); $("od-val").classList.toggle("is-od", Math.abs(cur.tempo) > 10);
      $("od-bpm").textContent = cur.bpm ? "Playing at " + (cur.bpm * C.rate(cur)).toFixed(1) + " BPM (track " + cur.bpm.toFixed(1) + ")" : "Tap the BPM number four times to see the BPM.";
      if (document.activeElement !== $("od-range")) $("od-range").value = Math.round(cur.tempo); if (document.activeElement !== $("od-in")) $("od-in").value = cur.tempo;
    }
    function openOd(d) { cur = d; $("od-deck").textContent = "Deck " + d.id.toUpperCase(); od.hidden = false; paint(); $("od-done").focus(); }
    function closeOd() { od.hidden = true; var d = cur; cur = null; if (d) { var o = $("tempo-out-" + d.id); if (o) o.focus(); } }
    $("od-range").addEventListener("input", function () { if (cur) C.setTempo(cur, parseFloat(this.value)); });
    od.querySelectorAll(".od-steps button").forEach(function (b) { b.addEventListener("click", function () { if (cur) C.setTempo(cur, cur.tempo + parseFloat(b.getAttribute("data-d"))); }); });
    $("od-form").addEventListener("submit", function (e) { e.preventDefault(); if (!cur) return; var v = parseFloat($("od-in").value); if (isNaN(v)) return; C.setTempo(cur, v); if (Math.abs(v) > 80) C.say("Tempo Overdrive stops at 80%."); $("od-in").blur(); });
    $("od-reset").addEventListener("click", function () { if (cur) C.setTempo(cur, 0); });
    $("od-done").addEventListener("click", closeOd); $("od-x").addEventListener("click", closeOd);
    od.addEventListener("click", function (e) { if (e.target === od) closeOd(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !od.hidden) closeOd(); });
    window.addEventListener("gsdj-tempo", function (e) { if (cur && e.detail === cur.id) paint(); });

    function overdriveChanged(on) {
      ctl.setAttribute("data-overdrive", on ? "on" : "off");
      C.say(on ? "Tempo Overdrive on. Tap a deck's tempo number to go from −80% to +80%. Sync can now match tempos that are far apart." : "Tempo Overdrive off. Tempo is back to ±10%.");
      if (!on && !od.hidden) closeOd();
    }
    ctl.setAttribute("data-overdrive", C.settings.overdrive ? "on" : "off");

    /* ---------- EQ: show the dB value, double-tap to reset ---------- */
    function fmtDb(v) { return v > 0 ? "+" + v : v < 0 ? "−" + Math.abs(v) : "0"; }
    var all = [];
    C.decks.forEach(function (d) {
      [["high", "Hi"], ["mid", "Mid"], ["low", "Low"]].forEach(function (b) {
        var i1 = $("eq-" + b[0] + "-" + d.id), i2 = $("eq2-" + b[0] + "-" + d.id), vals = [];
        var l1 = document.querySelector('label[for="eq-' + b[0] + "-" + d.id + '"]');
        if (l1) { l1.innerHTML = '<span class="eql">' + b[1] + '</span><b class="eqv"></b>'; l1.classList.add("eq-lab"); vals.push([l1.querySelector(".eqv"), " dB"]); }
        var l2 = i2.parentNode; if (l2 && l2.tagName === "LABEL") { var tn = l2.firstChild; if (tn && tn.nodeType === 3) { var sp = document.createElement("span"); sp.className = "eql"; sp.innerHTML = b[1] + ' <b class="eqv"></b>'; l2.replaceChild(sp, tn); vals.push([sp.querySelector(".eqv"), ""]); } }
        function paint() { var v = parseFloat(i1.value) || 0; vals.forEach(function (x) { x[0].textContent = fmtDb(v) + (v ? x[1] : ""); x[0].classList.toggle("is-on", v !== 0); }); [i1, i2].forEach(function (i) { i.setAttribute("aria-valuetext", fmtDb(v) + " decibels"); }); }
        [i1, i2].forEach(function (i) { i.addEventListener("input", paint); i.addEventListener("dblclick", function () { i.value = 0; i.dispatchEvent(new Event("input", { bubbles: true })); }); });
        paint(); all.push(paint);
      });
    });
    window.GSDJTempoEQ = { overdriveChanged: overdriveChanged, openOverdrive: openOd };
  }
  if (window.GSDJCtl) init(); else window.addEventListener("gsdj-ctl-ready", init, { once: true });
})();
