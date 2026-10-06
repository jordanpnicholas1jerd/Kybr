import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode, type Ref } from 'react';
import { ChromeText } from '../components/Chrome';
import { DeviceFrame } from '../components/DeviceFrame';
import { SevenSeg } from '../components/SevenSeg';
import {
  CREW_NAME_RE, DubError, HANDLE_RE, HandleTakenError, formatDub, normalizeDub,
  type Crew, type Dub, type DubFailure, type KybrApi, type Profile,
} from '../data';
import type { Skin } from '../theme/skins';

// First run. Device: a Y2K digital answering machine (spec §6 candidates).
// It's the whole way in: sign in (leave your email), record your greeting
// (name + handle), then 0 NEW MESSAGES with START A CREW / ENTER A DUB.

export type MachineStage = 'signin' | 'greeting' | 'messages';

type Step =
  | { k: 'signin' }
  | { k: 'sent'; email: string }
  | { k: 'greeting' }
  | { k: 'idle' }
  | { k: 'naming' }
  | { k: 'started'; crew: Crew; dub: Dub }
  | { k: 'dubbing' }
  | { k: 'joined'; crew: Crew };

interface Props {
  api: KybrApi;
  skin: Skin;
  stage: MachineStage;
  onProfile: (p: Profile) => void;
  /** a crew was started or joined: the app can open the tabs */
  onCrew: (c: Crew) => void;
  /** GO TO WIRE */
  onDone: () => void;
  demoHint?: ReactNode;
}

const DUB_COPY: Record<DubFailure, string> = {
  unknown: "that dub doesn't ring a bell.",
  used: "that dub's been used. ask for a fresh one.",
  expired: 'that dub ran out. ask for a fresh one.',
  full: "that crew's full. 8 is the limit.",
};

const first = (s: MachineStage): Step => ({ k: s === 'signin' ? 'signin' : s === 'greeting' ? 'greeting' : 'idle' });

export function AnsweringMachine({ api, skin, stage, onProfile, onCrew, onDone, demoHint }: Props) {
  const [step, setStep] = useState<Step>(() => first(stage));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [crewName, setCrewName] = useState('');
  const [dubCode, setDubCode] = useState('');
  const field = useRef<HTMLInputElement>(null);

  // The app moves us along when sign-in or the greeting lands elsewhere.
  useEffect(() => { setStep(first(stage)); setErr(''); }, [stage]);
  useEffect(() => { field.current?.focus({ preventScroll: true }); }, [step.k]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (s: Step) => { setErr(''); setStep(s); };

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      if (e instanceof DubError) setErr(DUB_COPY[e.reason]);
      else if (e instanceof HandleTakenError) setErr("that handle's taken. try another.");
      else setErr('the line went dead. try again.');
    } finally {
      setBusy(false);
    }
  }

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const greetingOk = name.trim().length > 0 && name.trim().length <= 40 && HANDLE_RE.test(handle);
  const crewOk = CREW_NAME_RE.test(crewName.trim().toLowerCase());
  const dubOk = normalizeDub(dubCode).length === 6;

  async function share(crew: Crew, dub: Dub) {
    const text = `you're dubbed into ${crew.name} on KYBR. dub: ${formatDub(dub.code)}`;
    const url = window.location.origin;
    try {
      if (navigator.share) { await navigator.share({ title: 'KYBR', text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setToast('COPIED · PASTE IT TO A FRIEND');
    } catch {
      // share sheet dismissed
    }
  }

  // ---- per-step content -------------------------------------------------
  let headline = '';
  let sub = '';
  let count = '0';
  let ledOn = false;
  let lcd: ReactNode = null;
  let keys: KeyDef[] = [];
  let extra: KeyDef | null = null;
  let onSubmit: (() => void) | null = null;

  switch (step.k) {
    case 'signin':
      headline = "who's this?";
      sub = "kybr signs you in with a link, no password. it's for you and your people, that's all.";
      count = '-';
      lcd = (<>
        <LcdTitle>LEAVE YOUR EMAIL</LcdTitle>
        <LcdLine>after the tone.</LcdLine>
        <LcdInput ref={field} label="your email" type="email" autoComplete="email" inputMode="email"
          value={email} onChange={setEmail} placeholder="you@somewhere" />
      </>);
      onSubmit = () => emailOk && run(async () => {
        await api.sendMagicLink(email.trim());
        go({ k: 'sent', email: email.trim() });
      });
      keys = [{ label: '● SEND THE LINK', primary: true, disabled: !emailOk, submit: true }];
      break;

    case 'sent':
      headline = 'check your mail.';
      sub = 'open the link on this phone and the machine picks up where you left off.';
      count = '-';
      lcd = (<>
        <LcdTitle>LINK SENT</LcdTitle>
        <LcdLine>to {step.email}</LcdLine>
        <LcdLine dim>the link signs you in. it works once.</LcdLine>
      </>);
      keys = [
        { label: '◂ OTHER EMAIL', onClick: () => go({ k: 'signin' }) },
        { label: '↻ SEND AGAIN', onClick: () => run(async () => { await api.sendMagicLink(step.email); setToast('SENT AGAIN'); }) },
      ];
      break;

    case 'greeting':
      headline = 'say who you are.';
      sub = 'your name is what your crews see. your handle is how anyone finds your deck from a review.';
      count = '-';
      lcd = (<>
        <LcdTitle>RECORD YOUR GREETING</LcdTitle>
        <LcdInput ref={field} label="your name" autoComplete="nickname" value={name} onChange={setName}
          placeholder="what your friends call you" maxLength={40} />
        <LcdInput label="your handle" prefix="@" autoComplete="username" value={handle}
          onChange={(v) => setHandle(v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
          placeholder="lowercase, 3 to 20" />
      </>);
      onSubmit = () => greetingOk && run(async () => {
        const p = await api.createProfile(handle, name.trim());
        onProfile(p);
      });
      keys = [{ label: '● SAVE THE GREETING', primary: true, disabled: !greetingOk, submit: true }];
      break;

    case 'idle':
      headline = "nobody's called yet.";
      sub = 'start a crew and dub your people in, or punch in the dub a friend gave you.';
      lcd = (<>
        <LcdTitle big>0 NEW MESSAGES</LcdTitle>
        <LcdLine>no crew on the line yet.</LcdLine>
      </>);
      keys = [
        { label: 'START A CREW', primary: true, onClick: () => go({ k: 'naming' }) },
        { label: 'ENTER A DUB', onClick: () => go({ k: 'dubbing' }) },
      ];
      break;

    case 'naming':
      headline = 'name your crew.';
      sub = 'a crew is up to 8 people. everything burned to it stays in it.';
      lcd = (<>
        <LcdTitle>NAME YOUR CREW</LcdTitle>
        <LcdInput ref={field} label="crew name" value={crewName}
          onChange={(v) => setCrewName(v.toLowerCase().slice(0, 24))} placeholder="basement, family, roadtrip…" />
        <LcdLine dim>private · up to 8 people</LcdLine>
      </>);
      onSubmit = () => crewOk && run(async () => {
        const { crew, dub } = await api.createCrew(crewName);
        onCrew(crew);
        go({ k: 'started', crew, dub });
      });
      keys = [
        { label: '◂ BACK', onClick: () => go({ k: 'idle' }) },
        { label: '● START IT', primary: true, disabled: !crewOk, submit: true },
      ];
      break;

    case 'started':
      headline = "you're on the air.";
      sub = 'send the dub to one friend. each dub lets one person in, so make one per friend.';
      lcd = (<>
        <LcdTitle>ON THE LINE</LcdTitle>
        <LcdLine>{step.crew.name} · {step.crew.freq}fm</LcdLine>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 2px' }}>
          <span style={{ fontSize: 8, letterSpacing: 2, color: 'rgba(168,255,207,.6)' }}>DUB</span>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 24, letterSpacing: 4, color: '#c9ffe2', textShadow: '0 0 8px rgba(124,255,176,.55)' }}
            aria-label={`dub code ${step.dub.code.split('').join(' ')}`}>{formatDub(step.dub.code)}</span>
        </div>
        <LcdLine dim>good for one friend · runs out in 7 days</LcdLine>
      </>);
      keys = [
        { label: '↗ SHARE THE DUB', primary: true, onClick: () => share(step.crew, step.dub) },
        { label: 'GO TO WIRE ▸', onClick: onDone },
      ];
      extra = {
        label: '＋ ANOTHER DUB',
        onClick: () => run(async () => {
          const dub = await api.mintDub(step.crew.id);
          setStep({ ...step, dub });
          setToast('NEW DUB · THE OLD ONE STILL WORKS');
        }),
      };
      break;

    case 'dubbing':
      headline = 'got a dub?';
      sub = 'the six-character code a friend sent you. one dub, one person.';
      lcd = (<>
        <LcdTitle>ENTER A DUB</LcdTitle>
        <LcdInput ref={field} label="dub code" big value={formatDub(dubCode)} autoComplete="off" autoCapitalize="characters"
          onChange={(v) => setDubCode(normalizeDub(v).slice(0, 6))} placeholder="XXX·XXX" />
      </>);
      onSubmit = () => dubOk && run(async () => {
        const crew = await api.redeemDub(dubCode);
        onCrew(crew);
        go({ k: 'joined', crew });
      });
      keys = [
        { label: '◂ BACK', onClick: () => go({ k: 'idle' }) },
        { label: '▶ PLAY IT', primary: true, disabled: !dubOk, submit: true },
      ];
      break;

    case 'joined':
      headline = "you've got a message.";
      sub = "your crew's songs land on wire. the newest are on top, still warm.";
      count = '1';
      ledOn = true;
      lcd = (<>
        <LcdTitle big>1 NEW MESSAGE</LcdTitle>
        <LcdLine>you're in {step.crew.name} · {step.crew.freq}fm</LcdLine>
      </>);
      keys = [{ label: 'GO TO WIRE ▸', primary: true, onClick: onDone }];
      break;
  }

  if (busy) count = '-';

  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit?.(); };

  return (
    <DeviceFrame skin={skin} screenBg={SCREEN_BG}>
      <main style={{
        flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        padding: 'calc(var(--safe-top) + 8px) 16px calc(var(--safe-bottom) + 14px)',
      }}>
        {/* headline */}
        <div style={{ padding: '6px 8px 0', minHeight: 92 }}>
          <h1 style={{ margin: 0, fontFamily: "'DM Mono',monospace", fontWeight: 500, fontSize: 21, letterSpacing: -.2, color: '#f3ecff' }}>{headline}</h1>
          <p style={{ margin: '7px 0 0', fontSize: 11, lineHeight: 1.55, color: 'rgba(233,228,240,.72)', maxWidth: 320 }}>{sub}</p>
        </div>

        {/* the machine */}
        <form onSubmit={submit} style={{ margin: 'auto 0', padding: '10px 0' }} noValidate>
          <div style={BODY}>
            {/* top plate */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <ChromeText style={{ fontSize: 14, letterSpacing: 3 }}>KYBR</ChromeText>
                <span style={MICRO}>DIGITAL ANSWERING SYSTEM</span>
              </div>
              <span style={{ ...MICRO, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: ledOn ? 'radial-gradient(circle at 40% 35%,#ffc2bd,#ff3b30 70%)' : 'radial-gradient(circle at 40% 35%,#6a3a3a,#3a1c1f)',
                  boxShadow: ledOn ? '0 0 8px #ff3b30' : 'inset 0 1px 1px rgba(0,0,0,.6)',
                  animation: ledOn ? 'kybrBlink 1s steps(1) infinite' : undefined,
                }} />
                MSG
              </span>
            </div>

            {/* speaker + counter */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              <div style={GRILLE_WELL} aria-hidden="true">
                <div style={GRILLE} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={COUNTER} aria-live="polite" aria-label={`${count === '-' ? 'no' : count} new messages`}>
                  <span style={{ ...MICRO, color: 'rgba(255,120,110,.55)', alignSelf: 'flex-start' }}>MESSAGES</span>
                  <SevenSeg char={count} height={58} />
                </div>
                {/* outgoing-message tape */}
                <div style={TAPE_WINDOW} aria-hidden="true">
                  <Reel spinning={busy} />
                  <div style={{ flex: 1, height: 10, margin: '0 6px', borderRadius: 2, background: 'linear-gradient(180deg,#3a2a22,#1e1612)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.7)' }} />
                  <Reel spinning={busy} />
                  <span style={{ position: 'absolute', left: 0, right: 0, bottom: 3, textAlign: 'center', ...MICRO, fontSize: 6 }}>OGM · GREETING</span>
                </div>
              </div>
            </div>

            {/* LCD */}
            <div style={LCD} role="group" aria-label="display">
              <div style={SCANLINES} aria-hidden="true" />
              <div style={{ position: 'relative' }}>
                {busy ? <><LcdTitle>PLEASE HOLD…</LcdTitle><LcdLine dim>connecting the line</LcdLine></> : lcd}
                {err && !busy && <div role="alert" style={{ marginTop: 6, fontSize: 10, color: '#ffb3a8', textShadow: '0 0 6px rgba(255,90,70,.45)' }}>✕ {err}</div>}
                {toast && !busy && !err && <div role="status" style={{ marginTop: 6, fontSize: 9, letterSpacing: 1.5, color: '#7CFFB0' }}>✓ {toast}</div>}
              </div>
            </div>

            {/* the two keys */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {keys.map((k) => <MachineKey key={k.label} def={k} skin={skin} busy={busy} />)}
            </div>
            {extra && (
              <button type="button" onClick={extra.onClick} disabled={busy} style={EXTRA_KEY}>{extra.label}</button>
            )}

            {/* decorative transport row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 14, padding: '0 2px' }} aria-hidden="true">
              {['◀◀', '▶', '▶▶', '■', 'ANNC', 'DEL'].map((l) => (
                <span key={l} style={MINI_KEY}>{l}</span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }} aria-hidden="true">
              <span style={MICRO}>KY·AM01</span>
              <span style={MICRO}>VOL ▸▸▸▹▹</span>
            </div>
          </div>
        </form>

        {demoHint && <div style={{ paddingTop: 6, textAlign: 'center', fontSize: 9, lineHeight: 1.6, color: 'rgba(233,228,240,.55)' }}>{demoHint}</div>}
      </main>
    </DeviceFrame>
  );
}

// ---- parts ----------------------------------------------------------------

interface KeyDef {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  submit?: boolean;
  onClick?: () => void;
}

function MachineKey({ def, skin, busy }: { def: KeyDef; skin: Skin; busy: boolean }) {
  const disabled = def.disabled || busy;
  const lit = def.primary && !disabled;
  return (
    <button
      type={def.submit ? 'submit' : 'button'}
      onClick={def.submit ? undefined : def.onClick}
      disabled={disabled}
      className="kybr-machine-key"
      style={{
        flex: 1, minHeight: 58, padding: '10px 6px 9px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
        background: 'linear-gradient(180deg,#e9e7ee 0%,#c9c6d1 48%,#aeabb8 52%,#d2d0d9 100%)',
        border: '1px solid rgba(255,255,255,.5)',
        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.9),inset 0 -3px 4px rgba(0,0,0,.25),0 4px 0 #2a2730,0 6px 10px rgba(0,0,0,.45)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{
        width: 22, height: 4, borderRadius: 2,
        background: lit ? `linear-gradient(180deg,${skin.lo},${skin.c})` : 'linear-gradient(180deg,#8c8a94,#5f5d68)',
        boxShadow: lit ? `0 0 8px ${skin.c}` : 'inset 0 1px 1px rgba(0,0,0,.4)',
      }} />
      <span style={{ fontSize: 10, letterSpacing: 1.6, fontWeight: 500, color: '#2a2433', textShadow: '0 1px 0 rgba(255,255,255,.6)' }}>{def.label}</span>
    </button>
  );
}

function Reel({ spinning }: { spinning: boolean }) {
  return (
    <span style={{
      position: 'relative', width: 22, height: 22, borderRadius: '50%', flex: 'none',
      background: 'radial-gradient(circle,#1a1418 0 22%,#e8e2d6 24% 34%,#3a2a22 36% 100%)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
      animation: spinning ? 'kybrSpin 1.1s linear infinite' : undefined,
    }}>
      {[0, 60, 120].map((d) => (
        <span key={d} style={{ position: 'absolute', left: '50%', top: '50%', width: 2, height: 9, marginLeft: -1, marginTop: -4.5, background: '#e8e2d6', transform: `rotate(${d}deg)` }} />
      ))}
    </span>
  );
}

function LcdTitle({ children, big }: { children: ReactNode; big?: boolean }) {
  return (
    <div style={{
      fontFamily: "'Michroma',sans-serif", fontSize: big ? 15 : 10, letterSpacing: big ? 2 : 1.6,
      color: '#c9ffe2', textShadow: '0 0 7px rgba(124,255,176,.5)', margin: '0 0 6px',
    }}>{children}</div>
  );
}

function LcdLine({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <div style={{ fontSize: 10.5, lineHeight: 1.5, color: dim ? 'rgba(168,255,207,.62)' : '#a8ffcf' }}>{children}</div>;
}

interface LcdInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  big?: boolean;
  type?: string;
  inputMode?: 'email' | 'text';
  autoComplete?: string;
  autoCapitalize?: string;
  maxLength?: number;
  ref?: Ref<HTMLInputElement>;
}

function LcdInput({ label, value, onChange, placeholder, prefix, big, ref, ...rest }: LcdInputProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 44, borderBottom: '1px dashed rgba(168,255,207,.35)' }}>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</span>
      {prefix && <span style={{ fontSize: 13, color: 'rgba(168,255,207,.7)' }}>{prefix}</span>}
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        {...rest}
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', padding: '8px 0',
          fontFamily: big ? "'Michroma',sans-serif" : "'DM Mono',monospace",
          fontSize: big ? 22 : 13, letterSpacing: big ? 4 : 0.2,
          color: '#c9ffe2', caretColor: '#7CFFB0', textShadow: '0 0 6px rgba(124,255,176,.4)',
        }}
      />
    </label>
  );
}

// ---- materials ------------------------------------------------------------

const SCREEN_BG = 'radial-gradient(120% 60% at 50% -6%,#2b2236 0%,#1a1622 46%,#120f19 100%)';

const MICRO: CSSProperties = { fontSize: 7, letterSpacing: 1.8, color: 'rgba(225,220,235,.62)' };

// Graphite plastic body with a satin top edge.
const BODY: CSSProperties = {
  position: 'relative', borderRadius: '26px 26px 18px 18px', padding: '14px 14px 14px',
  background: 'linear-gradient(170deg,#4a4654 0%,#34313c 28%,#24222b 70%,#1c1a21 100%)',
  boxShadow: '0 30px 50px -18px rgba(0,0,0,.8),0 2px 0 #0e0d12,inset 0 2px 1px rgba(255,255,255,.22),inset 0 -4px 10px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.05)',
};

const GRILLE_WELL: CSSProperties = {
  width: 112, flex: 'none', borderRadius: 14, padding: 8,
  background: 'linear-gradient(180deg,#1a181f,#25222b)',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,.7),inset 0 -1px 0 rgba(255,255,255,.06)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const GRILLE: CSSProperties = {
  width: 92, height: 92, borderRadius: '50%',
  background: 'radial-gradient(circle,#0b0a0e 0 1.6px,transparent 2px) 0 0/7px 7px,radial-gradient(circle at 40% 30%,#3a3742,#1d1b22 70%)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,.8),0 1px 0 rgba(255,255,255,.08)',
};

const COUNTER: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 8px 10px', borderRadius: 9,
  background: 'linear-gradient(180deg,#140707,#0a0303)',
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,.9),inset 0 0 0 2px #2a2228,0 0 0 2px #55505c',
};

const TAPE_WINDOW: CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center', padding: '6px 12px 12px', borderRadius: 8,
  background: 'linear-gradient(180deg,rgba(40,34,48,.9),rgba(16,14,20,.95))',
  boxShadow: 'inset 0 2px 5px rgba(0,0,0,.75),inset 0 0 0 1px rgba(255,255,255,.06)',
};

const LCD: CSSProperties = {
  position: 'relative', overflow: 'hidden', marginTop: 12, borderRadius: 8, padding: '12px 14px 12px', minHeight: 112,
  background: 'linear-gradient(180deg,#0e2418,#06120c)',
  boxShadow: 'inset 0 2px 9px rgba(0,0,0,.85),inset 0 0 0 2px #2c2e38,0 0 0 3px #5d5966',
};

const SCANLINES: CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: 'repeating-linear-gradient(0deg,rgba(124,255,176,.05) 0 1px,transparent 1px 3px)',
};

const EXTRA_KEY: CSSProperties = {
  display: 'block', width: '100%', minHeight: 44, marginTop: 10, borderRadius: 9, cursor: 'pointer',
  background: 'linear-gradient(180deg,#2a2731,#1f1d25)', border: '1px solid rgba(255,255,255,.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08),0 2px 4px rgba(0,0,0,.4)',
  fontSize: 9, letterSpacing: 1.8, color: 'rgba(233,228,240,.8)',
};

const MINI_KEY: CSSProperties = {
  flex: 1, textAlign: 'center', padding: '5px 0 4px', borderRadius: 5, fontSize: 7, letterSpacing: 1,
  color: 'rgba(225,220,235,.6)', background: 'linear-gradient(180deg,#3a3742,#24222a)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1),0 2px 0 #121116',
};
