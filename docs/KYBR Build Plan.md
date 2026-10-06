# KYBR — Build Plan
_Hand this to whoever builds the real app (a developer or Claude Code). It covers stack, accounts, data, music playback, and the order to build in. Pair it with `KYBR Handoff Spec.md` (the design) and `KYBR Prototype.dc.html` (the clickable reference)._

Written October 2026. Music-service rules change often, so re-check every rule in §4 against the linked source before building that part.

---

## 0. The one idea that shapes everything

**KYBR never hosts or streams audio.** It stores *which song* someone burned and tells each listener's own music service to play it. Audio files, licensing and royalties stay with Apple Music, YouTube, Spotify and the others. KYBR only moves song IDs, notes, ratings and timestamps.

Because of that, every song in the database is a **service-neutral track**: one row that knows its Apple Music ID, YouTube ID, Spotify ID, ISRC and album, plus a link for every service. Each listener plays it on whichever service they have.

---

## 1. Scope

**Audience for v1:** the author's real friends, in a few crews of at most 8 people. Design for that room (spec §1). Don't build for scale yet.

| Phase | What ships | Playback |
|---|---|---|
| **1. Crew loop** | Sign-in, crews + invites (DUB), BURN, WIRE, CHNL track list, PLYR, ETCH, CASE, CTRL skins | **Open in your own app** (link-out) |
| **2. Albums + reviews** | Album catalog, TAPE + J-card, public reviews, DECK | Link-out |
| **3. In-app playback** | Play inside KYBR for Apple Music users; YouTube fallback for everyone else | Apple MusicKit JS + YouTube player |
| **4. Live rooms** | CHNL "on air": the crew hears the same song at the same moment | Synced per-person playback, **blocked on Apple's answer (§4.4)** |

Phases 1–2 can go to friends with no approval from any music service.

---

## 2. Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| App | **Web app / PWA**: React + TypeScript + Vite, installable to the home screen | The prototype is already React and inline-styled HTML; MusicKit JS and the YouTube player are web SDKs; one codebase covers iPhone and Android friends. Revisit native (Expo) only if PWA audio limits bite. |
| Backend | **Supabase**: Postgres, Auth, Row Level Security, Realtime, Edge Functions | Private crews map cleanly to RLS; Realtime covers the live rooms in Phase 4; Edge Functions hold the secret keys. |
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

### 4.2 Albums (TAPE / J-card)
- **Source of truth for albums: MusicBrainz**, which is open and community-run (the same role TMDb plays for Letterboxd). Look up the recording by ISRC (`/ws/2/isrc/{isrc}?inc=releases+release-groups`), take its **release group** as the album, then fetch the tracklist from a representative release.
- **Cover art:** Cover Art Archive, `https://coverartarchive.org/release-group/{mbid}/front`.
- **MusicBrainz rules:** about **1 request per second per IP**, and every request must send a User-Agent like `KYBR/0.1 ( contact@yourdomain )`. Run all lookups server-side through a queue and cache results in `albums` / `album_tracks`. ([rate limiting doc](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting))
- If MusicBrainz has no match, build the album from the Apple Music album data and flag it `source='apple'`.
- **Replace the prototype's hand-typed tracklists** with this data. They were typed from memory and aren't authoritative.

### 4.3 Apple Music: in-app playback (Phase 3)
- **Who it works for:** listeners with an Apple Music subscription. Everyone else gets YouTube or link-out.
- **Developer token:** a JWT signed **ES256** with the MusicKit private key (`iss` = Team ID, `kid` = Key ID), valid for at most 6 months. Mint it in an Edge Function (`apple-dev-token`) and cache it. Never ship the .p8 key to the client.
- **Web player:** MusicKit JS v3 (`https://js-cdn.music.apple.com/musickit/v3/musickit.js`; confirm the current URL in Apple's docs). Flow: `MusicKit.configure({ developerToken, app:{ name:'KYBR', build } })` → `music.authorize()` the first time the user plays → `music.setQueue({ song: appleSongId })` → `music.play()`.
- **License rules to respect** (Apple Developer Program License Agreement §3.3.6; read the current text):
  - Playback must be started by the user (a tap). No autoplay on page load.
  - Don't charge for, or put ads around, the music itself.
  - Show Apple Music attribution where Apple's guidelines require it.
  - MusicKit content can't be "synchronized with any other content". See §4.4 for why this matters.

### 4.4 Live rooms (CHNL "on air", Phase 4) — blocked pending Apple's answer
Plan: each person plays the song on **their own** account, and Supabase Realtime broadcasts `{ trackId, positionMs, startedAt, playing }` from whoever is "driving". Each client seeks to `positionMs + (now − startedAt)`. No audio passes through KYBR.

**Blocker:** it's unclear whether Apple's "can't be synchronized with any other content" clause forbids this. A developer asked Apple exactly this question in public ([forum thread](https://developer.apple.com/forums/thread/838157)) and there's no public answer yet. **Before writing Phase 4, email Apple's MusicKit team and get the answer in writing.** If the answer is no, live rooms run on YouTube only, or rooms become "listen at the same time" without auto-seek, where each person presses play themselves.

### 4.5 Spotify: link-out only
For a new app, Spotify's developer program is effectively closed to in-app playback:
- Apps in development mode work for **only 5 users**, and the app owner must pay for Premium ([quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)).
- Getting past 5 users requires a **registered business, a launched service and at least 250,000 monthly active users** ([extended access criteria](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access), in effect since May 15, 2025).

So Spotify users get **"open in Spotify"** links (from Odesli). Follow Spotify's branding guidelines wherever its name or logo appears. Revisit only if KYBR somehow reaches that size.

### 4.6 YouTube: fallback in-app playback (Phase 3)
- Find the video with Odesli's YouTube link first; if there isn't one, use a YouTube Data API search (`<artist> <title>`), prefer official "Topic" / Art Track uploads, and cache the match.
- Play it with the **YouTube IFrame Player API**. Rules that affect the KYBR design ([required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)):
  - The player viewport must be **at least 200 × 200 px** and stay visible. **It can't be hidden for audio-only playback.**
  - No overlays on top of any part of the player, including the chrome frames KYBR loves. Put the hardware *around* it, never *over* it.
  - No autoplay until more than half the player is on screen, and never two auto-playing players at once.
- **Design consequence:** when PLYR is on the YouTube provider, the iPod screen shows the actual video player (≥ 200 px tall) in place of the spinning disc. Spec this as a PLYR variant.

### 4.7 Link-out (always available)
Every track has a "open in…" row built from Odesli links. Each user's preferred service is set in CTRL → Profile & Account. PLYR's center behavior per provider: Apple → play in app; YouTube → play in app; anything else → open the link in that app.

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

PLYR, CHNL transport, the CASE play hubs and the TAPE keys all call this. The TAPE's play key plays the album's tracks in order through the same provider.

---

## 6. Data model (Postgres)

```sql
profiles      (id uuid pk = auth.users.id, handle text unique, display_name, tagline,
               liner_notes, profile_track_id → tracks, created_at)          -- public (DECK)
settings      (user_id pk → profiles, skin text default 'uv',
               preferred_service text check in ('apple','youtube','spotify','link'))  -- owner only

crews         (id, name, freq text, created_by → profiles, created_at)
crew_members  (crew_id → crews, user_id → profiles, joined_at, pk(crew_id,user_id))
              -- trigger: reject insert when the crew already has 8 members
dubs          (code text pk, crew_id, created_by, expires_at, used_by null, used_at null)   -- invites

tracks        (id, isrc text unique null, title, artist, duration_ms, album_id → albums null,
               apple_id, spotify_id, youtube_id, links jsonb, resolved_at)
albums        (id, mbid uuid unique null, apple_album_id, title, artist, year, cover_url,
               tint text, source text)
album_tracks  (album_id, position int, side text check in ('A','B'), title, track_id null)

burns         (id, crew_id → crews, track_id → tracks, from_user → profiles,
               note text check (length ≤ 80), heat numeric(2,1) null, created_at)
etches        (burn_id → burns, user_id, heat numeric(2,1) not null, note ≤ 80, created_at,
               pk(burn_id,user_id))
kept          (user_id, burn_id, kept_at, pk(user_id,burn_id))          -- CASE

reviews       (id, album_id → albums, user_id, heat numeric(2,1) not null, body text ≤ 280,
               created_at, updated_at, unique(album_id,user_id))        -- public
top8          (user_id, position 1..8, album_id, pk(user_id,position))

room_state    (crew_id pk, track_id, position_ms, started_at, playing bool, driver_id)  -- Phase 4
```

**Heat** is `numeric(2,1)` with a check that it's between 0.5 and 5 in steps of 0.5 (spec §4.5). The UI renders it as stars and words, never as a number.

**This Week** is a view, not a table: a crew's burns from the last 7 days, oldest first.

---

## 7. Privacy rules (Row Level Security)

| Table | Who can read | Who can write |
|---|---|---|
| crews, crew_members, burns, etches, room_state | Members of that crew only | Members; burns only as yourself |
| kept, settings (preferred service, skin) | Owner | Owner |
| reviews | **Everyone** (public) | Owner |
| profiles (handle, name, tagline, liner notes, profile song), top8 | **Everyone** (DECKs are public, spec §8 Settled 10). Never expose crews, burns, etches or CASE through them | Owner |
| tracks, albums, album_tracks | Everyone | Server functions only |

**Anti-clout is enforced in the API, not just the UI:** don't create any endpoint, view or column that returns counts of plays, likes, followers or reviews. The one aggregate allowed is **crew heat** (the average of your crews' reviews of an album, rounded to the half), computed only over crews the viewer belongs to, and only if spec §8 Open 4 keeps it.

---

## 8. Build order and "done" checks

**Phase 1 — Crew loop (link-out)**
1. Auth (email magic link) → profile with handle.
2. Create a crew → share a DUB code → a friend joins; 9th join is rejected.
3. BURN: paste link → `resolve-link` → pick crew → optional heat + note → burn row. *Done when:* a Spotify link pasted by one friend shows up for an Apple Music friend with a working "open in Apple Music" link.
4. WIRE (Game Boy, 5-row cursor list of your crews' newest burns), CHNL track list per crew, PLYR as an "open in [service]" remote.
5. ETCH from PLYR's center button; "keep" adds to CASE. *Done when:* the etch shows for the whole crew and CASE says "saved from [name] · saved [day]".
6. CTRL: skin picker (persists to profile), preferred service, sign out.

**Phase 2 — Albums + reviews**
7. Album resolution on every new track (MusicBrainz queue + cover art).
8. TAPE screen from PLYR's `from [album] ↗`, DECK Top 8 and DECK reviews; J-card with real tracklist.
9. Write/rewrite review; public section lists others' reviews by time; no counts anywhere. *Done when:* a review written on TAPE appears on your DECK and on a friend's view of that J-card.

**Phase 3 — In-app playback**
10. Apple developer token function + MusicKit JS provider; authorize on first tap.
11. YouTube provider with the visible ≥ 200 px player variant of PLYR.
12. Provider fallback order from §5. *Done when:* the same burn plays in-app for an Apple Music friend, plays as a YouTube video for a friend without Apple Music, and opens Spotify for a Spotify friend.

**Phase 4 — Live rooms (only after Apple answers, §4.4)**
13. `room_state` + Realtime broadcast + presence ("in the room" chips); drift correction every few seconds.

---

## 9. Things to decide before or during the build
1. Apple's written answer on synchronized playback (§4.4). It gates Phase 4.
2. ~~Who can see a DECK~~ Settled: DECKs are public (spec §8 Settled 10). `profiles` and `top8` are readable by everyone.
3. How someone finds an album that nobody burned to them, without building a discovery feed (spec §8 Open 3). A plain search box that only returns exact matches is probably the safe minimum.
4. Whether crew heat stays (spec §8 Open 4).
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
