import type { CSSProperties } from 'react';
import { DarkChromeText } from '../components/Chrome';
import type { Crew, CrewDeck } from '../data';
import { whenShort, whenWord } from '../lib/when';
import type { Skin } from '../theme/skins';

// CHNL · silver hi-fi component rack (spec §6.2). Phase 1: the rack and the
// track list. No live room yet, so nothing here claims to be on air.

export const CHNL_SCREEN = 'linear-gradient(180deg,#1c1822 0%,#15111c 100%)';

interface Props {
  skin: Skin;
  crews: Crew[];
  crewId: string;
  deck: CrewDeck | null;
  cursor: number;
  weekCount: number;
  onPickCrew: (id: string) => void;
  onCursor: (i: number) => void;
  onOpen: (i: number) => void;
  onThisWeek: () => void;
  onDub: () => void;
}

const SPEC_H = [34, 58, 80, 100, 72, 90, 54, 84, 46, 96, 64, 38];
const SPEC_D = [0, .12, .24, .06, .3, .18, .36, .09, .27, .15, .33, .21];

export function Chnl({ skin, crews, crewId, deck, cursor, weekCount, onPickCrew, onCursor, onOpen, onThisWeek, onDub }: Props) {
  const idx = Math.max(0, crews.findIndex((c) => c.id === crewId));
  const crew = crews[idx];
  const burns = deck?.burns ?? [];
  const cur = burns[cursor];
  const n = burns.length;
  const nextCrew = () => crews.length && onPickCrew(crews[(idx + 1) % crews.length].id);
  const step = (d: number) => n && onCursor((cursor + d + n) % n);

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 'calc(var(--safe-top) - 2px)' }}>
      <div style={{
        flex: 1, minHeight: 0, margin: '0 12px', borderRadius: 14, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
        background: 'linear-gradient(180deg,#d9dbe1 0%,#bcbec7 42%,#a4a6b0 58%,#cfd1d8 100%)',
        boxShadow: 'inset 0 2px 2px rgba(255,255,255,.85),inset 0 -3px 7px rgba(0,0,0,.32),0 6px 16px rgba(0,0,0,.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none', padding: '0 3px' }}>
          <DarkChromeText style={{ fontSize: 15, letterSpacing: 1 }}>KYBR</DarkChromeText>
          <span style={{ fontSize: 7, letterSpacing: 2, color: '#5d5f69' }}>CD CREW SYSTEM · KY·NMT09</span>
        </div>

        {/* LCD */}
        <div style={{ ...SUNKEN, flex: 'none', borderRadius: 7, padding: '10px 13px 11px', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 9px rgba(0,0,0,.85),inset 0 0 0 2px #2c2e38,0 0 0 3px #6b6d77' }}>
          <div aria-hidden="true" style={SCAN} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8, letterSpacing: 1, color: '#5fd8ff' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, textShadow: '0 0 7px rgba(95,216,255,.7)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5fd8ff', boxShadow: '0 0 6px #5fd8ff' }} />
              {cur ? 'ON THE DECK' : 'NO DISC'}
            </span>
            <span style={{ textShadow: '0 0 7px rgba(95,216,255,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 8 }}>
              DECK {idx + 1} · {crew?.name} · {crew?.freq}fm
            </span>
          </div>
          <div aria-hidden="true" style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, height: 46, marginTop: 9 }}>
            {SPEC_H.map((h, k) => (
              <span key={k} style={{
                width: 5, height: `${cur ? h : 12}%`, borderRadius: 1, transformOrigin: 'bottom',
                background: k % 2 ? 'linear-gradient(180deg,#caffe8,#2fd6a6)' : 'linear-gradient(180deg,#b6f7ff,#19b6e6)',
                animation: cur ? `kybrEq 1.6s ease-in-out infinite ${SPEC_D[k]}s` : undefined, opacity: cur ? 1 : .4,
              }} />
            ))}
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 7, borderTop: '1px solid rgba(95,216,255,.22)', paddingTop: 7, minHeight: 38 }}>
            {cur ? (
              <>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#dffaff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 0 9px rgba(95,216,255,.5)' }}>{cur.track.title}</div>
                  <div style={{ fontSize: 8.5, color: 'rgba(159,239,255,.7)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.track.artist} · added by {cur.from.displayName}</div>
                </div>
                <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 10, color: '#7CFFC2', flex: 'none', marginLeft: 8, textShadow: '0 0 8px rgba(124,255,194,.6)' }}>{whenWord(cur.createdAt).toUpperCase()}</span>
              </>
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(159,239,255,.75)' }}>{deck ? 'nothing on this deck yet. burn one from WIRE.' : 'tuning…'}</div>
            )}
          </div>
        </div>

        {/* transport + jog */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
            <Transport label="⏮" aria="previous track" onClick={() => step(-1)} disabled={!n} />
            <Transport label="▶" aria="open in the player" onClick={() => n && onOpen(cursor)} disabled={!n} green />
            <Transport label="⏭" aria="next track" onClick={() => step(1)} disabled={!n} />
          </div>
          <button type="button" aria-label="tune to the next crew" onClick={nextCrew} className="kybr-press" style={{ position: 'relative', width: 64, height: 64, flex: 'none', borderRadius: '50%', border: 0, padding: 0, background: 'radial-gradient(circle at 42% 34%,#fbfbfd,#cdcfd7 52%,#9a9ca6)', boxShadow: '0 3px 6px rgba(0,0,0,.4),inset 0 2px 2px rgba(255,255,255,.9)' }}>
            <span style={{ position: 'absolute', inset: 5, borderRadius: '50%', background: 'conic-gradient(#c7c9d2 0 6deg,#8c8e98 6deg 12deg)', opacity: .85 }} />
            <span style={{ position: 'absolute', inset: 11, borderRadius: '50%', background: 'radial-gradient(circle at 40% 32%,#1a3a52,#0a1826)', boxShadow: 'inset 0 0 8px #3aa0ff,0 0 12px rgba(58,160,255,.55),inset 0 2px 3px rgba(0,0,0,.6)', border: '1px solid rgba(95,216,255,.5)' }} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 7, letterSpacing: 1, color: '#9fefff', textShadow: '0 0 6px #3aa0ff' }}>TUNE</span>
          </button>
        </div>

        {/* presets */}
        <div style={{ flex: 'none', borderRadius: 8, padding: '8px 9px', background: 'linear-gradient(180deg,#2c2d35,#16171d)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 7, letterSpacing: 1.5, color: '#9a9ca6' }}>DISC PRESETS</span>
            <span style={{ fontSize: 7, letterSpacing: 1, color: '#ff6fae' }}>● tap to tune in</span>
          </div>
          <div className="kybr-scroll" role="radiogroup" aria-label="crews" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {crews.map((c, i) => {
              const on = c.id === crewId;
              return (
                <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => onPickCrew(c.id)} className="kybr-press" style={{
                  flex: crews.length > 3 ? '0 0 30%' : 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '7px 8px', borderRadius: 7, textAlign: 'left',
                  background: on ? 'rgba(255,111,174,.16)' : 'rgba(255,255,255,.03)', border: `1px solid ${on ? 'rgba(255,111,174,.6)' : 'rgba(255,255,255,.07)'}`,
                }}>
                  <span style={{
                    width: 18, height: 18, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff',
                    background: on ? 'radial-gradient(circle at 38% 30%,#ffb3d6,#d63d8b)' : 'radial-gradient(circle at 38% 30%,#5a5b64,#2c2d35)',
                    boxShadow: on ? '0 0 10px rgba(255,111,174,.7),inset 0 1px 1px rgba(255,255,255,.5)' : 'inset 0 1px 1px rgba(255,255,255,.15)',
                  }}>{i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 9, color: on ? '#ffd0e6' : 'rgba(233,228,240,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <span style={{ display: 'block', fontSize: 7, color: 'rgba(233,228,240,.5)' }}>{c.freq}fm</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* in the room */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div aria-hidden="true" style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 7, letterSpacing: 1.5, color: '#4d4f59' }}>IN THE</span>
            <span style={{ fontSize: 7, letterSpacing: 1.5, color: '#4d4f59' }}>CREW</span>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 7, minWidth: 0 }}>
            <div style={{ ...WELL, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 6.5, letterSpacing: 1, color: '#7a7c86', marginBottom: 5 }}>DECK A · CREW</div>
                <div style={{ display: 'flex', alignItems: 'center' }} aria-label={`in ${crew?.name}: ${deck?.members.map((m) => m.displayName).join(', ') ?? ''}`}>
                  {(deck?.members ?? []).slice(0, 6).map((m, k) => (
                    <span key={m.id} title={m.displayName} style={{
                      width: 19, height: 19, borderRadius: '50%', marginLeft: k ? -5 : 0, border: '1.5px solid #0c0d12', flex: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, color: '#fff',
                      background: `radial-gradient(circle at 35% 30%,${skin.lo},${skin.c} 55%,${skin.hi})`,
                    }}>{initials(m.displayName)}</span>
                  ))}
                  {(deck?.members.length ?? 0) > 6 && (
                    <span style={{ width: 19, height: 19, borderRadius: '50%', marginLeft: -5, border: '1.5px solid #0c0d12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: 'rgba(233,228,240,.8)', background: '#2a2533' }}>+{deck!.members.length - 6}</span>
                  )}
                </div>
              </div>
              <button type="button" onClick={onDub} disabled={(deck?.members.length ?? 0) >= 8} aria-label={`make a dub for ${crew?.name}`} className="kybr-press" style={{
                flex: 'none', minWidth: 44, minHeight: 32, borderRadius: 5, fontSize: 7.5, letterSpacing: 1, padding: '0 6px',
                color: (deck?.members.length ?? 0) >= 8 ? 'rgba(233,228,240,.35)' : '#ffd0e6',
                background: 'rgba(255,111,174,.12)', border: '1px solid rgba(255,111,174,.4)', position: 'relative',
              }}>
                {(deck?.members.length ?? 0) >= 8 ? 'FULL' : '＋ DUB'}
                <span aria-hidden="true" style={{ position: 'absolute', inset: '-6px -2px' }} />
              </button>
            </div>
            <div aria-hidden="true" style={{ ...WELL, flex: 'none', width: 96 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6.5, letterSpacing: 1, color: '#7a7c86', marginBottom: 5 }}><span>VU</span><span>SUPER T·BASS</span></div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 18 }}>
                {Array.from({ length: 14 }).map((_, k) => (
                  <span key={k} style={{ flex: 1, minWidth: 2, borderRadius: 1, height: `${40 + (k % 3) * 22}%`, background: k > 11 ? '#ff4d4d' : k > 8 ? '#ffd23d' : '#46e06a', animation: cur ? `kybrFlick 1.1s ease-in-out infinite ${(k * .05).toFixed(2)}s` : undefined, opacity: cur ? 1 : .25 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* track list */}
        <div style={{ ...SUNKEN, flex: 1, minHeight: 96, borderRadius: 7, padding: '8px 10px 2px', display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 2px 7px rgba(0,0,0,.8),inset 0 0 0 2px #2c2e38' }}>
          <div style={{ flex: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 7.5, letterSpacing: 1.5, color: '#5fd8ff', borderBottom: '1px solid rgba(95,216,255,.22)', paddingBottom: 5 }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ON {crew?.name.toUpperCase()}'S DECK</span>
            <span style={{ color: 'rgba(159,239,255,.6)', flex: 'none', marginLeft: 8 }}>{n} TRACK{n === 1 ? '' : 'S'}</span>
          </div>
          <div className="kybr-scroll" role="listbox" aria-label={`${crew?.name}'s deck`} style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 3 }}>
            {burns.map((b, k) => {
              const on = k === cursor;
              return (
                <div key={b.id} role="option" aria-selected={on} onClick={() => (on ? onOpen(k) : onCursor(k))} className="kybr-press" style={{
                  display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '6px 3px', borderRadius: 5,
                  borderBottom: k < n - 1 ? '1px solid rgba(95,216,255,.1)' : 'none', background: on ? 'rgba(95,216,255,.07)' : undefined,
                }}>
                  <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 9, flex: 'none', width: 16, color: on ? '#7CFFC2' : 'rgba(159,239,255,.55)', textShadow: on ? '0 0 6px rgba(124,255,194,.6)' : 'none' }}>{String(k + 1).padStart(2, '0')}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#dffaff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.track.title}</div>
                    <div style={{ fontSize: 8.5, color: 'rgba(159,239,255,.6)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.track.artist} · {b.from.displayName}</div>
                  </div>
                  <span style={{ fontSize: 7.5, letterSpacing: 1, color: on ? '#7CFFC2' : 'rgba(159,239,255,.5)', flex: 'none' }}>{on ? '▶ OPEN' : whenShort(b.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ flex: 'none', display: 'flex', gap: 8, padding: '8px 14px 0' }}>
        <button type="button" onClick={onThisWeek} disabled={!weekCount} className="kybr-press" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: 11, borderRadius: 11,
          background: 'linear-gradient(160deg,rgba(95,216,255,.16),rgba(20,40,60,.5))', border: '1px solid rgba(95,216,255,.35)',
          fontFamily: "'Michroma',sans-serif", fontSize: 8.5, letterSpacing: 2, color: weekCount ? '#dffaff' : 'rgba(223,250,255,.45)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5fd8ff', boxShadow: weekCount ? '0 0 8px #5fd8ff' : 'none' }} />
          {weekCount ? `${crew?.name.toUpperCase()}'S THIS WEEK ►` : 'NOTHING THIS WEEK YET'}
        </button>
        <div aria-hidden="true" style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 11px', borderRadius: 9, background: 'linear-gradient(180deg,#d6342a,#9a1d16)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3),0 2px 4px rgba(0,0,0,.4)' }}>
          <span style={{ fontFamily: "'Michroma',sans-serif", fontSize: 11, color: '#ffe27a', lineHeight: 1 }}>410W</span>
          <span style={{ fontSize: 6, letterSpacing: 1, color: 'rgba(255,255,255,.85)', marginTop: 2 }}>T·BASS</span>
        </div>
      </div>
    </div>
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).replace(/^./, (c) => c.toUpperCase());
}

function Transport({ label, aria, onClick, disabled, green }: { label: string; aria: string; onClick: () => void; disabled?: boolean; green?: boolean }) {
  return (
    <button type="button" aria-label={aria} onClick={onClick} disabled={disabled} className="kybr-transport" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, fontSize: 11, borderRadius: 5, border: 0, cursor: disabled ? 'default' : 'pointer',
      color: green ? '#1f8f5a' : '#4b4d56', opacity: disabled ? .5 : 1,
      background: green ? 'linear-gradient(180deg,#eaffe9,#bfe6c4)' : 'linear-gradient(180deg,#eceef2,#c2c4cd)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9),0 1px 2px rgba(0,0,0,.3)',
    }}>{label}</button>
  );
}

const SUNKEN: CSSProperties = { position: 'relative', background: 'linear-gradient(180deg,#0a1526,#060c18)' };
const SCAN: CSSProperties = { position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,rgba(95,216,255,.05) 0 1px,transparent 1px 3px)', pointerEvents: 'none' };
const WELL: CSSProperties = { borderRadius: 6, padding: '7px 8px', background: 'linear-gradient(180deg,#15161c,#0c0d12)', boxShadow: 'inset 0 1px 4px rgba(0,0,0,.7),inset 0 0 0 1px #34353d' };
