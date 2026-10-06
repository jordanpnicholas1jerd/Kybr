import type { Skin } from '../theme/skins';

// LOCKED (spec §5). Order is always WIRE · CHNL · DECK · CASE · CTRL.
export type Tab = 'wire' | 'chnl' | 'deck' | 'case' | 'ctrl';
export const TABS: Tab[] = ['wire', 'chnl', 'deck', 'case', 'ctrl'];

interface Props {
  active: Tab | null;
  skin: Skin;
  onSelect: (t: Tab) => void;
  /** the strip of screen ground the tray sits on */
  ground?: string;
}

export function NavTray({ active, skin, onSelect, ground = 'transparent' }: Props) {
  return (
    <nav
      aria-label="KYBR"
      style={{ flex: 'none', padding: '10px 16px calc(16px + var(--safe-bottom))', background: ground }}
    >
      <div style={{
        display: 'flex', gap: 7, padding: 7, borderRadius: 18,
        background: 'linear-gradient(180deg,#2a2533,#171320)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,.66),inset 0 -1px 0 rgba(255,255,255,.05)',
      }}>
        {TABS.map((t) => {
          const on = t === active;
          return (
            <button
              key={t}
              type="button"
              className="kybr-navkey"
              aria-current={on ? 'page' : undefined}
              onClick={() => onSelect(t)}
              style={{
                flex: 1, minHeight: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '11px 0 10px', borderRadius: 12, cursor: 'pointer',
                background: on
                  ? 'linear-gradient(180deg,#f5f6f9,#d3d5dd 46%,#a8aab5 54%,#ced0d9)'
                  : 'linear-gradient(180deg,#dcdee4,#b6b8c1 46%,#8e909c 54%,#b2b4be)',
                border: `1px solid ${on ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.4)'}`,
                boxShadow: on
                  ? 'inset 0 1.5px 0 rgba(255,255,255,.95),inset 0 -2px 3px rgba(0,0,0,.28),0 3px 5px rgba(0,0,0,.45)'
                  : 'inset 0 1.5px 0 rgba(255,255,255,.75),inset 0 -2px 3px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.4)',
              }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: on
                  ? `radial-gradient(circle at 40% 35%,${skin.lo},${skin.c} 70%)`
                  : 'radial-gradient(circle at 40% 35%,#9a9ca6,#5f616c)',
                boxShadow: on
                  ? `0 0 9px ${skin.c},inset 0 0 2px rgba(255,255,255,.8)`
                  : 'inset 0 1px 1px rgba(0,0,0,.45),inset 0 -1px 1px rgba(255,255,255,.3)',
              }} />
              <span style={{
                fontSize: 8, letterSpacing: 1.5,
                color: on ? '#2a2433' : 'rgba(38,33,48,.64)',
                textShadow: on ? '0 1px 0 rgba(255,255,255,.6)' : '0 1px 0 rgba(255,255,255,.45)',
              }}>{t.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
