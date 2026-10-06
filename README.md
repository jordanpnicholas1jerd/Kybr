# KYBR

A private music-sharing app for small crews: you **burn** a song to your people, they **etch** a note on it, and the good ones get **kept** in a CASE. No feed, no algorithm, no counts.

The design lives in [`docs/KYBR Handoff Spec.md`](docs/KYBR%20Handoff%20Spec.md), and how it gets built lives in [`docs/KYBR Build Plan.md`](docs/KYBR%20Build%20Plan.md). The clickable prototype is in `docs/reference/` (open `KYBR Prototype.dc.html` with `support.js` beside it). Its data, including the album tracklists, is placeholder only.

## Status

**Phase 1 (the crew loop) is built.** Phase 2 (albums, reviews, DECK) waits for a go-ahead.

- [x] Answering machine first run: sign in with a magic link → greeting → START A CREW / ENTER A DUB
- [x] **WIRE** (Game Boy): your crews' five newest burns as a cursor list, plus a This Week row. D-pad/arrow keys move, A/Enter opens, START burns
- [x] **BURN** (CD burner): paste a link → it resolves to one song on every service → pick a crew → optional heat + note → burned. If a link can't be read, you name the song and the raw link is burned
- [x] **CHNL** (hi-fi rack): crew presets, jog dial, members, track list, This Week, ＋ DUB. No live sync
- [x] **PLYR** (iPod): a remote. ▶❚❚ opens the song in your own music app; ⏮ ⏭ step through; the center button etches
- [x] **ETCH** (jewel case): heat + note, keep it in your CASE
- [x] **CASE** (CD binder): what you kept, "saved from [name] · saved [day]", four-skin quick row
- [x] **CTRL** (Win98): all six skins, preferred music service, your crews (new DUB, leave, start/join another), sign out
- [ ] DECK shows your name and handle; the rest of it is Phase 2

Playback is link-out only, as the build plan's Phase 1 specifies. KYBR never streams audio.

## Run it

```sh
npm install
npm run dev          # http://127.0.0.1:5173
```

With no `.env.local`, the app runs in **demo mode**: the prototype's crews and songs, you're signed in as "you", and nothing is saved. `?demo` starts at the answering machine (it lists DUB codes to try); `?demo=crew` starts already in the prototype's three crews.

### Against local Supabase

This needs Docker.

```sh
npx supabase start                 # applies supabase/migrations
npx supabase status -o env         # prints API_URL and ANON_KEY
```

Put those values in `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

Sign-in emails don't leave your machine when you run locally. Open Mailpit at http://127.0.0.1:54324 and click the link.

BURN needs the `resolve-link` Edge Function:

```sh
npx supabase functions serve                     # talks to the real api.song.link
# or, offline, against a stand-in:
node scripts/mock-odesli.mjs &
echo 'ODESLI_BASE_URL=http://host.docker.internal:54399' > supabase/.env.functions
npx supabase functions serve --env-file supabase/.env.functions
```

## Tests

```sh
npm test             # unit tests: heat scale, time words, the Odesli parser
npm run typecheck
npm run test:db      # applies the migrations to a throwaway Postgres and runs
                     # the privacy checks in supabase/checks (needs Postgres 15+ binaries)
```

The privacy checks (39 of them) cover the following: outsiders and signed-out visitors can't see crews, members, burns, etches, DUBs, This Week or anyone's CASE. DECK profiles are public. DUBs are single use and expire. The 9th person can't join a crew.

## Before real friends sign in: set up a custom email sender

Supabase's built-in email sender is for trying things out only. It sends **only to members of your Supabase organization**, and it's capped at about **2 emails an hour** for the whole project. Your friends' magic links would never arrive. Set up your own sender first. Resend has a free tier:

1. **Resend:** sign up at resend.com and add a domain you own (for example `kybr.yourdomain.com`). Add the DNS records it shows you (SPF, DKIM) and wait until the domain shows as verified. Then create an API key.
2. **Supabase dashboard:** open your project, go to **Authentication → Emails → SMTP Settings** and turn on **custom SMTP**:
   - Host `smtp.resend.com`, port `465`
   - Username `resend`, password = your Resend API key
   - Sender email: an address on the verified domain (for example `dub@kybr.yourdomain.com`); sender name `KYBR`
3. **Rate limits:** with custom SMTP, Supabase starts you at about 30 emails an hour. Raise it under **Authentication → Rate Limits** if you need more.
4. **URLs:** set **Authentication → URL Configuration → Site URL** to wherever the app is hosted, and add that address to the **Redirect URLs**. Magic links send people back there.
5. **Optional:** in **Authentication → Emails → Templates**, rewrite the magic-link email in KYBR's voice, lowercase and warm.

Sources: [Supabase: custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Supabase: going into production](https://supabase.com/docs/guides/deployment/going-into-prod). Re-check them when you do this, because limits change.

## Connecting a real Supabase project later

1. Create a project at supabase.com.
2. Run `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply the migrations.
3. Put the project URL and the **anon** (publishable) key in your hosting provider's environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The service-role key never goes in the app.
4. Deploy the link resolver: `npx supabase functions deploy resolve-link`. Odesli works without a key at a low rate limit; before real use, request a key at odesli.co and run `npx supabase secrets set ODESLI_API_KEY=...`.
5. Set up email as described above.

## Layout

```
docs/                    spec, build plan, prototype reference
src/
  theme/                 skins (one shared list of six), heat scale
  components/            DeviceFrame, NavTray, chrome text, 7-segment digit
  screens/               one device per screen
  overlays/              PLYR, ETCH, BURN
  lib/                   time words ("saved tue"), "open in…" service links
  data/                  KybrApi interface; demo.ts (in memory) and live.ts (Supabase)
supabase/
  migrations/            schema + row level security
  functions/resolve-link pasted link → one service-neutral track (Odesli), cached
  checks/                privacy checks run by `npm run test:db`
scripts/                 test-db.sh, mock-odesli.mjs
```

## Decisions made during the build

- **Skins:** one list of six (UV, Sunset, Ice, Volt, Heat, Mint). CTRL shows all six; CASE's quick row shows UV, Sunset, Mint and Ice. "Ember" was an old name for Sunset.
- **Screen size:** 392×812 is the base. On a desktop the app is drawn inside the phone frame, as in the prototype. On a phone (500px wide or less) there's no frame and no fake clock, and the layout respects the safe areas.
- **DECKs are public** (spec §8 Settled 10). Private settings (skin, preferred music service) live in a separate owner-only `settings` table, so the public `profiles` row never carries them.
- **DUBs** are 6 characters (no 0/O/1/I), single use, and expire after 7 days. Redeeming a DUB for a crew you're already in doesn't use it up.
- **Anti-clout:** PostgREST aggregate functions stay off (Supabase's default), so the API can't be asked for counts.
- **Track identity:** a song pasted from Spotify and the same song pasted from Apple Music land on one row. The row is keyed on Odesli's Apple Music entity, or the first service Odesli knows. Without an Apple Developer account there's no ISRC or duration yet. That arrives with the Apple step in the build plan (§4.1), and WIRE shows the day a song was burned in place of its length.
- **Leaving a crew** takes its songs out of your CASE too, because row level security hides that crew's burns from you.
- **CHNL in Phase 1** says ON THE DECK, not ON AIR. Its transport keys move through the track list and ▶ opens PLYR. The live room is Phase 4.
