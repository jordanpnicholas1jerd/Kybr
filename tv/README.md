# Samsung TV control (UN58TU7000FXZA)

**What the TV is:** Samsung Crystal UHD TU7000, 58", 2020 model, running **Tizen**. It was
identified from the About This TV screen (Model Code UN58TU7000FXZA, software T-KTSU2AKUC-2743.0).

It is **not** Android TV, Google TV or Fire TV, so **ADB does not apply**. Developer options,
USB debugging, `pm disable-user`, `settings put` and APK installs don't exist on it. What Samsung
officially allows over your home network is:

| Official interface | What it can do | What it can't do |
|---|---|---|
| Remote-control WebSocket (port 8001/8002, the one SmartThings uses) | Press any remote key, list installed apps, open an app (with a deep link) | Read or change settings, disable or uninstall apps, take screenshots |
| REST API (port 8001) | Device info, check whether an app is running, open or close an app | Same as above |
| DIAL (port 8080) | Start YouTube on a given video, the same way your phone casts | Anything else |
| Wake-on-LAN | Turn the TV on from standby | — |
| Tizen Developer Mode + Tizen Studio (optional) | Install Tizen apps you sign with your own free Samsung certificate | Disable built-in apps, root |

`samsung_tv.py` uses only the first four. Settings changes are made by **you, with the remote**,
following the checklist below (or from the keyboard with `remote` mode, so you watch every press).
Nothing here roots or flashes anything, signs in, or types passwords.

## 1. Set up the computer (once)

```sh
cd Kybr
python3 -m venv tv/.venv && . tv/.venv/bin/activate
pip install -r tv/requirements.txt          # websocket-client, from PyPI
```

On macOS, if you later see **"No route to host"**, go to System Settings → Privacy & Security →
**Local Network**, turn your terminal app on, and retry.

## 2. On the TV, with the remote (once)

1. **Find the IP:** Home button → **Settings** (gear) → **General** → **Network** →
   **Network Status** → **IP Settings**. Note the **IP address** (e.g. 192.168.1.42).
2. **Let the computer turn the TV on:** Settings → General → Network → **Expert Settings** →
   **Power On with Mobile** → On.
3. **Make sure the Allow prompt will show:** Settings → General → **External Device Manager** →
   **Device Connection Manager** → **Access Notification** → *First Time Only*.
4. **Developer Mode isn't needed** for any of this. It's only for sideloading Tizen apps (section 6).

## 3. Connect

```sh
python3 tv/samsung_tv.py discover                 # optional: finds the TV's IP
python3 tv/samsung_tv.py --ip 192.168.1.42 pair   # the IP is remembered from now on
```

The TV shows **"TV Remote (this computer)" wants to connect** → press **Allow** on the remote.
The token is saved to `tv/state/token.json` (git-ignored). If you pressed Deny by mistake:
Settings → General → External Device Manager → Device Connection Manager → **Device List** →
select the computer → Allow.

In a second terminal, leave the live monitor running. It prints every command with a timestamp,
plus the TV's replies while each command runs:

```sh
python3 tv/samsung_tv.py monitor
```

## 4. Back up before changing anything

```sh
python3 tv/samsung_tv.py backup
```

This saves `tv/state/backups/<time>/device-info.json`, `installed-apps.json` and
`installed-apps.txt`. Settings menus **can't be read over the network** on Samsung, so before
each change in section 5, **take a phone photo of the screen** showing its current value. That
photo is your record of what to restore. The undo for each item is in section 8.

## 5. Proposed cleanup (do it only after you OK it)

All of it is menu toggles, so all of it can be undone. Apps on this TV can't be disabled or
uninstalled over the network, and built-in ones (Samsung TV Plus, Smart Hub, Universal Guide) can't
be uninstalled at all, so the cleanup turns off what feeds them ads and data. Not touched:
live TV and antenna/cable sources, the Smart Hub launcher, input/keyboard settings, Samsung account,
software updates (left on, for security fixes), and anything not identified.

**Ads and tracking:** Settings → **Support** → **Terms & Privacy** (on some firmware it's
*Terms & Policy*; on newer firmware it's under **Privacy Choices**):
- [ ] **Interest-Based Advertisement** → turn off / Disagree
- [ ] **Viewing Information Services** (ACR, which recognizes what's on screen) → Disagree
- [ ] **Internet-Based Advertisement / Privacy Notice for Ads**, where listed → Disagree
- [ ] **Voice Recognition Services** → Disagree (optional; only if you don't use voice)

**Stop the home-screen and autoplay clutter:** Settings → **General** → **Smart Features**:
- [ ] **Autorun Smart Hub** → Off (the TV no longer opens the ad-filled home row at power-on)
- [ ] **Autorun Last App** → your choice
- [ ] Home → **Samsung TV Plus** (and **Universal Guide**) → highlight the tile → press Down →
      **Move** it to the end of the row. If **Remove** isn't grayed out, you can use it; reinstall
      from the Apps store.

**Block ad and tracking domains network-wide (AdGuard DNS):** this TV has no "Private DNS"
(DNS-over-TLS) option, so `dns.adguard-dns.com` can't be entered as a hostname. Use AdGuard's plain
DNS addresses instead (same filter list):
- [ ] Settings → General → Network → Network Status → **IP Settings** → **DNS Setting** →
      *Enter manually* → **94.140.14.14** → OK. (Secondary: 94.140.15.15 if offered.)
  Some Samsung services (TV Plus, the Store's ad tiles) may stop loading. That's expected.

**Faster:**
- [ ] Settings → General → **Instant On** (if listed on your firmware) → On (quicker wake from standby)
- [ ] Settings → **Support** → **Device Care** → **Start Device Care** (clears memory and checks
      storage; run it whenever the TV feels slow)
- [ ] Settings → Support → Device Care → **Manage Storage** → delete apps *you* installed and no
      longer use (built-ins can't be deleted)
- Android's "animation scale 0.5" has **no Tizen equivalent**, so there's nothing to set.

To do these from the keyboard so you see each press: `python3 tv/samsung_tv.py remote`
(arrows, Enter = OK, Backspace = Back, h = Home, m = Menu, q = quit).

## 6. Installing an open-source app (optional, your call)

The TV can't install APKs, so the TV Bro browser can't run on it. The only official way to add a
non-Store app is **Tizen Developer Mode + Samsung's Tizen Studio**. You'd enable Developer Mode
(Apps → press **1 2 3 4 5** with the remote's **123** button → On → enter this computer's IP →
restart the TV), create a free Samsung certificate in Tizen Studio, and install a `.wgt` built
from the project's official GitHub source or releases. For example,
[Jellyfin for Tizen](https://github.com/jellyfin/jellyfin-tizen) builds from source this way.
Tell me which app you want, and I'll check whether it has an official Tizen build and write the
exact steps. To undo: Apps → the app → Delete, then Developer Mode → Off.

## 7. Cheat sheet

```sh
T="python3 tv/samsung_tv.py"
$T monitor                                   # live log (second terminal)
$T wake --mac d8:a3:5c:d7:25:2d              # power on (wired MAC; Wi-Fi: 54:3a:d6:48:30:c4)
$T youtube "https://youtu.be/VIDEO_ID"       # open YouTube and play: walks you through each step
$T youtube lofi hip hop radio                # a title works too (plays the first search result)
$T youtube --auto --pick-profile URL         # no questions; presses OK on "Who's watching?"
$T key HOME | key KEY_VOLUP KEY_VOLUP | key POWER
$T remote                                    # drive the TV from the keyboard
$T apps                                      # installed apps and their IDs
$T launch 111299001912                       # open an app by ID (this one is YouTube)
$T close 111299001912                        # close it
$T info | backup | discover | pair
```

`youtube` goes to Home, opens YouTube on the video, and stops at **"Who's watching?"** to ask you.
Samsung exposes no screenshot or screen dump, so your eyes on the TV are the check before it
presses OK (with `--auto --pick-profile` it presses OK without asking). It then re-sends the video
link and confirms playback. If the deep link doesn't start YouTube, it falls back to DIAL.

## 8. Undo

| Change | Undo |
|---|---|
| This computer paired | Settings → General → External Device Manager → Device Connection Manager → Device List → delete it; then `rm -r tv/state` |
| Power On with Mobile | Same menu → Off |
| Interest-Based Ads / Viewing Information / Voice | Settings → Support → Terms & Privacy → Agree / turn back on |
| Autorun Smart Hub / Last App | Settings → General → Smart Features → back to the value in your photo |
| Moved/removed home tiles | Highlight → Down → Move back; reinstall removed apps from Apps |
| AdGuard DNS | Settings → General → Network → Network Status → IP Settings → DNS Setting → **Obtain automatically** |
| Instant On | Settings → General → Instant On → back to your photo's value |
| Developer Mode / sideloaded app | Apps → app → Delete; Apps → 1 2 3 4 5 → Off |
| Everything at once (last resort) | Settings → General → **Reset** (PIN 0000). This resets *all* settings and sign-ins, so prefer the rows above |
