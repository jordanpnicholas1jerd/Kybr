# KYBR — Start Here
_Paste this into a new chat, or point the new chat at this file, to start building the app._

---

## The ask

Build **KYBR**: an album-review app built around CDs, with private music sharing for small friend groups. It's an installable web app (it lives on your phone's home screen) for iPhone and Android.

- **Album reviews come first:** people log albums they've listened to ("spin"), write short reviews ("takes") and long reviews ("booklets"), and post them on their public page (their "label"). Others can like, comment and subscribe.
- **Sharing is a close second:** people "burn" songs, mixes and albums to their crew (up to 8 friends), and each crew runs **Burn Club**, one album a week.
- **The look is cobalt and chrome:** a cobalt grid screen, chrome keys, brushed chrome review plates with etched text, and CD objects everywhere.

## Where everything is

Repository: **`jordanpnicholas1jerd/Kybr`**, branch **`claude/funny-faraday-1f4cw7`**.

Read these in order before writing code:
1. **`docs/KYBR Handoff Spec.md`**: the design. What KYBR is, the exact words to use, the look, and every screen.
2. **`docs/KYBR Build Plan.md`**: how to build it. Tools, accounts, music services and their rules, the database, privacy, and the order of work with "done when" checks.
3. **`docs/reference/KYBR Records Mockup.html`**: the clickable mockup. Open it in a browser; it's the reference for the look and feel. Its data is placeholder.
4. **`README.md`**: how to run the existing code, tests, and the email setup friends need to sign in.

If the mockup and the spec disagree, **the spec wins**.

## What already exists

The code already has the crew basics working (Build Plan Phase 1): sign-in by email link, crews and invite codes, burning a song from a pasted link, the crew rack, the binder, skins and settings. It uses React + TypeScript + Vite with Supabase. Its screens don't match the design yet.

## What to build first

**Build Plan Phase 2, steps 1–12, in order.** That gives the app its real shape: the five tabs (HOME · DIG · CREW · LABEL · KEPT) in the cobalt-and-chrome look, album search, the album page, takes, booklets with likes and comments, labels with subscribing and listener counts, the HOME feed, KEPT, settings, song replies and 30-second song previews.

Then Phase 3 (Burn Club), then Phase 4 (mixes, album burns, the first-run screen). Phases 5–6 (playing music inside the app, listening together live) come later.

## Rules that matter

- **KYBR never hosts or streams audio.** Songs open in each person's own music app. Song previews play straight from Apple's or Deezer's servers, only when tapped, with credit (Build Plan §4.8).
- **Privacy:** reviews, booklets, comments and labels are public. Crews, burns, song replies and KEPT stay inside the crew. Follow the privacy table in Build Plan §7 exactly, and never build rankings of people or "trending" pages.
- **Words:** use the words in Spec §3.3, and never show the words in Spec §3.4.
- **Tests:** keep `npm test`, `npm run typecheck` and `npm run test:db` passing, and add tests for new privacy rules.
- **Ask before deciding** anything listed as open (Spec §8 Open, Build Plan §9). The biggest one is the first-run screen.

## Working with the owner

- Keep replies short and in plain language, without jargon.
- Show progress in the mockup style the owner approved; when something visual changes, share a screenshot or a preview.
- Commit and push to the branch above as you finish each step.
