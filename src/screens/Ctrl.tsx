import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Win98Window, WinButton, WELL, WIN_GREY } from '../components/Win98';
import { formatDub, type Crew, type Dub, type Profile, type Service } from '../data';
import { SERVICE_NAMES } from '../lib/services';
import { SKINS, SKIN_ORDER, type Skin, type SkinKey } from '../theme/skins';

// CTRL · Windows 98 control panel on a green-hill desktop (spec §6.6).
// Tap an applet to select it, tap again (or double-click) to open it.

export const CTRL_SCREEN = '#5b9bd5';

type Applet = 'skin' | 'profile' | 'chnls' | 'notif' | 'about' | 'signout';

interface Props {
  skin: Skin;
  profile: Profile;
  email: string | null;
  crews: Crew[];
  service: Service;
  onSkin: (k: SkinKey) => void;
  onService: (s: Service) => void;
  onMintDub: (crewId: string) => Promise<Dub>;
  onShareDub: (crew: Crew, dub: Dub) => void;
  onLeave: (crewId: string) => Promise<void>;
  onStartCrew: () => void;
  onEnterDub: () => void;
  onSignOut: () => void;
  onOpenCase: () => void;
  onOpenWire: () => void;
}

const APPLETS: { k: Applet; label: string }[] = [
  { k: 'skin', label: 'Skin' }, { k: 'profile', label: 'Profile & Account' }, { k: 'chnls', label: 'Your CHNLs' },
  { k: 'notif', label: 'Notifications' }, { k: 'about', label: 'About kybr' }, { k: 'signout', label: 'Sign Out' },
];

const TITLES: Record<Applet, string> = {
  skin: 'Display Properties — Skins', profile: 'Profile & Account', chnls: 'Your CHNLs',
  notif: 'Notifications', about: 'About kybr', signout: 'Sign Out',
};

export function Ctrl(props: Props) {
  const { skin } = props;
  const [sel, setSel] = useState<Applet>('skin');
  const [open, setOpen] = useState<Applet | null>(null);
  const clock = useClock();

  const tap = (k: Applet) => (sel === k ? setOpen(k) : setSel(k));

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', background: 'linear-gradient(180deg,#2e6fc0 0%,#4f93d6 26%,#86bfe9 50%,#bfe0c0 66%,#a9d27e 70%)' }}>
        <Desktop />

        {/* desktop icons */}
        <div style={{ position: 'absolute', top: 'var(--safe-top)', left: 12, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 2 }}>
          <DesktopIcon label="My Burns" onClick={props.onOpenWire} icon={<MiniDisc size={30} />} />
          <DesktopIcon label="kept" onClick={props.onOpenCase} icon={<span style={{ width: 28, height: 24, borderRadius: '3px 3px 4px 4px', background: 'linear-gradient(180deg,#ffe39a,#e8b84e)', boxShadow: '0 1px 3px rgba(0,0,0,.4)', borderTop: '5px solid #ffcf6a' }} />} />
        </div>

        {/* control panel */}
        <Win98Window title="kybr control panel" skin={skin} menu style={{ position: 'absolute', top: 'var(--safe-top)', left: 82, right: 10, zIndex: 5 }}>
          <div style={{ ...WELL, margin: 5, padding: '10px 6px' }}>
            <div role="listbox" aria-label="applets" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 4px' }}>
              {APPLETS.map(({ k, label }) => {
                const on = sel === k;
                return (
                  <button key={k} type="button" role="option" aria-selected={on} onClick={() => tap(k)} onDoubleClick={() => setOpen(k)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48, padding: '5px 2px', cursor: 'pointer',
                    border: 0, outline: on ? '1px dotted #555' : 'none', background: on ? 'rgba(10,31,140,.1)' : 'transparent',
                  }}>
                    <AppletIcon k={k} />
                    <span style={{ fontSize: 8, color: k === 'signout' ? '#c0392b' : on ? '#0a1f8c' : '#000', textAlign: 'center', lineHeight: 1.1 }}>{label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, borderTop: '1px solid #d0d0d0', paddingTop: 5, fontSize: 7.5, color: '#444' }}>6 applets · tap twice to open one.</div>
          </div>
        </Win98Window>

        {open && (
          <div className="kybr-scroll" style={{ position: 'absolute', left: 14, right: 14, bottom: 10, top: 'calc(var(--safe-top) + 150px)', zIndex: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflowY: 'auto', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto', animation: 'kybrRise .2s ease both' }}>
              <Dialog applet={open} {...props} onClose={() => setOpen(null)} />
            </div>
          </div>
        )}
      </div>

      {/* taskbar */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 5px', background: WIN_GREY, borderTop: '2px outset #dedede', zIndex: 25 }}>
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 5px', background: WIN_GREY, border: '2px outset #dedede' }}>
          <span style={{ display: 'grid', gridTemplateColumns: '5px 5px', gridTemplateRows: '5px 5px', gap: 1 }}>
            <span style={{ background: '#C084FF' }} /><span style={{ background: '#FF8A3D' }} /><span style={{ background: '#6FD3E8' }} /><span style={{ background: '#C6F24E' }} />
          </span>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 9, color: '#11131a' }}>kybr</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: '#b4b0a8', border: '2px inset #dedede', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,.25)' }}>
          <span style={{ width: 11, height: 11, borderRadius: 2, background: `linear-gradient(135deg,${skin.c},${skin.hi})`, flex: 'none' }} />
          <span style={{ fontSize: 8.5, color: '#11131a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{open ? TITLES[open] : 'kybr control panel'}</span>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px', background: WIN_GREY, border: '2px inset #dedede' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: `radial-gradient(circle at 40% 35%,${skin.lo},${skin.c})`, boxShadow: `0 0 5px ${skin.c}` }} />
          <span style={{ fontSize: 8.5, color: '#11131a' }}>{clock}</span>
        </div>
      </div>
    </div>
  );
}

// ---- dialogs -----------------------------------------------------------------

function Dialog({ applet, onClose, ...p }: Props & { applet: Applet; onClose: () => void }) {
  switch (applet) {
    case 'skin': return <SkinDialog skin={p.skin} onApply={p.onSkin} onClose={onClose} />;
    case 'profile': return <ProfileDialog {...p} onClose={onClose} />;
    case 'chnls': return <ChnlsDialog {...p} onClose={onClose} />;
    case 'notif':
      return <MessageBox skin={p.skin} title={TITLES.notif} icon="i" onClose={onClose}>kybr doesn't send notifications yet. new burns land on WIRE, still warm.</MessageBox>;
    case 'about':
      return (
        <MessageBox skin={p.skin} title={TITLES.about} icon="k" onClose={onClose}>
          <b>kybr</b> · phase 1<br />a cd-r you left on someone's desk.<br />no feed, no counts, no algorithm. just your crews.
        </MessageBox>
      );
    case 'signout':
      return (
        <MessageBox skin={p.skin} title={TITLES.signout} icon="?" onClose={onClose} actions={<><WinButton primary onClick={p.onSignOut}>Yes</WinButton><WinButton onClick={onClose}>No</WinButton></>}>
          sign out of kybr on this device?
        </MessageBox>
      );
  }
}

function SkinDialog({ skin, onApply, onClose }: { skin: Skin; onApply: (k: SkinKey) => void; onClose: () => void }) {
  const [pend, setPend] = useState<SkinKey>(skin.key);
  const dirty = pend !== skin.key;
  return (
    <Win98Window title={TITLES.skin} skin={skin} onClose={onClose}>
      <div style={{ padding: '9px 9px 8px' }}>
        <div style={{ fontSize: 8, marginBottom: 7 }}>Choose a skin for kybr. Preview:</div>
        <div role="radiogroup" aria-label="skins" style={{ ...WELL, padding: '6px 4px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
          {SKIN_ORDER.map((k) => {
            const t = SKINS[k], on = k === pend;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setPend(k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56, padding: '4px 0', background: 'none', border: 0, cursor: 'pointer' }}>
                <span style={{ width: 32, height: 34, borderRadius: 3, background: `linear-gradient(150deg,${t.lo},${t.c} 55%,${t.hi})`, boxShadow: on ? '0 0 0 2px #0a1f8c,inset 0 1px 2px rgba(255,255,255,.6)' : 'inset 0 1px 2px rgba(255,255,255,.5)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 7.5, color: '#000' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid #555', background: on ? 'radial-gradient(circle,#0a1f8c 0 45%,#fff 50%)' : '#fff' }} />{t.name}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 7.5, marginTop: 8 }}>Current: <b style={{ color: SKINS[pend].hi }}>{SKINS[pend].name}</b> · "{SKINS[pend].q}"</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, marginTop: 8 }}>
          <WinButton primary onClick={() => { onApply(pend); onClose(); }}>OK</WinButton>
          <WinButton onClick={onClose}>Cancel</WinButton>
          <WinButton disabled={!dirty} onClick={() => onApply(pend)}>Apply</WinButton>
        </div>
      </div>
    </Win98Window>
  );
}

function ProfileDialog({ skin, profile, email, service, onService, onClose }: Props & { onClose: () => void }) {
  const [pend, setPend] = useState<Service>(service);
  return (
    <Win98Window title={TITLES.profile} skin={skin} onClose={onClose}>
      <div style={{ padding: '9px 9px 8px', fontSize: 8.5 }}>
        <Field label="Name">{profile.displayName}</Field>
        <Field label="Handle">@{profile.handle}</Field>
        {email && <Field label="Email">{email}</Field>}
        <fieldset style={{ margin: '8px 0 0', padding: '4px 8px 6px', border: '2px groove #dedede' }}>
          <legend style={{ fontSize: 8, padding: '0 3px' }}>Open songs in</legend>
          {(['apple', 'spotify', 'youtube', 'link'] as Service[]).map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 30, cursor: 'pointer' }}>
              <input type="radio" name="service" checked={pend === s} onChange={() => setPend(s)} style={{ margin: 0, accentColor: '#0a1f8c' }} />
              {s === 'link' ? 'no preference (song.link shows every service)' : SERVICE_NAMES[s]}
            </label>
          ))}
        </fieldset>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, marginTop: 8 }}>
          <WinButton primary onClick={() => { onService(pend); onClose(); }}>OK</WinButton>
          <WinButton onClick={onClose}>Cancel</WinButton>
        </div>
      </div>
    </Win98Window>
  );
}

function ChnlsDialog({ skin, crews, onMintDub, onShareDub, onLeave, onStartCrew, onEnterDub, onClose }: Props & { onClose: () => void }) {
  const [pick, setPick] = useState(crews[0]?.id ?? '');
  const [msg, setMsg] = useState<null | { kind: 'dub'; crew: Crew; dub: Dub } | { kind: 'leave'; crew: Crew } | { kind: 'error'; text: string }>(null);
  const [busy, setBusy] = useState(false);
  const crew = crews.find((c) => c.id === pick);

  if (msg?.kind === 'dub') {
    return (
      <MessageBox skin={skin} title="New DUB" icon="i" onClose={() => setMsg(null)} actions={<><WinButton primary onClick={() => onShareDub(msg.crew, msg.dub)}>Share…</WinButton><WinButton onClick={() => setMsg(null)}>OK</WinButton></>}>
        a dub for <b>{msg.crew.name}</b>:<br />
        <span style={{ display: 'inline-block', margin: '6px 0', fontFamily: "'Michroma',sans-serif", fontSize: 16, letterSpacing: 3 }}>{formatDub(msg.dub.code)}</span><br />
        good for one friend. runs out in 7 days.
      </MessageBox>
    );
  }
  if (msg?.kind === 'leave') {
    return (
      <MessageBox skin={skin} title="Leave crew" icon="!" onClose={() => setMsg(null)} actions={<>
        <WinButton primary disabled={busy} onClick={async () => { setBusy(true); try { await onLeave(msg.crew.id); setMsg(null); setPick(''); } finally { setBusy(false); } }}>Yes</WinButton>
        <WinButton onClick={() => setMsg(null)}>No</WinButton>
      </>}>
        leave <b>{msg.crew.name}</b>? you'll stop seeing its burns, and songs you kept from it leave your case. someone will need to dub you back in.
      </MessageBox>
    );
  }
  if (msg?.kind === 'error') {
    return <MessageBox skin={skin} title="kybr" icon="!" onClose={() => setMsg(null)}>{msg.text}</MessageBox>;
  }

  return (
    <Win98Window title={TITLES.chnls} skin={skin} onClose={onClose}>
      <div style={{ padding: '9px 9px 8px', fontSize: 8.5 }}>
        <div role="listbox" aria-label="your crews" style={{ ...WELL, maxHeight: 132, overflowY: 'auto' }}>
          {crews.map((c) => (
            <div key={c.id} role="option" aria-selected={c.id === pick} onClick={() => setPick(c.id)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 30, padding: '0 6px', cursor: 'pointer',
              background: c.id === pick ? '#0a1f8c' : 'transparent', color: c.id === pick ? '#fff' : '#000',
            }}>
              <span>{c.name}</span><span>{c.freq}fm</span>
            </div>
          ))}
          {!crews.length && <div style={{ padding: 6, color: '#555' }}>no crews yet.</div>}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          <WinButton disabled={!crew || busy} onClick={async () => {
            if (!crew) return;
            setBusy(true);
            try { setMsg({ kind: 'dub', crew, dub: await onMintDub(crew.id) }); } catch { setMsg({ kind: 'error', text: "couldn't make a dub. try again." }); } finally { setBusy(false); }
          }}>New DUB…</WinButton>
          <WinButton disabled={!crew} onClick={() => crew && setMsg({ kind: 'leave', crew })}>Leave…</WinButton>
        </div>
        <div style={{ borderTop: '1px solid #9a9a9a', margin: '9px 0 0', paddingTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <WinButton onClick={onStartCrew}>Start a crew…</WinButton>
          <WinButton onClick={onEnterDub}>Enter a DUB…</WinButton>
          <WinButton primary onClick={onClose} style={{ marginLeft: 'auto' }}>OK</WinButton>
        </div>
      </div>
    </Win98Window>
  );
}

function MessageBox({ skin, title, icon, children, onClose, actions }: { skin: Skin; title: string; icon: 'i' | '!' | '?' | 'k'; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  const iconBg = icon === '!' ? '#e8b84e' : icon === '?' ? '#1466c8' : icon === 'k' ? 'radial-gradient(circle at 38% 32%,#eef0f4,#9aa0ac)' : '#1466c8';
  return (
    <Win98Window title={title} skin={skin} onClose={onClose}>
      <div role="alertdialog" aria-label={title} style={{ padding: '12px 10px 9px', fontSize: 8.5, lineHeight: 1.5 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span aria-hidden="true" style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: iconBg, color: icon === 'k' ? '#2a2433' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: icon === 'k' ? "'Michroma',sans-serif" : 'serif', fontWeight: 700, fontSize: 13 }}>{icon}</span>
          <div style={{ flex: 1 }}>{children}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>{actions ?? <WinButton primary onClick={onClose}>OK</WinButton>}</div>
      </div>
    </Win98Window>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22 }}>
      <span style={{ width: 46, flex: 'none' }}>{label}:</span>
      <span style={{ ...WELL, flex: 1, minWidth: 0, padding: '2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </div>
  );
}

// ---- desktop ------------------------------------------------------------------

function Desktop() {
  const cloud = (s: CSSProperties) => ({ position: 'absolute' as const, borderRadius: '50%', filter: 'blur(1px)', ...s });
  return (
    <div aria-hidden="true">
      <div style={cloud({ top: 48, left: -14, width: 120, height: 34, background: 'radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.92),rgba(255,255,255,0) 70%)', animation: 'kybrCloud 9s ease-in-out infinite alternate' })} />
      <div style={cloud({ top: 84, right: -10, width: 96, height: 26, background: 'radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.8),rgba(255,255,255,0) 70%)', animation: 'kybrCloud 12s ease-in-out infinite alternate' })} />
      <div style={cloud({ top: 130, left: 60, width: 70, height: 20, background: 'radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.7),rgba(255,255,255,0) 70%)' })} />
      <div style={{ position: 'absolute', left: '-6%', right: '-6%', bottom: -2, height: '42%', background: 'linear-gradient(180deg,#a7d06a 0%,#7cb342 22%,#5f9e30 55%,#4e8c28 100%)', borderRadius: '54% 46% 0 0 / 60px 38px 0 0', boxShadow: 'inset 0 5px 0 rgba(255,255,255,.18)' }} />
      <div style={{ position: 'absolute', left: '-10%', right: '30%', bottom: -2, height: '30%', background: 'linear-gradient(180deg,#9ac95e,#6aa636)', borderRadius: '50% 50% 0 0 / 44px 30px 0 0', opacity: .85 }} />
    </div>
  );
}

function DesktopIcon({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 60, padding: '6px 0', background: 'none', border: 0, cursor: 'pointer' }}>
      {icon}
      <span style={{ fontSize: 7.5, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.7)', textAlign: 'center', lineHeight: 1.1 }}>{label}</span>
    </button>
  );
}

function MiniDisc({ size }: { size: number }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, borderRadius: '50%', overflow: 'hidden', clipPath: 'circle(50%)', background: 'radial-gradient(circle,#2a1f3a,#46326b 46%,#211633 76%)', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
      <span style={{ position: 'absolute', inset: '-14%', borderRadius: '50%', animation: 'kybrSpin 9s linear infinite', background: 'conic-gradient(from 0deg,#c9a6ff,#8fd9ff,#ffb3e6,#ffe6a8,#a8ffd1,#c9a6ff)', mixBlendMode: 'screen', opacity: .6 }} />
    </span>
  );
}

function AppletIcon({ k }: { k: Applet }) {
  const box: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 26 };
  switch (k) {
    case 'skin': return <span style={box}><span style={{ width: 11, height: 11, borderRadius: '50%', background: '#C084FF', boxShadow: '9px 0 0 -2px #FF8A3D,16px 0 0 -3px #6FD3E8,-9px 3px 0 -2px #C6F24E,-3px -7px 0 -3px #FF4D3D' }} /></span>;
    case 'profile': return <span style={box}><MiniDisc size={26} /></span>;
    case 'chnls': return <span style={box}><span style={{ width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#e7c8ff,#9a5cf0)', boxShadow: '8px 2px 0 -1px #3c96d2,4px 8px 0 -2px #78c83c', border: '1px solid #fff' }} /></span>;
    case 'notif': return <span style={box}><span style={{ width: 14, height: 13, borderRadius: '8px 8px 4px 4px', background: 'linear-gradient(180deg,#ffe08a,#d99a2a)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)', borderBottom: '2px solid #b97e1c' }} /><span style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: '50%', background: '#b97e1c' }} /></span>;
    case 'about': return <span style={box}><span style={{ width: 22, height: 22, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%,#eef0f4,#9aa0ac)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Michroma',sans-serif", fontSize: 9, color: '#2a2433' }}>k</span></span>;
    case 'signout': return <span style={box}><span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #c0392b' }} /><span style={{ position: 'absolute', width: 2, height: 9, background: '#c0392b', top: 3, borderRadius: 1 }} /></span>;
  }
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}
