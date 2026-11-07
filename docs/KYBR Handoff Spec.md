# KYBR — Design Spec
_Everything needed to build the app: what it is, the words it uses, how it looks, and what every screen does._

The clickable reference is `docs/reference/KYBR Records Mockup.html` (open it in a browser). Its albums, covers, people and tracklists are placeholders. Where the mockup and this document disagree, this document wins.

---

## 1. What KYBR is

**An album diary for you and your crew, built out of CDs.**

You **spin** albums and write **takes** on them, with heat stars and a few honest words. Your takes and longer **booklets** go up on your **label** (your own little record label) for anyone to read, like and comment on. Second, you **burn** songs, mixes and albums to your **crew**, a private group of up to 8 friends. Each crew runs **Burn Club**: one album a week, everyone spins it, and then the next person picks.

**Priorities, in order:**
1. **Album reviews**, part Letterboxd, part Substack: spin, take, booklet, label. People read, like, comment and subscribe, so you can become **known for your opinion without being famous**. This is the main event.
2. **Music sharing**: burns to your crew, kept in your binder. A close second.
3. **Burn Club** connects the two. Every round is shared music that turns into public takes.

**What it isn't:** not Spotify (no library-as-utility) and not a discovery feed (no algorithm). It's an indie CD shop where you and your friends hang out, write about records, and pass each other burned CDs.

**Audience now:** the author and their friends. Design for that room, not for a market.

---

## 2. Principles

| Principle | What it means in the UI |
|---|---|
| **Warm and personal** | Copy is lowercase, personal, a little sentimental: "burned for you", "still warm", "what stuck with you?" |
| **Known for taste** | Takes, booklets and comments show likes and comment counts, so good writing gets noticed. Labels show their **listener count** (how many people subscribe). There are no leaderboards, no "top reviewers" and no trending pages; reputation also shows as what you're *known for* (§6.5). |
| **Reviews are public, sharing is private** | Takes, booklets, comments, labels, Top 8, spins and wraps are public. Burns, crews, song replies and your KEPT binder never leave the crew, and the crew side has no likes or counts. |
| **Time over numbers** | "spun nov 3", "kept tue", "ends sun". Inside a crew the only numbers are navigational ("round 14", "4 of 6 spun it"). |
| **Plain words, CD world** | Every label is an everyday word or a CD-era word people already know. The CD feeling comes from the visuals (§3). |
| **Every screen is part of a CD's life** | Screens are built from CD objects: jewel case, tray card, spine, shrink-wrap, hype sticker, CD-R and Sharpie, binder, the silver rack, the burner. Each screen feels like picking up a different object. |
| **Never corporate** | No SaaS gradients, no pill-badge dashboards, no "Welcome back, User!" |

**Hard nevers:**
- No play counts, leaderboards or trending pages. Listener counts appear on labels; like and comment counts appear on individual takes, booklets and comments.
- No explore tab, "trending" or "recommended for you".
- No emoji as UI chrome.
- Handwriting (Caveat) only for things a person wrote: notes on burned CD-Rs, Sharpie labels, the take shown in the CREW rack. Never in labels or buttons.
- Iridescence lives on **discs only**.

---

## 3. Words

### 3.1 The word test
Every user-facing word has to pass one test:

> **Either it's an everyday word, or it's a word from the CD era that people already know, and the screen shows what it means.**

No invented abbreviations. **KYBR** is the only word with its vowels dropped, so it stands out. Model numbers and hardware text printed on the devices ("CD CREW SYSTEM · KY·NMT09", "DISC PRESETS") are decoration, but nothing a person has to read to use the app may live only there.

### 3.2 Tabs
Always in this order, uppercase, one real word each:

**HOME · DIG · CREW · LABEL · KEPT**

| Tab | What it is |
|---|---|
| **HOME** | The front of the shop: the Burn Club ticker, new booklets, what's been burned for you, new takes. |
| **DIG** | Search any album, or find writers. |
| **CREW** | Your crews, in the silver hi-fi rack. Burn Club lives here. |
| **LABEL** | Your public page, set up like your own record label: name, listeners, known-for tags, booklets, takes, on repeat, Top 8, your spins, still wrapped. Settings opens from here. |
| **KEPT** | Your private CD binder of burns you chose to keep. |

### 3.3 Lexicon (use verbatim)

**Brand words:** **KYBR · burn · spin · take · heat · wrapped · Burn Club · label · booklet**

| Word | Meaning | You'd see |
|---|---|---|
| **spin** | Listening to an album and logging it. | "✎ SPIN IT", "you spun it nov 3", "4 of 6 spun it" |
| **take** | A short public review of an album: heat plus up to 280 characters. | "Mara's take", "★ POST YOUR TAKE", "REWRITE YOUR TAKE" |
| **booklet** | A long review, written like the booklet in a CD case. | "✎ WRITE A BOOKLET" |
| **sticker line** | Optional one-liner printed on a hype sticker on the cover. Up to 40 characters. | "the bridge on 6" |
| **heat** | The one rating scale (§4.5). | ★★★★½ burning |
| **crew heat** | Average of your crews' takes on an album. | "crew heat ★★★★ hot" |
| **label** | Your public page, named like a record label ("Cold Side"). | "a label by Jordan" |
| **subscribe** | Getting a label's new booklets and takes on your HOME. | "SUBSCRIBE", "✓ SUBSCRIBED" |
| **listeners** | How many people subscribe to a label. | "1,204 listeners" |
| **known for** | Tags earned from likes on your reviews. | "known for trip-hop · Björk" |
| **wrapped** | An album you want to hear. It stays shrink-wrapped until you spin it. | "♡ WANT IT", "still wrapped", "UNWRAP & SPIN IT" |
| **your spins** | Your diary, drawn as a tower of spines grouped by month. | |
| **Top 8** | The 8 albums faced out on your label. | |
| **liner notes** | Your bio. | |
| **on repeat** | Your profile song. | |
| **burn** | Sending music to a crew: a song, a mix or an album. | "Mara burned you Teardrop" |
| **mix** | A burned CD-R of several songs, max 80:00. | "a mix · 71:40 of 80:00" |
| **burned for you** | Burns waiting for you on HOME. | |
| **preview** | A 30-second clip of a song, played inside KYBR. | "▶ PREVIEW · 0:30" |
| **note** | What the sender writes on a burn, in Sharpie on the disc. Up to 60 characters. | |
| **reply** | A crew member's response to a burned song (§6.14). | "reply to Mara" |
| **kept** | A burn you saved to your binder. | "burned by Mara · kept sun" |
| **invite** | A single-use code to join a crew. | "＋ INVITE" |
| **this week** | The weekly mix of a crew's burns. | |
| **Burn Club** | One album a week with your crew. | |
| **round** | One Burn Club album. | "round 14" |
| **pick** | Choosing the next round's album. | "Dev's pick", "NEXT PICK ▸ SOF" |
| **the ticker** | The scrolling Burn Club strip on HOME. | |
| **the changer** | The disc row in the CREW rack: one disc per member, lit once they've spun the round. | |

### 3.4 Words never used as labels
**WIRE, CHNL, DECK, SHELF, CASE, CTRL, ETCH, DUB, BUMP, PLYR, TAPE, J-CARD.** Some appear in code and table names (§9); none of them reach the screen.

---

## 4. Visual system

### 4.1 Look: cobalt and chrome
The screen is a cobalt grid, like blueprint paper. Everything you press is a chrome key that sits up off the screen and sinks when pressed. The main action on each screen is a blue chrome key. Reviews sit on brushed chrome plates with the words etched in. The CREW rack, ticker and LCD screens are dark hardware.

```
Screen          #3F5BA9 cobalt, with a faint white grid every 22px
Page outside    #E8DCC6 cream
Ink on cobalt   #F1E8D6 cream (labels at ~66% opacity)
Hardware        #141414 ink black (panels, nav tray, outlines)
Chrome keys     linear-gradient(180deg,#fff 0%,#eef0f4 18%,#b9bec9 46%,#8d93a1 50%,#d5d9e0 74%,#f4f5f8 100%)
                border #4b505c, a 5px #5d6372 edge below; pressed = moves down 4px
Blue chrome     linear-gradient(180deg,#c9d6ff 0%,#8ea6f0 20%,#4a66c0 47%,#2a418a 51%,#5f7bd6 75%,#b4c4f5 100%)
                main keys, the active toggle, the BURN button, the BURN CLUB tag, subscribe
Review plates   brushed chrome (fine vertical lines over a light steel gradient), border #4b505c
Etched type     #2a2e38 letters, 1px white highlight below, 1px dark shadow above
Stars on chrome #24346a
LCD screens     #0a1526 → #060c18 with cool blue text (#B9C6EE)
Skins           cobalt (default) · sunset · ice · volt · heat — swap the accent color
```

### 4.2 Type
| Face | Use |
|---|---|
| **Archivo** (wide, italic, heavy 800–900) | Wordmarks, screen titles, booklet titles, spines, the ticker. On cobalt, titles are chrome-filled with a thin black outline and a hard 2px drop shadow; the middle band of the chrome stays light so titles read easily. |
| **DM Mono** | Everything else: labels, body text, booklet paragraphs, takes, data. |
| **Chakra Petch 600** | The label name on LABEL. |
| **Caveat** | Handwriting only: Sharpie on CD-Rs, notes on burns, the take in the CREW rack readout. |

### 4.3 Materials
Recipes for all of these are in `reference/KYBR Records Mockup.html`.
- **CD iridescence** on discs; **CD-R with Sharpie** for burns; **jewel case**, **shrink-wrap**, **hype sticker**, **spines** and **tray card** on albums; **sunken LCD**; the **CREW rack** faceplate.
- **Chrome review plate:** booklet cards, the booklet reader and take cards. The reader has two small rivets in its top corners. Your own take has a cobalt ring.
- **Booklet reader:** one tall chrome plate: album art, the label badge, the title in heavy italic, stars, then the body in etched DM Mono. Likes and SUBSCRIBE at the bottom; comments below the plate.
- **DIG panel:** a chrome plate with etched labels, a cobalt DIG title, chrome ALBUMS / WRITERS toggles and a dark LCD search box.
- **KEPT sleeves:** one large disc per sleeve (up to 240px), centered, with the song and "burned by" under it.

### 4.4 Motion
`kybrSpin` (discs), `kybrEq` (spectrum, equalizer), `kybrFlick` (VU, ticker light), `kybrRise` (sheets), `kybrFlip` (binder pages), `kybrTick` (ticker scroll, about 9s per round, pauses on hover or focus) and `kybrPulse` (your unlit disc in the changer). Everything respects `prefers-reduced-motion`.

### 4.5 Heat: the one rating scale
- **0.5 to 5 in half steps**, drawn as five stars. The off state is the same star at 20% opacity.
- **Input:** five 44×44 star cells. Tap a star to set that whole number, tap it again for half a star less, tap again to go back up. No sliders.
- **Display:** `★★★★½` glyphs. Never a number, never "4.5/5".
- **Words:** 0.5 frozen · 1 cold · 1.5 cool · 2 room temp · 2.5 lukewarm · 3 warm · 3.5 toasty · 4 hot · 4.5 burning · 5 scorching.
- Required for any take or booklet. Optional on a burn or a song reply.
- **Crew heat** is the average of your crews' takes, rounded to the half, shown as stars and a word.

---

## 5. Navigation
Five chrome keycaps in a black tray at the bottom of every screen, each with an LED that lights on the active tab (`src/components/NavTray.tsx` has the tray).

Order, always: **HOME · DIG · CREW · LABEL · KEPT**.

The album page, the booklet reader and someone else's label open over the current tab, and that tab stays lit. ◂ BACK returns you there. The status bar shows the skin name, `ALBUM` on the album page, or `BOOKLET` in the reader.

---

## 6. Screens

### 6.1 HOME: the front of the shop
1. **Header:** `KYBR RECORDS` in chrome, with a `● OPEN` light.
2. **The ticker** (§6.3).
3. **New booklets:** chrome booklet cards (cover, label name, title, stars, album, when, ♥ and comment counts) from labels you subscribe to and from your crews, newest first. Tap to read.
4. **Burned for you:** a row of CD-Rs with Sharpie labels from your crews. Tap one to open it (§6.10).
5. **New takes:** short takes from your crews and labels you subscribe to, each with ♥ and comments.
6. **BURN:** a blue chrome button floating bottom-right opens the burner (§6.9).

**With no crew:** the ticker and burned for you are hidden. HOME shows booklets and takes from labels you subscribe to, and a quiet line: "start a crew or enter an invite code to burn music with friends."

### 6.2 DIG: search
A chrome panel with two modes, switched by toggles:
- **ALBUMS:** "dig for an album or artist…". Searches the whole catalog (MusicBrainz). Before you type: **Recent digs** and **Burn Club albums** from your crews. Results show as **spines**, grouped under A–Z dividers by artist (ignoring a leading "The"); if you've spun it, your stars show on the spine.
- **WRITERS:** "dig for a label or writer…". Searches labels by name, handle or what they're known for. Each result shows the label, listeners, known-for tags and a SUBSCRIBE key. Before you type: the labels you subscribe to.

Footer: "no charts here. dig for what you want." Search shows results only once you've typed something.

### 6.3 The ticker (on HOME)
A dark LCD strip, 46px tall.
- **Left:** a blue chrome tag reading `BURN` / `CLUB`, centered, with a small blinking light in its corner.
- **Right:** every active round scrolls past, rounds waiting on you first:
  `● BASEMENT · RD 14 · MEZZANINE · 4 OF 6 SPUN IT · ENDS SUN · YOUR TURN TO SPIN ✎`. Once you've spun it, the end reads `YOU SPUN IT ★★★★`.
- **Under it:** "your turn to spin in 2 crews" (or "all caught up") · "tap to open CREW ▸".
- **Tap:** opens CREW, tuned to the first crew that's waiting on you.
- With reduced motion it sits still, and the line under it still says everything.

### 6.4 CREW: the silver rack (Burn Club lives here)
Top to bottom:
1. **Faceplate:** `KYBR` in chrome · `CD CREW SYSTEM · KY·NMT09`.
2. **LCD:** `● ROUND 14` · `CREW 2 · basement · 98.6fm` · a 12-bar spectrum · the round album in big type · "massive attack · Dev's pick" · on the right `ENDS SUN` / `NEXT PICK ▸ SOF`. Tap the album to open it. On a past round: `PAST · ROUND 13`, the spectrum dims, and the right side reads `CREW HEAT / HOT`.
3. **The changer:** `6-DISC CHANGER · BURN CLUB` · `● spun it`. One disc per member in a dark tray. A disc is iridescent and spinning once that person has spun the round, dark otherwise. Under each disc: the name and their stars, or "—". **Your disc**, if you haven't spun it, pulses and says `SPIN`; tapping it opens the take sheet. Tapping a lit disc shows that person's take on an LCD strip below the tray. Below that: `✎ SPIN IT`, or `✓ YOU SPUN IT ★★★★ · OPEN THE ALBUM ↗`.
4. **Transport and jog dial:** ⏮ older round · ▶ open the round album · ⏭ newer round · the jog dial (`TUNE`) cycles crews. Printed hint: `⏮ ⏭ ROUNDS · ▶ ALBUM · DIAL CREWS`.
5. **Disc presets:** one per crew, numbered, with the frequency; the active one is lit.
6. **In the crew** (member chips, `＋ INVITE`, or `FULL` at 8) and **VU · CREW HEAT** (14 segments lit in proportion to the round's crew heat, with the heat word under it).
7. **Burned to [crew]:** the song burn list (number, song, "artist · who", time). Tap to open it in your music service.
8. **This week** bar and the red `410W T·BASS` badge (decoration).

### 6.5 LABEL: your public page
1. **Masthead:** a disc logo, "A LABEL BY [NAME]", the label name, your handle, **n listeners**, your tagline, and **known for** tags. On your own label: a `⚙ SETTINGS` key. On someone else's: `SUBSCRIBE` / `✓ SUBSCRIBED` and `◂ YOUR LABEL` to get back.
2. **✎ WRITE A BOOKLET** (your own label).
3. **Booklets:** newest first, as chrome booklet cards.
4. **Takes:** a row of chrome take cards with ♥ and comments.
5. **On repeat:** the chrome radio with your profile song (your own label).
6. **Top 8** (on others' labels, "On the shelf": albums they've reviewed).
7. **Your spins:** spines grouped by month, newest on top (your own label).
8. **Still wrapped:** albums you want to hear (your own label).

**Known for:** up to three tags for an artist, genre or decade, earned from likes on your takes and booklets in that corner of music. Hidden until you've earned one.

Anyone can see a label. Nothing from the private side (crews, burns, KEPT) appears on it. You reach someone's label by tapping their name on a take, booklet or comment, or through DIG → WRITERS. The listener count is public; who subscribes is private.

### 6.6 KEPT: your binder (private)
A `KEPT` chrome title, "burns you kept · only you see this", a `DISC nn / 48` pill, then sleeves in a black binder, two per page, split by a row of chrome rings. Each sleeve: a large iridescent CD, the song, the artist, "burned by [name] · kept [day]", and `▸ OPEN IN [SERVICE]`. ▲ / `flip the rings` / ▼ turn the page. Mixes show as a CD-R with a Sharpie tracklist.

### 6.7 Album page (the jewel case)
Opens from DIG, booklets, takes, the CREW rack, Top 8, your spins and burns.
1. `◂ BACK` · on the right, `♡ WANT IT` / `♥ WANTED`, or `spun [when]` once you've spun it.
2. **The case:** the cover (Cover Art Archive) inside a jewel case frame. If you've spun it, your **hype sticker** sits on the corner. If it's wrapped, shrink-wrap covers it with `STILL WRAPPED`.
3. Title in chrome · `artist · year · n tracks`.
4. Keys: `✎ SPIN IT` / `✎ UNWRAP & SPIN IT` / `✎ REWRITE YOUR TAKE` (blue chrome) · `BURN IT ▸` · `✎ WRITE A BOOKLET`.
5. **Crew heat** row (when someone in your crews has a take).
6. Sort toggle: `MOST LIKED` (default) / `NEWEST`, for both booklets and takes.
7. **Booklets:** chrome booklet cards.
8. **Takes:** a row of chrome take cards. Yours first. Your crews' takes show the crew name. Each card shows `♡ n` and `▤ n` (comments); tap ▤ to open the take with its comments.
9. **Tracklist:** the tray card, two columns. Tap a song to open it in your service. Under it, an "open in" row: Apple Music · Spotify · YouTube Music · Tidal.

### 6.8 Take sheet (spinning an album)
Rises from the bottom over a blurred scrim.
- Title `SPIN IT` · album · artist · ✕.
- A card: heat cells plus the word ("tap a star · twice for ½" until set), "your take", a ruled textarea (280 characters, "what stuck with you?"), a counter.
- `sticker line · optional` (40 characters).
- `spun`: `TODAY` / `THIS WEEK`, and `↻ RELISTEN` (adds a new entry to your spins instead of replacing the last one).
- "public · shows on your label and on this album." If the album is an open Burn Club round in one of your crews: "counts for Burn Club round 14."
- Keys `CANCEL` / `★ POST YOUR TAKE` (disabled until there's heat).

**Result:** the sticker appears on the cover, the album goes to the top of your spins, the wrap comes off, and if it's a round, your disc lights up and the ticker updates. Toasts: "✓ posted · on your label", "✓ spun · your disc is lit in basement", or "✓ round 14 complete · Sof picks next".

### 6.9 Burner (sending music)
A brushed-silver chassis: `KYBR` · `CD-RW BURNER · KY·BRN01` · a status light (`READY`, `BUSY`, `DONE`), and step lights `WHAT · CREW · NOTE · BURN`.
1. **What:** a song (one song for your crew) · a mix CD-R (up to 80:00, like a real blank) · an album (send it to them, or make it a Burn Club round).
2. **Pick it:**
   - *Song:* paste a link, or `OR GRAB ONE YOU PLAYED` (recent songs). The link is matched to every music service through Odesli.
   - *Mix:* add songs one by one. A capacity bar fills green → yellow → red, with `mm:ss / 80:00` and "mm:ss of blank left". Over 80:00, NEXT is disabled: "over the limit. take one off."
   - *Album:* search, or pick from your spins.
3. **Crew:** `WHO'S THIS FOR?`, one row per crew. For albums, also `HOW?`: *burn it for them* (it shows up wrapped in their burned for you) or *make it a Burn Club round* (it plays when it's your pick). "private · stays in the crew, never public."
4. **Note:** a CD-R preview with the label in Sharpie, plus an optional note (60 characters).
5. **Burning → done:** the disc spins fast with `BURNING… nn%`, then `✓ BURNED & SENT` · "delivered to [crew]. still warm." Keys `⏏ EJECT` / `SEE IT IN CREW`.

### 6.10 Burned-for-you sheet
Opens from a CD-R on HOME. A large CD-R with the Sharpie label, the title, the artist, the sender's note in handwriting, and when it arrived. Keys: `▶ PREVIEW · 0:30` (§6.15) · `▸ OPEN IN [SERVICE]` · `OPEN THE ALBUM ↗` (when the album is known) · `★ KEEP IT` (moves it to KEPT: "✓ kept · it's in your binder"). Below: the song replies (§6.14).

### 6.11 Settings
Opens from `⚙ SETTINGS` on your label, styled as an enhanced-CD **autorun menu** (the window that pops up when you put a disc in a PC): a blue title bar `KYBR.EXE · autorun`, a spinning disc, and glossy pill buttons for **Skin**, **Music service** (Apple Music · Spotify · YouTube Music · Tidal), **Your crews**, **Notifications** and **Sign out**.

### 6.12 First run
Not designed yet (§8 Open 1). The direction: a sealed jewel case you unwrap to begin. Then: sign in with a magic link → pick a handle and name your label → **start a crew**, **enter an invite code**, or **just spin** (no crew needed).

### 6.13 Booklets (long reviews)
- **Writing:** `✎ WRITE A BOOKLET` from the album page or your label. Album, stars (required), title, and the body (no length limit; blank lines start new paragraphs), plus up to three favorite tracks. Saves drafts. Publishing a booklet also sets your stars for that album.
- **Reading:** the chrome reader (§4.3): album art, the label badge (tap to open the label), title, stars and album link, the body, favorite tracks, then `♡ n` and `SUBSCRIBE TO [LABEL]`.
- **Likes:** `♡` with a count, on booklets, takes and comments.
- **Comments:** anyone signed in can comment (1,000 characters). Comments can be liked. The author can pin one and delete any on their own booklet. Sort `TOP` / `NEW`. One level of replies.
- **Where booklets show:** on the album page, on the author's label, and on subscribers' HOME.

### 6.14 Song replies (crew only)
When someone burns a song, anyone in the crew can reply with up to **250 characters**, stars optional. Replies stack under the burn, oldest first. No likes and no counts; replies stay in the crew.


### 6.15 Song previews
A 30-second clip of a song, so you can hear a burn before opening your music app. Songs only: albums open in your music service.
- **Where:** `▶ PREVIEW · 0:30` on the burned-for-you sheet, KEPT sleeves, rows in the crew track list, the song step of the burner, and the on repeat radio on a label.
- **How it looks:** while it plays, the CD-R or disc spins and a thin blue ring around it fills over 30 seconds; the key reads `❚❚ 0:12`. One preview plays at a time; starting another stops the first.
- **Credit:** a small line under the key: "preview from Apple Music" (or "from Deezer"), next to `▸ OPEN IN [SERVICE]` for the full song.
- Plays only when tapped. If no preview exists, the key doesn't show.

---

## 7. Copy rules
- Lowercase for human lines ("still warm", "what stuck with you?", "burned by Mara · kept sun").
- UPPERCASE with wide tracking for hardware labels and keys (`SPIN IT`, `DISC PRESETS`). `flip the rings` is the one lowercase key label.
- Time over counts in the crew: "spun nov 3", "kept tue", "ends sun".
- Attribution is always a person: "Dev's pick", "burned by Mara", "Sof picks next".
- Never: "Trending", "Popular", "Recommended for you", "Top reviewers", "X plays", "Discover".
- Every word passes the word test (§3.1).

---

## 8. Decisions

### Settled
1. **Reviews are the main event;** sharing is a close second; Burn Club connects them.
2. **Every screen is part of a CD's life** (§2).
3. **The CREW rack** is the crew screen, and Burn Club lives inside it (the changer).
4. **Words and tabs** follow §3: HOME · DIG · CREW · LABEL · KEPT.
5. **Burn Club shows on HOME as the ticker,** and in full in CREW.
6. **Burn Club rounds run Sunday to Sunday.** Every round closes Sunday at midnight in the crew's time zone and the next one opens. A crew's first round runs to the next Sunday. Unlit discs stay dark; there's no penalty.
7. **DIG searches any album and any writer,** with no ranking or feed.
8. **Mixes are capped at 80:00,** the length of a real CD-R.
9. **Crews are capped at 8 people.** The wordmark is **KYBR**.
10. **One heat scale** for takes, booklets, burns and song replies.
11. **Public and private:** takes, booklets, comments and labels are public; crews, burns, notes, song replies and KEPT are private. There's no profile search; you reach a label through a take, booklet, comment, or DIG → WRITERS.
12. **Solo users are welcome.** You can sign up just to spin and write; a crew is something you add.
13. **Likes, comments and listeners:** takes, booklets and comments show like and comment counts; labels show listener counts. No leaderboards, trending pages or app-wide best-of; good reviews rise on each album's page.
14. **Subscribing:** subscribe from someone's label; their booklets and takes show on your HOME.
15. **Booklets** are the long review (§6.13).
16. **Song replies:** 250 characters, stars optional, crew only (§6.14).
17. **The look is cobalt and chrome** (§4.1).

### Open
1. **First run:** design the unwrap-the-case opening (§6.12).
2. **Burn Club:** whether a picker can pass their turn.
3. **Crew heat:** confirm it reads as a vibe, not a score.
4. **In-app playback:** if music plays inside KYBR (Build Plan Phase 5), the player needs a CD-world device, probably a Discman.

---

## 9. Build notes
- **Screen size:** design at 392×812 inside the phone shell; the shell fills the screen on phones.
- **Hit targets:** anything tappable is at least 44px, using padding or an invisible overlay rather than bigger art. Decorative hardware (LEDs, model numbers, VU segments, rings) stays display-scale.
- **Contrast:** body text is full opacity on chrome, paper and cobalt. The lighter tier is for small labels only.
- **Code names vs screen words:** some code and database names differ from what the screen says. Map: `Wire` → HOME, `Chnl` → CREW, `Deck` → LABEL, `Case` → KEPT, `Ctrl` → Settings, `reviews` → takes, `etches` → song replies, `dubs` → invites. The Build Plan says which to rename.

---

## 10. Files
| File | What it is |
|---|---|
| `reference/KYBR Records Mockup.html` | **The clickable reference.** All five tabs, the album page, booklet reader, take sheet, burner, burned-for-you sheet and settings, with placeholder data. Open it in a browser. |
| `KYBR Build Plan.md` | How to build it: tools, music services, data, privacy, and the order of work. |
