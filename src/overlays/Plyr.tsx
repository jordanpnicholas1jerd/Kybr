import type { CSSProperties, ReactNode } from 'react';
import { Disc } from '../components/Disc';
import type { Burn, Etch, Service } from '../data';
import { allTargets, primaryTarget } from '../lib/services';
import { heatStars } from '../theme/heat';
import { alpha, type Skin } from '../theme/skins';

// PLYR · iPod with click wheel (spec §6.3). Phase 1 is a remote: KYBR never
// streams audio, so ▶❚❚ opens the song in the listener's own music app.

interface Props {
  skin: Skin;
  burn: Burn;
  /** "from WIRE", "in basement", "saved in CASE", "basement's this week" */
  context: string;
  backLabel: string;
  meId: string;
  etches: Etch[] | null;
  service: Service;
  onClose: () => void;
  onStep: (d: number) => void;
  canStep: boolean;
  onEtch: () => void;
  onOpenLink: (url: string) => void;
}

export function Plyr({ skin, burn, context, backLabel, meId, etches, service, onClose, onStep, canStep, onEtch, onOpenLink }: Props) {
  const t = burn.track;
  const main = primaryTarget(t, service);
  const others = allTargets(t).filter((o) => o.url !== main?.url);
  const mine = etches?.find((e) => e.by.id === meId);
  const theirs = etches?.filter((e) => e.by.id !== meId) ?? [];
  const fromMe = burn.from.id === meId;
  const open = () => main && onOpenLink(main.url);

  return (
    <Scrim onClose={onClose} label={`player: ${t.title}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 4px' }}>
        <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 9, letterSpacing: 3, color: '#8a8b97' }}>PLYR · REMOTE</span>
        <button type="button" onClick={onClose} className="kybr-press" style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 32, fontSize: 9, letterSpacing: 1, color: '#5f606d', border: '1px solid rgba(0,0,0,.14)', borderRadius: 999, padding: '0 14px', background: 'transparent' }}>
          ▾ {backLabel}<span aria-hidden="true" style={{ position: 'absolute', inset: -6 }} />
        </button>
      </div>

      {/* the screen */}
      <div style={{ borderRadius: 12, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 0%,#2c1c45,#160d22 80%)', padding: '14px 16px 14px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,.7),inset 0 0 0 2px rgba(0,0,0,.28)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: '#8df0d0', letterSpacing: 1, whiteSpace: 'nowrap' }}>● {fromMe ? 'YOU BURNED THIS' : 'BURNED FOR YOU'}</span>
          <span style={{ fontSize: 9, color: 'rgba(233,228,240,.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{burn.crewName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ position: 'relative' }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: `radial-gradient(circle,${alpha(skin.c, .4)},transparent 66%)`, filter: 'blur(4px)' }} />
            <Disc size={104} spin="12s" />
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 16, color: '#fff', lineHeight: 1.2 }}>{t.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(233,228,240,.7)', marginTop: 3 }}>{t.artist}</div>
        </div>

        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '7px 12px', borderRadius: 12, background: alpha(skin.c, .1), border: `1px solid ${alpha(skin.c, .22)}` }}>
          <span aria-hidden="true" style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', background: `radial-gradient(circle at 35% 30%,${skin.lo},${skin.c} 55%,${skin.hi})` }}>{(fromMe ? 'you' : burn.from.displayName)[0].toUpperCase()}</span>
          <span style={{ fontSize: 10.5, color: 'rgba(235,228,245,.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>added by {fromMe ? 'you' : burn.from.displayName} · {context}</span>
        </div>

        {(burn.note || burn.heat) && (
          <Line color="rgba(233,228,240,.85)">
            {fromMe ? 'you' : burn.from.displayName}{burn.heat ? <> <span style={{ color: '#FFB45E' }}>{heatStars(burn.heat)}</span></> : null}
            {burn.note ? <> · “{burn.note}”</> : null}
          </Line>
        )}
        {mine && <Line color="#FFB45E">you etched {heatStars(mine.heat)}{mine.note ? <> · “{mine.note}”</> : null}</Line>}
        {theirs.slice(0, 2).map((e) => (
          <Line key={e.by.id} color="rgba(233,228,240,.78)">{e.by.displayName} etched <span style={{ color: '#FFB45E' }}>{heatStars(e.heat)}</span>{e.note ? <> · “{e.note}”</> : null}</Line>
        ))}
        {theirs.length > 2 && <Line color="rgba(233,228,240,.6)">and {theirs.length - 2} more from the crew</Line>}

        {/* open in… */}
        <button type="button" onClick={open} disabled={!main} className="kybr-press" style={{
          width: '100%', marginTop: 12, minHeight: 44, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'linear-gradient(180deg,#0e2418,#06120c)', border: 0, boxShadow: 'inset 0 0 0 1px rgba(124,255,176,.35)',
          fontSize: 10, letterSpacing: 1.5, color: '#a8ffcf', textShadow: '0 0 6px rgba(124,255,176,.5)',
        }}>
          {main ? <>▶ OPEN IN {main.label.toUpperCase()} ↗</> : 'NO LINK FOR THIS ONE'}
        </button>
        {others.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0 4px', marginTop: 4, fontSize: 9, color: 'rgba(233,228,240,.6)' }}>
            <span>or</span>
            {others.slice(0, 4).map((o) => (
              <button key={o.url} type="button" onClick={() => onOpenLink(o.url)} className="kybr-press" style={{ minHeight: 36, padding: '0 5px', background: 'none', border: 0, fontSize: 9, color: skin.lo }}>{o.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* click wheel */}
      <div style={{ margin: '16px auto 0', width: 196, height: 196, borderRadius: '50%', position: 'relative', background: 'radial-gradient(circle at 50% 34%,#fdfdfe,#e6e7ec 58%,#c9cbd3)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,.9),inset 0 -3px 9px rgba(0,0,0,.16),0 4px 10px rgba(0,0,0,.2)' }}>
        <WheelKey aria="menu, close the player" style={{ top: 0, left: '50%', transform: 'translateX(-50%)', padding: '17px 18px 15px', fontFamily: "'Michroma',sans-serif", fontSize: 9, letterSpacing: 2 }} onClick={onClose}>MENU</WheelKey>
        <WheelKey aria="previous" disabled={!canStep} style={{ left: 0, top: '50%', transform: 'translateY(-50%)', padding: 14, fontSize: 15 }} onClick={() => onStep(-1)}>⏮</WheelKey>
        <WheelKey aria="next" disabled={!canStep} style={{ right: 0, top: '50%', transform: 'translateY(-50%)', padding: 14, fontSize: 15 }} onClick={() => onStep(1)}>⏭</WheelKey>
        <WheelKey aria={main ? `play in ${main.label}` : 'no link'} disabled={!main} style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', padding: '15px 18px 17px', fontSize: 11, letterSpacing: -1, whiteSpace: 'nowrap' }} onClick={open}>▶❚❚</WheelKey>
        <button type="button" aria-label="etch this burn" onClick={onEtch} className="kybr-etchkey" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 74, height: 74, borderRadius: '50%', border: 0, cursor: 'pointer',
          background: 'radial-gradient(circle at 50% 36%,#ffffff,#eceef2 60%,#d3d5dd)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,.9),inset 0 -2px 5px rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.16)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 13, color: '#FF8A3D', lineHeight: 1 }}>★</span>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 7.5, letterSpacing: 2, color: skin.hi, paddingLeft: 2 }}>ETCH</span>
        </button>
      </div>
    </Scrim>
  );
}

function Line({ color, children }: { color: string; children: ReactNode }) {
  return <div style={{ marginTop: 7, textAlign: 'center', fontSize: 9.5, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</div>;
}

function WheelKey({ aria, children, style, onClick, disabled }: { aria: string; children: ReactNode; style: CSSProperties; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} disabled={disabled} className="kybr-wheelkey" style={{ position: 'absolute', background: 'none', border: 0, color: '#6f7080', opacity: disabled ? .35 : 1, cursor: disabled ? 'default' : 'pointer', minWidth: 44, minHeight: 44, ...style }}>{children}</button>
  );
}

/** Dark blurred scrim with the iPod body rising from the bottom. */
function Scrim({ onClose, label, children }: { onClose: () => void; label: string; children: ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) + 4px)', background: 'rgba(8,5,14,.64)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()} style={{
        margin: 'auto 14px calc(16px + var(--safe-bottom))', borderRadius: 34, padding: '16px 18px 20px',
        background: 'linear-gradient(155deg,#fbfbfc,#e8e9ed 38%,#cfd1d8 60%,#f4f5f8)',
        boxShadow: '0 -12px 50px rgba(0,0,0,.5),inset 0 2px 2px rgba(255,255,255,.9),inset 0 -2px 4px rgba(0,0,0,.16),0 0 0 1px rgba(255,255,255,.6)',
        animation: 'kybrRise .32s ease both',
      }}>
        {children}
      </div>
    </div>
  );
}
