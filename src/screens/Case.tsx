import { useState, type CSSProperties } from 'react';
import type { KeptDisc } from '../data';
import { whenWord } from '../lib/when';
import { CASE_QUICK_SKINS, SKINS, alpha, type Skin, type SkinKey } from '../theme/skins';

// CASE · CD binder (spec §6.5). Two sleeves per spread, chrome rings between.
// The attribution line is the point of the screen.

export const CASE_SCREEN = 'radial-gradient(120% 56% at 50% -4%,#241c30 0%,#120f19 62%)';

interface Props {
  skin: Skin;
  discs: KeptDisc[];
  meId: string;
  loading: boolean;
  onSkin: (k: SkinKey) => void;
  onPlay: (i: number) => void;
}

export function Case({ skin, discs, meId, loading, onSkin, onPlay }: Props) {
  const [page, setPage] = useState(0);
  const [tick, setTick] = useState(0);
  const pages = Math.max(1, Math.ceil(discs.length / 2));
  const p = Math.min(page, pages - 1);
  const flip = (d: number) => { setPage((p + d + pages) % pages); setTick((t) => t + 1); };
  const top = discs[p * 2], bot = discs[p * 2 + 1];
  const anim = tick ? `${tick % 2 ? 'kybrFlipA' : 'kybrFlipB'} .55s ease` : undefined;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) - 4px)' }}>
      <div style={{ flex: 'none', padding: '8px 20px 0', zIndex: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontWeight: 400, fontFamily: "'Michroma',sans-serif", fontSize: 21, letterSpacing: 1, background: 'linear-gradient(180deg,#ffffff,#cfd0db 48%,#8b8c9c 52%,#ffffff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>KYBR·CASE</h1>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 8, letterSpacing: 3, color: 'rgba(233,228,240,.55)' }}>SAVED · YOURS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: 1, color: skin.c, border: `1px solid ${alpha(skin.c, .4)}`, borderRadius: 7, padding: '6px 11px', whiteSpace: 'nowrap', flex: 'none' }}>
            DISC {discs.length ? String(p * 2 + 1).padStart(2, '0') : '00'} / {String(discs.length).padStart(2, '0')}
          </span>
          <div role="radiogroup" aria-label="skin" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 8, letterSpacing: 1.5, color: 'rgba(233,228,240,.5)', marginRight: 2 }}>SKIN</span>
            {CASE_QUICK_SKINS.map((k) => {
              const t = SKINS[k], on = k === skin.key;
              return (
                <button key={k} type="button" role="radio" aria-checked={on} aria-label={t.name} title={t.name} onClick={() => onSkin(k)} className="kybr-press" style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 0, padding: 0 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: `radial-gradient(circle at 38% 32%,${t.lo},${t.c} 64%,${t.hi})`, boxShadow: on ? `0 0 0 2px #15121b,0 0 0 3.5px ${t.c},0 0 9px ${t.c}` : 'inset 0 1px 2px rgba(0,0,0,.4)' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: '8px 16px 4px', zIndex: 3, perspective: 1200, display: 'flex', flexDirection: 'column' }}>
        <Sleeve disc={top} skin={skin} meId={meId} at="top" anim={anim} onPlay={() => onPlay(p * 2)} empty={!discs.length ? (loading ? 'opening the binder…' : 'nothing kept yet.') : ''} />
        <button type="button" aria-label="flip to the next page" onClick={() => flip(1)} className="kybr-press" style={{ flex: 'none', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 14px', position: 'relative', zIndex: 5, background: 'none', border: 0 }}>
          {Array.from({ length: 8 }).map((_, k) => (
            <span key={k} style={{ width: 24, height: 22, borderRadius: '50%', background: 'radial-gradient(circle at 40% 28%,#fafbfd,#c2c4cd 50%,#83858f)', boxShadow: '0 2px 4px rgba(0,0,0,.6),inset 0 1px 1px rgba(255,255,255,.9),inset 0 -2px 3px rgba(0,0,0,.3)' }} />
          ))}
        </button>
        <Sleeve disc={bot} skin={skin} meId={meId} at="bottom" anim={anim} onPlay={() => onPlay(p * 2 + 1)} empty={!discs.length && !loading ? 'etch a burn and keep it. it lands here.' : ''} />
      </div>

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '2px 0 0', zIndex: 6 }}>
        <button type="button" aria-label="previous page" onClick={() => flip(-1)} disabled={pages < 2} style={roundKey(skin, pages < 2)}>▲</button>
        <span style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(233,228,240,.55)' }}>FLIP THE RINGS</span>
        <button type="button" aria-label="next page" onClick={() => flip(1)} disabled={pages < 2} style={roundKey(skin, pages < 2)}>▼</button>
      </div>
    </div>
  );
}

function Sleeve({ disc, skin, meId, at, anim, onPlay, empty }: { disc?: KeptDisc; skin: Skin; meId: string; at: 'top' | 'bottom'; anim?: string; onPlay: () => void; empty: string }) {
  const top = at === 'top';
  const frame: CSSProperties = {
    flex: 1, minHeight: 0, borderRadius: top ? '20px 20px 7px 7px' : '7px 7px 20px 20px',
    borderStyle: top ? 'dashed dashed none' : 'none dashed dashed', borderWidth: 1.5, borderColor: alpha(skin.c, .34), padding: '0 14px', display: 'flex', alignItems: 'center', gap: 14,
    background: `linear-gradient(160deg,rgba(255,255,255,${top ? .055 : .012}),rgba(255,255,255,${top ? .012 : .055}))`,
    transformOrigin: top ? 'bottom center' : 'top center', animation: anim,
  };
  if (!disc) {
    return <div style={{ ...frame, justifyContent: 'center' }}><span style={{ fontSize: 11, color: 'rgba(233,228,240,.6)', textAlign: 'center', lineHeight: 1.6 }}>{empty}</span></div>;
  }
  const b = disc.burn;
  const mine = b.from.id === meId;
  return (
    <div style={frame}>
      <button type="button" aria-label={`open ${b.track.title}`} onClick={onPlay} className="kybr-press" style={{
        position: 'relative', width: 'clamp(104px, 18dvh, 150px)', aspectRatio: '1', flex: 'none', borderRadius: '50%', border: 0, padding: 0,
        background: `conic-gradient(from ${top ? 210 : 150}deg,#f7c9d8,#c9d8f7,#c9f7e4,#f7f0c9,#f7d8c9,#e4c9f7,#c9e8f7,#f7c9d8)`,
        boxShadow: '0 16px 34px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.4)',
      }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-radial-gradient(circle at 50% 50%,transparent 0 2px,rgba(255,255,255,.15) 2px 3px)' }} />
        <span style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: 'linear-gradient(125deg,rgba(255,255,255,.5),rgba(255,255,255,0) 42%)' }} />
        <span style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '53%', height: '53%', borderRadius: 9, overflow: 'hidden',
          background: b.track.artUrl ? `center/cover url("${b.track.artUrl}")` : `linear-gradient(135deg,${skin.c},#160f20)`,
          boxShadow: '0 4px 12px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.25)',
        }} />
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '35%', height: '35%', borderRadius: '50%', background: `radial-gradient(circle at 42% 34%,#ffffff,${skin.lo} 56%,${skin.c})`, boxShadow: `0 5px 14px rgba(0,0,0,.45),0 0 18px ${alpha(skin.c, .55)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '9px 0 9px 15px', borderColor: 'transparent transparent transparent #2a1f3a', marginLeft: 3 }} />
        </span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 18, color: '#f3ecff', lineHeight: 1.15, overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.track.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(233,228,240,.65)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.track.artist}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12 }}>
          <span aria-hidden="true" style={{ width: 23, height: 23, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', background: `radial-gradient(circle at 35% 30%,${skin.lo},${skin.c})` }}>{(mine ? 'you' : b.from.displayName)[0].toUpperCase()}</span>
          <span style={{ fontSize: 10, lineHeight: '15px', color: 'rgba(233,228,240,.78)', minWidth: 0 }}>
            {mine ? 'burned by ' : 'saved from '}<span style={{ color: skin.c }}>{mine ? 'you' : b.from.displayName}</span> · saved {whenWord(disc.keptAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

const roundKey = (skin: Skin, disabled: boolean): CSSProperties => ({
  cursor: disabled ? 'default' : 'pointer', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 13, color: skin.c, background: 'rgba(255,255,255,.05)', border: `1px solid ${alpha(skin.c, .4)}`, opacity: disabled ? .4 : 1,
});
