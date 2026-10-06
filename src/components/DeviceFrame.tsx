import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { Skin } from '../theme/skins';

const PHONE_H = 812;
const PHONE_W = 392;

interface Props {
  skin: Skin;
  /** the screen ground behind this device */
  screenBg: string;
  /** status bar ink, tuned per device */
  statusFg?: string;
  /** what the status bar names: the skin, or a screen label like TAPE */
  statusLabel?: string;
  children: ReactNode;
}

/**
 * The phone every screen sits in. On desktop it's the drawn 392×812 phone
 * from the prototype; on a phone it disappears and the screen fills the
 * viewport (see styles.css). Children get `--safe-top` / `--safe-bottom`.
 */
export function DeviceFrame({ skin, screenBg, statusFg = 'rgba(233,228,240,.6)', statusLabel, children }: Props) {
  const phone = useRef<HTMLDivElement>(null);

  // Shrink the drawn phone to fit short desktop windows.
  useEffect(() => {
    const fit = () => {
      const el = phone.current;
      if (!el) return;
      if (window.innerWidth <= 500) { el.style.transform = ''; return; }
      const s = Math.min(1, (window.innerHeight - 48) / PHONE_H, (window.innerWidth - 40) / PHONE_W);
      el.style.transform = s < 1 ? `scale(${s})` : '';
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="kybr-stage">
      <div ref={phone} className="kybr-phone">
        <div className="kybr-screen" style={{ background: screenBg }}>
          <div className="kybr-status" style={status(statusFg)} aria-hidden="true">
            <span>9:41</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 9, letterSpacing: 1 }}>{statusLabel ?? skin.name}</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: skin.c, boxShadow: `0 0 7px ${skin.c}` }} />
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const status = (fg: string): CSSProperties => ({
  position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
  justifyContent: 'space-between', alignItems: 'center',
  padding: '15px 24px 0', fontSize: 11, fontWeight: 500, color: fg, pointerEvents: 'none',
});
