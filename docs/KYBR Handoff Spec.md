# KYBR — Full Design & Build Spec
_Handoff document. Everything needed to build the mobile app with confidence._

---

## 1. What KYBR is

A private music-sharing app for small crews. You **burn** a song to your people; they **etch** a note on it and **keep** it. There is no algorithm, no discovery feed, no audience. The whole product is built on one feeling: *someone made this for you.*

**Core loop:** burn a song → it lands warm at the top of your crew's stack → they play it, react, etch a note → the good ones get saved into your case forever.

**Anti-thesis:** it is not Spotify (no library-as-utility), not Instagram (no clout), not Discord (no walls of chat). It is a CD-R you left on someone's desk.

### Who it's for, and where it goes

**Now:** the author and their friends. A real group of people who send each other songs. Design for that room, not for a market.

**Horizon:** a larger music collaboration app with three pillars —
1. **Music sharing** (BURN / ETCH / CASE — built)
2. **Live music hangouts** (CHNL's "on air" room, listening together in sync — partially built)
3. **Album reviews, Letterboxd-style** (built in the prototype as **TAPE**, a cassette player with a J-card per album; see §6.9)

Everything built now should hold up when those three become peers. ETCH and album reviews now share **one heat scale** (§4.5): an ETCH is a short review of a song, and a J-card review is the long version for an album.

**Current build target: clickable prototype.** Real interactions, fake data. Display-scale controls are acceptable where they're decorative, but anything the user taps in the prototype needs a real hit area.

---

## 2. Soul — the non-negotiables

| Principle | What it means in the UI |
|---|---|
| **Warm & intimate** | Copy is lowercase, personal, a little sentimental. "made for you", "still warm", "what basement put you on". |
| **Anti-clout** | **ZERO vanity metrics.** No play counts, like counts, follower counts, stream numbers, trending, charts. Ever. |
| **Sharing is private, reviews are public** | Burns, etches and crews never leave the crew. Album reviews are public (on your DECK and the album's J-card), but still with no likes, no counts and no ranking. Reviews are listed by time, never by popularity. |
| **Status is physical** | Worth is expressed as objects and heat: a *stack*, a *disc*, a *sleeve*, "still warm", "410W". |
| **Status is temporal** | Time replaces numbers: "dropped sunday", "saved tue", "still warm", "this week". |
| **Never corporate** | No SaaS gradients, no pill-badge dashboards, no "Welcome back, User!". |
| **Y2K hardware** | Every screen is a *device*, not a page. Chrome, LCDs, jog dials, beveled buttons, CD iridescence. |
| **One device per screen** | **LOCKED.** Each section is a different piece of Y2K hardware. The inconsistency is deliberate and is the brand — opening a tab should feel like picking up a different object off the shelf. Do not unify the chassis. |

**Hard nevers:**
- No follower/play/like counts.
- No public feed or explore tab.
- No emoji as UI chrome (they were removed from CASE for exactly this reason).
- No Caveat handwriting except handwritten notes: the marker writing on the ETCH disc face and the ballpoint reviews on a J-card. Never in UI chrome, labels or buttons. DECK stays Caveat-free.
- No aggressive rainbow gradient backgrounds. Iridescence lives on **discs only**.

---

## 3. Lexicon (use these words in the UI, verbatim)

| Term | Meaning |
|---|---|
| **BURN** | A song shared with a crew. The core object. |
| **ETCH** | A quick rating + short note left on a burn. |
| **BUMP** | A lightweight reaction to a burn. |
| **DUB** | An invite. |
| **CHNL** | A private crew, **max 8 people**. |
| **WIRE** | Home. The mixed feed of everything your crews sent you. |
| **DECK** | Your public-ish profile (MySpace-descended). |
| **CASE** | Your library — burns you chose to keep. |
| **CTRL** | Settings. |
| **PLYR** | The iPod-style player overlay. |
| **This Week** | The weekly auto-mix of a crew's burns. |
| **TAPE** | An album's page: the cassette player. |
| **J-CARD** | The paper insert in a TAPE: tracklist, your take, your crews' takes, public takes. |
| **HEAT** | The one rating scale, used by ETCH and album reviews (§4.5). |

---

## 4. Visual system

### 4.1 Palette

**Grounds (dark aubergine):**
```
#15121b   base
#1a1622   panel base
#100d15   deepest
#2b2236   radial top-light  (radial-gradient(130% 80% at 12% -10%, #2b2236, #1a1622 52%))
#150f1f   device screen interior
```

**Ink:**
```
#e9e4f0   primary text
rgba(233,228,240,.6)   secondary
rgba(233,228,240,.45)  tertiary / micro-labels
#f3ecff / #fff         emphasis
```

**Skins (user-selectable accent — UV is default):**
```
UV      #C084FF   lo #e7c8ff   hi #7a3fd0     ← DEFAULT
Sunset  #FF8A3D   lo #ffd6a8   hi #d75a2a
Ice     #6FD3E8   lo #cdf6ff   hi #2a9fc4     (CASE variant: #4FC8E8)
Volt    #C6F24E   lo #eaffb0   hi #7fb02a
Heat    #FF4D3D   lo #ffcabf   hi #c42a1a
Mint    #2bd07a   lo #b8ffd9   hi #1a8f54     (CASE only)
```

**Fixed signal colors (do NOT re-skin these):**
```
#FFB45E / #FF8A3D   ember — heat, star ratings
#7CFFB0 / #7CFFC2   LCD green — "on air", live, confirmations
#5fd8ff / #9fefff   LCD cyan — CHNL readouts
#ff6fae             hot pink — CHNL preset active state
```

### 4.2 Type

| Face | Use | Never |
|---|---|---|
| **Michroma** | Wordmarks, screen titles, device branding, track numbers in LCDs. Always letter-spaced 1–3px, often uppercase. | Body copy. It's unreadable below 9px in sentences. |
| **DM Mono** | Everything else — labels, body, data, timestamps, song titles. | — |
| **Chakra Petch** (600) | Chosen alternative display face for DECK headline. Letter-spacing 4px. | — |
| **Caveat** | Handwritten notes only (ETCH). Currently unused in the chosen DECK direction. | UI chrome, labels, buttons. |

Chrome-metal text treatment (used on all screen titles):
```css
background: linear-gradient(180deg,#fff,#e3e4ec 26%,#9a9bae 50%,#74758a 53%,#cfd0db 76%,#fff);
-webkit-background-clip: text; background-clip: text; color: transparent;
```

### 4.3 Material recipes

**CD-R iridescence (discs, avatars, album art):**
```css
/* base */ background: radial-gradient(circle,#2a1f3a,#46326b 46%,#211633 76%);
/* spin layer, inset -12%, mix-blend-mode:screen, opacity .5-.65 */
background: conic-gradient(from 0deg,#c9a6ff,#8fd9ff,#ffb3e6,#ffe6a8,#a8ffd1,#bfa6ff,#8fd9ff,#ffb3e6,#c9a6ff);
animation: kybrSpin 9s linear infinite;
/* hub */ radial-gradient(circle,#160f20 0 38%,#8a76b8 40% 62%,#160f20 64%)
```
Big discs add data-track rings: `repeating-radial-gradient(circle at 50% 50%,transparent 0 2px,rgba(255,255,255,.15) 2px 3px)`.

**Brushed silver faceplate (CHNL rack, PLYR body):**
```css
background: linear-gradient(180deg,#d9dbe1 0%,#bcbec7 42%,#a4a6b0 58%,#cfd1d8 100%);
box-shadow: inset 0 2px 2px rgba(255,255,255,.85), inset 0 -3px 7px rgba(0,0,0,.32), 0 6px 16px rgba(0,0,0,.4);
```

**Chrome bar (profile song radio):**
```css
background: linear-gradient(180deg,#c2c6d0 0%,#9aa0ac 30%,#6a6f7c 50%,#525762 51%,#7a808c 70%,#aeb4c0 100%);
box-shadow: 0 10px 20px rgba(0,0,0,.5), inset 0 2px 2px rgba(255,255,255,.7), inset 0 -4px 8px rgba(0,0,0,.4);
```
The hard 50%/51% stop is what makes it read as metal. Keep it.

**Sunken LCD:**
```css
background: linear-gradient(180deg,#0a1526,#060c18);
box-shadow: inset 0 2px 9px rgba(0,0,0,.85), inset 0 0 0 2px #2c2e38, 0 0 0 3px #6b6d77;
```
Plus a scanline overlay: `repeating-linear-gradient(0deg,rgba(95,216,255,.05) 0 1px,transparent 1px 3px)`.
Green LCD variant (profile song): `linear-gradient(180deg,#0e2418,#06120c)` with `#a8ffcf` text.

**Phone shell (every screen is inside one):**
```css
/* 392×812 or 322×716 */
border-radius: 50px; padding: 11px;
background: linear-gradient(155deg,#48424f 0%,#2a2530 32%,#16131b 100%);
box-shadow: 0 44px 80px -20px rgba(0,0,0,.72), inset 0 2px 1px rgba(255,255,255,.16), inset 0 -3px 6px rgba(0,0,0,.5);
/* inner screen */ border-radius: 40px; overflow: hidden;
```

### 4.4 Animations (the whole keyframe vocabulary)
```css
@keyframes kybrSpin  { to { transform: rotate(360deg); } }                          /* discs */
@keyframes kybrEq    { 0%,100%{transform:scaleY(.22);} 50%{transform:scaleY(1);} }  /* spectrum bars */
@keyframes kybrPulse { 0%,100%{opacity:1;box-shadow:0 0 9px #5fd8ff;} 50%{opacity:.4;box-shadow:0 0 2px #5fd8ff;} }
@keyframes kybrFlick { 0%,100%{opacity:.22;} 50%{opacity:1;} }                      /* VU segments */
@keyframes kybrRise  { from{transform:translateY(26px);opacity:0;} to{transform:translateY(0);opacity:1;} } /* PLYR entry */
@keyframes kybrCloud { 0%{transform:translateX(0);} 100%{transform:translateX(26px);} } /* CTRL desktop */
@keyframes kybrFlipA/B { 0%{rotateX(0);opacity:1} 44%{rotateX(34deg);opacity:.25} 60%{rotateX(-22deg);opacity:.5} 100%{rotateX(0);opacity:1} } /* CASE page flip */
```

### 4.5 Heat: the one rating scale (ETCH + album reviews). SETTLED
- **0.5 to 5 in half steps**, drawn as five ember stars (`#FFB45E`, glow `rgba(255,138,61,.6)`). The off state is the same star at 20% opacity (on paper: `rgba(150,110,60,.22)`).
- **Input:** five 44×44 star cells. Tap a star to set that whole number. Tap the same star again for half a star less. Tap again to go back up. No sliders.
- **Display:** text glyphs `★★★★½` in ember. Never a number, never "4.5/5".
- **Words** (lowercase, shown next to the stars): 0.5 frozen · 1 cold · 1.5 cool · 2 room temp · 2.5 lukewarm · 3 warm · 3.5 toasty · 4 hot · 4.5 burning · 5 scorching.
- Heat is optional when burning, and required to save an ETCH or a review.
- **Crew heat** on a TAPE is the average of your crews' reviews, rounded to the half and shown as stars plus a word ("your crews run it burning"). There is no public average and no reviewer count.

---

## 5. Navigation standard — LOCKED, reuse verbatim

Five chunky beveled **chrome hardware buttons** in a dark recessed tray at the bottom of every screen. They must feel like real device buttons.

**Tray:**
```css
display:flex; gap:7px; padding:7px; border-radius:18px;
background: linear-gradient(180deg,#2a2533,#171320);
box-shadow: inset 0 2px 6px rgba(0,0,0,.66), inset 0 -1px 0 rgba(255,255,255,.05);
```

**Active tab** (bright brushed metal + lit LED + dark label):
```css
background: linear-gradient(180deg,#f5f6f9,#d3d5dd 46%,#a8aab5 54%,#ced0d9);
border: 1px solid rgba(255,255,255,.55);
box-shadow: inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 -2px 3px rgba(0,0,0,.28), 0 3px 5px rgba(0,0,0,.45);
/* LED */ background: radial-gradient(circle at 40% 35%,#e7c8ff,#C084FF 70%); box-shadow: 0 0 9px #C084FF, inset 0 0 2px rgba(255,255,255,.8);
/* label */ color:#2a2433; text-shadow: 0 1px 0 rgba(255,255,255,.6);
```

**Inactive tab** (darker metal + unlit LED + muted label; hover lifts 1px):
```css
background: linear-gradient(180deg,#dcdee4,#b6b8c1 46%,#8e909c 54%,#b2b4be);
border: 1px solid rgba(255,255,255,.4);
box-shadow: inset 0 1.5px 0 rgba(255,255,255,.75), inset 0 -2px 3px rgba(0,0,0,.25), 0 2px 4px rgba(0,0,0,.4);
/* LED */ background: radial-gradient(circle at 40% 35%,#9a9ca6,#5f616c); box-shadow: inset 0 1px 1px rgba(0,0,0,.45);
/* label */ color: rgba(38,33,48,.64); text-shadow: 0 1px 0 rgba(255,255,255,.45);
/* hover */ filter: brightness(1.06); transform: translateY(-1px);
```

Tab geometry: `flex:1; column; align-items:center; gap:6px; padding:10px 0 9px; border-radius:12px`. LED 9px, label 8px / letter-spacing 1.5px.
Order, always: **WIRE · CHNL · DECK · CASE · CTRL**

---

## 6. Screens

Each screen is a *different* device — see the locked rule in §2. The only things every screen shares: the phone shell it sits inside, the status bar (`9:41` left, skin name + lit dot right), and the chrome nav tray at the bottom.

### Device roster

| Screen | Device |
|---|---|
| WIRE | Game Boy Color (translucent Atomic Purple) |
| CHNL | Silver hi-fi component rack |
| PLYR | iPod with click wheel |
| DECK | Gatefold record sleeve + chrome radio |
| CASE | CD binder with chrome rings |
| CTRL | Windows 98 control panel on a green-hill desktop |
| BURN | A CD burner tray / wizard |
| ETCH | A jewel case with a printable disc face (overlay) |
| TAPE | A stereo cassette player with a J-card (album page) |

When a new screen is added, it gets its own device. Candidates not yet used: MiniDisc deck, boombox, karaoke machine, answering machine, disposable camera, Tamagotchi, car head unit, jukebox.

### 6.1 WIRE — home
**Metaphor: the Game Boy Color IS WIRE. LOCKED.** Translucent frosted shell (Atomic Purple is the default; Amber and Kiwi exist as alternates), visible internals (green PCB, ghost button pads, mesh speaker), dark smoky buttons, "KYBR BOY COLOR" branding centered under the screen, authentic GBC layout — D-pad lower-left, A/B on a diagonal with A upper-right, SELECT/START centered and horizontal, round speaker bottom-right.

**The small screen is the constraint, and it's the design brief.** The feed is built to fit the GBC LCD, not the other way around. That means:
- Roughly **5 rows visible at a time.** No infinite scroll illusion — a Game Boy shows you a screenful.
- Row anatomy: iridescent dot · song title (9.5px) · "from [name]" (7px) · duration. That's all that fits and all that's needed.
- Header `♥KYBR` + a `WIRE` chip; section label `WHAT YR CREW PUT U ON`.
- "This Week" rows flag ember (`#FFB45E` border, `#ffd36a` title) against the UV purple of ordinary burns.
- The in-LCD nav strip (WIRE/CHNL/DECK/CASE/CTRL, 6px) reads as the game's own UI, *in addition to* the hardware nav tray below the shell.
- **Selection, not scrolling, is the interaction.** The D-pad moves a highlight; A opens the burn into PLYR. Build the feed as a cursor list, not a scroll view — that's what makes the hardware honest.

**Tweaks:** `showGuts`, `scanlines`, `gloss` (booleans).

### 6.2 CHNL — crews (the strongest chassis in the project)
**Metaphor:** a silver hi-fi component rack — the "KYBR CD CREW SYSTEM · KY·NMT09".
**Anatomy, top to bottom:**
1. Faceplate header — Michroma `KYBR` in dark chrome + model number.
2. **Sunken cyan LCD** — `● ON AIR` pulse dot, `DECK n · [crew] · [freq]fm`, 12-bar animated spectrum analyzer, then now-playing song / artist / "added by [who]" / elapsed time in green Michroma.
3. **Transport + jog dial** — 4 beveled transport buttons (⏮ ▶ ⏸ ⏭, play button tinted green) and a 64px jog dial with a glowing blue center reading `TUNE`. Clicking the dial cycles crews.
4. **Disc presets** — one card per crew in a recessed tray, labeled "DISC PRESETS · ● tap to power up a room". Active preset gets hot-pink glow (`#ff6fae`), numbered disc badge, `[freq]fm` subtitle.
5. **In the room** — DECK A shows overlapping member chips (live members ringed `#7CFFC2` with glow, offline at 45% opacity, `+n` overflow); DECK B is a 14-segment VU meter (green → `#ffd23d` → `#ff4d4d`) labeled `VU / SUPER T·BASS`.
6. **Track list** — sunken LCD, header `ON [CREW]'S DECK  ·  n TRACKS`. Rows: Michroma 2-digit number, song, "artist · who", and `▶ NOW` on row 1. Tap a row → PLYR.
7. **This Week bar** + a red `410W T·BASS` power badge.
8. Chrome nav.

**Data model:**
```js
crew = { id, name, freq, members: [{ i: initials, live: bool }], burns: [{ song, artist, who }] }
```
Three crews shipped: `family` 92.1, `basement` 98.6 (default), `roadtrip` 104.3.

**Interactions:** preset tap sets crew (LCD, meters, members, tracklist all change) · jog dial cycles · track tap opens PLYR · backdrop tap closes PLYR.

### 6.3 PLYR — the player (overlay, not a tab)
iPod-style. Rises from the bottom (`kybrRise .32s`) over a blurred dark scrim. Body is light chrome (`linear-gradient(155deg,#fbfbfc,#e8e9ed 38%,#cfd1d8 60%,#f4f5f8)`), radius 34px.
Inside: a dark screen with `▶ ON AIR` + crew name, a large spinning iridescent disc (118px), song + artist centered, an "added by [who] · live in [crew]" attribution chip, and a progress row (`1:48 —— in sync`).
Below the attribution chip: **`from [album] ↗`** (only when the song's album is in the catalog) opens that album's TAPE, cued to the song. This is the song-to-album doorway. If you've etched the song, an ember line shows it: `you etched ★★★★½ · “note”`.
Below: a 196px **click wheel** with `MENU` on top, ⏮ left, ⏭ right and `▶❚❚` (play/pause) at the bottom. The 74px **center button is ETCH** (an ember ★ over `ETCH`). It opens the jewel case for the current burn.
Header has `▾ CHNL` to dismiss. Scrubber + `＋ VOL －` ring hint exist in the standalone PLYR.

### 6.4 DECK — profile (MySpace, decluttered)
**Chosen direction: "Record Sleeve" with the "Cold Mono" type cut** (`DECK 2a Cold Mono.dc.html`).
The original had too much: extended-network banner, contact grid, details box, guestbook. All cut. What remains:
1. **Gatefold cover** — 196px header, `linear-gradient(150deg,#3d2560,#1d1230)`, a huge half-cropped spinning disc bleeding off the right edge, masked left by `linear-gradient(100deg,#150f1f 22%,rgba(21,15,31,.55) 52%,transparent 76%)`. Over it: `DECK · SIDE A`, the name in **Chakra Petch 600 / 25px / 4px tracking** with a white→lavender gradient clip, and the tagline in DM Mono 9px `#c9a6ff`.
2. **Profile song** — the chrome radio strip, green LCD, song · artist, 6-bar equalizer, purple play knob. This is the emotional centerpiece; keep it.
3. **Liner notes (about me)** — a 2px `rgba(192,132,255,.5)` left rule, label `LINER NOTES`, 10px DM Mono body.
4. **Top 8 albums** — two-column numbered spine (`01`–`08` in `#7a3fd0`), album + artist. No cover art, no counts. Each row is a 44px tap target that opens the album's TAPE.
5. **Album reviews** (tagged `PUBLIC`) — one featured card (album, heat stars, `artist · year`, the take, `↪ OPEN THE J-CARD`), then a horizontal shelf of 44px chips for your other reviewed albums (title + stars). Tapping either one opens the TAPE. Newly written reviews move to the front of the shelf.
6. Chrome nav.

An alternative "Quiet Column" layout (top 8 as a 4×2 grid of iridescent discs) and a "Tabbed Deck" (ABOUT / TOP 8 / REVIEWS segmented switcher) exist in `DECK v2.dc.html` if a denser or paged version is ever needed.

### 6.5 CASE — library
**Metaphor:** a CD binder page, seen inside the phone. Two sleeves per spread, split by a row of eight chrome binder rings.
Each sleeve: a 176px iridescent CD (`conic-gradient(from 210deg,#f7c9d8,#c9d8f7,#c9f7e4,#f7f0c9,#f7d8c9,#e4c9f7,#c9e8f7,#f7c9d8)`) with data rings, a 92px album-art square at center, and a 60px accent play hub. Beside it: song 20px, artist 12px, and the attribution row — a 23px initial avatar + **"saved from [name] · saved [day]"**. That attribution line is the point of the screen; nothing else goes in the sleeve.
Header: `KYBR·CASE` chrome wordmark, `SAVED · YOURS`, `DISC nn / 48` pill, and a `SKIN` row of four re-skin swatches (UV / Ember / Mint / Ice) — the active one gets a double ring.
Footer: ▲ / `FLIP THE RINGS` / ▼. Flipping runs the `kybrFlip` X-rotation on both sleeves.
**Note:** emoji BUMP chips were deliberately removed from the sleeves (clutter + anti-clout). Do not reintroduce them.

### 6.6 CTRL — settings
**Metaphor:** a Windows 98 Control Panel on a green-hill desktop, inside the phone.
Desktop: layered blue-to-green sky gradient, three drifting blur-radial clouds, two rolling hills built from `border-radius: 54% 46% 0 0 / 60px 38px 0 0`, and two desktop icons (`My Burns` spinning disc, `kept` folder).
**Window chrome:** `#c0c0c0` body, `2px outset #dedede`, title bar `linear-gradient(90deg,#0a1f8c,#1466c8 70%,#3a8fdf)`, `_ ▢ ✕` buttons, an `File Edit View Help` menu bar with underlined accelerators, and a `2px inset` white content well.
**Applet grid (3×2):** Skin (selected — dotted outline + blue wash) · Profile & Account · Your CHNLs · Notifications · About kybr · Sign Out (red). Caption: "6 applets · double-click to open one."
**Second window:** `Display Properties — Skins` — five skin chips with radio buttons (UV selected), the line `Current: UV · "what basement put you on"`, and `OK / Cancel / Apply` outset buttons (Apply greyed).
**Taskbar:** `kybr` start button with a 2×2 four-color logo, one open task in an inset well, and a tray with a glowing accent dot + `9:41`.

### 6.7 BURN — CD burner (overlay, opened by START on WIRE)
A brushed-silver chassis rises from the bottom: `KYBR` · `CD-RW BURNER · KY·BRN01` · a status LED (`READY` amber, `BUSY`, `DONE` green). Under it are four step LEDs, `PASTE · CHNL · ETCH · BURN` (done = green, current = amber, ahead = unlit). Then comes the tray, which stays empty until a song resolves; then an iridescent disc slides in with the song on a tray label. Below that is a sunken cyan LCD that changes per step, then two keys.
- **paste** — `DROP A LINK IN THE TRAY` and a `SONG LINK` input ("paste a song link…"). Under it is either `OR GRAB ONE YOU PLAYED` (three 44px rows of recent songs) or, once a song resolves, `▸ song` / `artist · from [album] · year` / duration. `NEXT ▸ CHNL` stays disabled until a song resolves.
- **chnl** — `WHO'S THIS FOR?`, one 44px row per crew (hot-pink active state, like the CHNL presets), and "private · stays in the crew, never public". Defaults to the crew you were last on.
- **etch** — `ETCH IT` · `optional`: heat cells plus a word, a note input ("a note for [crew]…", 80 characters), and "tap a star twice for a half. skip it if the song says enough." The primary key turns ember: `● BURN IT`.
- **burning** — the disc spins fast (0.9s), with `BURNING… nn%` in ember, a progress bar, and "writing to [crew]'s deck…". Tapping the backdrop does nothing while burning.
- **done** — `✓ BURNED & SENT`, "delivered to [crew] — still warm.", "your crew will find it sitting at the top of their stack." Keys: `⏏ EJECT` / `SEE IT ON WIRE`.

**Result:** the burn lands at the top of WIRE ("you burned this · [crew]") and at the top of that crew's deck in CHNL ("· you").
State: `{ burnStep, burnLink, burnCrew, burnNote, burnHeat, burnProg, sent[] }`.

### 6.8 ETCH — jewel case (overlay, opened from the PLYR center button)
A clear jewel case: a frosted glass panel, a ridged hinge down the left edge, `ETCH` in chrome-metal Michroma, `JEWEL CASE · KY·JC01`, and a ✕.
- **Printable disc face** (196px, matte white): the song title in marker (Caveat 600, `#1d1b4f`), your heat stars under it, the hub, and your note written across the lower half as you type. When empty it shows "write something…" in faded ink. This is the only place a burn gets handwriting.
- If someone in the crew already etched the song: `Dev etched ★★★★ · “basement anthem, no notes”`.
- A dark control well holds the heat cells plus a word and the note input (80 characters, with a counter).
- `KEEP IT IN YOUR CASE · ON/OFF` — a 44px toggle with a green LED, on by default.
- Keys: `CANCEL` / `★ ETCH IT` (ember, dimmed until there's heat).

**Result:** you return to PLYR with the ember etch line and a green LCD toast (`✓ etched · kept in your case`). If keep was on, the disc goes to the front of CASE ("saved from [who] · saved today", or "burned by you").

### 6.9 TAPE — album page (stereo cassette player + J-card)
Opened from PLYR's `from [album] ↗`, the DECK Top 8 rows, and the DECK review card and shelf. It replaces the tab content rather than overlaying it; the nav tray stays, and `◂ BACK` returns to the tab you came from. The status label reads `TAPE`.
1. **Transport keys** stand up off the top edge like piano keys: `◀◀` · `▶ PLAY` (wider; toggles to `❚❚`) · `▶▶` · `■`.
2. **Player body** — blue-silver brushed metal with `KYBR` · `STEREO CASSETTE · KY·TP02`, an LED (red when stopped, green when playing) and a green LCD counter (`001`). A smoked window holds the cassette: a cream label sticker with an album-tinted top stripe (title, `artist · year`, `SIDE A/B`) and two reels that spin while playing. Under the window: `▶ side a · 03 Teardrop` and `AUTO REVERSE`.
3. **Heat readout** — two tiles: yours (`you run it hot`) and your crews' average (`your crews run it burning`). No counts.
4. **J-card** — cream paper (`#f3ecdd → #ebe2ce`) that scrolls. A dark spine strip in the album's tint reads `ARTIST — TITLE — YEAR` in Michroma. Then:
   - The `SIDE A` / `SIDE B` tracklist in two columns, split at the halfway point, with the current track in red ink (`#b4321f`). Tracks are printed, not tappable; the transport keys move through them.
   - `YOUR TAKE` · `PUBLIC` — your stars, when you logged it, and your review in ballpoint (Caveat 500, `#23307a`), with `✎ REWRITE`. If you haven't reviewed the album, a dashed `✎ WRITE ON THE J-CARD` button appears instead. While writing: heat cells plus a word, a ruled-paper textarea (280 characters), "public · shows on your DECK too", and `CANCEL` / `★ ETCH IT ON`.
   - `FROM YOUR CREWS` — avatar, name · crew, stars, and the take in ballpoint.
   - `OUT IN THE WORLD` — public takes from people outside your crews: handle · when, stars, and the take in DM Mono. Ordered by time, with no likes, no replies and no follower counts.
   - Footer: "no counts, no charts — just takes."

Data: `album = { title, artist, year, tint, tracks[] }`, `review = { h, t, when }`. The prototype's tracklists are hand-entered placeholder data; the real build pulls albums from MusicBrainz and the Cover Art Archive.


---

## 7. Copy rules

- Lowercase for warm/human lines ("i burn more than i talk", "basement-dwelling, always cold", "still warm").
- UPPERCASE + wide tracking for hardware labels (`LINER NOTES`, `DISC PRESETS`, `FLIP THE RINGS`, `ON AIR`).
- Time, never counts: "dropped sunday", "saved tue", "4 more reviews" (a navigational count, not a vanity one).
- Attribution is always a person: "from Mara", "added by Dev", "saved from Sof".
- Never: "Trending", "Popular", "Recommended for you", "X plays", "Discover".

---

## 8. Decisions — settled and open

### Settled
1. **No WIRE × CHNL merge.** They stay separate screens on separate hardware. WIRE is the Game Boy, CHNL is the rack. The proposal to rebuild WIRE inside the silver chassis is **rejected** — it would have unified the chassis, which is exactly what the brand doesn't do.
2. **One device per screen** is the standing rule. Each new section earns a new device.
3. **The Game Boy is WIRE**, permanently. The feed fits the small screen; the small screen doesn't grow.
4. **CHNL cap is 8 people** (was 10 in the original brief).
5. **Build target: clickable prototype.**
6. **The wordmark is KYBR,** not KYBER.
7. **One heat scale** (0.5–5, half steps) for ETCH and album reviews (§4.5).
8. **Album reviews are public;** sharing stays private. There are still zero counts (§2).
9. **TAPE (cassette player + J-card) is the album-page device.** **ETCH is a jewel case.**
10. **DECKs are public, like MySpace** (was Open 2, settled October 2026). Anyone can see a DECK's handle, name, tagline, profile song, liner notes, Top 8 albums and reviews. A public DECK never shows anything from the private side: no crew names or members, no burns, no etches, nothing kept in CASE. There is no profile search or browse page; you reach someone's DECK by tapping a reviewer's name on a J-card. In the database, `profiles` and `top8` are readable by everyone and everything crew-related stays members-only.

### Open
1. **Remaining missing screens:** onboarding / empty state (no crews yet), the This Week mix as its own surface, and a "your reviews" list (DECK's shelf only shows four).
2. ~~**Who can see a DECK.**~~ **Settled:** DECKs are public. See Settled 10.
3. **Getting to TAPE without a burn.** Right now you reach an album from a burn, your DECK or your Top 8. Public reviews imply some way to look up any album, and that has to be built without becoming a discovery feed (§2 forbids one).
4. **Crew heat.** The prototype shows your crews' average heat on a TAPE. Confirm that's acceptable under anti-clout, or drop it.

---

## 9. Build notes

- Screens are 322×716 (WIRE, DECK, CTRL) or 392×812 (CHNL, CASE) inside the phone shell. Pick one and normalize if building for real devices.
- **Prototype rule on hit targets:** decorative hardware (LEDs, model numbers, VU segments, ring hardware) stays display-scale. Anything actually tappable in the prototype — nav tabs, feed rows, presets, play buttons, the click wheel, skin swatches — needs a real ≥44px hit area, even if the visible art is smaller. Use padding or an invisible overlay, not bigger graphics.
- Contrast: keep ink at full opacity over metal and photo grounds. The muted `rgba(233,228,240,.4)` tier is for micro-labels only, never for content.
- All styling is inline in the current files; there is no stylesheet or token file. Only `@font-face`, `@keyframes`, and body resets live in a style block.
- Fonts load from Google: `Michroma`, `DM Mono` (400/500 + italic), `Chakra Petch` (400–700). Drop `Caveat` unless you're rendering an ETCH note.

---

## 10. File map

| File | What it is |
|---|---|
| `KYBR Prototype.dc.html` | **The clickable prototype.** All five tabs plus PLYR, BURN, ETCH and TAPE, wired together with fake data. Needs `support.js` next to it. |
| `KYBR Build Plan.md` | How to build the real app: stack, accounts, music services and their rules, data model, build order. |
| `CHNL.dc.html` | Crew rack + PLYR overlay. The reference chassis. |
| `CASE.dc.html` | CD-binder library (emoji chips removed). |
| `CTRL.dc.html` | Win98 control panel settings. |
| `DECK 2a Cold Mono.dc.html` | **Chosen** profile: record sleeve, Chakra Petch + DM Mono. |
| `DECK v2.dc.html` | All DECK explorations — 1a/1b/1c layouts, 2a/2b/2c type cuts. |
| `DECK.dc.html` | Original cluttered MySpace version (superseded). |
| `WIRE Home.dc.html` | Three Game Boy Color shells. |
| `WIRE UV Shell.dc.html` | The Atomic Purple shell alone. |
| `WIRE Home (DMG grey).dc.html` | Earlier original-Game-Boy version. |
| `PLYR.dc.html` / `PLYR copy.dc.html` | Standalone iPod player. |
| `BURN Flow.dc.html` | The four-step create flow. |
| `Canvas.dc.html` | Working scratch canvas. |
