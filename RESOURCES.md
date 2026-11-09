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

## 4. Inspiration sites and repos used for GoldenSunDJ itself

- [lbbikeclub](https://github.com/Sukonik/lbbikeclub) — the pearl-chrome UI, three-color theme system and weather chip that GoldenSunDJ's look follows.
- [GoldenSunAI](https://github.com/Sukonik/goldensunai) — brand, emblem, wordmark style and design tokens.
- [nakogold](https://github.com/Sukonik/nakogold) · [site](https://sukonik.github.io/nakogold/index.html) — the artist and catalog GoldenSunDJ works close with.
- [wywo](https://github.com/Sukonik/wywo) — the notes concept behind our Notes page.
- [weather-app](https://github.com/Sukonik/weather-app) and [goldbrief](https://github.com/Sukonik/goldbrief) — weather and design-system concepts.
- [MusicRadar: best DJ controllers](https://www.musicradar.com/news/the-best-dj-controllers-in-world-today) — a survey of current controllers; guide for layout and feature choices.
- Numark, Pioneer DJ and Denon DJ product lines — the "mix of the three" look we describe in BRAND.md.

## 5. Tools and data we use

- [Open-Meteo](https://open-meteo.com/) — free weather, geocoding and air-quality APIs (no key).
- [Tailwind CSS v4](https://tailwindcss.com/) — styling and animation utilities, built in CI.
- [Outfit](https://fonts.google.com/specimen/Outfit) and [Inter](https://fonts.google.com/specimen/Inter) — typefaces (Google Fonts).
- Web Audio API, Pointer Events and DeviceOrientation — audio, scratching and tilt.

## 6. Platforms the path connects to

Suno, DistroKid, YouTube, Spotify and SoundCloud (links today, deeper hooks planned). See the hub's "Your platforms" section.

---

*Want to add a resource? Put it in the right section with a one-line "why it matters" and the license if it is code.*
