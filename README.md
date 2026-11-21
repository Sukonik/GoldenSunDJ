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
- **Scratch disc.** Drag to scratch. A real scratch engine plays a light decoded copy of the track through an audio worklet, so it can run at any speed, forward or backward, with no glitches. A small platter model makes it repeatable: finger speed sets playback speed, a held finger stops the record, and letting go spins the motor back up. The disc spins at 33 rpm while a deck plays. Until a track is ready (or if it is too long), the disc uses **Bend**, a gentle pitch nudge.
- **Scratch feel (wheel → Scratch):** presets **Natural** (default), **Tight**, **Heavy** and **Bend**, plus Sensitivity, Weight and Return time sliders, **Stop on touch** and **Slip mode** (let go and the track jumps back to where it would have been, so you stay on the beat). The same settings give the same result every time.
- **Per deck, by default:** Cue, Play/Pause, 4 hot cues (see *Cue and hot cues* below), a tempo fader (±8%), a 3-band EQ, a level meter and a Load button for your own audio.
- **Center strip:** Echo, master volume and a crossfader. Status messages show here and clear themselves.
- **Tap the A or B tag on a deck** to open the deck menu:
  - **Library:** eight full-length tracks (about 3 minutes each) in the NAKO GOLD styles: **Gold, Trance, House, Techno, Pulsewave, Synthpop, Eurodance, Nightdrive**. They are arranged (intro, build, drop, breakdown, build, drop, outro) and synthesized on your device, so the first tap takes a few seconds.
  - **Load:** a file from your device (it never leaves it).
  - **Audius:** search or browse recommended tracks from **[Audius](https://audius.co)**, a free music platform that needs no account or API key, and stream them onto the deck. Tracks belong to their artists and each result links back to Audius. A streamed track can be cached on your device (tap its waveform) for smooth scratching.
- **Tempo detection.** Tracks without a known tempo (your files and Audius streams) are analysed automatically once they are ready, and the BPM shows with an "auto" tag. The beat grid on the waveform and loop snapping follow it. **Tap the BPM number four times** (or more) on a deck to set the tempo and beat by hand. In my tests the detector found all four generated tracks I checked to within 0.5 BPM; real recordings with swing, tempo changes or no clear kick can be harder, which is what tap tempo is for.
- **Playback safety.** Moving EQ, tempo, faders or effects never stops a track. Held effects (Echo, Brake, Filter, Gate, XY) let go if your finger lifts anywhere, the page loses focus or the app is hidden; the audio engine restarts itself if iOS suspends it; and a watchdog nudges a deck that says it is playing but has stopped moving.
- **Demo loops:** short house and techno loops start on the decks for instant play; use the deck menu for full tracks.
- **Settings wheel (the gear button):** a round menu in three pages.
  - **Controls:** Decks (1 or 2), **EQ**, Tempo, Echo, Fader, Scratch feel. **EQ 1** is the full slider rail (default). **EQ 2** is a compact one-row strip that frees width so the discs can be bigger. Tap again for EQ off.
  - **Add-ons** (turn on only what you need; everything except Hot cues starts off): **Hot cues** (the 1 2 3 4 row, on by default, turn it off to give the discs and the other add-ons more room), **Patterns** (a Scratch drawer per deck with eight one-tap scratches: Baby, Chirp, Transform, Tear, Flare, Scribble, Brake and Backspin, timed to the deck's tempo; they play on top of the track and drop you back on the beat), **Wave** (a waveform strip per deck: beat bars, hot cue flags, loop region, elapsed and remaining time, drag to scrub, tap a flag to jump, and a **Zoom** close-up for precise cueing), **Sampler** (6 banks of 8 glowing pads: Drums, Hats and Perc, 808 and Bass, Stabs and Leads, Keys, Hits and Risers, with arrows, numbered bank chips and swipe), **FX** (its own drawer: an XY pad for filter and echo plus hold-to-use Echo, Brake, Filter and Gate), **Loop** (a − loop N + control, 1 to 32 beats, with a glowing Play button) and **Tips** (short skippable first-run tooltips).
  - **Look:** Material, Tilt, Themes and Full screen.
- **8 controller themes** (separate from the site theme): Night Club, Chrome Plate, Neon Grid, Gold Rush, Glacier, Magma, Violet Haze, Jade Rack. Deck A and deck B are color-coded, like real hardware.
- **Materials (semi-3D, CSS only):** *Matte*, *Carbon* (woven carbon fiber) and *Titanium* (brushed metal), with beveled buttons and metal discs.
- **Tilt:** on an iPad or iPhone the specular highlight moves as you tilt the device (it asks for motion access once). On a computer, the light follows your pointer.
- **Full screen:** in full screen mode or when installed to the Home Screen, the top bar shrinks to **Home** and **Menu** buttons, and everything else lives in the menu drawer.
- **Layouts for every screen:** three columns on tablets in landscape, stacked decks in portrait, and a dedicated **phone-in-landscape layout** (below).
- **Phone in landscape.** On a phone turned sideways (full screen from the Home Screen, or inside Safari with its address bar) each deck is rearranged instead of squeezed: a slim top bar, a big disc with the tempo fader beside it, **hot cues as a 2×2 grid and big Play / Cue buttons in a side column**, and the EQ as one compact row under the disc. The header shrinks to 44 px, the center strip is narrower, and with the default setup nothing scrolls (on a 844×390 phone the disc is about 195 px, on a 926×428 phone about 236 px, and about 136 px even inside Safari with its address bar). The EQ switches to the compact row in this layout whichever EQ mode you chose. With every add-on on at once in a very short window, the deck scrolls on its own instead of anything overlapping.

### SpotifyNinja (experimental, a separate mode)

The deck menu has a fourth tab, **Spotify**. It never changes anything by itself: opening it only shows the prompt **"Switch to SpotifyNinja Controller?"**. GoldenSun Controller (Library, Load, Audius, the Web Audio engine, scratching) stays the default every time you open the page.

- **Same surface, different adapter.** In SpotifyNinja mode the controller looks the same and its controls send tiny JSON packets (`gsdj:command`, `gsdj:state`, `gsdj:modechange` browser events) to an adapter. The packet contract does not mention Spotify, so another adapter could use it later.
- **A specialized controller, not a disabled one.** Spotify protects its audio, so GoldenSunDJ never touches the sound. Instead every GoldenSun control is rebuilt as a **Ninja control**: it looks and feels like the DJ control, but only sends the transport commands Spotify allows (play, pause, seek, volume, load). Labels and accent colors change when SpotifyNinja is active (**black and gold for the live deck, Spotify green for the next track**), and nothing is left as a dead grey control. The only things that stay unavailable are real tempo change, EQ, effects on the sound, and overlapping two Spotify tracks.
- **The mode badge** is the shuriken (the *ninja star* icon), beside "SpotifyNinja", inside the Track circle button, and at the center of Deck A's disc (it turns gently while Spotify plays; still when reduced motion or Motion off is set). The ninja character appears in the *Switch to SpotifyNinja Controller?* panel and in the not-connected state. The icons are masks, so they take the accent color (`assets/ninja/`).
- **Return any time:** *Return to GoldenSun Controller* is in the Spotify tab, and **gear → Controls → Exit Ninja** does the same, without reloading. The mode lives in the browser session only, so a new visit always starts on GoldenSun.
### Spotify connection (sign in, search, load)

The **Spotify** tab can connect to your Spotify account, search tracks and load them on Deck A, like the Audius tab does. It needs three things:

1. **A Spotify Premium account.** Spotify only lets Premium accounts play music inside a web page (their Web Playback SDK rule).
2. **A free Spotify app (one-time, by the site owner).** Create one in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), add this **exact Redirect URI**, then give GoldenSunDJ the app's **Client ID**:
   ```
   https://sukonik.github.io/GoldenSunDJ/controller/spotify-callback.html
   ```
   Put the Client ID in `controller/spotify-config.js` (`clientId`), or paste it into the Spotify tab (it is kept in your browser only). A Client ID is public. **No client secret is ever used or stored.** New Spotify apps start in *development mode*, where each account that should be able to log in must be added under **User Management** in the dashboard.
3. **Sign in once per browser session.** Tap **Connect Spotify**; you are sent to Spotify's own page (your password is only ever typed there) and come back to the Controller.

How it works: Authorization Code with **PKCE** (Spotify's recommended flow for a static site), requesting only `streaming`, `user-read-private`, `user-read-email`, `user-read-playback-state`, `user-modify-playback-state` and (from v22, for Playlists and Liked Songs, read-only) `playlist-read-private` and `user-library-read`. Tokens stay in session storage (they are gone when the browser session ends) and refresh automatically. Search uses the Spotify Web API; playback uses the official Web Playback SDK, which makes this page a Spotify device. **Connect Spotify / Switch to SpotifyNinja / Disconnect Spotify / Return to GoldenSun Controller** are all in the tab, and after login it says *Connected as <name>*.

The tab also has **genre chips** (Gold, Trance, House, Techno, Pulsewave, Synthpop, Eurodance, Nightdrive) that list tracks for each style as soon as you are connected, plus a search box. Spotify limits how many results one search may return, so GoldenSunDJ asks for 10 and automatically falls back to smaller sizes if Spotify says the limit is invalid. Spotify no longer gives apps its 30-second preview clips, so results are listed to **Load** (full track through SpotifyNinja), not previewed.

Tap **Load** on a result: if you are still on GoldenSun Controller, the Spotify tab asks you to press **Switch to SpotifyNinja** first, then loads the track on Deck A. Without a connection, SpotifyNinja runs as a silent preview so you can try the controls.

Honest status: the login, token exchange (including the PKCE check), search, device start-up, load and playback commands are tested against **mocked** Spotify servers and a mocked player. They have not yet been run against a live Spotify account. On iPhone and iPad, sign in from a Safari tab first; a Home Screen app may not return to itself after the Spotify login page. Ninja Scrub, the timeline, the Prep Deck, the Up next queue, Ninja Switch, Ninja FX and Ninja Pads, and the Playlists and Liked Songs lists are tested the same way (mocked Spotify, headless browser at phone, tablet and landscape sizes), but not yet by hand on a real iPad or iPhone with a Premium account. Fade timing, the feel of the scrub, and Spotify's reaction to quick volume commands are the things to check first.

### Ninja controls (the "imitation crab" DJ controls)

| GoldenSun control | SpotifyNinja version | What it really does |
|---|---|---|
| Scratch | **Ninja Scrub** | Drag the disc to preview a position, then seek once on release. Scrub Sensitivity sets how much song one turn covers. |
| FX | **Ninja FX** | Transport effects: **Smoke Fade** (fade out, then pause), **Shadow Mute** (hold to mute), **Shuriken Skip** (cut to the next track), **Vanish** (pause now, tap again to return) and **Teleport** (jump to your Cue point). |
| Sampler | **Ninja Pads** | Pads become commands, no sound of their own. Bank *Cues*: Cue 1 to 4, −10 s, +10 s, Mute, Fade. Bank *Moves*: Restart, Repeat, Previous, Next, Shuffle, Up next. |
| Tempo | **Ninja BPM** | A big **TAP** button (tap four times) and the BPM readout. It powers beat jumps and calculated loop sizes without pretending to change playback speed. |
| Master | **Spotify Master** | Spotify's playback volume where supported. On iPhone and iPad a web page cannot change Spotify's loudness, so a note points to the device volume buttons. |
| Crossfader | **Ninja Switch** | Fades the live track down, loads the prepared track at its start point, then fades up. It is sequential, never two tracks at once. Drag the lever to NEXT and let go, or press **Switch** on Deck B. |
| EQ knobs | **Ninja Macros** | **Jump** (beat jump size), **Fade** (fade length, 0.5 to 8 s) and **Scrub** (sensitivity). They sit where the EQ is and follow the EQ 1 / EQ 2 setting. Saved on your device. |
| Deck B | **Prep Deck** | The next track: its title, a start point and its four cue slots. See below. |

Ninja FX and Ninja Pads open from the deck buttons even when the Sampler and FX add-ons are off. Fades and mutes are volume commands. They lag a little (Spotify answers over the network) and on iPhone and iPad they may not be audible at all, because iOS ignores web-page volume. Smoke Fade still times the pause.

#### Prep Deck and Up next

- In the Spotify tab every result has **Load** (play now on Deck A), **Prep** (make it the next track on Deck B) and **Queue** (add it to the Up next list). Playlists and Liked Songs (below) have the same buttons.
- **Deck B** shows the prepared track. Its **start point** defaults to a saved Cue point if the track has one, otherwise 0:00. Change it by **tapping its cue buttons** (they show the cue times saved when that track was on Deck A), **dragging the timeline strip**, or the ⏪ ⏩ buttons (±5 s). **Start** resets to the beginning. **Switch** runs the Ninja Switch.
- **Up next** is one list: Deck B first, then the queue. It is a panel in the deck menu (open it from the Track circle's *Up next*). Remove tracks with ✕, **Shuffle** mixes the order, **Clear** empties it. When Deck B plays, the next queued track moves up into it.
- **Previous / Next** (Track circle page 3, and the Moves pads) follow this list. **Next** is a hard cut to what is up next; **Switch** is the faded version. Previous goes back to the start if you are more than 3 seconds in, otherwise to the earlier track. With nothing queued, Next is **dimmed with the reason**, and it never wanders off to another style.
- GoldenSun Controller has the same **Up next** list for Library and Audius tracks (a **Queue** button beside each), so Previous, Next and Shuffle in the Track circle work there too.

#### Playlists and Liked Songs

The Spotify tab has a source row: **Search**, **Liked Songs**, **Playlists**. They are read-only and need two more permissions (`playlist-read-private`, `user-library-read`). If you connected with an earlier version, the tab shows a **Reconnect Spotify** button once. Playlists open to a track list with a *‹ Playlists* back button.

#### Sync and Nudge (GoldenSun Controller)

Under each deck's tempo slider: **Sync** matches this deck's tempo to the other deck (it also tries half and double time, and says so if the tempos are more than 8% apart; it matches tempo, not beat position). **◂ ▸ Nudge** briefly slows down or speeds up the deck by 5% while you hold it, so you can line the beats up by ear.

#### Batch 3: Ninja Scratch, loops, fades, Auto-next, Auto-mix (v23)

- **Ninja Scratch** (the *Scratch* button under Deck A becomes **Ninja Scratch**, a toggle). Spotify's audio cannot be scratched, so this is a **scratch layer of quick seeks**, built on the original scratch patterns. When it is on, the disc glows white and gold and works differently from Ninja Scrub: Spotify keeps playing and the song position follows your finger live (about 9 seeks a second, so it sounds choppy, like a stutter). **Flick forward** for a Chirp, **flick backward** for a Backspin (8 s, or 16 s if you flick hard), **zig-zag** quickly for a Scribble. The **Scratch bank** of Ninja Pads (bank 3) runs Baby, Chirp, Transform, Tear, Flare, Scribble, Brake and Backspin by button, timed to your tapped BPM (120 if none). Spotify cannot play backwards or cut the sound in time, so this is an approximation, not the real thing.
- **Backspin without Ninja Scratch:** in plain Ninja Scrub, a fast backward flick also jumps back 8 s (16 s when very fast), then resumes.
- **Deck B's disc** now turns too: turn it to choose where the next track starts.
- **Ninja Loop:** the Moves pads have **Loop** (a beat loop of the Beats macro size, timed by tap tempo) and **A–B** (a loop between Cue 1 and Cue 2). The loop button in the loop row works too. Spotify answers seeks after a short delay, so a loop has a small seam at the jump, and the timeline shows the loop as a band.
- **Fade and Fade length** on the Track circle's Level page (and a **Fade** pad): one tap fades the target deck out, the next fades it back in; Fade length is a slider (0.5 to 8 s) that sets Smoke Fade, Fade pad, Ninja Switch and Auto-next, and is separate for GoldenSun tracks. Normal tracks fade with real Web Audio gain; Spotify fades are volume commands (see the iOS note).
- **Auto-next** (Track circle page 3, SpotifyNinja only): near the end of a track it runs a Ninja Switch to what is up next. Needs a Prep track or a queue.
- **Auto-mix** (gear → Add-ons → Auto-mix, GoldenSun Controller only): when the playing deck nears its end, the next track mixes in on the other deck. It uses the track waiting on the other deck, or loads the next one from Up next. It syncs tempos first, starts the other deck and glides the crossfader (at least 4 s). It turns Repeat off so tracks can finish. It never touches Spotify tracks.
- **Cleaner menus:** in every track list (Library, Audius, Spotify, Playlists) the main button stays beside the title, and the small actions (Queue, Prep, Audius link) sit underneath, instead of being squeezed beside it. Deck B now wears the same Ninja branding as Deck A.
- **Still not shipped:** the beat gate (Spotify cannot be gated in time) and Spotify Mix now / Auto-mix, which Spotify's policy does not allow.

### The Track circle (everyday track controls)

A round **Track** button sits beside the gear in the center strip. It opens a small radial menu for **one deck at a time, the target**. The target is written inside the button (**TRACK A**, **TRACK B**, or **LIVE** / **NEXT** in SpotifyNinja) and shown by a **colored outline on that deck**. Touch a deck to target it, or tap the **TRACK A ⇄** label in the middle of the circle to switch.

- **Page 1, Transport:** Restart, −10 s, +10 s, Repeat.
- **Page 2, Level:** Mute and Volume. Volume opens a slider panel under the circle (sliders never sit on the ring).
- **Page 3, Queue:** Previous, Next, Shuffle and Up next (see *Prep Deck and Up next*).
- **Normal tracks:** Restart and ±10 s move the track, **Repeat** turns looping on or off (a track now stops at its end when Repeat is off), and Mute and Volume are **per deck** (each deck now has its own volume).
- **Spotify (SpotifyNinja):** the same buttons send seek, repeat and volume commands to Spotify. LIVE is Deck A. NEXT is the Prep Deck: Restart, ±10 s and the page 3 buttons act on its start point and the Up next list; Repeat, Mute and Volume say they belong to the live track. On iPhone and iPad a web page's volume setting may not change Spotify's loudness, and the panel says so.
- Controls that cannot work are dimmed with a short reason, never silently ignored.

Performance functions stay on the decks, not in the circle: **loops and beat jump** (Loop add-on row), the **timeline** (Wave add-on), **Ninja Scrub** (the disc) and the cues.

- **Beat jump** (⏪ ⏩ beside the loop controls): jumps by the loop size (1 to 32 beats). It needs a tempo: Library tracks and detected tracks have one; otherwise **tap the BPM number four times**. In SpotifyNinja, tap tempo works the same way (Spotify gives no tempo) and is saved per track on your device.
- **Timeline** (SpotifyNinja, with the Wave add-on on): a position bar with cue flags and beat marks. Drag it and the track jumps once when you let go.
- **Ninja Scrub** (SpotifyNinja): touch the disc and it pauses and previews a position as you turn it (about 12 seconds of song per turn, faster when you spin fast). When you let go it seeks once and resumes if it was playing.

### Cue and hot cues (the Cue button and the 1 2 3 4 buttons)

These work for **any** track (Library, Load, Audius, demo loops). They are *bookmarks* you place yourself, and the Controller now explains what happened each time with a short message on the deck.

**Hot cues 1 2 3 4: four bookmarks per deck**
- **Empty** ones say **Save**. Tap one while the track is at a spot you like and it saves that spot (the button shows the time, for example `1:12`, and lights up). A message tells you what happened.
- **Tap a saved one** to jump straight to it, even while playing. Great for jumping to the drop.
- **Press and hold** a saved one for about 0.6 s to clear it.
- **Library tracks come with cues already placed:** **1 Build, 2 Drop, 3 Break, 4 Drop 2**. Just tap them. You can clear or re-save any of them.
- **On the beat:** when the tempo is known (Library tracks, auto-detected or tapped tempo), saved cues snap to the nearest beat so jumps land in time.
- **Remembered:** cues are saved on your device for each track (Library tracks, your files and Audius tracks) and come back when you load it again.
- With the **Wave** add-on, each cue shows as a numbered flag (with its name) on the waveform, and tapping a flag jumps there.

**Cue button: your "return point"**
- **Paused:** press **Cue** to set the return point at the current spot. **Keep holding to listen** from there, and **let go to snap back** and pause. (This is how DJ players preview a start point.)
- **Playing:** press **Cue** to jump back to the return point and pause. Press **Play** to go.
- The return point shows as a small white marker on the waveform. A new track's return point starts at 0:00.

**Short on space?** Turn the hot cues row off under gear → Add-ons → Hot cues. On a phone the disc grew from 92 to 127 px, and on an iPad from 155 to 205 px, in my tests. The **Cue** button stays next to Play, and your saved cues come back when you turn the row on again.

Tip: turn on **Tips** (gear → Add-ons) for short hints about these buttons. A one-time message also appears the first time you save a hot cue.

**Ideas for a later update (cues):** custom names for cues, a color per cue, cue points that follow the detected beat grid after a tempo correction, jumping to a cue on a streamed track without a pause while it buffers (faster once saved on the device), and cue-based looping.

### Snapshot: v25, the first complete release (2026-11-21)

This is the reference version tested by hand on iPhone and iPad: **GoldenSun Controller** (two decks, Library, Load and Audius tracks, scratch with patterns, tempo detection and tap tempo, EQ 1 and EQ 2, hot cues, loops, Wave, Sampler, FX, Sync and Nudge, Auto-mix, Up next with Previous, Next and Shuffle, Track circle, 8 themes) and **SpotifyNinja Controller** (Spotify sign-in with PKCE, search, genre chips, Liked Songs and Playlists, the Ninja control set: Scrub, Scratch, FX, Pads, BPM, Macros, Switch, Loop, Auto-next, Prep Deck). To return to it exactly: `git checkout v25`. Everything after it builds on top.

### Tempo, Tempo Overdrive and EQ sliders (v26)

- **Tempo slider:** −10% to +10% in **1% steps** (it used to be ±8% in 0.1% steps), taller and wider with a tick for every 1% and a bright center line. The tempo **readout** sits between **−** and **+** buttons (tap and hold to repeat). **Double-tap the slider** to return to 0%. Sync, Nudge and tap tempo are unchanged beside it.
- **Tempo Overdrive** (gear → Controls → **Overdrive**): off by default. When on, tap a deck's tempo number to open the **Overdrive panel**: a wide **−80% to +80%** slider with the ±10% fine zone marked, ±1 and ±10 steppers, quick chips (−50 −25 −10 0 +10 +25 +50) and an exact number box (decimals allowed). Beyond ±10% the readout turns **magenta** and shows the BPM you are really playing. **Sync** then matches tempos up to 80% apart (it also tries half and double time); without Overdrive it tells you when tempos are more than 10% apart. Turning Overdrive off brings tempos back inside ±10%. At −80% a track plays at one fifth speed; very slow or fast speeds sound rough and the browser decides how well pitch is kept.
- **EQ sliders:** bigger thumbs and thicker tracks, a **dB value next to every name** (for example *Mid +4 dB*, colored when not flat), and **double-tap to reset to 0**. In portrait the decks are taller so the tempo and EQ controls and the disc fit together; on small landscape phones everything shrinks to fit without overlapping.

### Test it on an iPad

1. Open <https://sukonik.github.io/GoldenSunDJ/controller/> in Safari on the iPad.
2. Tap **Share → Add to Home Screen**. It then opens full screen like an app (the site ships a web app manifest and Apple web-app tags).
3. Tap the gear, then **Material → Carbon** or **Titanium**, then **Tilt** and allow motion access. Tilt the iPad to move the light across the metal.
4. Tap Play on a deck and drag the pad to scratch. Turn the iPad to try portrait and landscape.

To inspect on a Mac, connect the iPad by cable and use Safari's *Develop* menu. Scratching and tilt have only been tested in desktop browser emulation so far, so real-iPad feedback is welcome.

## Look and feel

- **Brand.** The GoldenSunAI "G" sun emblem is the logo and favicon. The wordmark is **GoldenSun DJ** set in Outfit, the same geometric style as the GoldenSun AI wordmark. The black emblem is also used as a mask, so it fills with the current theme's colors in the footer, the drawer and as watermarks. The hero emblem is a clean, solid shape on a transparent background whose color slowly shifts through the theme's colors.
- **App icons (glass).** Eight Material-style tiles in hand-blown Italian (Murano) glass: deep color at the thick rim, a luminous center, a window highlight, a pale lattimo swirl and tiny trapped bubbles, with the GoldenSun emblem printed on top. They are *Glass Blue* (the default), *Amber*, *Cristallo*, *Opal*, *Smoke*, *Rose*, *Emerald* and *Ruby*, matching the eight theme colors but interchangeable. Pick one under **Menu → App icon** (with a black or white logo); it changes the tab icon, and the default Glass Blue is also the Home Screen icon. Regenerate them with `python3 tools/make_glass_icons.py`.
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

Each version is tagged in git (`git checkout v3`). The tags currently exist on the maintainer's machine; push them with `git push origin v1 v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15 v16 v17 v18 v19 v20 v21`.

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
| **v12** | **Glass icon system:** eight Murano-style blown-glass app icons with the black (or white) logo, default Glass Blue, a picker in the menu, a favicon that follows your choice, and a Home Screen icon. Fixes the Animations toggle label. |
| **v13** | **iPhone fixes from real-device screenshots:** the settings wheel now stays fully on screen on narrow phones, and the tempo and EQ sliders, disc, waveform and button rows never overlap, even with every add-on on (checked at six phone and iPad sizes in both EQ modes). |
| **v14** | **Scratch engine** (audio worklet, forward and backward, glitch-free) with a repeatable platter model and a **Scratch feel** panel (Natural, Tight, Heavy, Bend, Slip mode). The deck **Load** button now opens the full deck menu (Library, Load, Audius). |
| **v15** | **Scratch patterns** (8 one-tap scratches per deck), **tempo detection** (automatic, with tap tempo to correct it) and a beat grid that follows it, plus **playback safety** (held effects always release, the audio engine self-restarts, a watchdog keeps decks moving). |
| **v16** | **Clearer cues:** hot cues show *Save* or their time, Library tracks arrive with Build / Drop / Break / Drop 2 cues, cues snap to the beat and are remembered per track, a message explains every cue action, and the Cue button now *holds to listen and returns when you let go*. Also fixes a bug where a track you loaded in the first seconds could be replaced by the demo loop. Hot cues is now a switch in the Add-ons page, so you can trade it for EQ, Sampler or FX room. |
| **v17** | **Phone landscape layout:** a purpose-built landscape arrangement for iPhones (big discs, side column for cues and Play/Cue, compact EQ, slimmer header), tested in full screen and inside Safari. Fixes the cramped, scrolling, "locked" feel on a sideways phone. |
| **v18** | **SpotifyNinja shell (Patch 1):** the deck menu's *Link* tab is now **Audius**, and a new **Spotify** tab offers an opt-in SpotifyNinja controller mode with a JSON packet layer and a mock adapter (no Spotify connection yet). |
| **v19** | **Spotify connection (Patch 2):** Connect / Disconnect Spotify (Authorization Code with PKCE, no client secret), "Connected as <name>", Spotify search and Load on Deck A, the Web Playback SDK adapter, and the callback page `controller/spotify-callback.html`. Tested against mocked Spotify servers. |
| **v20** | Spotify search fix ("Invalid limit": results are now requested in sizes Spotify accepts, with automatic fallback) and **genre chips** in the Spotify tab with recommended tracks for the eight NAKO GOLD styles. |
| **v21** | **Track circle** (two radial pages, explicit TRACK A/B or LIVE/NEXT target with a colored outline), per-deck volume and mute, Repeat, **beat jump**, tap tempo for Spotify, the SpotifyNinja **timeline** and **Ninja Scrub**. First batch of the approved plan. |
| **v22** | **Batch 2 and the Ninja control set.** Ninja Pads, Ninja FX (Smoke Fade, Shadow Mute, Shuriken Skip, Vanish, Teleport), Ninja BPM, Ninja Macros, Spotify Master and the **Ninja Switch** (a faded, one-track-at-a-time crossfader); the **Prep Deck** and an **Up next** queue with Previous, Next and Shuffle (Spotify and GoldenSun); **Playlists and Liked Songs**; **Sync and Nudge**; the shuriken and ninja icons with black-and-gold SpotifyNinja accents. |
| **v23** | **Batch 3.** **Ninja Scratch** (a scratch layer: live seeks, flicks, scribble, Scratch pads), Backspin 8/16 s, Ninja Loop (beat and A–B), Fade and Fade length, Auto-next, GoldenSun **Auto-mix**, a draggable Prep disc, cleaner result rows and matching Ninja branding on Deck B. |
| **v24** | **Button polish.** Ninja Pads and Ninja FX drawers reformatted (bank chips no longer clip, the close button never covers a tile, tiles keep a sensible size on phone, tablet and desktop), consistent press, hover and focus states and no tap flash or double-tap zoom on every button, and a stronger **Ninja Scratch**: hold the disc still and the groove holds (stuck-record stutter), with a small haptic tick on each direction change where the device supports it. |
| **v25** | **Fix:** the settings wheel and Track circle buttons did nothing on phones after v24. The new press-scale feedback replaced the transform that positions each wheel button, so a button jumped away while pressed and the tap was lost. Wheel buttons now only brighten when pressed. |
| **v26** | **Tempo and EQ pass.** Tempo slider ±10% in 1% steps with ticks, readout and ± buttons, double-tap reset; **Tempo Overdrive** (typed or dialed −80% to +80%, wide-range Sync); EQ dB readouts and double-tap reset; larger touch targets and a layout that fits small phones in portrait and landscape. README snapshot of v25. |
| **v27** | **Phone portrait layout.** The disc now takes the full width (about 270 to 320 px instead of 170), tempo is a slim half-height slider beside it, the −, readout, +, Sync and Nudge buttons sit in one row under it (spread to the edges), and EQ is three wide sliders with big round thumbs and the dB value above each. |

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
assets/icons/         the glass app icons (generated by tools/make_glass_icons.py)
assets/ninja/         the shuriken and ninja icons (white masks, colored in CSS)
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
- A crossfader cut helper, record-your-scratch, and more patterns.
- More glass icon variants (a Home Screen icon for every color, an SVG favicon).
- More sources for the Audius tab (Internet Archive, Free To Use), key detection, and a sync button using the detected tempo.
- More 3D materials and components for the Controller (knobs, jog rings, faders) in carbon and titanium.
- Suno, DistroKid, YouTube, Spotify and SoundCloud hooks beyond plain links; a mastering step.
- **Approved plan, remaining (Batch 3 shipped in v23, apart from the held items):** *formerly Batch 3* Spotify loop (calculated A to B and beat loops), an automatic end-of-track transition option, Ninja Scrub gesture variations (backspin 8 or 16 s), Fade length and Fade in on the Track circle, and GoldenSun Auto-mix for Library, Device and Audius tracks. *Experimental, only after latency testing:* a beat gate. *Held or dropped:* Spotify "Mix now" and Spotify Auto-mix (held), and anything that overlaps Spotify audio. Spotify's public developer policy does not allow mixing, segueing or overlapping its content.

## Resources

The controller projects, repos and tools we study are listed in **[RESOURCES.md](RESOURCES.md)**, with the ideas we may borrow and the licenses to check.

## Credits and licenses

Code is released under the license in [LICENSE](LICENSE). The GoldenSunAI name, emblem and wordmark belong to GoldenSunAI and are used here for the GoldenSunDJ product. Weather data by Open-Meteo.
