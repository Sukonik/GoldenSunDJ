# GoldenSunDJ — Resources

Projects, references and tools we look to while building GoldenSunDJ, and what we might borrow from each. **These are inspiration and learning material.** We do not copy their code or artwork. Check each project's own license before reusing anything, and credit the people who made them.

Last reviewed: 2026-11-09.

---

## 1. DJ controller projects

### AI DJ — [ujjwalredd/AI-DJ](https://github.com/ujjwalredd/AI-DJ) · MIT
A self-hosted autonomous DJ that builds a live set from a plain-language vibe, then performs it.
- 3D DJ booth scene with two decks, a mixer, crossfader, EQ knobs, cue lights, disc labels and audio-reactive lighting (React Three Fiber).
- Browser-side Web Audio: key-lock time stretching, filter, 3-band EQ, crossfader, delay and reverb sends.
- Audio analysis in the browser: BPM, key (Camelot), energy, phrasing, cue points and waveform peaks.
- Phrase-aligned transitions and live EQ/filter/echo "rides" while a track plays.

**Ideas for us:** audio-reactive deck lighting on the Controller; a waveform strip per deck; key and BPM analysis for the Player's setlist tags; phrase-aware "mix assist" as an optional, human-in-charge feature.

### Traktor S4 MK3 mods — [japoch/traktor-s4mk3](https://github.com/japoch/traktor-s4mk3)
A collection of mappings and links for the Native Instruments Traktor S4 MK3 (mapping editor CMDR, community mods, screen mods, a "Ninja" mapping).

**Ideas for us:** how pro controllers lay out hot cue, loop and sampler pad modes; per-deck FX assignment; mapping layers that let one surface do many jobs.

### Traktorino — [silveirago/traktorino](https://github.com/silveirago/traktorino)
A low-cost DIY MIDI controller built on an Arduino, with a video build series.
- Small control set: about 11 knobs, 3 faders, 13 buttons, 1 encoder, with LEDs for feedback.
- Open parts list, PCB and enclosure files.

**Ideas for us:** a deliberately small, readable control set (matches our "minimalist, add or remove features" goal); LED-style status feedback on every control.

### STM32 DJ Controller — [dagsion/STM32-DJ-Controller](https://github.com/dagsion/STM32-DJ-Controller)
A microcontroller-based controller that plays audio through a DAC and applies effects, with a Python script that turns audio into a C array.

**Ideas for us:** a reminder that low-latency feedback matters more than feature count; simple, responsive effects beat complicated ones.

### DJC-DIY — [mandiclab.com/projects/djc-diy](https://mandiclab.com/projects/djc-diy/)
A free, open-source, 3D-printed DJ controller that works with Mixxx (software GPL-3.0, hardware CERN-OHL-S-2.0).
- Two decks plus a mixer: per deck a jog wheel, play, cue, two performance pads and a tempo fader; in the mixer a low EQ knob, two FX knobs and a crossfader.
- The FX knobs can be remapped to other jobs (extra EQ, channel volume).
- Color is used to separate control types (for example dark jog wheels, red faders, pink buttons).

**Ideas for us:** remappable knobs from our settings wheel; a repeated, simple deck strip on each side; color-coding by function as well as by deck.

### Denon DJ controllers — [denondj.com/products/dj-controllers](https://www.denondj.com/products/dj-controllers.html)
Manufacturer reference for the high-end look we aim for (alongside Numark and Pioneer DJ). The category page itself is thin (it features the LC6000 family); detail lives on individual product pages.

**Ideas for us:** premium metal-and-carbon finishes (see our Carbon and Titanium materials), large jog platters, clean hierarchy of controls.

---

## 2. GitHub topics worth browsing

- [dj-controller topic](https://github.com/topics/dj-controller) — notable repos seen there:
  - **ArthurBeaulieu/Meax** — mix with a Pioneer DDJ-400 in a web browser (MIDI to the browser). Closest to what we do.
  - **fwcd/djcontroller.js** — a JavaScript/TypeScript library for talking to MIDI DJ controllers.
  - **medeiros-ts/open-effector** — an open-source DJ effects surface that runs as a web app in a phone browser. Relevant to our touch FX.
  - **gusgustavodj/kontrol-s8-protocol** — reverse-engineered notes on LEDs, displays and HID for a Traktor controller.
  - **ElHanko/mixxx-ddj-flx4-mapping**, **TRC-Loop/flx4py** — mappings and a Python interface for the Pioneer DDJ-FLX4 (pads, FX, LEDs).
  - **gbroeckling/cdj1000** — a Pioneer CDJ rebuilt as a USB-MIDI controller.
- [pioneer-dj topic](https://github.com/topics/pioneer-dj) — saved as a place to browse for Pioneer DJ mappings, tools and libraries. Not reviewed in detail yet.

---

## 3. Controller feature ideas (our backlog)

Drawn from the projects above, in rough priority order for the touch Controller:

1. **Performance pad modes** per deck: Hot Cue, Loop, Sampler (we have 4 hot cues today).
2. **Loop controls:** 1/2/4/8-beat loops and loop in/out.
3. **Sync and key lock:** match tempo between decks, keep pitch when tempo changes (the AI DJ project uses SoundTouch for this).
4. **LED-style feedback:** jog ring that shows position, pad lights that show state, audio-reactive glow.
5. **Waveform strip** per deck with cue markers.
6. **Remappable knobs:** the settings wheel lets you choose what each FX knob does.
7. **Web MIDI support:** use a real DDJ or Traktor controller with the same screen (Meax and djcontroller.js are good references).
8. **A real Web Audio scratch engine** for vinyl-style scratching on iPad.
9. **More materials:** carbon fiber and titanium knobs, jog rings and faders, with tilt-reactive light.

---

## 3b. Inspiration screenshots (shared by the team)

A set of DJ-app and website screenshots was shared as 3D and layout inspiration. The images themselves are third-party apps and sites, so they are **not stored in this repo**. What we noted:

- **Waveform strip on top of each deck** with track name, time and BPM. Minimal and readable.
- **Very large platters** with a glowing ring and little else on screen; Play as a big glowing round button in the bottom corners; a slim crossfader with small arrow buttons at the bottom center.
- **FX and Sampler overlay:** one button opens a full-width panel of big, glowing, color-coded pads (8 per page, with page dots), with Sampler and FX tabs and a clear close button.
- **Single-deck "CDJ" layout:** touch screen with waveform and browse buttons, a large jog wheel with a ring of lights, a tall tempo fader, Cue and Play/Pause, loop in / out / reloop, vinyl jog mode.
- **Pad-style layouts and tutorial hints:** a plain green tooltip that teaches "drag your finger on the turntable to scratch".
- **Spotify and Suno home pages:** simple top bar (logo left, a few links, one pill button), a single big headline, one clear action. A good model for a clean menu.

**From the two screen recordings (an iPad DJ app; not stored in this repo):**
- **Side-button drawers inside each deck** (FX, Pro, Pads, Mixer): one tap swaps the deck's face for a panel (a sampler grid with paging arrows, an FX picker with an XY pad, "pro tools" with sync, jump and hot cues) without leaving the screen.
- **Loop selector** per deck: a compact "− loop 4 +" control beside Cue.
- **Waveform strips** with a colored played-part and a playhead, plus track name, time and BPM at the top.
- **Center mixer:** BPM readout, two vertical channel faders with a shared level meter, a crossfader at the bottom, and a filter / bass / mid / high strip.
- **Guided first-run tips:** short green tooltips that teach one move at a time ("drag your finger on the turntable to scratch", "drag the crossfader to mix") with a way to skip.
- **Music browser:** tap the center of a platter to load a track from a simple list with tabs.
- **Skins and mixer styles** picker, and a "party mode" with colorful visuals.

**From recording 3 (settings and skins):**
- A **bottom pill tab bar** for settings (Profile, Tutorials, Skin, Settings, About) with the active tab filled in green: a model for the pages in our settings wheel.
- A **Settings list of plain toggles** (auto BPM, auto sync, auto repeat, advanced options), each with a help bubble.
- **Skin picker** with live previews ("Pro mixer" default, "Animated mixer"): a model for choosing Controller themes and materials with a preview.
- **Rim lights on the platter** that glow in color and travel with playback.

What fits GoldenSunDJ: the waveform strip, glowing corner Play buttons, the overlay of big color pads, and the single-deck layout. What does not: heavy skeuomorphic chrome and dense screens; our controller stays minimal and added-to-by-choice.

## 4. Inspiration sites and repos used for GoldenSunDJ itself

- [lbbikeclub](https://github.com/Sukonik/lbbikeclub) — the pearl-chrome UI, three-color theme system and weather chip that GoldenSunDJ's look follows.
- [GoldenSunAI](https://github.com/Sukonik/goldensunai) — brand, emblem, wordmark style and design tokens.
- [nakogold](https://github.com/Sukonik/nakogold) · [site](https://sukonik.github.io/nakogold/index.html) — the artist and catalog GoldenSunDJ works close with.
- [wywo](https://github.com/Sukonik/wywo) — the notes concept behind our Notes page.
- [weather-app](https://github.com/Sukonik/weather-app) and [goldbrief](https://github.com/Sukonik/goldbrief) — weather and design-system concepts.
- [MusicRadar: best DJ controllers](https://www.musicradar.com/news/the-best-dj-controllers-in-world-today) — a survey of current controllers; guide for layout and feature choices.
- Numark, Pioneer DJ and Denon DJ product lines — the "mix of the three" look we describe in BRAND.md.

## 4b. Free music sources for the Link tab (researched 2026-11-10)

Tested from our own environment (search, CORS headers and streaming ranges):

| Source | Keyless? | Verdict |
| --- | --- | --- |
| **[Audius](https://api.audius.co/docs)** | Yes. Add `app_name=GoldenSunDJ`. | **In use.** Search, trending by genre, and `/v1/tracks/{id}/stream` all work from a browser (CORS `*`, range requests supported, so it plays through the Web Audio chain). Full-length independent tracks. Rights belong to the artists, so we show the artist, link back to Audius and credit it. |
| **[Internet Archive](https://archive.org/advancedsearch.php)** | Yes. | Search works from a browser (CORS `*`). Huge collection; licenses vary per item (filter for Creative Commons). Good next source. |
| **iTunes Search** | Yes. | 30-second previews only. Useful for artwork and metadata, not for DJing. |
| **MusicBrainz** | Yes (send a user agent). | Metadata (artist, release, tags), not audio. Could help tempo and key hints. |
| **[Free To Use](https://freetouse.com/music)** | Site is open; a public API was not verified. | Worth a closer look for direct downloads, with license limits. Not integrated. |
| Jamendo, Spotify, Deezer, Apple Music | Need a key or give previews only. | Not suitable for a keyless build. |

Notes: streamed tracks are played through an `<audio>` element. Tap a streamed track's waveform to cache it on the device, which makes scratching, loops and cues instant. Decoding every track to an audio buffer (best for reverse play) uses a lot of memory on phones, so it stays on the roadmap.

## 4c. Icon direction

**Material Design + Italian blown glass (Murano).** Material gives the tile (rounded square, soft elevation, simple geometry); blown glass gives the surface (translucent color that is dark at the thick rim and luminous in the thin center, a window highlight, lattimo swirls, trapped air bubbles). Eight colors match the eight site themes; Glass Blue is the default. Generated with `tools/make_glass_icons.py` from our own emblem mask.

## 4d. Scratch engine notes

- Scratching needs random-access playback at any speed, including backward, which an `<audio>` element cannot do (seeking is slow and glitchy, negative speeds are not allowed). So we decode a light **mono, 22 kHz copy** of the track (a few MB for a 3-minute track) and play it from an **AudioWorklet** that reads samples with linear interpolation and smooths the speed.
- A tiny **platter model** (finger velocity / 33 rpm, one-pole smoothing for weight, motor spin-up on release) turns touch into speed, so identical settings always feel identical. Presets: Natural, Tight, Heavy, Bend.
- The normal player keeps running silently during a scratch, which is what makes **Slip mode** possible.
- Limits: tracks over about 30 MB use Bend instead; streamed tracks are prepared once they start playing.
- Patterns are short speed-and-gate scripts (in beats) played by the worklet over the track, so each one sounds the same every time and scales with the deck's tempo. Tempo detection runs on the same mono copy (kick and onset energy at 100 frames per second, autocorrelation with harmonic weighting, then a beat-grid phase search).
- Ideas: crossfader-cut helper, recording your scratch, more patterns.

## 5. Tools and data we use

- [Open-Meteo](https://open-meteo.com/) — free weather, geocoding and air-quality APIs (no key).
- [Tailwind CSS v4](https://tailwindcss.com/) — styling and animation utilities, built in CI.
- [Outfit](https://fonts.google.com/specimen/Outfit) and [Inter](https://fonts.google.com/specimen/Inter) — typefaces (Google Fonts).
- Web Audio API, Pointer Events and DeviceOrientation — audio, scratching and tilt.

## 6. Platforms the path connects to

Suno, DistroKid, YouTube, Spotify and SoundCloud (links today, deeper hooks planned). See the hub's "Your platforms" section.

---

*Want to add a resource? Put it in the right section with a one-line "why it matters" and the license if it is code.*
