# KYBR — Build Plan
_For whoever builds the app (a developer or Claude Code): tools, accounts, music services, data, privacy, and the order of work. Pair it with `KYBR Handoff Spec.md` (the design) and `reference/KYBR Records Mockup.html` (the clickable reference)._

Music-service rules change often, so re-check every rule in §4 against the linked source before building that part.

---

## 0. The one idea that shapes everything

**KYBR never hosts or streams audio.** It stores *which song or album* someone burned or reviewed and tells each person's own music service to play it. Audio files, licensing and royalties stay with Apple Music, YouTube, Spotify and the others. KYBR only moves song and album IDs, reviews, notes, ratings and timestamps.

Because of that, every song in the database is a **service-neutral track**: one row that knows its Apple Music ID, YouTube ID, Spotify ID, ISRC and album, plus a link for every service. Each person plays it on whichever service they have.

---

## 1. Scope

**Audience:** the author's real friends, plus the people who find their labels. Crews are at most 8 people. Don't build for scale yet.

| Phase | What ships | Playback |
|---|---|---|
| **1. Crew loop** (in the code today) | Sign-in, crews and invites, song burns, the crew track list, song notes, the binder, skins | **Open in your own app** (link-out) |
| **2. The app's shape + albums** | The five tabs and the cobalt-and-chrome look; DIG; album page; takes; booklets with likes and comments; LABEL with subscribing and listener counts; HOME feed; KEPT; settings; song replies | Link-out |
| **3. Burn Club** | Rounds, pick order, the changer in the CREW rack, the ticker on HOME, known-for tags | Link-out |
| **4. Burner extras + first run** | Mixes (80:00 cap), album burns (burn it for them / make it a round), the first-run opening | Link-out |
| **5. In-app playback** | Play inside KYBR for Apple Music users; YouTube for everyone else. Needs a CD-world player (spec §8 Open 4) | Apple MusicKit JS + YouTube player |
| **6. Live rooms** (maybe) | The crew hears the same song at the same moment | Synced per-person playback, **blocked on Apple's answer (§4.4)** |

Phases 1–4 can go to friends with no approval from any music service.

---

## 2. Tools

| Layer | Choice | Why |
|---|---|---|
| App | **Installable web app (PWA)**: React + TypeScript + Vite, added to the phone's home screen | One codebase covers iPhone and Android; MusicKit JS and the YouTube player are web tools. Consider a native app (Expo) only if web audio limits get in the way. |
| Backend | **Supabase**: Postgres, Auth, Row Level Security, Realtime, Edge Functions | Private crews map cleanly to row-level security; Realtime covers live rooms; Edge Functions hold the secret keys. |
| Hosting | Vercel or Netlify for the web app; Supabase for everything else | |
| Server jobs | Supabase Edge Functions (Deno) and Supabase cron | Link resolving, album search, the weekly Burn Club turnover, the Apple developer token. |

Build the look from the mockup as shared tokens and components (`<ChromeKey>`, `<BlueKey>`, `<ChromePlate>`, `<SunkenLCD>`, `<Disc>`, `<CDR>`, `<Spine>`, `<HeatStars>`, `<NavTray>`), following spec §4–5.

---

## 3. Accounts and keys to set up first

| Account | Needed for | Cost | Secret goes in |
|---|---|---|---|
| Supabase project | Database, sign-in, realtime | Free tier is fine to start | `SUPABASE_URL`, `SUPABASE_ANON_KEY` (app); service key server-only |
| Email sender (for example Resend) | Sign-in emails to friends | Free tier | Set in Supabase's SMTP settings (see README) |
| **Apple Developer Program** | MusicKit (Apple Music catalog + in-app playback) | $99/year | `APPLE_TEAM_ID`, `APPLE_MUSICKIT_KEY_ID`, `APPLE_MUSICKIT_PRIVATE_KEY` (.p8), server-only |
| Google Cloud project with YouTube Data API v3 | Finding a YouTube video for a song | Free quota | `YOUTUBE_API_KEY`, server-only |
| Odesli (song.link) API | Turning one pasted link into links for every service | Free without a key at a low rate limit; request a key before real use | `ODESLI_API_KEY`, server-only |
| MusicBrainz | Album search, album data, tracklists | Free; no key, but a contact User-Agent is required (§4.2) | none |
| Spotify | **Not needed.** Spotify is link-out only (§4.5) | — | — |

---

## 4. Music services: what each one does, and its rules

### 4.1 Resolving a pasted link (the burner)
1. The app sends the pasted URL to the Edge Function `resolve-link`.
2. The function calls Odesli: `GET https://api.song.link/v1-alpha.1/links?url=<encoded url>`. The response gives a link per platform (`linksByPlatform`) and an ID per platform (`entitiesByUniqueId`).
3. Using the Apple Music song ID, call the Apple Music catalog (`GET https://api.music.apple.com/v1/catalog/{storefront}/songs/{id}?include=albums`, with the developer token) to get the **ISRC**, duration, title, artist and album.
4. Upsert a `tracks` row keyed by ISRC (fall back to the Odesli entity ID when there is no ISRC) and return it to the app.
5. **Cache everything.** Never resolve the same URL twice; Odesli and MusicBrainz have tight rate limits.

If Odesli is down or rate-limited, still accept the burn and store the raw link. Playback then opens that link.

### 4.2 Albums (DIG and the album page)
- **DIG searches the whole catalog.** The Edge Function `search-albums` queries MusicBrainz release groups (`/ws/2/release-group?query=<text>&type=album`), caches results, and returns them in MusicBrainz's order; the app groups them A–Z by artist. Search only after 2 or more characters, and debounce typing so the 1 request per second rule holds. Keep each person's recent searches on their device.
- **Writer search** (DIG → WRITERS) is a plain database query over label names, handles and known-for tags.
- Opening a result upserts the `albums` row and its `album_tracks`.
- **Source of truth: MusicBrainz**, open and community-run. For a burned track, look up the recording by ISRC (`/ws/2/isrc/{isrc}?inc=releases+release-groups`), take its **release group** as the album, and fetch the tracklist from a representative release.
- **Cover art:** Cover Art Archive, `https://coverartarchive.org/release-group/{mbid}/front`.
- **MusicBrainz rules:** about **1 request per second per IP**, and every request sends a User-Agent like `KYBR/0.1 ( contact@yourdomain )`. Run lookups server-side through a queue and cache in `albums` / `album_tracks`. ([rate limiting doc](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting))
- If MusicBrainz has no match, build the album from Apple Music album data and mark it `source='apple'`.
- The mockup's tracklists are placeholders; real tracklists come from this data.

### 4.3 Apple Music: in-app playback (Phase 5)
- **Who it works for:** people with an Apple Music subscription. Everyone else gets YouTube or link-out.
- **Developer token:** a JWT signed **ES256** with the MusicKit private key (`iss` = Team ID, `kid` = Key ID), valid for at most 6 months. Mint it in an Edge Function (`apple-dev-token`) and cache it. Never ship the .p8 key to the app.
- **Web player:** MusicKit JS v3 (`https://js-cdn.music.apple.com/musickit/v3/musickit.js`; confirm the current URL in Apple's docs). Flow: `MusicKit.configure({ developerToken, app:{ name:'KYBR', build } })` → `music.authorize()` on the first play → `music.setQueue({ song: appleSongId })` → `music.play()`.
- **License rules** (Apple Developer Program License Agreement §3.3.6; read the current text):
  - Playback starts from a tap. No autoplay on page load.
  - Don't charge for, or put ads around, the music itself.
  - Show Apple Music attribution where Apple's guidelines require it.
  - MusicKit content can't be "synchronized with any other content" (see §4.4).

### 4.4 Live rooms (Phase 6, maybe): blocked on Apple's answer
Plan: each person plays the song on **their own** account, and Supabase Realtime broadcasts `{ trackId, positionMs, startedAt, playing }` from whoever is driving. Each phone seeks to `positionMs + (now − startedAt)`. No audio passes through KYBR.

**Blocker:** it's unclear whether Apple's "can't be synchronized with any other content" clause forbids this. A developer asked Apple this question in public ([forum thread](https://developer.apple.com/forums/thread/838157)) with no public answer. **Before building Phase 6, email Apple's MusicKit team and get the answer in writing.** If the answer is no, live rooms run on YouTube only, or become "listen at the same time" where each person presses play.

### 4.5 Spotify: link-out only
For a new app, Spotify's developer program is effectively closed to in-app playback:
- Apps in development mode work for **only 5 users**, and the owner must pay for Premium ([quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)).
- Going past 5 users requires a **registered business, a launched service and at least 250,000 monthly active users** ([extended access criteria](https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access)).

So Spotify users get **"open in Spotify"** links (from Odesli). Follow Spotify's branding guidelines wherever its name or logo appears.

### 4.6 YouTube: in-app playback for everyone else (Phase 5)
- Use Odesli's YouTube link first; otherwise search the YouTube Data API (`<artist> <title>`), prefer official "Topic" / Art Track uploads, and cache the match.
- Play it with the **YouTube IFrame Player API**. Rules that affect the design ([required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality)):
  - The player must be **at least 200 × 200 px** and visible. **It can't be hidden for audio-only playback.**
  - Nothing may overlay any part of the player, including chrome frames. Put hardware *around* it, never *over* it.
  - No autoplay until more than half the player is on screen, and never two auto-playing players at once.
- **Design consequence:** on YouTube, the Phase 5 player shows the actual video (≥ 200 px tall) where the spinning disc would be.

### 4.7 Link-out (always available)
Every track has an "open in…" row built from Odesli links. Each person picks their service in Settings → Music service. Per provider: Apple → play in app; YouTube → play in app; anything else → open the link in that app.

---

## 5. Player abstraction

One interface, so the screens never care which service is playing:

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

Until Phase 5 the only provider is `link`: every "open in [service]" button (burned-for-you sheet, KEPT sleeves, the crew track list, the album tracklist, on repeat) opens the track's link in your preferred service. In Phase 5 the same buttons call this interface, and an album's tracklist can play in order.

---

## 6. Data model (Postgres)

**exists** = already in `supabase/migrations`. **add (Pn)** = new in that phase. Spec §9 maps database names to the words on screen.

```sql
-- people
profiles      exists (id uuid pk = auth.users.id, handle text unique, display_name, tagline,
               liner_notes, profile_track_id → tracks, created_at)        -- public: the LABEL
              -- add (P2): label_name text not null
settings      exists (user_id pk → profiles, skin text, preferred_service text
               check in ('apple','youtube','spotify','link'))           -- owner only
              -- add (P2): skin default 'cobalt'
subscriptions add (P2) (subscriber_id → profiles, label_id → profiles, created_at,
               pk(subscriber_id,label_id), check subscriber_id <> label_id)
listener_counts view (P2): per label, the number of subscribers

-- crews
crews         exists (id, name, freq text, created_by → profiles, created_at)
              -- add (P3): timezone text not null (IANA name, from the creator's device)
crew_members  exists (crew_id → crews, user_id → profiles, joined_at, pk(crew_id,user_id))
              -- trigger: reject insert when the crew already has 8 members
              -- add (P3): pick_order int (Burn Club rotation, set on join)
dubs          exists (code text pk, crew_id, created_by, expires_at, used_by null, used_at null)  -- invites

-- catalog
tracks        exists (id, isrc text unique null, title, artist, duration_ms, album_id → albums null,
               apple_id, spotify_id, youtube_id, links jsonb, resolved_at)
albums        exists (id, mbid uuid unique null, apple_album_id, title, artist, year, cover_url,
               tint text, source text)
album_tracks  exists (album_id, position int, side text, title, track_id null)

-- reviews (public)
reviews       exists, = takes (id, album_id, user_id, heat not null, body text ≤ 280,
               created_at, updated_at, unique(album_id,user_id))
              -- add (P2): sticker text check (length ≤ 40) null
booklets      add (P2) (id, album_id, user_id, title text, body text, fav_tracks int[] null,
               heat not null, status text check in ('draft','published'), published_at, updated_at)
likes         add (P2) (user_id, target_kind text check in ('take','booklet','comment'),
               target_id uuid, created_at, pk(user_id,target_kind,target_id))
like_counts   view (P2): per target, the number of likes
comments      add (P2) (id, target_kind check in ('take','booklet'), target_id, parent_id null,
               user_id, body text ≤ 1000, pinned bool default false, created_at, deleted_at null)
spins         add (P2) (id, user_id, album_id, spun_on date, relisten bool default false,
               created_at)                                              -- your spins (the diary)
wants         add (P2) (user_id, album_id, added_at, pk(user_id,album_id))  -- still wrapped;
              -- deleted when you spin the album
top8          exists (user_id, position 1..8, album_id, pk(user_id,position))
known_for     materialized view (P3): per user, top 3 artists/genres/decades by likes on
               their takes and booklets, refreshed nightly; a tag needs a minimum like total

-- sharing (private to the crew)
burns         exists (id, crew_id, track_id, from_user, note ≤ 80, heat null, created_at)
              -- add (P4): kind text check in ('song','mix','album') default 'song',
              --           album_id → albums null, title text null (a mix's name);
              --           track_id nullable (a mix or album burn has none)
burn_tracks   add (P4) (burn_id, position int, track_id, pk(burn_id,position))  -- a mix's songs;
              -- a function checks total duration ≤ 80:00
song_replies  add (P2) (id, burn_id, user_id, body ≤ 250, heat null, created_at)
              -- the existing etches table is dropped when song_replies lands
kept          exists (user_id, burn_id, kept_at, pk(user_id,burn_id))     -- KEPT

-- Burn Club (private to the crew)
rounds        add (P3) (id, crew_id, number int, album_id, picked_by → profiles,
               starts_at, ends_at, unique(crew_id,number))
round_queue   add (P4) (crew_id, user_id, album_id, queued_at, pk(crew_id,user_id))
              -- "make it a Burn Club round": one queued pick per person per crew

room_state    exists, Phase 6 (crew_id pk, track_id, position_ms, started_at, playing bool, driver_id)
```

**Heat** is `numeric(2,1)` with a check that it's between 0.5 and 5 in steps of 0.5 (spec §4.5). The screen shows stars and words, never the number.

**This week** is a view: a crew's burns from the last 7 days, oldest first.

**Spinning an album** writes in one transaction: upsert the `reviews` row (heat, body, sticker), insert a `spins` row (a new row for a relisten, otherwise update today's), and delete the `wants` row. A take without heat can't be saved. **Publishing a booklet** also upserts the author's heat on the album.

**Burn Club:**
- A member has *spun* the current round when they have a `spins` row for the round's album dated on or after `starts_at`. The changer and the ticker read that, plus their take for the stars.
- **Rounds run Sunday to Sunday** (spec §8 Settled 6). `ends_at` is always the next Sunday at 24:00 in `crews.timezone`; a crew's first round runs to the coming Sunday. A scheduled function (Supabase cron, hourly) closes every round whose `ends_at` has passed and opens the next for the member next in `pick_order`: their `round_queue` album if they queued one, otherwise the rack shows "waiting on [name]'s pick" until they choose, and that round still ends on the next Sunday. Unlit discs stay dark; there's no penalty.
- Takes written for a round are ordinary public takes.

---

## 7. Privacy rules (Row Level Security)

| Table | Who can read | Who can write |
|---|---|---|
| crews, crew_members, burns, burn_tracks, song_replies, rounds, round_queue, room_state | Members of that crew only | Members, as themselves |
| kept, settings, subscriptions | Owner only (nobody else sees who you subscribe to) | Owner |
| reviews (takes), booklets (published), comments, spins, wants, top8, like_counts, listener_counts, known_for | **Everyone** | Owner; for comments, the commenter (the booklet's author can pin or delete) |
| likes (who liked what) | The liker, and the author of the liked thing | The liker |
| profiles (handle, name, label name, tagline, liner notes, profile song) | **Everyone** (labels are public). Never expose crews, burns, notes, rounds or KEPT through them | Owner |
| tracks, albums, album_tracks | Everyone | Server functions only |

**What counts are allowed:** likes and comments per take, booklet or comment (through `like_counts`), and listeners per label (through `listener_counts`). Never build an endpoint, view or column that returns per-person totals of likes, plays or spins, or any ranking of people or albums across the app. `known_for` exposes tags only, never the numbers behind them. Inside crews, two more are allowed, for members only:
- **crew heat** (the average of your crews' takes on an album, rounded to the half), and
- **"n of m spun it"** for an open round in your own crew.

On an album page, takes and booklets sort by likes (default) or by time. There is no app-wide ranking or trending query.

---

## 8. Build order and "done" checks

**Phase 1 — Crew loop. In the code today.**
Sign-in by email link, crews and invites (the 9th join is rejected), song burns through `resolve-link`, the crew rack and track list, song notes, the binder, skins and settings. Its screens don't match this design yet; Phase 2 replaces them.

**Phase 2 — The app's shape + albums (the main event)**
1. **Tabs, words and look:** HOME · DIG · CREW · LABEL · KEPT in the cobalt-and-chrome look (spec §3–5). *Done when:* no word from spec §3.4 appears anywhere a person can read.
2. **Replace the current screens** that don't fit the design (`Wire.tsx`, `overlays/Plyr.tsx`, `Ctrl.tsx`, `Win98.tsx`, `AnsweringMachine.tsx`). Until Phase 4's first run exists, sign-in and "start a crew / enter an invite code / just spin" use a plain interim screen.
3. **Catalog:** `search-albums` (MusicBrainz, cached, debounced) and album lookup for every new track, with cover art.
4. **DIG:** ALBUMS (spines grouped A–Z, recent digs on the device) and WRITERS (labels with SUBSCRIBE).
5. **Album page:** jewel case, cover, hype sticker, wrapped state, crew heat, booklets and takes sorted by most liked or newest, tracklist with "open in" links.
6. **Takes:** the take sheet (heat, take, sticker line, spun today / this week, relisten) writes `reviews` + `spins` and removes `wants`. *Done when:* a take posted by one friend shows on their label and on another friend's view of the album.
7. **Booklets, likes and comments:** writing (with drafts), the chrome reader, likes on takes, booklets and comments, comments with pin and one level of replies. *Done when:* a friend likes and comments on your booklet, and you see the counts and the comment.
8. **LABEL and subscribing:** masthead with label name, listener count and SUBSCRIBE, booklets, takes, on repeat, Top 8 (editable), your spins by month, still wrapped. Others' labels open from their name anywhere or from DIG → WRITERS.
9. **HOME:** new booklets and takes from your crews and labels you subscribe to, burned for you, the BURN button. With no crew: booklets and takes only, plus the start-a-crew line.
10. **KEPT, Settings and song replies:** the binder ("burned by [name] · kept [day]"), settings as the autorun menu opened from LABEL, and crew-only replies on burned songs.
11. **CREW:** the rack with its labels (`CREW n`, `IN THE CREW`, `＋ INVITE`, `BURNED TO [CREW]`).

**Phase 3 — Burn Club**
12. `rounds`, `pick_order`, `crews.timezone`, and the hourly close/open job (rounds turn over Sunday at midnight). First round: the crew's creator picks.
13. **The changer** in the CREW rack: one disc per member, lit when spun, tap to read a take; your disc opens the take sheet. ⏮ ⏭ step through past rounds; the LCD shows the round and `NEXT PICK ▸ [NAME]`; the VU shows crew heat.
14. **The ticker** on HOME, opening CREW on the first crew that's waiting on you. *Done when:* in a crew of three, two people spin the round and both see the third disc dark; the third spins it, the round shows complete, and the next round opens for the next person in order.
15. **Known-for tags** on labels.

**Phase 4 — Burner extras + first run**
16. **Mixes:** `burn_tracks`, the 80:00 capacity bar, a mix shown as one CD-R with a Sharpie tracklist in KEPT.
17. **Album burns:** "burn it for them" lands wrapped in their burned for you; "make it a Burn Club round" writes `round_queue`.
18. **First run:** the opening (spec §6.12), with start a crew / enter an invite code / just spin.

**Phase 5 — In-app playback**
19. Apple developer token function and MusicKit JS provider; authorize on the first tap.
20. YouTube provider with a visible ≥ 200 px player inside the Phase 5 player device.
21. Provider order from §5. *Done when:* the same burn plays in-app for an Apple Music friend, as a YouTube video for a friend without Apple Music, and opens Spotify for a Spotify friend.

**Phase 6 — Live rooms (maybe; only after Apple answers, §4.4)**
22. `room_state`, Realtime broadcast and presence, drift correction every few seconds.

**Before friends sign in:** host the app, set up the email sender (README), get an Odesli key, and set the MusicBrainz contact User-Agent.

---

## 9. Still to decide
1. **First run** (spec §8 Open 1). Needed by Phase 4; Phase 2 uses a plain interim screen.
2. **Whether a Burn Club picker can pass their turn** (spec §8 Open 2). Decide before Phase 3.
3. **The Phase 5 player device** (spec §8 Open 4).
4. Apple's written answer on synchronized playback (§4.4). It gates Phase 6.
5. **Name check:** confirm "KYBR" is clear to use as a product name before anything goes public.

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
