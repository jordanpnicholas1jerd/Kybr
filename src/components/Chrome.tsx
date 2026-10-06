import type { CSSProperties, ReactNode } from 'react';

/** Chrome-metal title text (spec §4.2). */
export function ChromeText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "'Michroma',sans-serif",
      background: 'linear-gradient(180deg,#fff,#e3e4ec 26%,#9a9bae 50%,#74758a 53%,#cfd0db 76%,#fff)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      ...style,
    }}>{children}</span>
  );
}

/** Dark chrome text for light metal faceplates (BURN, CHNL headers). */
export function DarkChromeText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{
      fontFamily: "'Michroma',sans-serif",
      background: 'linear-gradient(180deg,#3a3a44,#6f7180 48%,#2b2c34 52%,#54555f)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      ...style,
    }}>{children}</span>
  );
}
