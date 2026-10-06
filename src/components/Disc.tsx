import type { CSSProperties } from 'react';

/** CD-R iridescence (spec §4.3): discs, avatars, album art. */
export function Disc({ size, spin = '9s', rings = size >= 80, style, paused }: { size: number; spin?: string; rings?: boolean; style?: CSSProperties; paused?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: size, height: size, flex: 'none', ...style }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', clipPath: 'circle(50%)', isolation: 'isolate',
        background: 'radial-gradient(circle,#2a1f3a 0%,#46326b 46%,#211633 76%)',
        boxShadow: '0 14px 28px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.22)',
      }}>
        <div style={{
          position: 'absolute', inset: '-12%', borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.55,
          background: 'conic-gradient(from 0deg,#c9a6ff,#8fd9ff,#ffb3e6,#ffe6a8,#a8ffd1,#bfa6ff,#8fd9ff,#ffb3e6,#c9a6ff)',
          animation: `kybrSpin ${spin} linear infinite ${paused ? 'paused' : 'running'}`,
        }} />
        {rings && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-radial-gradient(circle at 50% 50%,transparent 0 2px,rgba(255,255,255,.15) 2px 3px)' }} />}
        {size >= 80 && <div style={{ position: 'absolute', top: '-8%', left: '-6%', width: '60%', height: '46%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.5),transparent 62%)', filter: 'blur(3px)' }} />}
      </div>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '28%', height: '28%', borderRadius: '50%',
        background: 'radial-gradient(circle,#160f20 0 32%,#8a76b8 34% 46%,#3a2c55 47% 70%,#160f20 71%)',
      }} />
    </div>
  );
}
