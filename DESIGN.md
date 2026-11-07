# GoldenSunDJ — Design Plan

One design system for the hub and all four apps, assembled from three of Nathan's own projects:

- **Formatting base: GoldBrief's BASE3 UI** (`Sukonik/goldbrief`) — structure, scales, and the tokens philosophy.
- **Character: nakogold V4** (`Sukonik/nakogold`) — per-app genre themes and the metallic gold sheen.
- **Components: lbbikeclub** (`Sukonik/lbbikeclub`) — live-data chip, drawer nav with theme swatches, stat blocks, spinning mark.

---

## 1. BASE3 formatting (from GoldBrief)

The rule that runs everything: **structure and behavior live in unstyled primitives; ALL identity lives in tokens.** Swap the tokens, keep the primitives — an app re-skins without a single markup change.

- **Surfaces:** night black — `#050504` (bg), `#0a0908` (raised), `#121009` (card), `#1a160e` (deep), line `#2a2418`.
- **Master accent:** BASE3 neon yellow `#ffe81a` (bright `#fff45c`, dim `#d4c200`), glow `rgba(255, 232, 26, 0.45)`.
- **Neon traces, small doses only:** cyan `#00e5ff`, magenta `#ff2ea6`.
- **Text:** `#f6f1e6` primary, `#c9c0a8` secondary, `#8f8672` muted, `#171300` on accent.
- **Two fonts, no third family:** **Outfit** (display — wordmark, headlines, app titles) + **Inter** (reading — controls, labels, data; tabular numerals for BPM/timers). Helvetica/Arial fallbacks.
- **Type scale:** 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.875 / 2.5 / 3.25 rem. Reading measure 36rem.
- **Spacing scale:** 0.25 → 6rem in the BASE3 steps. **Container** 72rem.
- **Shape:** radii 6 / 12 / 20px (apps may override via theme — see §2).
- **Motion:** 120ms fast / 220ms normal, ease `cubic-bezier(0.2, 0.7, 0.2, 1)`, reduced motion respected.
- **Brand habits (from GoldBrief's BRAND.md):** wordmark stays live HTML text; favicon and touch icons sit on the black tile; clear space around marks, never stretched or rotated.

## 2. Per-app themes (from nakogold V4)

nakogold's trick: semantic tokens only (`bg / surface / ink / accent / sheen / kick / deco / frame`), and each genre is a full token set behind a `data-theme` attribute — "a style is one line." GoldenSunDJ gives **each app its own genre theme** on the shared BASE3 structure:

| App | Theme | Accent | Kick | Character |
| --- | --- | --- | --- | --- |
| **Hub** | BASE3 master | neon yellow `#ffe81a` | ♪ | Night black, gold sheen wordmark |
| **Sampler** | house | warm amber `#ffb876` | ● | Rounded frames (22px), sun-ray deco |
| **Mic** | synthpop | pink `#ff8bdb` | ✦ | Pill shapes, scanline deco, offset shadow |
| **Mixer** | techno | lime `#c8ff62` | // | Sharp corners (3px), blueprint grid deco, dashed rules |
| **Player** | eurodance | gold `#ffdf62` | ★ | Diagonal stripe deco, hard offset frame — the Nako Gold star |

- **Metallic gold sheen** (nakogold's signature gradient `#fff3c8 → #efc466 → #b98a30 → #f7da8c`) is reserved for the hub wordmark, the Player's star, and hero moments — never body text.
- Themes change accent, sheen, radius, deco pattern, and kick glyph. Layout, spacing, and type never change — that's the BASE3 guarantee.
- A theme switcher (see §3) lets the user re-skin an app live; the app default above is the starting point, not a cage.

## 3. Components (from lbbikeclub)

- **Live chip in the header** — lbbikeclub's weather chip (status dot + live values) becomes GoldenSunDJ's session chip: ● REC state in Mic, current BPM in Mixer, total runtime in Player.
- **Drawer navigation with scrim** — grouped links, one thumb reach on mobile, same as the bike club's.
- **Theme swatches in the drawer** — lbbikeclub's swatch row is how users flip the §2 themes.
- **Stat blocks** — big number + small note (bike club's `stat-num` / `stat-note`): runtime, BPM, sample count, set length.
- **Spinning mark** — the club's wheel-spin becomes a slowly spinning vinyl/star in the hub hero and the Mixer's platters.
- **Accessibility habits carried over:** skip-link first, labeled icon buttons, hairline rules instead of heavy borders.

## 4. Rules

1. Tokens first — no hard-coded colors in components, ever.
2. One accent glows at a time; cyan/magenta appear only as traces.
3. Touch targets ≥ 44px; pads and platters are the biggest things on their screens.
4. Every app works at 390px wide before it works anywhere else.
5. If it isn't in GoldBrief's BASE3, nakogold V4, or lbbikeclub — it needs a reason to exist.
