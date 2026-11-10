<div align="center">

<img src="assets/brand/emblem-gold-256.png" alt="GoldenSun emblem" width="120">

# GoldenSun DJ ☀️🎧

**Be the music.**
Get outside, find your lyrics, record what you hear, mix it like cookie batter, and play it out.

[**Live site**](https://sukonik.github.io/GoldenSunDJ/) · [Controller](https://sukonik.github.io/GoldenSunDJ/controller/) · [Weather](https://sukonik.github.io/GoldenSunDJ/weather/) · [Notes](https://sukonik.github.io/GoldenSunDJ/notes/) · [Brand notes](BRAND.md) · [Resources](RESOURCES.md)

*Built by Team GoldenSun. A GoldenSunAI product, working close with [NakoGold](https://sukonik.github.io/nakogold/index.html).*

</div>

---

## What it is

GoldenSunDJ is the home of the GoldenSun music bench: a set of small, touch-first tools that run entirely in your browser. Nothing to install, nothing uploaded. Open the link on your phone or iPad and play.

The idea follows one path, from the street to the stream:

> **Get out → Record → Produce → Master → Distribute → Mix → Play → Get found**

The tools are live for the steps that happen on your device. The rest link out to the platforms you already use (Suno, DistroKid, YouTube, Spotify, SoundCloud), and deeper hooks are planned.

## The tools

| Tool | The line | What it does |
| --- | --- | --- |
| **[Controller](controller/)** | *Build your controller.* | A minimalist full-screen DJ controller with 1 or 2 scratch pads. See below. |
| **[Weather](weather/)** | *Get outside. Find your lyrical inspiration.* | A DJ weather dashboard: your get-out score, best 3-hour window, wind and sound, rain risk, gear safety, UV, golden hour, air quality, 24-hour strip and 7-day outlook. |
| **[Notes](notes/)** | *What did you hear? Write it down, then record it.* | Lyrics, ideas, Suno prompts, setlists and gig notes, saved in your browser. |
| **[Mic](mic/)** | *Your mic is ready… use it.* | Record vocals and found sounds. Save as WAV, or send the take to the Sampler as a pad. |
| **[Sampler](sampler/)** | *When lightning strikes, record a sample!* | A 4×4 pad grid with a 16-step sequencer. Load your own sounds, export patterns as WAV. |
| **[Mixer](mixer/)** | *Mix it, like cookie batter.* 😉 | Two decks, crossfader, 3-band EQ, echo and touch scratch platters. |
| **[Player](player/)** | *Whatcha playin?* | A setlist builder with BPM, key, runtime and notes. Export or print, then play it live. |

The tools hand off to each other: Mic → Sampler → Mixer, and Player → Mixer. The weather page ties in too: when a storm rolls in, its verdict reads *"When lightning strikes, record a sample!"*

## The Controller

Built to feel great on an **iPad**, and to use as much of the screen as it can.

- **1 or 2 scratch discs** (the rotating pads). Two by default. Switch from the settings wheel.
- **Scratch disc.** Drag to scratch: the audio seeks by the angle you turn, and pitch bends with your speed. The disc spins at 33 rpm while a deck plays.
- **Per deck, by default:** Cue, Play/Pause, 4 hot cues (tap to set or jump, hold to clear), a tempo fader (±8%), a 3-band EQ, a level meter and a Load button for your own audio.
- **Center strip:** Echo, master volume and a crossfader. Status messages show here and clear themselves.
- **Tap the A or B tag on a deck** to open the deck menu:
  - **Library:** eight full-length tracks (about 3 minutes each) in the NAKO GOLD styles: **Gold, Trance, House, Techno, Pulsewave, Synthpop, Eurodance, Nightdrive**. They are arranged (intro, build, drop, breakdown, build, drop, outro) and synthesized on your device, so the first tap takes a few seconds.
  - **Load:** a file from your device (it never leaves it).
  - **Link:** search or browse recommended tracks from **[Audius](https://audius.co)**, a free music platform that needs no account or API key, and stream them onto the deck. Tracks belong to their artists and each result links back to Audius. A streamed track can be cached on your device (tap its waveform) for smooth scratching.
- **Demo loops:** short house and techno loops start on the decks for instant play; use the deck menu for full tracks.
- **Settings wheel (the gear button):** a round menu in three pages.
  - **Controls:** Decks (1 or 2), **EQ**, Tempo, Cues, Echo, Fader. **EQ 1** is the full slider rail (default). **EQ 2** is a compact one-row strip that frees width so the discs can be bigger. Tap again for EQ off.
  - **Add-ons** (all off until you add them, so the screen stays clean): **Wave** (a waveform strip per deck: beat bars, hot cue flags, loop region, elapsed and remaining time, drag to scrub, tap a flag to jump, and a **Zoom** close-up for precise cueing), **Sampler** (6 banks of 8 glowing pads: Drums, Hats and Perc, 808 and Bass, Stabs and Leads, Keys, Hits and Risers, with arrows, numbered bank chips and swipe), **FX** (its own drawer: an XY pad for filter and echo plus hold-to-use Echo, Brake, Filter and Gate), **Loop** (a − loop N + control, 1 to 32 beats, with a glowing Play button) and **Tips** (short skippable first-run tooltips).
  - **Look:** Material, Tilt, Themes and Full screen.
- **8 controller themes** (separate from the site theme): Night Club, Chrome Plate, Neon Grid, Gold Rush, Glacier, Magma, Violet Haze, Jade Rack. Deck A and deck B are color-coded, like real hardware.
- **Materials (semi-3D, CSS only):** *Matte*, *Carbon* (woven carbon fiber) and *Titanium* (brushed metal), with beveled buttons and metal discs.
- **Tilt:** on an iPad or iPhone the specular highlight moves as you tilt the device (it asks for motion access once). On a computer, the light follows your pointer.
- **Full screen:** in full screen mode or when installed to the Home Screen, the top bar shrinks to **Home** and **Menu** buttons, and everything else lives in the menu drawer.
- **Layouts for every screen:** three columns on tablets in landscape, stacked decks in portrait, and a compact layout for phones in landscape.

### Test it on an iPad

1. Open <https://sukonik.github.io/GoldenSunDJ/controller/> in Safari on the iPad.
2. Tap **Share → Add to Home Screen**. It then opens full screen like an app (the site ships a web app manifest and Apple web-app tags).
3. Tap the gear, then **Material → Carbon** or **Titanium**, then **Tilt** and allow motion access. Tilt the iPad to move the light across the metal.
4. Tap Play on a deck and drag the pad to scratch. Turn the iPad to try portrait and landscape.

To inspect on a Mac, connect the iPad by cable and use Safari's *Develop* menu. Scratching and tilt have only been tested in desktop browser emulation so far, so real-iPad feedback is welcome.

## Look and feel

- **Brand.** The GoldenSunAI "G" sun emblem is the logo and favicon. The wordmark is **GoldenSun DJ** set in Outfit, the same geometric style as the GoldenSun AI wordmark. The black emblem is also used as a mask, so it fills with the current theme's colors in the footer, the drawer and as watermarks. The hero emblem is a clean, solid shape on a transparent background whose color slowly shifts through the theme's colors.
- **Type.** Outfit for display, Inter for text, a monospace for small labels.
- **8 site themes** built around headphones and CDs, each with three colors and a pattern layer (disc grooves for CDs, waveform stripes for headphones):
  Golden Hour (default), Moonchrome, Prism Pop, Blue Hour, Amber Studio, Bubblegum Bass, Mint Drop, Ember Cans. Pick one from the theme dot in the header. Your choice is remembered.
- **Static on phones and iPads.** Touch devices (and visitors who prefer reduced motion) get a still, light build by default: no animations, a plain emblem image instead of the animated masked one, and no fixed full-screen pattern layers. Use **Menu → Motion → Animations** to turn motion on or off on any device.
- **Motion (desktop).** The weather page has an animated sky (sun and rays, moon and stars, clouds, rain, snow, lightning), a counting temperature and a filling score ring. The hero has a soft float, glow and rotating rings. All of it switches off for visitors who prefer reduced motion.
- **Voice.** Short, friendly and practical. Say what to do next, lead with the music. See [BRAND.md](BRAND.md).

## Weather and Notes

**Weather** uses [Open-Meteo](https://open-meteo.com/) (no API key). It loads for a default area on its own and only asks for your location when you tap *Use my location*. You can also search a city, save places and switch between °F/mph and °C/km/h. The header chip and the hub card both open the full dashboard.

**Notes** has five note types (Lyrics, Idea, Suno prompt, Setlist, Gig), BPM, key and tags, one-tap inserts (Verse, Pre, Chorus, Bridge, Hook, Outro), a Suno prompt template and a weather stamp. Notes autosave a draft, then save to a searchable list you can filter, open, copy, download as `.txt` or `.md`, or delete. Everything stays in your browser's localStorage.

## Version history

Each version is tagged in git (`git checkout v3`). The tags currently exist on the maintainer's machine; push them with `git push origin v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11`.

| Version | What it was |
| --- | --- |
| **v1** | Hub + Sampler, Mic, Mixer, Player on the BASE3 shell (GoldBrief + nakogold themes), GitHub Pages workflow. |
| **v2** | Tailwind v4 build, Y2K chrome styling, Verdana type stack, journey bar, weather chip. |
| **v3** | lbbikeclub-style pearl chrome UI, 8 working themes, fixed weather, per-app how-to and next-step, mobile layout fixes. |
| **v4** | Original 5×7 pixel display font and pixel-sun hero, more vivid themes, lighter rendering, idle-rendered Mixer demos. *(Pixel direction retired in v5; kept here for the record.)* |
| **v5** | GoldenSunAI emblem and wordmark as GoldenSunDJ, Inter/Outfit type, headphone and CD themes, DJ Weather dashboard, Notes, BRAND.md. |
| **v6** | Chrome emblem hero with effects, theme-colored sun marks, animated weather sky, unique theme names with pattern layers, and the **Controller** (1 or 2 scratch pads, settings wheel, 8 controller themes). |
| **v7** | Clean solid color-changing emblem on a transparent background (replacing the chrome cut-out), new coordinated page copy ("Be the music"), a featured Controller card, **Carbon** and **Titanium** materials with tilt-reactive light, Add to Home Screen support, and this documentation. |
| **v8** | **Mobile pass:** a static, light build on phones and iPads (no animations, plain emblem image, no fixed pattern layers) that fixes the home-screen crash, an **Animations on/off** switch in the menu, a responsive header and menu, 44 px touch targets across every page, safe-area support, and [RESOURCES.md](RESOURCES.md) with the controller projects we study. |
| **v9** | **Clean header and status:** one tidy row at every width (brand left, a clear *Menu* button, weather and theme chips that never overlap), the page nav moves into the menu below 1280 px, the cluttered header status chip is gone (status now lives in the page), the Controller's status line sits inside the center strip and clears itself, and the journey bar has soft edges. |
| **v10** | **Suno/Spotify-style header** (page links stay visible on tablets, with an *All tools* link to the menu, and a compact **Home + Menu** bar in full screen or installed mode). **Controller add-ons** you turn on from the settings wheel: waveform strips, a sampler + FX drawer with an XY pad, loop control and first-run tips. **EQ 1 / EQ 2** (full or compact) so the discs can be bigger. |
| **v11** | **Deck menu** on the A and B tags (Library of eight full-length NAKO GOLD style tracks, Load, and **Link** to search free music on Audius), **Sampler** and **FX** as separate add-ons with 6 sampler banks, a refreshed borderless FX drawer, and a much better **Wave** (beat bars, cue flags, loop region, zoom). |

## Under the hood

- **Tailwind CSS v4**, built in CI (`npm run build` writes `css/tw.css`; it is not committed). Theme colors live in `css/tokens.css` as three variables per theme (`--a` primary, `--b` highlight, `--c` deep) and everything else is derived from them.
- **Vanilla JavaScript** and the **Web Audio API** for the audio tools. No framework.
- **Responsive and touch-ready:** header and menu adapt from 320 px phones to iPad Pro, every button and link is at least 44 px tall on touch devices, the layout respects the iPhone notch and home bar, and the full path (home, Controller, Weather, Notes, Mic, Sampler, Mixer, Player) was audited at nine phone and iPad sizes in portrait and landscape.
- **Fast and light:** no backdrop blur, one static background layer, off-screen hub sections skip rendering, the Mixer and Controller demo loops are rendered only when the browser is idle (mono, 32 kHz), and a single animation loop runs only while something moves.
- **Private:** recordings, samples, notes and settings never leave your device. Weather requests send only coordinates to Open-Meteo, and only when you ask.
- **Accessible:** real buttons and labels, ARIA state on toggles, visible focus, keyboard nudge on the scratch pads, and reduced-motion support.

### Project layout

```
index.html            hub
controller/ weather/ notes/ mic/ sampler/ mixer/ player/   one folder per tool
css/                  tokens, base, components, responsive, hub (tw.css is generated)
js/shell.js           header, drawer, theme picker, weather chip, journey bar
js/demo-loops.js      synthesized demo loops shared by Mixer and Controller
assets/brand/         emblem PNGs and the mask used for theme-colored marks
src/tailwind.css      Tailwind entry (animations, utilities)
.github/workflows/    GitHub Pages deploy
BRAND.md              brand voice and identity for GoldenSunDJ
DESIGN.md, SHELL.md   the original v1 design plan and shell contract (historical)
```

### Run it locally

```bash
npm install
npm run build          # generates css/tw.css
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Use a local server (not `file://`) so the theme-colored logo masks load.

### Deploy

Pushing to `main` runs the **Deploy static site to Pages** workflow: install, `npm run build`, then publish the repository root. Pages must be set to **GitHub Actions** in the repository settings.

## Roadmap

- Real-iPad tuning of the Controller (scratch feel, tilt, layout) from hands-on feedback.
- A Web Audio scratch engine for true vinyl-style scratching (decode tracks to buffers for reverse play and instant scratching).
- A glass icon and favicon system: eight colored-glass icons with the black logo (one per site theme, interchangeable, default glass blue), plus white-logo variants.
- More Link sources (Internet Archive, Free To Use) and tempo detection for streamed tracks.
- More 3D materials and components for the Controller (knobs, jog rings, faders) in carbon and titanium.
- Suno, DistroKid, YouTube, Spotify and SoundCloud hooks beyond plain links; a mastering step.

## Resources

The controller projects, repos and tools we study are listed in **[RESOURCES.md](RESOURCES.md)**, with the ideas we may borrow and the licenses to check.

## Credits and licenses

Code is released under the license in [LICENSE](LICENSE). The GoldenSunAI name, emblem and wordmark belong to GoldenSunAI and are used here for the GoldenSunDJ product. Weather data by Open-Meteo.
