import { useState } from 'react';
import { HeatCells } from '../components/HeatCells';
import type { Burn, Etch as EtchT } from '../data';
import { heatStars } from '../theme/heat';
import { alpha, type Skin } from '../theme/skins';

// ETCH · jewel case (spec §6.8). The disc face is the only place a burn gets
// handwriting. Heat is required; the note is up to 80 characters.

interface Props {
  skin: Skin;
  burn: Burn;
  mine: EtchT | null;
  theirs: EtchT | null;
  alreadyKept: boolean;
  onCancel: () => void;
  onSave: (heat: number, note: string, keep: boolean) => Promise<void>;
}

export function Etch({ skin, burn, mine, theirs, alreadyKept, onCancel, onSave }: Props) {
  const [heat, setHeat] = useState(mine?.heat ?? 0);
  const [note, setNote] = useState(mine?.note ?? '');
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!heat || busy) return;
    setBusy(true);
    setErr('');
    try {
      await onSave(heat, note.trim(), keep);
    } catch {
      setErr("didn't take. try again.");
      setBusy(false);
    }
  };

  return (
    <div onClick={onCancel} style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 4px)', background: 'rgba(8,5,14,.7)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={`etch ${burn.track.title}`} onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', margin: 'auto 14px calc(16px + var(--safe-bottom))', borderRadius: 10, padding: '12px 14px 14px 28px',
        background: 'linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.05) 38%,rgba(255,255,255,.03) 60%,rgba(255,255,255,.12))',
        border: '1px solid rgba(255,255,255,.32)', boxShadow: '0 -12px 50px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.4)', backdropFilter: 'blur(10px)', animation: 'kybrRise .32s ease both',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, borderRadius: '10px 0 0 10px', background: 'repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0 1px,rgba(255,255,255,.04) 1px 3px)', borderRight: '1px solid rgba(255,255,255,.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 14, letterSpacing: 3, background: 'linear-gradient(180deg,#fff,#e3e4ec 26%,#9a9bae 50%,#74758a 53%,#cfd0db 76%,#fff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ETCH</span>
          <span style={{ fontSize: 7, letterSpacing: 2, color: 'rgba(233,228,240,.62)' }}>JEWEL CASE · KY·JC01</span>
          <button type="button" aria-label="close" onClick={onCancel} style={{ width: 44, height: 44, margin: '-10px -10px -10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(233,228,240,.75)', fontSize: 13, background: 'none', border: 0 }}>✕</button>
        </div>

        {/* printable disc face */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
          <div aria-hidden="true" style={{ position: 'relative', width: 196, height: 196, borderRadius: '50%', background: 'radial-gradient(circle,#fbfaff 0,#f1eff6 58%,#dcd8e6 100%)', boxShadow: '0 10px 26px rgba(0,0,0,.5),inset 0 0 0 1px rgba(0,0,0,.08),inset 0 0 0 9px rgba(255,255,255,.5)' }}>
            <div style={{ position: 'absolute', top: 22, left: 28, right: 28, textAlign: 'center', transform: 'rotate(-3deg)' }}>
              <div style={{ fontFamily: "'Caveat',cursive", fontWeight: 600, fontSize: 19, lineHeight: 1, color: '#1d1b4f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{burn.track.title}</div>
              <div style={{ fontSize: 12, letterSpacing: 1, color: '#e2701f', marginTop: 3, minHeight: 14 }}>{heatStars(heat)}</div>
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 54, height: 54, borderRadius: '50%', background: 'radial-gradient(circle,#15121b 0 30%,rgba(200,196,214,.9) 32% 58%,#cfcbdb 60% 100%)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
            <div style={{ position: 'absolute', top: 126, left: 30, right: 30, textAlign: 'center', transform: 'rotate(-4deg)', fontFamily: "'Caveat',cursive", fontWeight: 500, fontSize: 17, lineHeight: '16px', color: note ? '#1d1b4f' : 'rgba(29,27,79,.35)', maxHeight: 34, overflow: 'hidden' }}>{note || 'write something…'}</div>
          </div>
        </div>

        {theirs && (
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'rgba(233,228,240,.8)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {theirs.by.displayName} etched <span style={{ color: '#FFB45E' }}>{heatStars(theirs.heat)}</span>{theirs.note ? <> · “{theirs.note}”</> : null}
          </div>
        )}

        <div style={{ marginTop: 10, borderRadius: 8, padding: '2px 10px 10px', background: 'rgba(10,7,16,.6)', boxShadow: 'inset 0 1px 4px rgba(0,0,0,.6)' }}>
          <HeatCells value={heat} onChange={setHeat} />
          <input aria-label="note" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="etch a short note…" style={{
            width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 6, border: `1px solid ${alpha(skin.c, .3)}`, background: 'rgba(0,0,0,.35)', color: '#f3ecff', fontSize: 11, outline: 'none',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(233,228,240,.6)', marginTop: 6 }}>
            <span>tap a star twice for a half</span><span>{80 - note.length}</span>
          </div>
        </div>

        <button type="button" role="switch" aria-checked={keep} onClick={() => setKeep(!keep)} className="kybr-press" style={{
          width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', gap: 9, minHeight: 44, padding: '0 10px', borderRadius: 8, textAlign: 'left',
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: keep ? 'radial-gradient(circle at 40% 35%,#c8ffe0,#7CFFB0)' : 'radial-gradient(circle at 40% 35%,#9a9ca6,#5f616c)', boxShadow: keep ? '0 0 7px #7CFFB0' : 'inset 0 1px 1px rgba(0,0,0,.45)' }} />
          <span style={{ fontSize: 8.5, letterSpacing: 1.5, color: '#e9e4f0' }}>{alreadyKept ? 'IN YOUR CASE' : 'KEEP IT IN YOUR CASE'} · {keep ? 'ON' : 'OFF'}</span>
        </button>

        {err && <div role="alert" style={{ marginTop: 8, fontSize: 9.5, color: '#ffb3a8' }}>✕ {err}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={onCancel} className="kybr-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 7, fontSize: 9, letterSpacing: 2, flex: 'none', padding: '0 16px', color: '#e9e4f0', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)' }}>CANCEL</button>
          <button type="button" onClick={save} disabled={!heat || busy} className="kybr-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 7, fontSize: 9, letterSpacing: 2, flex: 1, border: 0,
            opacity: heat && !busy ? 1 : .45, color: '#4a1d05', background: 'linear-gradient(180deg,#ffcf9a,#FF8A3D)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7),0 0 14px rgba(255,138,61,.35)',
          }}>{busy ? 'ETCHING…' : heat ? '★ ETCH IT' : '★ PICK SOME HEAT'}</button>
        </div>
      </div>
    </div>
  );
}
