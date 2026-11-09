# GoldenSunDJ 🎧

> **Live site:** [sukonik.github.io/GoldenSunDJ](https://sukonik.github.io/GoldenSunDJ/)

One home for the whole GoldenSun music bench. GoldenSunDJ launches each app as you need it: Sampler for beats, Mic for recording, Mixer for live touch mixing and scratching, Player for setlists. All four interwoven, sourced from NakoGold, GoldenSunAI, and KikoMix.

GoldenSunDJ is a launcher: open the hub, pick the tool the moment calls for, and it loads — nothing installs, everything runs in the browser.

---

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

Full plan: **[DESIGN.md](DESIGN.md)**. In short, the system is assembled from three of Nathan's own projects:

- **Formatting base — GoldBrief's BASE3 UI**: night-black surfaces, neon-yellow master accent, Outfit + Inter two-font system, BASE3 type/spacing scales. All identity lives in tokens; structure never changes.
- **Character — nakogold V4**: each app gets its own genre theme (Sampler = house amber, Mic = synthpop pink, Mixer = techno lime, Player = eurodance gold ★), plus the metallic gold sheen for hero moments.
- **Components — lbbikeclub**: live session chip in the header, drawer navigation, theme swatches, stat blocks, spinning mark.

Touch-first, responsive from phone to desktop, reduced motion respected.

## Tech

- Tailwind CSS v4 (built in CI via `npm run build`) over the BASE3 tokens, with Y2K chrome styling and a Verdana type stack (Verdana / Verdana Pro where installed, DejaVu Sans fallback).
- Vanilla JavaScript + Web Audio API for the audio apps; weather via Open-Meteo (location only on tap).
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
