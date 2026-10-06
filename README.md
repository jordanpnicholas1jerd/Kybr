# KYBR

A private music-sharing app for small crews: you **burn** a song to your people, they **etch** a note on it, and the good ones get **kept** in a CASE. No feed, no algorithm, no counts.

The design lives in [`docs/KYBR Handoff Spec.md`](docs/KYBR%20Handoff%20Spec.md), and how it gets built lives in [`docs/KYBR Build Plan.md`](docs/KYBR%20Build%20Plan.md). The clickable prototype is in `docs/reference/` (open `KYBR Prototype.dc.html` with `support.js` beside it). Its data, including the album tracklists, is placeholder only.

## Status

Phase 1 (the crew loop), in progress.

- [x] Project setup: React, TypeScript, Vite, installable as a PWA
- [x] Database: Phase 1 tables, the 8-person crew cap, DUB invites and row level security
- [x] Shared look: the six skins, the heat scale, the phone frame, the locked nav tray
- [x] Demo mode and Supabase behind one data layer
- [x] First run: the answering machine (sign in → greeting → START A CREW / ENTER A DUB)
- [ ] **Waiting on design review of the answering machine before going further**
- [ ] BURN, WIRE, CHNL (rack and track list, with no live sync), This Week, PLYR, ETCH, CASE, CTRL

## Run it

```sh
npm install
npm run dev          # http://127.0.0.1:5173
```

With no `.env.local`, the app runs in **demo mode**. You're signed in as "you", nothing is saved, and the answering machine lists DUB codes to try. Add `?demo` to any URL to force demo mode.

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

## Tests

```sh
npm test             # unit tests (heat scale)
npm run typecheck
npm run test:db      # applies the migrations to a throwaway Postgres and runs
                     # the privacy checks in supabase/checks (needs Postgres 15+ binaries)
```

The privacy checks cover the following: outsiders and signed-out visitors can't see crews, members, burns, etches, DUBs, This Week or anyone's CASE. DECK profiles are public. DUBs are single use and expire. The 9th person can't join a crew.

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
4. Set up email as described above.

## Layout

```
docs/                    spec, build plan, prototype reference
src/
  theme/                 skins (one shared list of six), heat scale
  components/            DeviceFrame, NavTray, chrome text, 7-segment digit
  screens/               one device per screen
  data/                  KybrApi interface; demo.ts (in memory) and live.ts (Supabase)
supabase/
  migrations/            schema + row level security
  checks/                privacy checks run by `npm run test:db`
scripts/test-db.sh
```

## Decisions made during the build

- **Skins:** one list of six (UV, Sunset, Ice, Volt, Heat, Mint). CTRL shows all six; CASE's quick row shows UV, Sunset, Mint and Ice. "Ember" was an old name for Sunset.
- **Screen size:** 392×812 is the base. On a desktop the app is drawn inside the phone frame, as in the prototype. On a phone (500px wide or less) there's no frame and no fake clock, and the layout respects the safe areas.
- **DECKs are public** (spec §8 Settled 10). Private settings (skin, preferred music service) live in a separate owner-only `settings` table, so the public `profiles` row never carries them.
- **DUBs** are 6 characters (no 0/O/1/I), single use, and expire after 7 days. Redeeming a DUB for a crew you're already in doesn't use it up.
- **Anti-clout:** PostgREST aggregate functions stay off (Supabase's default), so the API can't be asked for counts.
