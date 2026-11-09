# GoldenSunDJ ☀️🎧

> **Live site:** [sukonik.github.io/GoldenSunDJ](https://sukonik.github.io/GoldenSunDJ/)

Software for music, movement and everyday sound. GoldenSunDJ is the home of the GoldenSun music bench: **Weather** to get out, **Notes** for lyrics and ideas, **Controller** for a full-screen touch DJ rig, **Mic** to record, **Sampler** to produce, **Mixer** to mix and **Player** to play. A GoldenSunAI product, working close with [NakoGold](https://sukonik.github.io/nakogold/index.html) and AI tools like Suno.

GoldenSunDJ is a launcher: open the hub, pick the tool the moment calls for, and it loads — nothing installs, everything runs in the browser.

---

## The Controller

A minimalist, full-screen DJ controller built to feel great on iPad and iPhone. Defaults to **two scratch pads** with a switch to **one**. Drag a pad to scratch, tap Cue / Play, use hot cues, EQ, tempo and echo, and shape the layout from the **settings wheel**: add or remove EQ, Tempo, Cues, Echo and Fader, or open the **8 controller themes** (Night Club, Chrome Plate, Neon Grid, Gold Rush, Glacier, Magma, Violet Haze, Jade Rack), separate from the site theme. Load your own audio on each deck or use the built-in demo loops.

## The Apps

### 🥁 GoldenSunSampler

An MPC MkII-style pad board in your browser. Tap out beats on a 4×4 grid, load your own sounds onto any pad, chop samples, and build patterns with the step sequencer. Export beats and samples as WAV or MP4. No install — just open the link and play.

### 🎙️ GoldenSunMic

Your pocket recording studio. Hit record and capture vocals, freestyles, and found sounds straight from the mic — then save them as WAV or MP4, or send them straight into GoldenSunSampler as fresh pads. Clean takes anywhere, no gear required.

### 🎚️ GoldenSunMixer

A full touch DJ mixer that goes anywhere. Two decks, a crossfader, and per-channel EQ and filters — plus platters you can actually scratch with your fingers. Built modular: swap the FX rack, sampler strip, and other pieces in and out to make it yours.

### 📋 GoldenSunPlayer

The SetList maker, spun out of KikoMix. Drag tracks into running order, tag each with BPM and key so transitions blend, watch total runtime build as you go, and add performance notes. Export or share the finished set — then play it live.

---

## How They Interweave

The four apps are one workflow, not four islands:

- **GoldenSunMic → GoldenSunSampler** — record a sound, use it as a pad.
- **GoldenSunSampler → GoldenSunMixer** — beats you build load onto the decks.
- **KikoMix → GoldenSunPlayer** — setlists are built from the KikoMix catalog.
- **GoldenSunPlayer → GoldenSunMixer** — the set you planned is the set you perform.

All four share one design, one family navigation, and one source well:

- **[NakoGold](https://open.spotify.com/artist/6n4s5S0cGiMsW4oJvIwU2L)** — the artist, the catalog, the reason the bench exists.
- **[GoldenSunAI](https://github.com/Sukonik/goldensunai)** — the framework and design system underneath.
- **[KikoMix](https://sukonik.github.io/kikomix/)** — the player and catalog the setlists draw from.

## Design

Brand notes: **[BRAND.md](BRAND.md)** (adapted from the GoldenSunAI brand kit). The look is a clean, dark, Y2K-chrome interface in the spirit of lbbikeclub: GoldenSunAI emblem and wordmark, Outfit + Inter type, soft theme glow, and 8 headphone and CD colorway themes (Golden Hour, Moonchrome, Prism Pop, Blue Hour, Amber Studio, Bubblegum Bass, Mint Drop, Ember Cans). Touch-first, responsive from phone to desktop, reduced motion respected.

## Version history

Each version is tagged in git (`git checkout v3`).

| Version | What it was |
| --- | --- |
| **v1** | Hub + Sampler, Mic, Mixer, Player on the BASE3 shell (GoldBrief + nakogold themes), GitHub Pages workflow. |
| **v2** | Tailwind v4 build, Y2K chrome styling, Verdana type stack, journey bar, weather chip. |
| **v3** | lbbikeclub-style pearl chrome UI, 8 working themes, fixed weather, per-app how-to and next-step. |
| **v4** | Original 5×7 pixel display font and pixel-sun hero, more vivid themes, lighter rendering, idle-rendered Mixer demos. *(Pixel direction retired in v5; kept here for the record.)* |
| **v5** | GoldenSunAI emblem + wordmark as GoldenSunDJ, Inter/Outfit type, headphone and CD themes, DJ Weather dashboard, Notes, BRAND.md. |
| **v6** | Chrome GoldenSun emblem hero with effects, theme-colored sun marks, animated weather sky, unique theme names, and the **Controller** (1 or 2 scratch pads, settings wheel, 8 controller themes). |

## Tech

- Tailwind CSS v4 (built in CI via `npm run build`) over a three-color theme system, with Inter + Outfit type.
- Vanilla JavaScript + Web Audio API for the audio apps. Weather via Open-Meteo (no key; location only when you ask). Notes live in your browser's localStorage.
- Mic capture via `getUserMedia` (works over HTTPS on GitHub Pages).
- WAV export encoded in-browser; MP4 where the browser's recorder supports it.
- Your recordings and samples live on your device — nothing is uploaded anywhere.

## Roadmap

1. **Hub + shell** — GoldenSunDJ launcher on the BASE3 base.
2. **GoldenSunMic** — record, trim, export WAV/MP4.
3. **GoldenSunSampler** — pad board + step sequencer; consumes Mic captures.
4. **GoldenSunMixer** — decks, crossfader, scratch platters, modular slots.
5. **GoldenSunPlayer** — setlist builder wired to the KikoMix catalog.

## Status

**v1.0 — built 2026-11-07.** The hub and all four apps are live, working pages (no mockups):

- **Hub** — launcher with spinning star mark, sheen wordmark, live session chip, drawer navigation with theme swatches, and tiles for all four apps.
- **GoldenSunSampler** — 4×4 pads with a fully synthesized drum kit, per-pad volume and pitch, load your own sounds onto any pad (file picker or drag and drop), a 16-step sequencer with tempo control, and one-bar pattern export as WAV.
- **GoldenSunMic** — mic recording with a live level meter, a takes list with playback, WAV export, and original-format download.
- **GoldenSunMixer** — two decks with synthesized demo loops built in (plus your own files), 3-band EQ per deck, crossfader, touch platter scratching, and an echo FX module.
- **GoldenSunPlayer** — setlist builder with drag-to-reorder, BPM/key/duration/notes per track, total-runtime stats, localStorage saving, and text/JSON export plus a print view.

Each app wears its own genre theme from DESIGN.md on the shared BASE3 shell, and the drawer's theme swatches re-skin any page live. Deployment runs through GitHub Actions (`.github/workflows/pages.yml`); the site goes live at the link above once Pages is set to Actions in the repo settings.
