import type { CSSProperties, ReactNode } from 'react';
import type { Burn } from '../data';
import { duration, whenShort } from '../lib/when';
import { alpha, type Skin } from '../theme/skins';
import { TABS, type Tab } from '../components/NavTray';

// WIRE · Game Boy Color, Atomic Purple (spec §6.1). The feed fits the LCD:
// five rows, a cursor you move with the D-pad, A opens, START burns.

export type WireRow =
  | { kind: 'burn'; burn: Burn }
  | { kind: 'week'; crewId: string; crewName: string; burns: Burn[] };

export const WIRE_SHELL = {
  bg: 'linear-gradient(158deg,#d6cfe8,#bfb5da 44%,#a99dcb 80%,#bbb1d8)',
  shadow: '0 44px 80px -20px rgba(0,0,0,.72),inset 0 2px 0 rgba(255,255,255,.75),inset 0 0 0 1px rgba(255,255,255,.45),inset 0 -6px 14px rgba(120,104,170,.45)',
};
export const WIRE_SCREEN = 'linear-gradient(158deg,#e6e1f2,#d2cce8 44%,#bcb4dc 80%,#cbc4e6)';

interface Props {
  skin: Skin;
  rows: WireRow[];
  sel: number;
  meId: string;
  loading: boolean;
  onSel: (i: number) => void;
  onOpen: (i: number) => void;
  onStart: () => void;
  onNextTab: () => void;
  onBack: () => void;
}

export function Wire({ skin, rows, sel, meId, loading, onSel, onOpen, onStart, onNextTab, onBack }: Props) {
  const n = rows.length;
  const up = () => n && onSel((sel - 1 + n) % n);
  const down = () => n && onSel((sel + 1) % n);

  return (
    <div className="kybr-scroll" style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 'var(--safe-top) 22px 0' }}>
      {/* gloss */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 30% at 24% 4%,rgba(255,255,255,.6),transparent 60%),radial-gradient(50% 24% at 88% 28%,rgba(255,255,255,.35),transparent 70%)', pointerEvents: 'none', zIndex: 3 }} />

      {/* bezel */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', borderRadius: '10px 10px 24px 24px', padding: '14px 16px 12px', background: 'linear-gradient(160deg,#201e26,#070608)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.7),0 1px 0 rgba(255,255,255,.3)' }}>
        <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '34px 9px 0 0', flex: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%,#ff8f8f,#cc2222)', boxShadow: '0 0 6px #ff4d4d' }} />
          <span style={{ width: 7, height: 9, borderRadius: '50%', border: '1.4px solid #6e6e77', borderLeftColor: 'transparent' }} />
          <span style={{ width: 7, height: 9, borderRadius: '50%', border: '1.4px solid #54545c', borderLeftColor: 'transparent' }} />
          <span style={{ fontSize: 6, letterSpacing: 1, color: '#83838c', writingMode: 'vertical-rl', marginTop: 3 }}>POWER</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* the LCD */}
          <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 0,#241a33,#100c18)', padding: 11, boxShadow: `inset 0 0 0 1px ${alpha(skin.c, .18)}` }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg,${alpha(skin.c, .05)} 0 1px,transparent 1px 3px)`, pointerEvents: 'none', zIndex: 2 }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(skin.c, .3)}`, paddingBottom: 6 }}>
              <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 11, color: skin.c }}>♥KYBR</span>
              <span style={{ fontSize: 8, background: `linear-gradient(180deg,${skin.lo},${skin.c})`, color: '#2a1f3a', padding: '2px 7px', borderRadius: 2, letterSpacing: 1 }}>WIRE</span>
            </div>
            <h1 style={{ position: 'relative', fontSize: 8, fontWeight: 400, letterSpacing: 1, color: 'rgba(231,224,240,.6)', margin: '8px 0 7px' }}>WHAT YR CREW PUT U ON</h1>
            <div role="listbox" aria-label="wire" aria-activedescendant={n ? `wire-row-${sel}` : undefined} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 5 * 44 + 4 * 3 }}>
              {rows.map((r, i) => (
                <Row key={r.kind === 'burn' ? r.burn.id : `week-${r.crewId}`} id={`wire-row-${i}`} row={r} on={i === sel} skin={skin} meId={meId}
                  onClick={() => (i === sel ? onOpen(i) : onSel(i))} />
              ))}
              {!n && (
                <div style={{ padding: '22px 6px', fontSize: 10, lineHeight: 1.7, color: 'rgba(231,224,240,.75)' }}>
                  {loading ? 'tuning in…' : <>nothing on the wire yet.<br /><span style={{ color: skin.lo }}>press START</span> to burn your crew a song.</>}
                </div>
              )}
            </div>
            {/* the game's own nav strip */}
            <div aria-hidden="true" style={{ position: 'relative', display: 'flex', gap: 3, marginTop: 9, borderTop: `1px solid ${alpha(skin.c, .3)}`, paddingTop: 7, justifyContent: 'space-between' }}>
              {TABS.map((t: Tab) => (
                <span key={t} style={{ fontSize: 7, letterSpacing: .5, padding: '2px 6px', borderRadius: 2, color: t === 'wire' ? '#2a1f3a' : 'rgba(231,224,240,.5)', background: t === 'wire' ? `linear-gradient(180deg,${skin.lo},${skin.c})` : 'transparent' }}>{t.toUpperCase()}</span>
              ))}
            </div>
          </div>
          <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 5, marginTop: 9, fontStyle: 'italic' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5, color: '#aeb0b8' }}>KYBR BOY</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5 }}>
              <span style={{ color: '#ff5b5b' }}>C</span><span style={{ color: '#ff9d3d' }}>O</span><span style={{ color: '#ffd23d' }}>L</span><span style={{ color: '#46d07a' }}>O</span><span style={{ color: '#4db4ff' }}>R</span>
            </span>
          </div>
        </div>
      </div>

      {/* controls */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 210, marginTop: 14 }}>
        <Guts />

        {/* D-pad */}
        <div style={{ position: 'absolute', left: 8, top: 26, width: 96, height: 96, zIndex: 1 }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: 32, left: 0, width: 96, height: 32, borderRadius: 5, background: 'linear-gradient(180deg,#4a4552,#211d28)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.18),0 3px 5px rgba(0,0,0,.45)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: 32, top: 0, width: 32, height: 96, borderRadius: 5, background: 'linear-gradient(90deg,#4a4552,#211d28)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.18),0 3px 5px rgba(0,0,0,.45)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: 40, top: 40, width: 16, height: 16, borderRadius: '50%', background: '#0f0d12', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.7)' }} />
          <PadHit label="up" style={{ left: 26, top: -2 }} onClick={up} />
          <PadHit label="down" style={{ left: 26, top: 54 }} onClick={down} />
          <PadHit label="next tab" style={{ left: -2, top: 26 }} onClick={onNextTab} />
          <PadHit label="next tab" style={{ left: 54, top: 26 }} onClick={onNextTab} />
        </div>

        {/* A / B */}
        <div style={{ position: 'absolute', right: 4, top: 22, zIndex: 1, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <RoundKey label="B" aria="B, back" onClick={onBack} />
          <RoundKey label="A" aria="A, open" onClick={() => n && onOpen(sel)} style={{ marginBottom: 30 }} />
        </div>

        {/* SELECT / START */}
        <div style={{ position: 'absolute', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 1, display: 'flex', gap: 10 }}>
          <PillKey label="SELECT" aria="select, next tab" onClick={onNextTab} />
          <PillKey label="START" aria="start, burn a song" onClick={onStart} glow={skin.c} />
        </div>

        {/* speaker */}
        <div aria-hidden="true" style={{ position: 'absolute', right: 2, bottom: 4, zIndex: 1, width: 58, height: 58, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,rgba(255,255,255,.4),rgba(70,62,84,.12) 72%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.45),inset 0 2px 6px rgba(0,0,0,.22)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', backgroundImage: 'radial-gradient(circle,rgba(36,30,48,.62) 0 1.4px,transparent 1.8px)', backgroundSize: '5px 5px' }} />
        </div>
      </div>
    </div>
  );
}

function Row({ id, row, on, skin, meId, onClick }: { id: string; row: WireRow; on: boolean; skin: Skin; meId: string; onClick: () => void }) {
  const week = row.kind === 'week';
  let title: string, who: ReactNode, time: string;
  if (row.kind === 'week') {
    title = 'This Week';
    who = `${row.crewName} · weekly mix`;
    time = 'mix';
  } else {
    const b = row.burn;
    title = b.track.title;
    who = b.from.id === meId ? `you burned this · ${b.crewName}` : `from ${b.from.displayName}`;
    time = duration(b.track.durationMs) || whenShort(b.createdAt);
  }
  return (
    <div
      id={id}
      role="option"
      aria-selected={on}
      tabIndex={-1}
      onClick={onClick}
      className="kybr-press"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: 8, borderRadius: 6,
        borderLeft: `2px solid ${on ? (week ? '#FFB45E' : skin.c) : 'transparent'}`,
        background: on ? (week ? 'rgba(255,180,94,.16)' : alpha(skin.c, .18)) : 'rgba(255,255,255,.03)',
      }}
    >
      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: week ? 'radial-gradient(circle,#ffd36a,#FF8A3D)' : `radial-gradient(circle,${skin.lo},${skin.hi})` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: week ? '#ffd36a' : on ? '#fff' : '#d7cbe8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 8, color: 'rgba(231,224,240,.62)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{who}</div>
      </div>
      <span style={{ fontSize: 8, color: 'rgba(231,224,240,.55)', flex: 'none' }}>{time}</span>
    </div>
  );
}

function PadHit({ label, style, onClick }: { label: string; style: CSSProperties; onClick: () => void }) {
  return <button type="button" aria-label={label} onClick={onClick} className="kybr-padhit" style={{ position: 'absolute', width: 44, height: 44, borderRadius: 6, background: 'transparent', border: 0, cursor: 'pointer', ...style }} />;
}

function RoundKey({ label, aria, onClick, style }: { label: string; aria: string; onClick: () => void; style?: CSSProperties }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} className="kybr-gbkey" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 52, padding: '4px 0', background: 'none', border: 0, cursor: 'pointer', ...style }}>
      <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(180deg,#54505c,#211d28)', boxShadow: 'inset 0 2px 2px rgba(255,255,255,.22),0 4px 6px rgba(0,0,0,.5)' }} />
      <span style={{ fontSize: 9, color: '#6a5c86', letterSpacing: 1, textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>{label}</span>
    </button>
  );
}

function PillKey({ label, aria, onClick, glow }: { label: string; aria: string; onClick: () => void; glow?: string }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} className="kybr-gbkey" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, width: 58, height: 44, background: 'none', border: 0, cursor: 'pointer' }}>
      <span style={{ width: 30, height: 10, borderRadius: 6, background: 'linear-gradient(180deg,#4a4552,#211d28)', boxShadow: `inset 0 1px 1px rgba(255,255,255,.18),0 2px 3px rgba(0,0,0,.45)${glow ? `,0 0 8px ${alpha(glow, .45)}` : ''}` }} />
      <span style={{ fontSize: 7, color: '#6a5c86', letterSpacing: 1, textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>{label}</span>
    </button>
  );
}

/** Visible internals through the translucent shell. */
function Guts() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, filter: 'blur(.5px)', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, bottom: 44, width: 56, height: 46, borderRadius: 3, background: '#1d3a26', opacity: .42, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.35)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 4, backgroundImage: 'radial-gradient(circle,#c9a84a 0 1px,transparent 1.5px)', backgroundSize: '6px 6px', opacity: .85 }} />
        <div style={{ position: 'absolute', left: 5, top: 6, width: 22, height: 3, background: 'rgba(201,168,74,.6)' }} />
      </div>
      <div style={{ position: 'absolute', right: 96, top: 10, width: 24, height: 24, borderRadius: '50%', background: 'radial-gradient(circle,rgba(160,140,200,.55),transparent 72%)' }} />
      <div style={{ position: 'absolute', right: 40, top: 84, width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle,rgba(160,140,200,.5),transparent 72%)' }} />
      <div style={{ position: 'absolute', left: 110, bottom: 28, width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle,rgba(160,140,200,.45),transparent 72%)' }} />
    </div>
  );
}
