import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DarkChromeText } from '../components/Chrome';
import { Disc } from '../components/Disc';
import { HeatCells } from '../components/HeatCells';
import type { Burn as BurnT, Crew, KybrApi, Resolved, Track } from '../data';
import { duration } from '../lib/when';

// BURN · CD burner (spec §6.7): paste → chnl → etch → burning → done.
// A link that can't be read can still be burned: name the song by hand.

type Step = 'paste' | 'chnl' | 'etch' | 'burning' | 'done';

interface Props {
  api: KybrApi;
  crews: Crew[];
  defaultCrewId: string;
  recent: Track[];
  onClose: () => void;
  onBurned: (b: BurnT) => void;
  onSeeWire: () => void;
}

type Lookup =
  | { k: 'idle' }
  | { k: 'reading' }
  | { k: 'got'; track: Track }
  | { k: 'manual'; reason: Exclude<Resolved, { ok: true }>['reason'] };

const MANUAL_COPY: Record<string, string> = {
  not_a_link: "that doesn't look like a song link.",
  not_found: "couldn't find that song. name it and we'll burn the link as is.",
  not_a_song: "that's an album, not a song. paste one song.",
  unavailable: "the link reader's down. name it and we'll burn the link as is.",
};

export function Burn({ api, crews, defaultCrewId, recent, onClose, onBurned, onSeeWire }: Props) {
  const [step, setStep] = useState<Step>('paste');
  const [link, setLink] = useState('');
  const [picked, setPicked] = useState<Track | null>(null);
  const [look, setLook] = useState<Lookup>({ k: 'idle' });
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [crewId, setCrewId] = useState(crews.some((c) => c.id === defaultCrewId) ? defaultCrewId : crews[0]?.id);
  const [heat, setHeat] = useState(0);
  const [note, setNote] = useState('');
  const [prog, setProg] = useState(0);
  const [err, setErr] = useState('');
  const seq = useRef(0);
  const crew = crews.find((c) => c.id === crewId);

  // Read the link a beat after the paste settles.
  useEffect(() => {
    const l = link.trim();
    if (picked) { seq.current++; setLook({ k: 'got', track: picked }); return; }
    if (!l) { setLook({ k: 'idle' }); return; }
    const my = ++seq.current;
    setLook({ k: 'reading' });
    const t = setTimeout(async () => {
      const r = await api.resolveLink(l).catch((): Resolved => ({ ok: false, reason: 'unavailable' }));
      if (my !== seq.current) return;
      setLook(r.ok ? { k: 'got', track: r.track } : { k: 'manual', reason: r.reason });
    }, 450);
    return () => clearTimeout(t);
  }, [link, picked, api]);

  const canManual = look.k === 'manual' && look.reason !== 'not_a_link' && look.reason !== 'not_a_song';
  const manualOk = canManual && title.trim().length > 0 && artist.trim().length > 0;
  const track = look.k === 'got' ? look.track : null;
  const shown = track ?? (manualOk ? { title: title.trim(), artist: artist.trim(), durationMs: null } : null);

  const burnIt = async () => {
    if (!crewId) return;
    setStep('burning');
    setErr('');
    setProg(0);
    let p = 0;
    const tick = setInterval(() => { p = Math.min(90, p + 4); setProg(p); }, 60);
    try {
      const t = track ?? await api.rawTrack(link.trim(), title.trim(), artist.trim());
      const [b] = await Promise.all([
        api.burn({ crewId, trackId: t.id, note: note.trim() || null, heat: heat || null }),
        new Promise((r) => setTimeout(r, 1300)), // let the disc spin a moment
      ]);
      clearInterval(tick);
      setProg(100);
      onBurned(b as BurnT);
      setStep('done');
    } catch {
      clearInterval(tick);
      setErr("the burn failed. nothing was sent. try again.");
      setStep('etch');
    }
  };

  const primary: Record<Step, { label: string; go: () => void; ok: boolean; ember?: boolean }> = {
    paste: { label: 'NEXT ▸ CHNL', go: () => setStep('chnl'), ok: !!shown },
    chnl: { label: 'NEXT ▸ ETCH', go: () => setStep('etch'), ok: !!crewId },
    etch: { label: '● BURN IT', go: burnIt, ok: true, ember: true },
    burning: { label: 'BURNING…', go: () => {}, ok: false },
    done: { label: 'SEE IT ON WIRE', go: onSeeWire, ok: true },
  };
  const secondary: Partial<Record<Step, { label: string; go: () => void }>> = {
    paste: { label: '⏏ EJECT', go: onClose },
    chnl: { label: '◂ BACK', go: () => setStep('paste') },
    etch: { label: '◂ BACK', go: () => setStep('chnl') },
    done: { label: '⏏ EJECT', go: onClose },
  };
  const idx = { paste: 0, chnl: 1, etch: 2, burning: 3, done: 3 }[step];
  const status = step === 'burning' ? 'BUSY' : step === 'done' ? 'DONE' : 'READY';
  const statusDot = step === 'burning' ? '#FF8A3D' : step === 'done' ? '#7CFFB0' : '#FFB45E';
  const pri = primary[step], sec = secondary[step];

  return (
    <div onClick={() => step !== 'burning' && onClose()} style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 4px)', background: 'rgba(8,5,14,.64)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label="burn a song" onClick={(e) => e.stopPropagation()} style={{
        margin: 'auto 14px calc(16px + var(--safe-bottom))', borderRadius: 14, padding: 12,
        background: 'linear-gradient(180deg,#d9dbe1 0%,#bcbec7 42%,#a4a6b0 58%,#cfd1d8 100%)',
        boxShadow: 'inset 0 2px 2px rgba(255,255,255,.85),inset 0 -3px 7px rgba(0,0,0,.32),0 -12px 50px rgba(0,0,0,.5)', animation: 'kybrRise .32s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3px 8px' }}>
          <DarkChromeText style={{ fontSize: 13, letterSpacing: 1 }}>KYBR</DarkChromeText>
          <span style={{ fontSize: 7, letterSpacing: 2, color: '#4d4f59' }}>CD-RW BURNER · KY·BRN01</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 7, letterSpacing: 1, color: '#4d4f59' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot, boxShadow: `0 0 7px ${statusDot}`, animation: 'kybrFlick 1.4s ease-in-out infinite' }} />{status}
          </span>
        </div>

        {/* step LEDs */}
        <ol aria-label="steps" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px 8px', margin: 0, listStyle: 'none' }}>
          {['PASTE', 'CHNL', 'ETCH', 'BURN'].map((l, i) => {
            const done = i < idx || step === 'done', cur = i === idx && step !== 'done';
            return (
              <li key={l} aria-current={cur ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 7, letterSpacing: 1.5, color: i <= idx ? '#2f3139' : '#6f717b' }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: done ? 'radial-gradient(circle at 40% 35%,#c8ffe0,#7CFFB0)' : cur ? 'radial-gradient(circle at 40% 35%,#ffe0b8,#FFB45E)' : 'radial-gradient(circle at 40% 35%,#9a9ca6,#5f616c)',
                  boxShadow: done ? '0 0 7px #7CFFB0' : cur ? '0 0 8px #FF8A3D' : 'inset 0 1px 1px rgba(0,0,0,.45)',
                }} />{l}
              </li>
            );
          })}
        </ol>

        {/* tray */}
        <div style={{ position: 'relative', height: 84, borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(180deg,#2c2d35,#16171d)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.6)' }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 14, right: 14, top: 12, height: 90, borderRadius: 6, background: 'linear-gradient(180deg,#3a3b44,#23242b)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12),0 -3px 10px rgba(0,0,0,.5)' }} />
          {shown && (
            <div style={{ position: 'absolute', left: '50%', top: 22, marginLeft: -70, animation: 'kybrRise .3s ease both' }}>
              <Disc size={140} spin={step === 'burning' ? '.9s' : '9s'} />
            </div>
          )}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 4, zIndex: 2, textAlign: 'center', fontSize: 7, letterSpacing: 1.5, color: 'rgba(255,255,255,.75)', textShadow: '0 1px 2px #000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 10px' }}>
            {shown ? `${shown.title} · ${shown.artist}` : look.k === 'reading' ? 'READING THE DISC…' : 'NO DISC IN TRAY'}
          </div>
        </div>

        {/* LCD */}
        <div style={{ marginTop: 10, borderRadius: 7, padding: '11px 13px 12px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#0a1526,#060c18)', boxShadow: 'inset 0 2px 9px rgba(0,0,0,.85),inset 0 0 0 2px #2c2e38,0 0 0 3px #6b6d77' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,rgba(95,216,255,.05) 0 1px,transparent 1px 3px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            {step === 'paste' && (<>
              <Title>DROP A LINK IN THE TRAY</Title>
              <Label>SONG LINK</Label>
              <input aria-label="song link" value={link} onChange={(e) => { setPicked(null); setLink(e.target.value); }} inputMode="url" autoComplete="off" spellCheck={false} placeholder="paste a song link…" style={INPUT} autoFocus />
              {look.k === 'reading' && <Small>reading the link…</Small>}
              {track && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: '#7CFFC2', fontSize: 10 }}>▸</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#fff' }}>{track.title}</div>
                    <div style={{ fontSize: 8.5, color: 'rgba(159,239,255,.75)', marginTop: 2 }}>{track.artist}</div>
                  </div>
                  <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 9, color: '#7CFFC2' }}>{duration(track.durationMs)}</span>
                </div>
              )}
              {look.k === 'manual' && (
                <>
                  <Small warn>{MANUAL_COPY[look.reason]}</Small>
                  {canManual && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <input aria-label="song title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="song" style={{ ...INPUT, flex: 1, minWidth: 0 }} />
                      <input aria-label="artist" value={artist} maxLength={120} onChange={(e) => setArtist(e.target.value)} placeholder="artist" style={{ ...INPUT, flex: 1, minWidth: 0 }} />
                    </div>
                  )}
                </>
              )}
              {look.k === 'idle' && recent.length > 0 && (<>
                <Label style={{ margin: '11px 0 2px' }}>OR GRAB ONE YOU PLAYED</Label>
                {recent.slice(0, 3).map((t) => (
                  <button key={t.id} type="button" onClick={() => { setPicked(t); setLink(t.links.page ?? t.links.raw ?? Object.values(t.links)[0] ?? ''); }} className="kybr-press" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, border: 0, borderBottom: '1px solid rgba(95,216,255,.1)', background: 'none', fontSize: 10.5, color: '#dffaff', textAlign: 'left', padding: 0,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fd8ff', boxShadow: '0 0 6px #5fd8ff', flex: 'none' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title} · {t.artist}</span>
                  </button>
                ))}
              </>)}
            </>)}

            {step === 'chnl' && (<>
              <Title>WHO'S THIS FOR?</Title>
              <div role="radiogroup" aria-label="crew" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, maxHeight: 200, overflowY: 'auto' }} className="kybr-scroll">
                {crews.map((c, i) => {
                  const on = c.id === crewId;
                  return (
                    <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => setCrewId(c.id)} className="kybr-press" style={{
                      display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0 10px', borderRadius: 8, textAlign: 'left',
                      background: on ? 'rgba(255,111,174,.16)' : 'rgba(255,255,255,.03)', border: `1px solid ${on ? 'rgba(255,111,174,.6)' : 'rgba(95,216,255,.14)'}`,
                    }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', background: on ? 'radial-gradient(circle at 38% 30%,#ffb3d6,#d63d8b)' : 'radial-gradient(circle at 38% 30%,#5a5b64,#2c2d35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 11, color: on ? '#ffd0e6' : 'rgba(223,250,255,.8)' }}>{c.name}</span>
                      <span style={{ fontSize: 8, color: 'rgba(159,239,255,.65)' }}>{c.freq}fm</span>
                    </button>
                  );
                })}
              </div>
              <Small>private · stays in the crew, never public</Small>
            </>)}

            {step === 'etch' && (<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Title>ETCH IT</Title><span style={{ fontSize: 8, color: 'rgba(159,239,255,.65)' }}>optional</span></div>
              <div style={{ marginTop: 6 }}><HeatCells value={heat} onChange={setHeat} /></div>
              <input aria-label="note" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder={`a note for ${crew?.name ?? 'your crew'}…`} style={{ ...INPUT, marginTop: 6 }} />
              <Small>tap a star twice for a half. skip it if the song says enough.</Small>
              {err && <Small warn>{err}</Small>}
            </>)}

            {step === 'burning' && (
              <div style={{ padding: '4px 0 2px' }} role="status">
                <div style={{ fontFamily: "'Michroma',sans-serif", fontSize: 11, letterSpacing: 2, color: '#FFB45E', textShadow: '0 0 8px rgba(255,138,61,.5)' }}>BURNING… {prog}%</div>
                <div style={{ marginTop: 12, height: 8, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog}%`, background: 'linear-gradient(90deg,#d75a2a,#FFB45E)', boxShadow: '0 0 10px #FF8A3D', transition: 'width .1s linear' }} />
                </div>
                <Small>writing to {crew?.name}'s deck…</Small>
              </div>
            )}

            {step === 'done' && (
              <div style={{ padding: '2px 0' }} role="status">
                <div style={{ fontFamily: "'Michroma',sans-serif", fontSize: 11, letterSpacing: 2, color: '#7CFFC2', textShadow: '0 0 8px rgba(124,255,194,.5)' }}>✓ BURNED &amp; SENT</div>
                <div style={{ fontSize: 11, color: '#dffaff', marginTop: 10 }}>delivered to {crew?.name} — still warm.</div>
                <div style={{ fontSize: 9.5, lineHeight: '15px', color: 'rgba(159,239,255,.75)', marginTop: 5 }}>your crew will find it sitting at the top of their stack.</div>
              </div>
            )}
          </div>
        </div>

        {/* keys */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {sec && <button type="button" onClick={sec.go} className="kybr-transport" style={{ ...KEY, flex: 'none', padding: '0 16px', color: '#3b3d46', background: 'linear-gradient(180deg,#eceef2,#c2c4cd)' }}>{sec.label}</button>}
          <button type="button" onClick={pri.go} disabled={!pri.ok} className="kybr-transport" style={{
            ...KEY, flex: 1, opacity: pri.ok ? 1 : .45, cursor: pri.ok ? 'pointer' : 'default',
            color: pri.ember ? '#4a1d05' : '#1f5f3e', background: pri.ember ? 'linear-gradient(180deg,#ffcf9a,#FF8A3D)' : 'linear-gradient(180deg,#eaffe9,#bfe6c4)',
          }}>{pri.label}</button>
        </div>
      </div>
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: "'Michroma',sans-serif", fontSize: 9, letterSpacing: 2, color: '#dffaff' }}>{children}</div>;
}
function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: 7, letterSpacing: 1.5, color: 'rgba(159,239,255,.7)', margin: '9px 0 5px', ...style }}>{children}</div>;
}
function Small({ children, warn }: { children: ReactNode; warn?: boolean }) {
  return <div role={warn ? 'alert' : undefined} style={{ fontSize: 9, lineHeight: 1.5, color: warn ? '#ffd0b0' : 'rgba(159,239,255,.75)', marginTop: 8 }}>{children}</div>;
}

const INPUT: CSSProperties = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 6, border: '1px solid rgba(95,216,255,.3)', background: 'rgba(0,0,0,.35)', color: '#dffaff', fontSize: 11, outline: 'none' };
const KEY: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 7, border: 0, cursor: 'pointer', fontSize: 9, letterSpacing: 2, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9),0 1px 2px rgba(0,0,0,.3)' };
