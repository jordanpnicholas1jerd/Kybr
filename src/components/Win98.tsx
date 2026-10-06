import type { CSSProperties, ReactNode } from 'react';
import type { Skin } from '../theme/skins';

// Windows 98 chrome for CTRL (spec §6.6).

export const WIN_GREY = '#c0c0c0';
const TITLE_BG = 'linear-gradient(90deg,#0a1f8c,#1466c8 70%,#3a8fdf)';

export function Win98Window({ title, skin, onClose, children, style, menu }: {
  title: string; skin: Skin; onClose?: () => void; children: ReactNode; style?: CSSProperties; menu?: boolean;
}) {
  return (
    <section aria-label={title} style={{ background: WIN_GREY, border: '2px outset #dedede', boxShadow: '2px 3px 8px rgba(0,0,0,.4)', color: '#000', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 4px', background: TITLE_BG }}>
        <span style={{ width: 14, height: 14, borderRadius: 2, flex: 'none', background: `linear-gradient(135deg,${skin.c},${skin.hi})`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.3)' }} />
        <span style={{ flex: 1, fontSize: 9, fontWeight: 500, color: '#fff', letterSpacing: .3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {onClose && (
          <button type="button" aria-label="close" onClick={onClose} style={{ position: 'relative', width: 15, height: 13, padding: 0, background: WIN_GREY, border: '1px outset #dedede', fontSize: 9, lineHeight: 1, color: '#000', cursor: 'pointer' }}>
            ✕<span style={{ position: 'absolute', inset: -15 }} />
          </button>
        )}
      </div>
      {menu && (
        <div style={{ display: 'flex', gap: 11, padding: '2px 7px', fontSize: 8.5, borderBottom: '1px solid #9a9a9a' }} aria-hidden="true">
          <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
        </div>
      )}
      {children}
    </section>
  );
}

export function WinButton({ children, onClick, disabled, primary, style, type = 'button' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; primary?: boolean; style?: CSSProperties; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="kybr-winbtn"
      style={{
        position: 'relative', minHeight: 26, minWidth: 54, padding: '0 9px', fontSize: 8.5, color: disabled ? '#808080' : '#000',
        textShadow: disabled ? '1px 1px 0 #fff' : undefined,
        background: WIN_GREY, border: '2px outset #dedede', outline: primary ? '1px solid #000' : undefined, cursor: disabled ? 'default' : 'pointer', ...style,
      }}
    >
      {children}
      {/* 44px touch target around the small Win98 button */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: -9, bottom: -9 }} />
    </button>
  );
}

export const WELL: CSSProperties = { background: '#fff', border: '2px inset #dedede' };
