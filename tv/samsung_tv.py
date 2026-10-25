#!/usr/bin/env python3
"""Control a Samsung Tizen TV (2016+) over Samsung's official local-network API.

Uses only what the TV itself exposes on your LAN:
  * REST      http://<ip>:8001/api/v2/                      device info, app status/launch/close
  * WebSocket wss://<ip>:8002/api/v2/channels/samsung.remote.control
                                                            remote-key presses, installed apps, app launch
  * DIAL      http://<ip>:8080/ws/apps/YouTube              the protocol phones use to cast to YouTube
  * Wake-on-LAN magic packet                                (needs "Power On with Mobile" on the TV)

No root, no firmware changes, no sign-ins. The first connection makes the TV show an
Allow/Deny prompt; the token it returns is saved in tv/state/token.json.

Every command is printed with a timestamp and appended to tv/state/commands.log.
While a command runs, the events the TV sends back are printed under it ("  tv| ...").
Run `python3 tv/samsung_tv.py monitor` in a second terminal to follow the log live.
"""

import argparse
import base64
import datetime as dt
import json
import os
import re
import socket
import ssl
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state")
LOG = os.path.join(STATE, "commands.log")
TOKEN_FILE = os.path.join(STATE, "token.json")
CONFIG_FILE = os.path.join(STATE, "config.json")
CLIENT_NAME = "TV Remote (this computer)"

YOUTUBE_APP_ID = "111299001912"

# Remote keys this tool exposes in interactive mode. Names are Samsung's own.
INTERACTIVE_KEYS = {
    "\x1b[A": "KEY_UP", "\x1b[B": "KEY_DOWN", "\x1b[C": "KEY_RIGHT", "\x1b[D": "KEY_LEFT",
    "\r": "KEY_ENTER", "\n": "KEY_ENTER", "\x7f": "KEY_RETURN", "b": "KEY_RETURN",
    "h": "KEY_HOME", "m": "KEY_MENU", "s": "KEY_SOURCE", "i": "KEY_INFO",
    "p": "KEY_PLAY", "k": "KEY_PAUSE", "x": "KEY_STOP", "f": "KEY_FF", "r": "KEY_REWIND",
    "+": "KEY_VOLUP", "-": "KEY_VOLDOWN", "0": "KEY_MUTE", "e": "KEY_EXIT", "q": None,
}


# ---------------------------------------------------------------- logging / monitor

def now():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(line):
    os.makedirs(STATE, exist_ok=True)
    stamped = f"[{now()}] {line}"
    print(stamped, flush=True)
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(stamped + "\n")


def tv_event(line):
    """Events from the TV: shown only while a command is running, and logged."""
    log(f"  tv| {line}")


def monitor():
    os.makedirs(STATE, exist_ok=True)
    open(LOG, "a").close()
    print(f"Following {LOG} (Ctrl-C to stop)\n", flush=True)
    with open(LOG, encoding="utf-8") as fh:
        fh.seek(0, os.SEEK_END)
        while True:
            line = fh.readline()
            if line:
                print(line, end="", flush=True)
            else:
                time.sleep(0.2)


# ---------------------------------------------------------------- config

def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return default


def save_json(path, data):
    os.makedirs(STATE, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)


def tv_ip(args):
    ip = args.ip or os.environ.get("TV_IP") or load_json(CONFIG_FILE, {}).get("ip")
    if not ip:
        sys.exit("No TV IP. Run `discover`, or pass --ip 192.168.x.x (it is then remembered).")
    if args.ip:
        cfg = load_json(CONFIG_FILE, {})
        cfg["ip"] = args.ip
        save_json(CONFIG_FILE, cfg)
    return ip


# ---------------------------------------------------------------- REST / DIAL

def http(method, url, body=None, timeout=5, content_type=None):
    req = urllib.request.Request(url, data=body, method=method)
    if content_type:
        req.add_header("Content-Type", content_type)
    log(f"→ {method} {url}" + (f"  body={body.decode()!r}" if body else ""))
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = resp.read().decode("utf-8", "replace")
            tv_event(f"HTTP {resp.status} {text[:300]}")
            return resp.status, text
    except urllib.error.HTTPError as err:
        tv_event(f"HTTP {err.code} {err.reason}")
        return err.code, ""
    except (urllib.error.URLError, OSError) as err:
        tv_event(f"no answer: {err}")
        if "No route to host" in str(err) and sys.platform == "darwin":
            log("macOS: allow your terminal under System Settings → Privacy & Security → "
                "Local Network, then retry.")
        return None, ""


def device_info(ip):
    status, text = http("GET", f"http://{ip}:8001/api/v2/")
    return json.loads(text) if status == 200 else None


def app_status(ip, app_id):
    status, text = http("GET", f"http://{ip}:8001/api/v2/applications/{app_id}")
    return json.loads(text) if status == 200 and text else None


# ---------------------------------------------------------------- WebSocket remote

class Remote:
    """One authorised WebSocket session to the TV's remote-control channel."""

    def __init__(self, ip, timeout=30):
        try:
            import websocket  # websocket-client
        except ImportError:
            sys.exit("Missing dependency: pip install -r tv/requirements.txt")
        self.ip = ip
        self.events = []
        self.cond = threading.Condition()
        tokens = load_json(TOKEN_FILE, {})
        name = base64.b64encode(CLIENT_NAME.encode()).decode()
        url = f"wss://{ip}:8002/api/v2/channels/samsung.remote.control?name={name}"
        if tokens.get(ip):
            url += f"&token={tokens[ip]}"
        log(f"→ connect {url.split('?')[0]}")
        if not tokens.get(ip):
            log("  Look at the TV: choose Allow on the prompt for "
                f"\"{CLIENT_NAME}\" (you have {timeout}s).")
        try:
            # The TV's certificate is self-signed by Samsung, so it cannot be verified.
            self.ws = websocket.create_connection(
                url, timeout=timeout, sslopt={"cert_reqs": ssl.CERT_NONE})
        except Exception as err:  # noqa: BLE001 - report any connection failure plainly
            tv_event(f"connection failed: {err}")
            if "No route to host" in str(err) and sys.platform == "darwin":
                log("macOS: allow your terminal under System Settings → Privacy & Security → "
                    "Local Network, then retry.")
            sys.exit(1)
        first = json.loads(self.ws.recv())
        tv_event(f"{first.get('event')} {json.dumps(first.get('data', {}))[:200]}")
        if first.get("event") == "ms.channel.unauthorized":
            sys.exit("The TV refused the connection (Deny was chosen, or the device is blocked). "
                     "Unblock it under Settings → General → External Device Manager → "
                     "Device Connection Manager → Device List, then retry.")
        token = (first.get("data") or {}).get("token")
        if token and token != tokens.get(ip):
            tokens[ip] = token
            save_json(TOKEN_FILE, tokens)
            log("  Connected and authorised; token saved to tv/state/token.json.")
        self.ws.settimeout(None)
        self.reader = threading.Thread(target=self._read, daemon=True)
        self.reader.start()

    def _read(self):
        while True:
            try:
                msg = json.loads(self.ws.recv())
            except Exception:  # noqa: BLE001 - socket closed
                return
            tv_event(f"{msg.get('event')} {json.dumps(msg.get('data', ''))[:300]}")
            with self.cond:
                self.events.append(msg)
                self.cond.notify_all()

    def send(self, payload, label):
        log(f"→ {label}")
        self.ws.send(json.dumps(payload))

    def wait_event(self, name, timeout=8):
        end = time.time() + timeout
        with self.cond:
            while time.time() < end:
                for msg in self.events:
                    if msg.get("event") == name:
                        self.events.remove(msg)
                        return msg
                self.cond.wait(end - time.time())
        return None

    def key(self, key, pause=0.6):
        self.send({"method": "ms.remote.control", "params": {
            "Cmd": "Click", "DataOfCmd": key, "Option": "false",
            "TypeOfRemote": "SendRemoteKey"}}, f"key {key}")
        time.sleep(pause)

    def apps(self):
        self.send({"method": "ms.channel.emit", "params": {
            "event": "ed.installedApp.get", "to": "host"}}, "list installed apps")
        msg = self.wait_event("ed.installedApp.get")
        return (msg or {}).get("data", {}).get("data", [])

    def launch(self, app_id, meta=None, app_type=2):
        data = {"appId": app_id,
                "action_type": "DEEP_LINK" if app_type == 2 else "NATIVE_LAUNCH"}
        if meta:
            data["metaTag"] = meta
        self.send({"method": "ms.channel.emit", "params": {
            "event": "ed.apps.launch", "to": "host", "data": data}},
            f"launch app {app_id}" + (f" with {meta}" if meta else ""))

    def close(self):
        self.ws.close()


# ---------------------------------------------------------------- YouTube helpers

VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


def video_id_from(text):
    """Accept a YouTube URL or bare video ID; return the ID or None."""
    text = text.strip()
    if VIDEO_ID.match(text):
        return text
    url = urllib.parse.urlparse(text if "://" in text else "https://" + text)
    host = (url.hostname or "").lower()
    if host.endswith("youtu.be"):
        vid = url.path.strip("/").split("/")[0]
        return vid if VIDEO_ID.match(vid) else None
    if "youtube.com" in host:
        vid = urllib.parse.parse_qs(url.query).get("v", [""])[0]
        if VIDEO_ID.match(vid):
            return vid
        parts = url.path.strip("/").split("/")
        if len(parts) >= 2 and parts[0] in ("shorts", "embed", "live", "v") \
                and VIDEO_ID.match(parts[1]):
            return parts[1]
    return None


def search_youtube(query):
    """First result for a title search, read from youtube.com's public results page."""
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    log(f"→ search YouTube for {query!r}")
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.8"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            page = resp.read().decode("utf-8", "replace")
    except OSError as err:
        log(f"  search failed ({err}); pass the video's URL instead.")
        return None, None
    match = re.search(r'"videoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})".*?'
                      r'"title":\{"runs":\[\{"text":"(.*?)"\}', page)
    if not match:
        log("  no result found; pass the video's URL instead.")
        return None, None
    vid, title = match.group(1), json.loads(f'"{match.group(2)}"')
    log(f"  first result: {title}  (https://youtu.be/{vid})")
    return vid, title


def confirm(question):
    if not sys.stdin.isatty():
        return True
    return input(f"    {question} [Y/n] ").strip().lower() in ("", "y", "yes")


def play_youtube(ip, what, auto=False, pick_profile=False):
    vid = video_id_from(what)
    if not vid:
        vid, _ = search_youtube(what)
        if not vid:
            sys.exit(1)

    log("STEP 1/5  make sure the TV is on and answering")
    if not device_info(ip):
        sys.exit("The TV did not answer. Is it on and on the same network? Try `wake`.")

    remote = Remote(ip)
    try:
        log("STEP 2/5  go to the Home screen so you can see the launch")
        remote.key("KEY_HOME", pause=1.5)

        log(f"STEP 3/5  open YouTube on video {vid}")
        remote.launch(YOUTUBE_APP_ID, meta=f"v={vid}")
        time.sleep(4)
        st = app_status(ip, YOUTUBE_APP_ID)
        if not (st and st.get("running")):
            log("  The WebSocket launch did not start YouTube; trying DIAL (the casting path).")
            http("POST", f"http://{ip}:8080/ws/apps/YouTube", body=f"v={vid}".encode(),
                 content_type="text/plain; charset=utf-8")
            time.sleep(5)

        log("STEP 4/5  \"Who's watching?\" check")
        # Samsung exposes no screenshot or UI dump, so the check is your eyes on the TV.
        if auto:
            if pick_profile:
                log("  --pick-profile: pressing OK on the highlighted profile")
                remote.key("KEY_ENTER", pause=4)
                remote.launch(YOUTUBE_APP_ID, meta=f"v={vid}")
                time.sleep(4)
            else:
                log("  --auto: not pressing OK (it would pause a video that is already playing)")
        elif confirm("Is the TV showing \"Who's watching?\" (or another prompt that needs OK)?"):
            if confirm("Is the profile you want highlighted? (press Left/Right in `remote` "
                       "mode first if not)"):
                remote.key("KEY_ENTER", pause=4)
                log("  The video link is reapplied after the profile pick.")
                remote.launch(YOUTUBE_APP_ID, meta=f"v={vid}")
                time.sleep(4)

        log("STEP 5/5  playback")
        if not auto and not confirm("Is the video playing?"):
            log("  pressing Play")
            remote.key("KEY_PLAY", pause=2)
        log(f"Done: https://youtu.be/{vid}")
    finally:
        remote.close()


# ---------------------------------------------------------------- other commands

def discover(timeout=4):
    """SSDP search for Samsung TVs on the LAN."""
    msg = ("M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: \"ssdp:discover\"\r\n"
           "MX: 2\r\nST: urn:samsung.com:device:RemoteControlReceiver:1\r\n\r\n").encode()
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.settimeout(timeout)
    log("→ SSDP search for Samsung TVs")
    sock.sendto(msg, ("239.255.255.250", 1900))
    found = set()
    try:
        while True:
            _, addr = sock.recvfrom(4096)
            if addr[0] not in found:
                found.add(addr[0])
                info = device_info(addr[0]) or {}
                dev = info.get("device", {})
                log(f"  found {addr[0]}  {dev.get('modelName', '?')}  {dev.get('name', '')}")
    except socket.timeout:
        pass
    if not found:
        log("  nothing answered. Find the IP on the TV instead (see tv/README.md).")
    return found


def wake(mac, ip=None):
    raw = bytes.fromhex(mac.replace(":", "").replace("-", ""))
    packet = b"\xff" * 6 + raw * 16
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    for target in filter(None, ["255.255.255.255", ip]):
        log(f"→ Wake-on-LAN {mac} via {target}")
        sock.sendto(packet, (target, 9))


def backup(ip):
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    folder = os.path.join(STATE, "backups", stamp)
    os.makedirs(folder, exist_ok=True)
    info = device_info(ip)
    save_json(os.path.join(folder, "device-info.json"), info)
    remote = Remote(ip)
    try:
        apps = remote.apps()
    finally:
        remote.close()
    save_json(os.path.join(folder, "installed-apps.json"), apps)
    with open(os.path.join(folder, "installed-apps.txt"), "w", encoding="utf-8") as fh:
        for app in sorted(apps, key=lambda a: a.get("name", "")):
            fh.write(f"{app.get('appId')}\t{app.get('name')}\n")
    log(f"Saved device info and {len(apps)} installed apps to {folder}")
    log("Settings menus can't be read over the network: photograph each screen in "
        "tv/README.md's checklist before you change it (that is your restore record).")


def interactive(ip):
    import termios
    import tty
    remote = Remote(ip)
    print("\nArrows move · Enter OK · Backspace/b Back · h Home · m Menu · s Source · "
          "p Play · k Pause · +/- Volume · 0 Mute · e Exit · q quit\n", flush=True)
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setcbreak(fd)
        while True:
            ch = os.read(fd, 3).decode(errors="ignore")
            if ch not in INTERACTIVE_KEYS:
                continue
            if INTERACTIVE_KEYS[ch] is None:
                break
            remote.key(INTERACTIVE_KEYS[ch], pause=0.05)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)
        remote.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--ip", help="TV IP address (remembered after first use)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("discover", help="find Samsung TVs on the network")
    sub.add_parser("info", help="print the TV's device info")
    sub.add_parser("pair", help="connect and approve this computer on the TV")
    sub.add_parser("backup", help="save device info and the installed-app list")
    sub.add_parser("apps", help="list installed apps")
    p = sub.add_parser("key", help="press one or more remote keys, e.g. KEY_HOME KEY_ENTER")
    p.add_argument("keys", nargs="+")
    p = sub.add_parser("launch", help="open an app by ID")
    p.add_argument("app_id")
    p = sub.add_parser("close", help="close an app by ID")
    p.add_argument("app_id")
    sub.add_parser("remote", help="drive the TV from this keyboard")
    p = sub.add_parser("youtube", help="open YouTube and play a video (URL, ID or title)")
    p.add_argument("video", nargs="+")
    p.add_argument("--auto", action="store_true", help="don't ask questions")
    p.add_argument("--pick-profile", action="store_true",
                   help="with --auto: press OK on the \"Who's watching?\" screen")
    p = sub.add_parser("wake", help="turn the TV on with Wake-on-LAN")
    p.add_argument("--mac", help="TV MAC address (remembered after first use)")
    sub.add_parser("monitor", help="follow every command and TV event live")
    args = ap.parse_args()

    if args.cmd == "monitor":
        return monitor()
    if args.cmd == "discover":
        return discover()
    if args.cmd == "wake":
        cfg = load_json(CONFIG_FILE, {})
        mac = args.mac or cfg.get("mac")
        if not mac:
            sys.exit("Pass --mac (Settings → Support → About This TV shows it).")
        cfg["mac"] = mac
        save_json(CONFIG_FILE, cfg)
        return wake(mac, args.ip or cfg.get("ip"))

    ip = tv_ip(args)
    if args.cmd == "info":
        print(json.dumps(device_info(ip), indent=2))
    elif args.cmd == "pair":
        Remote(ip).close()
    elif args.cmd == "backup":
        backup(ip)
    elif args.cmd == "apps":
        remote = Remote(ip)
        try:
            for app in sorted(remote.apps(), key=lambda a: a.get("name", "")):
                print(f"{app.get('appId'):<28} {app.get('name')}")
        finally:
            remote.close()
    elif args.cmd == "key":
        remote = Remote(ip)
        try:
            for key in args.keys:
                remote.key(key if key.startswith("KEY_") else "KEY_" + key.upper())
        finally:
            remote.close()
    elif args.cmd == "launch":
        remote = Remote(ip)
        try:
            remote.launch(args.app_id)
            time.sleep(2)
        finally:
            remote.close()
    elif args.cmd == "close":
        http("DELETE", f"http://{ip}:8001/api/v2/applications/{args.app_id}")
    elif args.cmd == "remote":
        interactive(ip)
    elif args.cmd == "youtube":
        play_youtube(ip, " ".join(args.video), auto=args.auto,
                     pick_profile=args.pick_profile)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
