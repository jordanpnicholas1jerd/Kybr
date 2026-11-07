# KYBR — Design Spec (v2: the record store)
_Handoff document. Everything needed to build the app with confidence. Rewritten November 2026 when KYBR changed focus from song sharing to album reviews._

The clickable reference for this spec is `docs/reference/KYBR Records Mockup.html` (open it in a browser). Its albums, covers, people and tracklists are placeholders. The older Game Boy / iPod / Win98 prototype (`KYBR Prototype.dc.html`) is kept for history only. Where it disagrees with this document, this document wins.

---

## 1. What KYBR is

**An album diary for you and your crew, built out of CDs.**

You **spin** albums and write **takes** on them, with heat stars and a few honest words. Your takes go up on your **shelf** for anyone to read. Second, you **burn** songs, mixes and albums to your **crew**, a private group of up to 8 friends. Each crew runs **Burn Club**: one album a week, everyone spins it, and then the next person picks.

**Priorities, in order:**
1. **Album reviews**, part Letterboxd, part Substack: spin, take, booklet, shelf. People read, like and comment, so you can become **known for your opinion without being famous**. This is the main event.
2. **Music sharing**: burns to your crew, kept in your binder. It's a close second.
3. **Burn Club** connects the two. Every round is shared music that turns into public takes.

**Anti-thesis:** it's not Spotify (no library-as-utility), not Instagram (no clout), and not a discovery feed (no algorithm). It's an indie CD shop where you and your friends hang out, leave staff picks, and pass each other burned CDs.

**Audience now:** the author and their friends. Design for that room, not for a market.

---

## 2. Soul: the non-negotiables

| Principle | What it means in the UI |
|---|---|
| **Warm and personal** | Copy is lowercase, personal, a little sentimental: "burned for you", "still warm", "what stuck with you?" |
| **Known for taste, not fame** | Reviews get likes and comments, with real counts, so good writing gets noticed. People never get a fame number: **no follower counts**, no leaderboards, no "top reviewers", no trending pages. Reputation shows as what you're *known for* (§6.5), not how many people follow you. Changed November 2026; this replaces v2's "zero vanity metrics" lock. |
| **Reviews are public, sharing is private** | Takes, booklets, comments, Top 8, spins and wraps are public. Burns, crews, song replies and your KEPT binder never leave the crew, and the crew side has no likes or counts. |
| **Time, not numbers** | "spun nov 3", "kept tue", "ends sun". The only numbers shown are navigational ("round 14", "4 of 6 spun it" inside your own crew). |
| **Plain words, CD world** | **LOCKED.** Every label is an everyday word or a CD-era word people already know. The CD feeling comes from the visuals. See §3. |
| **Every screen is part of a CD's life** | **LOCKED.** Replaces the old "one device per screen" rule. Screens are built from CD objects (jewel case, tray card, spine, shrink-wrap, sticker, CD-R and Sharpie, binder, the silver rack, the burner), not from unrelated gadgets. Each screen still feels like picking up a different object. |
| **Never corporate** | No SaaS gradients, no pill-badge dashboards, no "Welcome back, User!" |

**Hard nevers:**
- No follower counts, play counts or leaderboards. Like and comment counts appear only on individual reviews and comments.
- No public feed, explore tab, "trending" or "recommended".
- No emoji as UI chrome.
- Handwriting (Caveat) only for things a person wrote: takes on the cards, notes on burned CD-Rs, Sharpie labels. Never in labels or buttons.
- Iridescence lives on **discs only**. No rainbow backgrounds.

---

## 3. Words

### 3.1 The word test
Every user-facing word has to pass one test:

> **Either it's an everyday word, or it's a word from the CD era that people already know, and the screen shows what it means.**

No invented abbreviations. **KYBR** is the only word with its vowels dropped, so it stands out. Model numbers and hardware text printed on the devices ("CD CREW SYSTEM · KY·NMT09", "DISC PRESETS") are decoration and don't need to pass the test, but nothing a person has to read to use the app may live there.

### 3.2 Tabs
Always in this order, uppercase, one real word each (3–5 letters):

**HOME · DIG · CREW · SHELF · KEPT**

| Tab | What it is |
|---|---|
| **HOME** | The front of the shop: the Burn Club ticker, what's been burned for you, new takes from your crews. |
| **DIG** | Search any album or artist. |
| **CREW** | Your crews, in the silver hi-fi rack. Burn Club lives here. |
| **SHELF** | Your public page: on repeat, liner notes, Top 8, your spins, still wrapped. Settings opens from here. |
| **KEPT** | Your private CD binder of burns you chose to keep. |

### 3.3 Lexicon (use verbatim)

**Brand words** (seven, each easy to learn): **KYBR · burn · spin · take · heat · wrapped · Burn Club**

| Word | Meaning | You'd see |
|---|---|---|
| **spin** | Listening to an album and logging it. | "✎ SPIN IT", "you spun it nov 3", "4 of 6 spun it" |
| **take** | A review: heat plus words. Albums get public takes; songs get crew-only takes (§6.10). | "Mara's take", "★ POST YOUR TAKE", "REWRITE YOUR TAKE" |
| **sticker line** | Optional one-liner printed on a hype sticker on the cover. Up to 40 characters. | "the bridge on 6" |
| **heat** | The one rating scale (§4.5). | ★★★★½ burning |
| **crew heat** | Average of your crews' takes on an album. | "crew heat ★★★★ hot" |
| **wrapped** | An album you want to hear. It stays shrink-wrapped until you spin it. | "♡ WANT IT", "still wrapped", "UNWRAP & SPIN IT" |
| **your spins** | Your diary, drawn as a tower of spines grouped by month. | |
| **Top 8** | The 8 albums faced out on your shelf. | |
| **liner notes** | Your bio. | |
| **on repeat** | Your profile song. | |
| **burn** | Sending music to a crew: a song, a mix or an album. | "Mara burned you Teardrop" |
| **mix** | A burned CD-R of several songs, max 80:00. | "a mix · 71:40 of 80:00" |
| **burned for you** | Burns waiting for you on HOME. | |
| **note** | What the sender writes on a burn, in Sharpie on the disc. Up to 60 characters. | |
| **kept** | A burn you saved to your binder. | "burned by Mara · kept sun" |
| **invite** | A single-use code to join a crew. | "＋ INVITE" |
| **this week** | The weekly mix of a crew's burns. | |
| **Burn Club** | One album a week with your crew. | |
| **round** | One Burn Club album. | "round 14" |
| **pick** | Choosing the next round's album. | "Dev's pick", "NEXT PICK ▸ SOF" |
| **the ticker** | The scrolling Burn Club strip on HOME. | |
| **the changer** | The disc row in the CREW rack: one disc per member, lit once they've spun the round. | |

### 3.4 Retired words
These no longer appear as labels anywhere: **WIRE, CHNL, DECK, CASE, CTRL, ETCH, DUB, BUMP, PLYR, TAPE, J-CARD.** Some still appear in code and table names (§9). Don't let them leak into the UI.

---

## 4. Visual system

### 4.1 Palette
Unchanged from v1. **Grounds:** `#15121b` base, `#1a1622` panel, `#100d15` deepest, radial top-light `radial-gradient(130% 80% at 12% -10%, #2b2236, #1a1622 52%)`, `#150f1f` device screen interior.
**Ink:** `#e9e4f0` primary, `rgba(233,228,240,.6)` secondary, `rgba(233,228,240,.45)` micro-labels only.

**Skins** (user-selectable accent, UV is the default):
```
UV      #C084FF   lo #e7c8ff   hi #7a3fd0   ← DEFAULT
Sunset  #FF8A3D   lo #ffd6a8   hi #d75a2a
Ice     #6FD3E8   lo #cdf6ff   hi #2a9fc4
Volt    #C6F24E   lo #eaffb0   hi #7fb02a
Heat    #FF4D3D   lo #ffcabf   hi #c42a1a
```

**Fixed signal colors (never re-skinned):**
```
#FFB45E / #FF8A3D   ember: heat, stars, "your turn" nudges, primary keys
#7CFFC2 / #a8ffcf   green LCD: "spun it", confirmations, toasts
#5fd8ff / #9fefff   cyan LCD: the CREW rack, the ticker, the burner screen
#ff6fae             hot pink: active crew preset, invite
#ffe27a             sticker yellow: hype stickers
#f3ecdd → #ebe2ce   paper: take cards (crew), #e9edf2 → #d9dfe7 for takes from everyone
#23307a             ballpoint ink (handwritten takes)
#1d1b4f             Sharpie ink (CD-R labels, notes on burns)
```

### 4.2 Type
| Face | Use |
|---|---|
| **Michroma** | Wordmarks, screen titles, spines, LCD readouts, the ticker. Letter-spaced 1–3px, usually uppercase. Never body copy. |
| **DM Mono** | Everything else: labels, body, data, song titles, typed takes from everyone. |
| **Chakra Petch 600** | The name on the SHELF name tag only. |
| **Caveat** | Handwriting only: crew takes on paper cards (500, ballpoint), Sharpie on CD-Rs and burn notes (600). |

Chrome-metal title text, unchanged:
```css
background: linear-gradient(180deg,#fff,#e3e4ec 26%,#9a9bae 50%,#74758a 53%,#cfd0db 76%,#fff);
-webkit-background-clip: text; background-clip: text; color: transparent;
```

### 4.3 Material recipes
Kept from v1: **CD iridescence** (discs, avatars), **brushed silver faceplate** (CREW rack, burner, ticker frame), **chrome bar** (on repeat radio), **sunken LCD** with scanlines (cyan and green variants), **phone shell**. Recipes are in the v1 spec history and in `src/`.

New in v2:

**Jewel case** (album page):
```css
/* frame */ padding: 8px 8px 8px 18px; border-radius: 4px;
background: linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04) 40%,rgba(255,255,255,.1));
box-shadow: inset 0 0 0 1px rgba(255,255,255,.28), 0 14px 30px rgba(0,0,0,.55);
/* hinge: 8px strip on the left */ repeating-linear-gradient(180deg,rgba(255,255,255,.28) 0 2px,rgba(255,255,255,.06) 2px 5px);
/* glare */ linear-gradient(120deg,rgba(255,255,255,.18),transparent 30%);
```

**Shrink-wrap** (wrapped albums), laid over the cover:
```css
background: linear-gradient(115deg,transparent 18%,rgba(255,255,255,.28) 30%,transparent 42%,rgba(255,255,255,.14) 68%,transparent 78%),
            linear-gradient(0deg,rgba(220,230,255,.08),rgba(220,230,255,.08));
border: 1px solid rgba(255,255,255,.35);
```

**Hype sticker** (your take on the cover): a 92px circle, `radial-gradient(circle at 40% 35%,#fff4b8,#ffe27a 60%,#e8c24a)`, rotated 9°, overlapping the top-right corner. Stars in `#b4321f`, the heat word in Michroma, the sticker line in DM Mono.

**CD-R** (burns): silver `conic-gradient(from 30deg,#d9dce3,#f6f7f9,#b9bcc6,#eef0f4,#c9ccd5,#e9ebef,#d9dce3)`, a hub cut-out, and the label written in Sharpie (Caveat 600, `#1d1b4f`), tilted −4° to −6°.

**Spine** (search results, your spins): a 36px-tall horizontal strip in the album's two tint colors, `ARTIST — TITLE` in 8px Michroma, year or your stars on the right. A list of spines reads as a stack of CDs.

**Take card:** paper (`#f3ecdd → #ebe2ce`), a strip of translucent tape at the top, the author and time in small caps, stars in `#c4561f`, and the take in ballpoint. Takes from everyone use the cool paper (`#e9edf2 → #d9dfe7`) with the take typed in DM Mono, not handwritten. Your own card gets a 2px ember ring.

**Tray card** (tracklist): pale grey paper (`#e9e6df → #d6d2c8`), two columns, dotted rules, a barcode at the bottom.

### 4.4 Animations
`kybrSpin` (discs), `kybrEq` (spectrum, equalizer), `kybrFlick` (VU, ticker light), `kybrRise` (sheets), `kybrFlip` (binder pages) are unchanged.
New: `kybrTick` (ticker scroll, `translateX(0 → -50%)` over a duplicated strip, about 9s per round, pauses on hover/focus) and `kybrPulse` (your unlit disc in the changer). Everything respects `prefers-reduced-motion`.

### 4.5 Heat: the one rating scale. SETTLED
- **0.5 to 5 in half steps**, drawn as five ember stars. The off state is the same star at 20% opacity.
- **Input:** five 44×44 star cells. Tap a star to set that whole number. Tap it again for half a star less. Tap again to go back up. No sliders.
- **Display:** `★★★★½` glyphs. Never a number, never "4.5/5".
- **Words:** 0.5 frozen · 1 cold · 1.5 cool · 2 room temp · 2.5 lukewarm · 3 warm · 3.5 toasty · 4 hot · 4.5 burning · 5 scorching.
- Required for any take. Optional on a burn.
- **Crew heat** is the average of your crews' takes, rounded to the half, shown as stars and a word. There's no public average and no count.

---

## 5. Navigation. LOCKED
The chrome nav tray from v1 is unchanged: five beveled metal buttons in a dark recessed tray, the active one bright with a lit LED in the skin color (recipes in `src/components/NavTray.tsx`).

Order, always: **HOME · DIG · CREW · SHELF · KEPT**. Labels 8px, letter-spacing 1.2–1.5px.

The album page and the overlays don't get tabs. The album page replaces the tab content, and the tab you came from stays lit. ◂ BACK returns you there. The status bar shows the skin name on tab screens and `ALBUM` on the album page.

---

## 6. Screens

### 6.1 HOME: the front of the shop
1. **Header:** `KYBR RECORDS` in chrome, with a green `● OPEN` light.
2. **The ticker** (§6.3). It's the first thing you see.
3. **Burned for you:** a horizontal row of CD-Rs with Sharpie labels (song title, or the mix's name, or "the whole album"), "from [name]" and the time. Tap one to open the burned-for-you sheet (§6.10).
4. **New takes, from your crews:** rows with a cover, name · album, stars and the take in quotes, newest first. Tap a row to open the album.
5. **BURN:** a round ember button floating bottom-right opens the burner (§6.9).

Everything here comes from your crews and the shelves you follow, ordered by time. Empty state: "nothing burned for you yet."

**With no crew:** the ticker and burned for you are hidden. HOME shows new takes from shelves you follow, and a quiet line: "start a crew or enter an invite code to burn music with friends."

### 6.2 DIG: search
1. Header `DIG` · "find any album", on a warm brown counter panel.
2. Input: "dig for an album or artist…". Searches the whole catalog (MusicBrainz), not just what your crews have touched.
3. Before you type: **Recent digs** (your own searches) and **Burn Club albums** (rounds from your crews).
4. Results show as **spines**, grouped under A–Z dividers by artist (ignoring a leading "The"). If you've spun it, your stars show on the spine.
5. Footer line: "no charts here. dig for what you want."

**No ranking by popularity, no "people also liked", no browse-by-genre pages.** Search only shows results once you've typed something. This settles v1's Open 3.

### 6.3 The ticker (on HOME)
A sunken cyan LCD strip in a thin chrome frame, 46px tall.
- **Left:** an ember tag, `BURN CLUB`, with a blinking red light.
- **Right:** every active round scrolls past, rounds waiting on you first:
  `● BASEMENT · RD 14 · MEZZANINE · 4 OF 6 SPUN IT · ENDS SUN · YOUR TURN TO SPIN ✎`
  "YOUR TURN TO SPIN ✎" is ember. Once you've spun it, it reads `YOU SPUN IT ★★★★` in green.
- **Under it:** "your turn to spin in 2 crews" (or "all caught up") · "tap to open CREW ▸".
- **Tap:** opens CREW, tuned to the first crew that's waiting on you.
- Hover or focus pauses the scroll. With reduced motion it sits still, and the line under it still says everything.

### 6.4 CREW: the silver rack (Burn Club lives here)
The v1 CHNL rack, kept because it's the strongest chassis in the project. Top to bottom:
1. **Faceplate:** `KYBR` in dark chrome · `CD CREW SYSTEM · KY·NMT09`.
2. **Cyan LCD:** `● ROUND 14` · `CREW 2 · basement · 98.6fm` · a 12-bar spectrum · the round album in big type · "massive attack · Dev's pick" · right side `ENDS SUN` / `NEXT PICK ▸ SOF`. Tap the album to open it. When you're looking at a past round, the dot turns ember, the label reads `PAST · ROUND 13`, the spectrum dims, and the right side reads `CREW HEAT / HOT`.
3. **The changer** (new component): `6-DISC CHANGER · BURN CLUB` · `● spun it`. One disc per member in a dark tray (columns = members, up to 6 per row). A member's disc is iridescent and spinning once they've spun the round; otherwise it's dark. Under each disc: the name and their stars, or "—". **Your disc**, if you haven't spun it, has a pulsing ember ring and says `SPIN`; tapping it opens the take sheet. Tapping a lit disc shows that person's take on a green LCD strip below the tray. Below that: `✎ SPIN IT` (ember), or `✓ YOU SPUN IT ★★★★ · OPEN THE ALBUM ↗`.
4. **Transport and jog dial:** ⏮ older round · ▶ open the round album · ⏭ newer round · the jog dial (`TUNE`) cycles crews. Printed hint: `⏮ ⏭ ROUNDS · ▶ ALBUM · DIAL CREWS`.
5. **Disc presets:** one per crew, hot pink when active, numbered, with the frequency.
6. **In the crew** (member chips, `＋ INVITE`, or `FULL` at 8) and **VU · CREW HEAT** (14 segments lit in proportion to the round's crew heat, with the heat word underneath).
7. **Burned to [crew]:** the song burn list (Michroma numbers, song, "artist · who", time). Tap to open it in your music service.
8. **This week** bar and the red `410W T·BASS` badge (decoration).

### 6.5 SHELF: your public page
1. **Name tag:** a white badge with a skin-colored band reading `KYBR RECORDS · STAFF`, your name in Chakra Petch 600 / 24px / 4px tracking, then `@handle · "tagline"`. Beside it, a small `⚙ SETTINGS` button.
2. **On repeat:** the chrome radio from v1 (green LCD, equalizer, purple play knob).
3. **Liner notes:** a thin skin-colored rule on the left, 11px body.
4. **Top 8** · `PUBLIC`: a 4×2 wall of covers. Tap one to open it.
5. **Your spins:** spines grouped by month, newest on top, each showing your stars.
6. **Known for:** up to three tags earned from likes on your reviews, for an artist, genre or decade ("known for trip-hop · Björk · 2000s R&B"). Computed from likes on your reviews in that corner of music, never from followers. Hidden until you've earned one.
7. **Booklets:** your long reviews, newest first, as booklet covers.
8. **Your takes:** your latest takes as cards with their likes, newest first, `SEE ALL ▸`.
9. **Still wrapped:** covers under shrink-wrap. Empty state: "nothing wrapped. tap ♡ WANT IT on any album."

Anyone can see a shelf. Nothing from the private side (crews, burns, KEPT) ever appears on it. You reach someone else's shelf by tapping their name on a take. On someone else's shelf, a `＋ FOLLOW` key under the name tag adds their takes and booklets to your HOME. **No follower count is ever shown, on either side.** You can see the list of people you follow; nobody can see who follows them.

### 6.6 KEPT: your binder (private)
The v1 CD binder: a `KEPT` chrome title, "burns you kept · only you see this", a `DISC nn / 48` pill, two sleeves per page split by eight chrome rings, and ▲ / `flip the rings` / ▼. Each sleeve: an iridescent CD, the song, the artist, an avatar plus "burned by [name] · kept [day]", and `▸ OPEN IN [SERVICE]`. Mixes show as a CD-R with a Sharpie tracklist.

### 6.7 Album page (the jewel case)
Opens from DIG, takes on HOME, the CREW rack, Top 8, your spins and burns. It replaces the tab content.
1. `◂ BACK` · on the right, `♡ WANT IT` / `♥ WANTED`, or `spun [when]` once you've spun it.
2. **The case:** the cover (Cover Art Archive) inside the jewel case frame. If you've spun it, your **hype sticker** sits on the corner. If it's wrapped, shrink-wrap covers it with `STILL WRAPPED`.
3. Title in chrome Michroma · `artist · year · n tracks`.
4. Keys: `✎ SPIN IT` / `✎ UNWRAP & SPIN IT` / `✎ REWRITE YOUR TAKE` (ember) · `BURN IT ▸` (opens the burner with this album).
5. **Crew heat** row (only if someone in your crews has a take).
6. **Booklets** (long reviews, §6.13): cards with title, author, stars and the first lines, above the takes.
7. **Takes:** a row of take cards. Yours first, then a toggle: `MOST LIKED` (default) / `NEWEST`. Your crews' takes are marked with the crew name. Each card shows `♥ n` and comment counts drawn as hardware glyphs, not emoji (`♥ 24 · ▤ 3`). Tap a card to open its comments.
8. **Tracklist:** the tray card, two columns. Tap a song to open it in your service. Under it, an "open in" row: Apple Music · Spotify · YouTube Music · Tidal.

### 6.8 Take sheet (spinning an album)
Rises from the bottom over a blurred scrim.
- Title `SPIN IT` · album · artist · ✕.
- A paper card: heat cells plus the word ("tap a star · twice for ½" until set), "your take", a ruled ballpoint textarea (280 characters, "what stuck with you?"), a character counter.
- `sticker line · optional` (40 characters).
- `spun`: `TODAY` / `THIS WEEK`, and `↻ RELISTEN` (adds a new entry to your spins instead of replacing the old one).
- "public · shows on your shelf and on this album." If this album is an open Burn Club round in one of your crews: "counts for Burn Club round 14."
- Keys `CANCEL` / `★ POST YOUR TAKE` (disabled until there's heat).

**Result:** the sticker appears on the cover, the album goes to the top of your spins, wrap comes off, and if it's a round, your disc lights up in the changer and the ticker flips to green. Toasts: "✓ posted · on your shelf", "✓ spun · your disc is lit in basement", or "✓ round 14 complete · Sof picks next".

### 6.9 Burner (sending music)
A brushed-silver chassis: `KYBR` · `CD-RW BURNER · KY·BRN01` · a status light (`READY` amber, `BUSY`, `DONE` green), and step lights `WHAT · CREW · NOTE · BURN`.
1. **What:** a song (one song for your crew) · a mix CD-R (up to 80:00, like a real blank) · an album (send it to them, or make it a Burn Club round).
2. **Pick it:**
   - *Song:* paste a link, or `OR GRAB ONE YOU PLAYED` (recent songs). Resolves through Odesli as in v1.
   - *Mix:* add songs one by one. A capacity bar fills green → yellow → red, with `mm:ss / 80:00` and "mm:ss of blank left". Over 80:00, NEXT is disabled: "over the limit. take one off."
   - *Album:* search, or pick from your spins.
3. **Crew:** `WHO'S THIS FOR?`, one row per crew. For albums, also `HOW?`: *burn it for them* (it shows up wrapped in their burned for you) or *make it a Burn Club round* (it plays when it's your pick). "private · stays in the crew, never public."
4. **Note:** a CD-R preview with the label in Sharpie, plus an optional note (60 characters).
5. **Burning → done:** the disc spins fast with `BURNING… nn%`, then `✓ BURNED & SENT` · "delivered to [crew]. still warm." Keys `⏏ EJECT` / `SEE IT IN CREW`.

### 6.10 Burned-for-you sheet
Opens from a CD-R on HOME. A large CD-R with the Sharpie label, the title, the artist, the sender's note in handwriting, and when it arrived. Keys: `▸ OPEN IN [SERVICE]` · `OPEN THE ALBUM ↗` (if the album is known) · `★ KEEP IT` (moves it to KEPT: "✓ kept · it's in your binder").

**Song takes (the old ETCH):** the receiver can also leave a quick take on a burned song, with heat plus up to 80 characters. It stays inside the crew, and the sender sees it on the burn. Settled (Open 5); not in the mockup yet.

### 6.11 Settings
Opens from `⚙ SETTINGS` on SHELF, styled as an enhanced-CD **autorun menu** (the window that popped up when you put a disc in a PC): a blue title bar `KYBR.EXE · autorun`, a spinning disc, and glossy pill buttons for **Skin** (five swatches), **Music service** (Apple Music · Spotify · YouTube Music · Tidal), **Your crews**, **Notifications** and **Sign out**.

### 6.12 First run
Not designed yet (Open 1). The v1 answering machine is not CD-world and gets replaced. Direction: you start with a sealed jewel case and unwrap it to begin. Then: sign in with a magic link → pick a handle → **start a crew**, **enter an invite code**, or **just spin** (no crew; settled in Open 2).


### 6.13 Booklets (long reviews)
The Substack part. A booklet is a long review of one album, written like the booklet that folds out of a CD case.
- **Writing:** from the album page, `✎ WRITE A BOOKLET`. Title, stars (required), the body (no length cap, paragraphs, pull quotes), and up to three favorite tracks called out. Saves drafts. Publishing a booklet also sets your take's stars for that album.
- **Reading:** a reading view styled as booklet pages: the album art as the cover, then clean pages of type (DM Mono body, Michroma headings). Author name tag at the top, tap to open their shelf.
- **Likes:** `♥` with a count, on booklets, takes and comments.
- **Comments:** anyone signed in can comment (1,000 characters). Comments can be liked. The author can pin one and delete any on their own booklet. Sort `MOST LIKED` / `NEWEST`. One level of replies.
- **Where booklets show:** on the album page above takes, on the author's shelf, and on followers' HOME.

### 6.14 Song replies (crew only)
Replaces the 80-character song take. When someone burns a song, anyone in the crew can reply with up to **250 characters**, stars optional. Replies stack under the burn as a short thread, oldest first. No likes, no counts; it stays in the crew.

---

## 7. Copy rules
- Lowercase for human lines ("still warm", "what stuck with you?", "burned by Mara · kept sun").
- UPPERCASE with wide tracking for hardware labels and keys (`SPIN IT`, `DISC PRESETS`, `flip the rings` is the one lowercase exception, kept from v1).
- Time, not counts: "spun nov 3", "kept tue", "ends sun".
- Attribution is always a person: "Dev's pick", "burned by Mara", "Sof picks next".
- Never: "Trending", "Popular", "Recommended for you", "Top reviewers", "X plays", "X followers", "Discover". Like and comment counts are fine on individual reviews.
- Every word passes the word test (§3.1).

---

## 8. Decisions

### Settled
1. **Reviews are the main event;** sharing is a close second (November 2026).
2. **The CD world replaces "one device per screen."** The Game Boy (WIRE), iPod (PLYR), Win98 (CTRL), cassette (TAPE) and answering machine are retired.
3. **The CREW rack stays,** and Burn Club lives inside it (the changer).
4. **Plain words, CD world** (§3). Tabs: HOME · DIG · CREW · SHELF · KEPT.
5. **Burn Club shows on HOME as the ticker,** and in full in CREW.
6. **DIG searches any album** (the whole catalog), with no ranking or feed.
7. **Mixes are capped at 80:00,** the length of a real CD-R.
8. **Crews are capped at 8 people.** The wordmark is **KYBR**.
9. **One heat scale** for album and song takes.
10. **Takes and shelves are public; crews, burns, notes and KEPT are private.** There's no profile search; you reach a shelf through a take.
11. **Solo users are welcome** (November 2026). You can sign up just to spin and post takes; a crew is something you add.
12. **Burn Club rounds run Sunday to Sunday.** Every round closes Sunday at midnight in the crew's time zone and the next one opens. A crew's first round runs to the next Sunday. Unlit discs stay dark; there's no penalty.
13. **Song takes stay.** Receivers can leave heat and up to 80 characters on a burned song, inside the crew only.
14. **Following is in,** built after Burn Club. Follow from someone's shelf; their takes and booklets show on your HOME; follower counts are never shown.
15. **Reviews get likes and comments** (November 2026). Counts show on individual takes, booklets and comments. People are known for taste ("known for" tags), never for follower numbers. No app-wide best-of or trending page; good reviews rise on each album's page.
16. **Booklets** are the long review (§6.13).
17. **Song replies** replace song takes: 250 characters, stars optional, crew only (§6.14).

### Open
1. **First run:** design the unwrap-the-case opening.
2. ~~**Solo users**~~ **Settled:** yes (Settled 11).
3. ~~**Following people outside your crews**~~ **Settled:** a quiet follow, after Burn Club (Settled 14).
4. ~~**Burn Club rules**~~ **Settled:** Sunday to Sunday, closes on time, no penalty (Settled 12). Still to decide: whether a picker can pass their turn.
5. ~~**Song takes**~~ **Settled:** keep them (Settled 13).
6. **Crew heat** stays (the mockup shows it on albums and in the VU meter). Reconfirm it doesn't feel like a score.
7. **In-app playback:** v1's PLYR (iPod) is retired. If in-app playback (Build Plan Phase 5) happens, its player needs a CD-world device, probably a Discman.

---

## 9. Build notes
- **Screen size:** design at 392×812 inside the phone shell; the shell fills the screen on phones.
- **Hit targets:** anything tappable is at least 44px, using padding or an invisible overlay rather than bigger art. Decorative hardware (LEDs, model numbers, VU segments, rings) stays display-scale.
- **Contrast:** ink is full opacity over metal and paper. The 45% tier is for micro-labels only.
- **Code names vs UI words:** the code and database still use v1 names in places (`burns`, `etches`, `dubs`, `kept`, `reviews`, `Wire.tsx`, `Chnl.tsx`). That's fine internally, but no v1 word reaches the UI. Map: Wire → HOME, Chnl → CREW, Deck → SHELF, Case → KEPT, Ctrl → Settings, reviews → takes, etches → song takes, dubs → invites. The Build Plan says which to rename.

---

## 10. File map
| File | What it is |
|---|---|
| `reference/KYBR Records Mockup.html` | **The clickable reference for v2.** All five tabs, the album page, take sheet, burner, burned-for-you sheet and settings, with placeholder data. Open it in a browser. |
| `KYBR Build Plan.md` | How to build it: stack, music services, data model, privacy, phases. |
| `reference/KYBR Prototype.dc.html` + `support.js` | **Superseded.** The v1 prototype (Game Boy, iPod, Win98, cassette). Keep for the CREW rack, nav tray and material recipes only. |
