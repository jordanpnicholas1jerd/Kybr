# KYBR — Build Plan
_Hand this to whoever builds the real app (a developer or Claude Code). It covers stack, accounts, data, music playback, and the order to build in. Pair it with `KYBR Handoff Spec.md` (the design, v2) and `reference/KYBR Records Mockup.html` (the clickable reference)._

Written October 2026. **Revised November 2026** for v2: album reviews became the main event, sharing a close second, and the UI moved to the CD world with new words (spec §3). Phase 1 is built; the phases after it are reordered (§1, §8). Music-service rules change often, so re-check every rule in §4 against the linked source before building that part.

---

## 0. The one idea that shapes everything

**KYBR never hosts or streams audio.** It stores *which song* someone burned and tells each listener's own music service to play it. Audio files, licensing and royalties stay with Apple Music, YouTube, Spotify and the others. KYBR only moves song IDs, notes, ratings and timestamps.

Because of that, every song in the database is a **service-neutral track**: one row that knows its Apple Music ID, YouTube ID, Spotify ID, ISRC and album, plus a link for every service. Each listener plays it on whichever service they have.

---

## 1. Scope

**Audience for v1:** the author's real friends, in a few crews of at most 8 people. Design for that room (spec §1). Don't build for scale yet.

| Phase | What ships | Playback |
|---|---|---|
| **1. Crew loop** (built, v1 look) | Sign-in, crews + invites, song burns, the rack's track list, song takes (ETCH), the binder, skins | **Open in your own app** (link-out) |
| **2. New shape + albums** | v2 nav and words; DIG; album page; take sheet; SHELF; HOME as the shop front; KEPT; settings as the autorun menu. Retire the Game Boy, iPod, Win98 and answering machine | Link-out |
| **3. Burn Club** | Rounds, pick order, the changer in the CREW rack, the ticker on HOME | Link-out |
| **4. Burner upgrades** | Mixes (80:00 cap), album burns (burn it for them / make it a round), first run (unwrap the case) | Link-out |
| **5. In-app playback** | Play inside KYBR for Apple Music users; YouTube fallback for everyone else. Needs a CD-world player (spec Open 7) | Apple MusicKit JS + YouTube player |
| **6. Live rooms** (maybe) | The crew hears the same song at the same moment | Synced per-person playback, **blocked on Apple's answer (§4.4)** |

Phases 1–4 can go to friends with no approval from any music service.

---

## 2. Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| App | **Web app / PWA**: React + TypeScript + Vite, installable to the home screen | The prototype is already React and inline-styled HTML; MusicKit JS and the YouTube player are web SDKs; one codebase covers iPhone and Android friends. Revisit native (Expo) only if PWA audio limits bite. |
| Backend | **Supabase**: Postgres, Auth, Row Level Security, Realtime, Edge Functions | Private crews map cleanly to RLS; Realtime covers the live rooms in Phase 6; Edge Functions hold the secret keys. |
| Hosting | Vercel or Netlify for the web app; Supabase for everything else | |
| Server jobs | Supabase Edge Functions (Deno) | Link resolving, catalog lookups, minting the Apple developer token. |

Port the visual system from the prototype as-is: palette, type, material recipes and the locked nav tray (spec §4–5). Turn the inline styles into shared tokens and components (`<Disc>`, `<ChromeKey>`, `<SunkenLCD>`, `<HeatStars>`, `<NavTray>`). **One device per screen** stays: each screen keeps its own chassis component. Don't unify them.

---

## 3. Accounts and keys to set up first

| Account | Needed for | Cost | Secret goes in |
|---|---|---|---|
| Supabase project | Database, auth, realtime | Free tier is fine for v1 | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client); service key server-only |
| **Apple Developer Program** | MusicKit (Apple Music API catalog lookups + in-app playback) | $99/year | `APPLE_TEAM_ID`, `APPLE_MUSICKIT_KEY_ID`, `APPLE_MUSICKIT_PRIVATE_KEY` (.p8), server-only |
| Google Cloud project with YouTube Data API v3 | Finding a YouTube video for a song (fallback playback) | Free quota | `YOUTUBE_API_KEY`, server-only |
| Odesli (song.link) API | Turning one pasted link into links for every service | Free without a key at a low rate limit; request a key before real use | `ODESLI_API_KEY`, server-only |
| MusicBrainz | Album data, tracklists | Free; no key, but a contact User-Agent is required (§4.2) | none |
| Spotify | **Not needed.** Spotify songs are link-out only (§4.5) | — | — |

---

## 4. Music services: what each one does, and its rules

### 4.1 Resolving a pasted link (BURN → "paste a song link")
1. Client sends the pasted URL to the Edge Function `resolve-link`.
2. The function calls Odesli: `GET https://api.song.link/v1-alpha.1/links?url=<encoded url>`. The response gives a link per platform (`linksByPlatform`) and an ID per platform (`entitiesByUniqueId`): Apple Music, Spotify, YouTube, YouTube Music, Tidal, Deezer and others.
3. Using the Apple Music song ID, call the Apple Music API catalog (`GET https://api.music.apple.com/v1/catalog/{storefront}/songs/{id}?include=albums`, with the developer token) to get the **ISRC**, duration, title, artist and album.
4. Upsert a `tracks` row keyed by ISRC (fall back to the Odesli entity ID when there is no ISRC). Return it to the client for the BURN "resolved" state.
5. **Cache everything.** Never resolve the same URL twice. Odesli and MusicBrainz have tight rate limits.

If Odesli is down or rate-limited, still accept the burn and store the raw link. Playback falls back to opening that link.

### 4.2 Albums (the album page, DIG)
- **DIG searches the whole catalog.** The Edge Function `search-albums` queries MusicBrainz release groups (`/ws/2/release-group?query=<text>&type=album`), caches the results, and returns them in the order MusicBrainz gives, then grouped A–Z by artist in the UI. Never rank by anything KYBR counts (spins, takes). Only search once the person has typed at least 2 characters, and debounce input so typing doesn't break the 1 request per second rule. Keep each person's recent searches on their device only.
- Picking a result upserts the `albums` row (and its `album_tracks`) on first open.
- **Source of truth for albums: MusicBrainz**, which is open and community-run (the same role TMDb plays for Letterboxd). Look up the recording by ISRC (`/ws/2/isrc/{isrc}?inc=releases+release-groups`), take its **release group** as the album, then fetch the tracklist from a representative release.
- **Cover art:** Cover Art Archive, `https://coverartarchive.org/release-group/{mbid}/front`.
- **MusicBrainz rules:** about **1 request per second per IP**, and every request must send a User-Agent like `KYBR/0.1 ( contact@yourdomain )`. Run all lookups server-side through a queue and cache results in `albums` / `album_tracks`. ([rate limiting doc](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting))
- If MusicBrainz has no match, build the album from the Apple Music album data and flag it `source='apple'`.
- **Replace the prototype's hand-typed tracklists** with this data. They were typed from memory and aren't authoritative.

### 4.3 Apple Music: in-app playback (Phase 5)
- **Who it works for:** listeners with an Apple Music subscription. Everyone else gets YouTube or link-out.
- **Developer token:** a JWT signed **ES256** with the MusicKit private key (`iss` = Team ID, `kid` = Key ID), valid for at most 6 months. Mint it in an Edge Function (`apple-dev-token`) and cache it. Never ship the .p8 key to the client.
- **Web player:** MusicKit JS v3 (`https://js-cdn.music.apple.com/musickit/v3/musickit.js`; confirm the current URL in Apple's docs). Flow: `MusicKit.configure({ developerToken, app:{ name:'KYBR', build } })` → `music.authorize()` the first time the user plays → `music.setQueue({ song: appleSongId })` → `music.play()`.
- **License rules to respect** (Apple Developer Program License Agreement §3.3.6; read the current text):
  - Playback must be started by the user (a tap). No autoplay on page load.
  - Don't charge for, or put ads around, the music itself.
  - Show Apple Music attribution where Apple's guidelines require it.
  - MusicKit content can't be "synchronized with any other content". See §4.4 for why this matters.

### 4.4 Live rooms (Phase 6, maybe) — blocked pending Apple's answer
Plan: each person plays the song on **their own** account, and Supabase Realtime broadcasts `{ trackId, positionMs, startedAt, playing }` from whoever is "driving". Each client seeks to `positionMs + (now − startedAt)`. No audio passes through KYBR.

**Blocker:** it's unclear whether Apple's "can't be synchronized with any other content" clause forbids this. A developer asked Apple exactly this question in public ([forum thread](https://developer.apple.com/forums/thread/838157)) and there's no public answer yet. **Before writing Phase 4, email Apple's MusicKit team and get the answer in writing.** If the answer is no, live rooms run on YouTube only, or rooms become "listen at the same time" without auto-seek, where each person presses play themselves.

### 4.5 Spotify: link-out only
For a new app, Spotify's developer program is effectively closed to in-app playback:
- Apps in development mode work for **only 5 users**, and the app owner must pay for Premium ([quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)).
- Getting past 5 users requires a **registered business, a launched service and at least 250,000 monthly active users** ([extended access criteria](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access), in effect since May 15, 2025).

So Spotify users get **"open in Spotify"** links (from Odesli). Follow Spotify's branding guidelines wherever its name or logo appears. Revisit only if KYBR somehow reaches that size.

### 4.6 YouTube: fallback in-app playback (Phase 5)
- Find the video with Odesli's YouTube link first; if there isn't one, use a YouTube Data API search (`<artist> <title>`), prefer official "Topic" / Art Track uploads, and cache the match.
- Play it with the **YouTube IFrame Player API**. Rules that affect the KYBR design ([required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)):
  - The player viewport must be **at least 200 × 200 px** and stay visible. **It can't be hidden for audio-only playback.**
  - No overlays on top of any part of the player, including the chrome frames KYBR loves. Put the hardware *around* it, never *over* it.
  - No autoplay until more than half the player is on screen, and never two auto-playing players at once.
- **Design consequence:** when the Phase 5 player is on the YouTube provider, its screen shows the actual video player (≥ 200 px tall) in place of the spinning disc. Spec this as a variant of that player.

### 4.7 Link-out (always available)
Every track has a "open in…" row built from Odesli links. Each user's preferred service is set in Settings → Music service. Play behavior per provider: Apple → play in app; YouTube → play in app; anything else → open the link in that app.

---

## 5. Player abstraction

Build one interface and keep the UI from knowing which service is playing:

```ts
interface PlayerProvider {
  id: 'apple' | 'youtube' | 'link';
  canPlay(track: Track, user: Me): boolean;   // has the ID + user is authorized
  load(track: Track): Promise<void>;
  play(): Promise<void>;                      // must be called from a user tap
  pause(): void;
  seek(ms: number): void;
  position(): number;                         // ms
  onEnded(cb: () => void): void;
}
// choose: user's preferred service → apple → youtube → link
```

Until Phase 5 the only provider is `link`: every "open in [service]" button (burned-for-you sheet, KEPT sleeves, the rack's track list, the album tracklist) opens the track's link for your preferred service. In Phase 5 the same buttons call this interface instead, and the album page's tracklist can play in order. v1's PLYR (iPod) is retired; the Phase 5 player needs its own CD-world device.

---

## 6. Data model (Postgres)

Tables marked **(v1)** already exist in `supabase/migrations`. Tables and columns marked **new** come with the phase shown. The database keeps v1 names where a table already exists (spec §9 has the map to UI words).

```sql
-- people
profiles      (v1) (id uuid pk = auth.users.id, handle text unique, display_name, tagline,
               liner_notes, profile_track_id → tracks, created_at)       -- public: the SHELF
settings      (v1) (user_id pk → profiles, skin text default 'uv',
               preferred_service text check in ('apple','youtube','spotify','link'))  -- owner only

-- crews
crews         (v1) (id, name, freq text, created_by → profiles, created_at)
              -- new (P3): timezone text not null — IANA name, set from the creator's device
crew_members  (v1) (crew_id → crews, user_id → profiles, joined_at, pk(crew_id,user_id))
              -- trigger: reject insert when the crew already has 8 members
              -- new (P3): pick_order int — Burn Club rotation, set on join
dubs          (v1) (code text pk, crew_id, created_by, expires_at, used_by null, used_at null)  -- invites

-- catalog
tracks        (v1) (id, isrc text unique null, title, artist, duration_ms, album_id → albums null,
               apple_id, spotify_id, youtube_id, links jsonb, resolved_at)
albums        (v1) (id, mbid uuid unique null, apple_album_id, title, artist, year, cover_url,
               tint text, source text)
album_tracks  (v1) (album_id, position int, side text, title, track_id null)

-- reviews (public)
reviews       (v1, = takes) (id, album_id, user_id, heat not null, body text ≤ 280,
               created_at, updated_at, unique(album_id,user_id))
              -- new (P2): sticker text check (length ≤ 40) null
spins         new (P2) (id, user_id, album_id, spun_on date, relisten bool default false,
               created_at)                                    -- your spins (the diary)
wants         new (P2) (user_id, album_id, added_at, pk(user_id,album_id))  -- still wrapped;
              -- deleted when you spin the album
top8          (v1) (user_id, position 1..8, album_id, pk(user_id,position))

-- sharing (private to the crew)
burns         (v1) (id, crew_id, track_id, from_user, note ≤ 80, heat null, created_at)
              -- new (P4): kind text check in ('song','mix','album') default 'song',
              --           album_id → albums null, title text null (a mix's name);
              --           track_id becomes nullable (a mix or album burn has none)
burn_tracks   new (P4) (burn_id, position int, track_id, pk(burn_id,position))  -- a mix's songs
              -- check in a function: total duration ≤ 80:00
etches        (v1, = song takes) (burn_id, user_id, heat not null, note ≤ 80, created_at)
kept          (v1) (user_id, burn_id, kept_at, pk(user_id,burn_id))          -- KEPT

-- Burn Club (private to the crew)
rounds        new (P3) (id, crew_id, number int, album_id, picked_by → profiles,
               starts_at, ends_at, unique(crew_id,number))
round_queue   new (P4) (crew_id, user_id, album_id, queued_at, pk(crew_id,user_id))
              -- "make it a Burn Club round": one queued pick per person per crew

-- following (private lists)
follows       new (P4) (follower_id → profiles, followee_id → profiles, created_at,
               pk(follower_id,followee_id), check follower_id <> followee_id)

room_state    (v1, Phase 6) (crew_id pk, track_id, position_ms, started_at, playing bool, driver_id)
```

**Heat** is `numeric(2,1)` with a check that it's between 0.5 and 5 in steps of 0.5 (spec §4.5). The UI renders it as stars and words, never as a number.

**This week** is a view, not a table: a crew's burns from the last 7 days, oldest first.

**Spinning an album** writes in one transaction: upsert the `reviews` row (the take, with heat, body and sticker), insert a `spins` row (a new row for a relisten, otherwise update today's), and delete the `wants` row. A take without heat can't be saved.

**Burn Club:**
- A member has *spun* the current round when they have a `spins` row for the round's album dated on or after `starts_at`. The changer and the ticker read that, plus their take for the stars.
- **Rounds run Sunday to Sunday** (spec §8 Settled 12). `ends_at` is always the next Sunday at 24:00 in `crews.timezone`; a crew's first round, started midweek, runs to the coming Sunday. A scheduled function (Supabase cron, hourly) closes every round whose `ends_at` has passed and opens the next one for the member next in `pick_order`: their `round_queue` album if they queued one, otherwise the rack shows "waiting on [name]'s pick" until they choose, and that round still ends on the next Sunday. Unlit discs stay dark; there's no penalty.
- Rounds belong to the crew. The takes written for them are ordinary public takes.

---

## 7. Privacy rules (Row Level Security)

| Table | Who can read | Who can write |
|---|---|---|
| crews, crew_members, burns, burn_tracks, etches, rounds, round_queue, room_state | Members of that crew only | Members; burns and queue entries only as yourself |
| kept, settings (preferred service, skin), follows | Owner (follow lists are never shown to anyone else) | Owner |
| reviews (takes), spins, wants, top8 | **Everyone** (public) | Owner |
| profiles (handle, name, tagline, liner notes, profile song) | **Everyone** (shelves are public, spec §8 Settled 10). Never expose crews, burns, notes, rounds or KEPT through them | Owner |
| tracks, albums, album_tracks | Everyone | Server functions only |

**Anti-clout is enforced in the API, not just the UI:** don't create any endpoint, view or column that returns counts of plays, likes, followers, follows, spins, takes or wants. Two aggregates are allowed, and both only inside crews the viewer belongs to:
- **crew heat** (the average of your crews' takes on an album, rounded to the half), and
- **"n of m spun it"** for an open round in your own crew.

Takes from everyone on an album are listed by time, never sorted or filtered by anything popularity-like.

---

## 8. Build order and "done" checks

**Phase 1 — Crew loop (link-out). Built.**
Sign-in, crews and invites (the 9th join is rejected), song burns through `resolve-link`, the Game Boy feed, the rack's track list, PLYR as an "open in [service]" remote, ETCH, the binder, skins and settings. It shipped with the v1 look and words; Phase 2 changes those.

**Phase 2 — New shape + albums (the main event)**
1. **Words and nav:** tabs become HOME · DIG · CREW · SHELF · KEPT. Sweep every v1 word out of the UI (spec §3.4). *Done when:* a search of the rendered app for WIRE, CHNL, DECK, CASE, CTRL, ETCH, DUB or PLYR finds nothing a person can read.
2. **Retire the v1 devices:** the Game Boy (`Wire.tsx`), iPod (`overlays/Plyr.tsx`), Win98 (`Ctrl.tsx`, `Win98.tsx`) and answering machine. Until Phase 4's first run exists, sign-in and "start a crew / enter an invite code" use a plain interim screen.
3. **Catalog:** `search-albums` (MusicBrainz, cached, debounced) and album resolution for every new track, with cover art.
4. **DIG:** search box, results as spines grouped A–Z, recent digs on the device.
5. **Album page:** jewel case, cover, hype sticker, wrapped state, crew heat, takes (yours, your crews', everyone's, each by time), tracklist with "open in" links.
6. **Take sheet:** heat, take, sticker line, spun today / this week, relisten. Writes `reviews` + `spins`, removes `wants`. *Done when:* a take posted by one friend shows on their shelf and on another friend's view of the album, with no counts anywhere.
7. **SHELF:** name tag, on repeat, liner notes, Top 8 (editable), your spins by month, still wrapped. Others' shelves open from their name on a take.
8. **HOME (shop front, without Burn Club):** burned for you (unkept song burns from your crews), new takes from your crews, the BURN button. With no crew: just new takes (empty until Phase 4 follows) and the start-a-crew line. Sign-up gets a **just spin** option, so solo users never need a crew.
9. **KEPT and Settings:** rename CASE to KEPT ("burned by [name] · kept [day]"); settings as the autorun menu opened from SHELF.
10. **CREW:** the rack keeps its v1 parts with the new labels (`CREW n`, `IN THE CREW`, `＋ INVITE`, `BURNED TO [CREW]`).

**Phase 3 — Burn Club**
11. `rounds`, `pick_order`, `crews.timezone`, and the hourly close/open job (rounds turn over Sunday at midnight). First round: the crew's creator picks.
12. **The changer** in the CREW rack: one disc per member, lit when spun, tap to read a take; your disc opens the take sheet. ⏮ ⏭ step through past rounds; the LCD shows the round and `NEXT PICK ▸ [NAME]`. VU becomes crew heat.
13. **The ticker** on HOME, opening CREW on the first crew that's waiting on you. *Done when:* in a crew of three, two people spin the round and both see the third disc dark; the third spins it, the round shows complete, and the next round opens for the next person in order.

**Phase 4 — Burner upgrades**
14. **Mixes:** `burn_tracks`, the 80:00 capacity bar, a mix shown as one CD-R with a Sharpie tracklist in KEPT.
15. **Album burns:** "burn it for them" lands wrapped in their burned for you; "make it a Burn Club round" writes `round_queue`.
16. **Follows:** `＋ FOLLOW` on someone else's shelf; their takes join new takes on your HOME. No counts, private lists.
17. **First run:** the new opening (spec Open 1), with start a crew / enter an invite code / just spin.

**Phase 5 — In-app playback**
18. Apple developer token function and MusicKit JS provider; authorize on the first tap.
19. YouTube provider with a visible ≥ 200 px player inside the Phase 5 player device.
20. Provider fallback order from §5. *Done when:* the same burn plays in-app for an Apple Music friend, as a YouTube video for a friend without Apple Music, and opens Spotify for a Spotify friend.

**Phase 6 — Live rooms (maybe; only after Apple answers, §4.4)**
21. `room_state`, Realtime broadcast and presence, drift correction every few seconds.

---

## 9. Things to decide before or during the build
Settled in November 2026: solo users are in, rounds run Sunday to Sunday, song takes stay, following comes after Burn Club (spec §8 Settled 11–14). Still open:

1. **First run** (spec Open 1). Needed by Phase 4; Phase 2 uses a plain interim screen.
2. **Whether a picker can pass their turn** in Burn Club. Decide before Phase 3.
3. **The Phase 5 player device** (spec Open 7).
4. Apple's written answer on synchronized playback (§4.4). It gates Phase 6.
5. App name check: confirm "KYBR" is clear to use as a product name before anything goes public.

---

## 10. References
- Apple MusicKit and the Apple Developer Program License Agreement (§3.3.6): developer.apple.com/musickit
- [Apple Developer Forums: MusicKit JS and shared listening (3.3.6(D))](https://developer.apple.com/forums/thread/838157)
- [Spotify Web API: quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Spotify: updating the criteria for Web API extended access](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)
- [YouTube API Services: required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)
- [MusicBrainz API rate limiting](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting)
- Odesli / song.link API: odesli.co (request an API key there)
- [Apple Music JavaScript integration guide (token creation walkthrough)](https://dev.to/areknawo/apple-music-javascript-integration-guide-518b)
