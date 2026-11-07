# GoldenSunDJ — Shell Contract for App Workers

The shared design shell is finished and frozen. Sampler, Mic, Mixer and
Player each build **one folder** against this contract. Read it fully
before writing any markup — the class names, ids, file order and theme
names below are exact, not suggestions.

## 1. File layout

```
index.html            hub (shell worker — do not edit)
SHELL.md              this contract
DESIGN.md             design plan (do not edit)
README.md             source of all copy (do not edit)
css/
  tokens.css          all colors, scales, themes (do not edit)
  base.css            reset + element defaults (do not edit)
  components.css      shared components (do not edit)
  responsive.css      breakpoints (do not edit)
js/
  shell.js            drawer, theme switcher, session chip (do not edit)
assets/
  favicon.svg
sampler/index.html    + sampler/sampler.css + sampler/sampler.js
mic/index.html        + mic/mic.css + mic/mic.js
mixer/index.html      + mixer/mixer.css + mixer/mixer.js
player/index.html     + player/player.css + player/player.js
```

**Do not edit any shared file** (`css/*`, `js/shell.js`, `index.html`,
`assets/*`, `README.md`, `DESIGN.md`, this file). If the shell is missing
something you need, build it in your own app CSS and flag it in your
report.

## 2. Required head snippet

Every app page starts with this head. CSS order is load-bearing:
tokens → base → components → responsive → **your app CSS last**.

```html
<!doctype html>
<html lang="en" data-theme="house">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>GoldenSunSampler — GoldenSunDJ</title>
  <meta name="description" content="...">
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/tokens.css">
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/responsive.css">
  <link rel="stylesheet" href="sampler.css">
</head>
```

From the hub, the same files are `css/tokens.css` etc. (no `../`).
From an app folder they are always `../css/…`, `../js/shell.js`,
`../assets/favicon.svg`, `../index.html`.

### Your page's default theme

Set `data-theme` on `<html>` to your app's genre — this is the page's
starting skin:

| Page | `data-theme` | Accent | Kick |
| --- | --- | --- | --- |
| Hub | `master` | `#ffe81a` | ♪ |
| Sampler | `house` | `#ffb876` | ● |
| Mic | `synthpop` | `#ff8bdb` | ✦ |
| Mixer | `techno` | `#c8ff62` | // |
| Player | `eurodance` | `#ffdf62` | ★ |

How it resolves at runtime (shell.js): if the visitor previously picked
a theme, `localStorage["gsdj-theme"]` wins and overrides your attribute.
Otherwise your attribute stands. Never set the theme from your own JS on
load — you would fight the visitor's saved choice.

## 3. Header / drawer / footer — copy verbatim

Copy this block into your page and adjust **only**:

1. Path prefixes (`../` from an app folder, none from the hub).
2. Add `aria-current="page"` to **your own app's** link, in both the
   header nav and the drawer nav.
3. The session chip's starting text (see §5).

```html
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap site-header-inner">
    <a class="brand" href="../index.html" aria-label="GoldenSunDJ home">
      <svg class="mark-spin" viewBox="0 0 100 100" aria-hidden="true"><polygon fill="currentColor" points="50,2 61.8,33.8 95.6,35.2 69,56.2 78.2,88.8 50,70 21.8,88.8 31,56.2 4.4,35.2 38.2,33.8"/></svg>
      <span class="wordmark wordmark--sheen">GoldenSunDJ</span>
    </a>
    <nav class="main-nav" aria-label="Apps">
      <ul>
        <li><a href="../sampler/">Sampler</a></li>
        <li><a href="../mic/">Mic</a></li>
        <li><a href="../mixer/">Mixer</a></li>
        <li><a href="../player/">Player</a></li>
      </ul>
    </nav>
    <span class="session-chip" id="session-chip" data-chip="♪ Ready">
      <span class="chip-dot" aria-hidden="true"></span>
      <span class="chip-text" id="session-chip-text">♪ Ready</span>
    </span>
    <button class="menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-controls="drawer" aria-expanded="false">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>

<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="drawer-top">
    <span class="wordmark wordmark--sheen">GoldenSunDJ</span>
    <button class="icon-btn" type="button" data-drawer-close aria-label="Close menu">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
  </div>
  <nav class="drawer-group" aria-label="Apps">
    <h2>Apps</h2>
    <ul>
      <li><a href="../sampler/">Sampler</a></li>
      <li><a href="../mic/">Mic</a></li>
      <li><a href="../mixer/">Mixer</a></li>
      <li><a href="../player/">Player</a></li>
    </ul>
  </nav>
  <nav class="drawer-group" aria-label="Family">
    <h2>Family</h2>
    <ul>
      <li><a href="https://open.spotify.com/artist/6n4s5S0cGiMsW4oJvIwU2L" rel="noopener">NakoGold</a></li>
      <li><a href="https://github.com/Sukonik/goldensunai" rel="noopener">GoldenSunAI</a></li>
      <li><a href="https://sukonik.github.io/kikomix/" rel="noopener">KikoMix</a></li>
    </ul>
  </nav>
  <div class="drawer-group">
    <h2>Theme</h2>
    <div class="swatches">
      <button class="swatch" type="button" data-set-theme="master" aria-pressed="false"><span class="swatch-dot sw-master" aria-hidden="true"></span>GoldenSunDJ</button>
      <button class="swatch" type="button" data-set-theme="house" aria-pressed="false"><span class="swatch-dot sw-house" aria-hidden="true"></span>Sampler</button>
      <button class="swatch" type="button" data-set-theme="synthpop" aria-pressed="false"><span class="swatch-dot sw-synthpop" aria-hidden="true"></span>Mic</button>
      <button class="swatch" type="button" data-set-theme="techno" aria-pressed="false"><span class="swatch-dot sw-techno" aria-hidden="true"></span>Mixer</button>
      <button class="swatch" type="button" data-set-theme="eurodance" aria-pressed="false"><span class="swatch-dot sw-eurodance" aria-hidden="true"></span>Player</button>
    </div>
  </div>
</aside>

<main id="main">
  <!-- your app -->
</main>

<footer class="site-footer">
  <div class="wrap">
    <p class="footer-note">Built on the GoldenSunAI framework.</p>
    <nav class="footer-links" aria-label="Family">
      <a href="https://open.spotify.com/artist/6n4s5S0cGiMsW4oJvIwU2L" rel="noopener">NakoGold</a>
      <a href="https://github.com/Sukonik/goldensunai" rel="noopener">GoldenSunAI</a>
      <a href="https://sukonik.github.io/kikomix/" rel="noopener">KikoMix</a>
    </nav>
    <p class="footer-small">Recordings and samples never leave your device.</p>
    <p class="footer-small">© <span id="year">2026</span> GoldenSunDJ</p>
  </div>
</footer>

<script src="../js/shell.js"></script>
<script src="sampler.js"></script>
```

Ids the shell JS depends on — keep them exactly: `#menu-btn`, `#drawer`,
`#scrim`, `#session-chip`, `#session-chip-text`, `#year`, plus
`[data-drawer-close]` on the drawer close button and
`[data-set-theme]` on every swatch. shell.js guards every lookup, so a
missing piece degrades instead of throwing — but the contract is to
include them all.

### Swatch markup rules

- One `<button class="swatch" data-set-theme="NAME" aria-pressed="…">`
  per theme, NAME ∈ `master | house | synthpop | techno | eurodance`.
- Inside it, `<span class="swatch-dot sw-NAME">` renders the 28px circle
  in that theme's fixed accent (`.sw-master`, `.sw-house`,
  `.sw-synthpop`, `.sw-techno`, `.sw-eurodance` are defined in
  components.css and read the `--acc-*` tokens).
- The visible label is the app name. shell.js maintains `aria-pressed`
  for you — author it `false` (hub authors the active one `true`; JS
  corrects on load either way).

## 4. Theme API

```js
window.GSDJ.setTheme("techno");  // apply + persist + update swatches
window.GSDJ.theme();             // → current theme name, e.g. "techno"
```

Valid names only: `master`, `house`, `synthpop`, `techno`, `eurodance`.
Invalid names are ignored. You normally never call `setTheme` — the
drawer swatches do it. The per-theme tokens you can rely on in your CSS
(they change with the theme): `--bg`, `--bg-raised`, `--bg-card`,
`--bg-deep`, `--border`, `--border-strong`, `--text`, `--text-2`,
`--text-muted`, `--accent`, `--accent-strong`, `--accent-dim`,
`--accent-ink` (text on accent), `--focus`, `--glow`, `--rec` (record
red-pink), `--sheen` (metallic gold gradient — hero moments only, never
body text), `--frame-r` (card corner radius), `--rule-style` (border
style for hairlines), `--deco` (background pattern), `--frame-fx`
(offset shadow / frame treatment), `--kick` (content string with the
theme glyph — use as `content: var(--kick)`).

Fixed per-app accents, theme-independent: `--acc-master`,
`--acc-house`, `--acc-synthpop`, `--acc-techno`, `--acc-eurodance`, with
matching text-color utilities `.kick-master`, `.kick-house`,
`.kick-synthpop`, `.kick-techno`, `.kick-eurodance`.

## 5. Session chip API

The header chip is your app's live readout (REC state, BPM, runtime…).

Markup contract: `#session-chip` wrapper, `.chip-dot` span inside it,
`#session-chip-text` span inside it. The starting text comes from the
`data-chip` attribute on `#session-chip` (or on `<body>`); whatever you
author in the text span is what shows until you call `setChip`.

```js
window.GSDJ.setChip({ text: "● REC 0:42", live: true });  // dot turns rec-pink
window.GSDJ.setChip({ text: "126 BPM" });                  // text only
window.GSDJ.setChip({ live: false });                      // dot back to accent
```

`live: true` adds `.is-live` to the dot (rec color + glow). Both fields
are optional; omitted fields stay as they were.

## 6. Classes available to you

Layout & base: `.wrap` (72rem container), `.skip-link`,
`.visually-hidden`, `.tnum` (tabular numerals — use on every timer,
BPM and runtime), `.section` (vertical rhythm), `.deco-bg` (applies the
theme's `--deco` pattern as background-image), `hr` (hairline using
`--rule-style`, so techno gets dashed rules for free).

Shell: `.site-header`, `.site-header-inner`, `.brand`, `.wordmark`,
`.wordmark--sheen`, `.mark-spin` (slow-rotating mark; put an inline SVG
star inside a link or use it on the SVG itself with
`fill="currentColor"`), `.session-chip`, `.chip-dot`, `.chip-text`,
`.main-nav`, `.menu-btn`, `.icon-btn`, `.scrim`, `.drawer`,
`.drawer-top`, `.drawer-group`, `.swatches`, `.swatch`, `.swatch-dot`,
`.site-footer`, `.footer-links`, `.footer-note`, `.footer-small`.

Components: `.btn` (accent fill, `--accent-ink` text), `.btn--ghost`
(transparent, bordered), `.tiles` + `.tile` (card, `--frame-r` radius,
`--frame-fx` shadow) with `.tile-kick`, `.stat` with `.stat-num` +
`.stat-note`, `.module` with `.module-head` + `.module-kick` (bordered
panel for Mixer-style sections), `.flow` (hub workflow list),
`.field` (label + input/select/textarea, 44px, focus ring built in).
`input[type="range"]` already gets `accent-color: var(--accent)`.

Type/spacing tokens for your own CSS: `--fs-xs … --fs-3xl`,
`--space-1 … --space-12`, `--radius-sm/md/lg`, `--font-display`,
`--font-sans`, `--duration-fast` (120ms), `--duration-normal` (220ms),
`--ease`. Headings are Outfit automatically; body is Inter.

## 7. Rules

1. **Your CSS** goes in `<app>/<app>.css`, linked **after**
   `../css/responsive.css`. **Your JS** goes in `<app>/<app>.js`,
   loaded **after** `../js/shell.js`. Vanilla only, no dependencies,
   no build step.
2. **No hard-coded colors in your CSS.** Everything goes through the
   tokens in §4. If a component needs a value that has no token, use
   the closest token and flag it in your report — never paste a hex.
3. **Touch targets ≥ 44px**, pads and platters bigger. Every interactive
   element works at 390px wide first.
4. **Contrast pairs are already token-safe**: `--text` / `--text-2` /
   `--text-muted` on `--bg` / `--bg-raised` / `--bg-card`, and
   `--accent-ink` on `--accent` / `--accent-strong`. Stay inside those
   pairs and every theme stays legible.
5. Icon-only buttons get an `aria-label`. Images get `alt`. Interactive
   divs are not allowed — use real buttons.
6. Respect `prefers-reduced-motion` (base.css already neutralizes
   animations/transitions globally — don't re-enable them in app CSS).
7. Copy comes from README.md verbatim where the brief says so. No
   placeholder text of any kind.
