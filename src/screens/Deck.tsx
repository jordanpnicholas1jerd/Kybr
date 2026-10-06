import { ChromeText } from '../components/Chrome';
import { Disc } from '../components/Disc';
import type { Profile } from '../data';

export const DECK_SCREEN = '#150f1f';

/** DECK arrives in Phase 2 with Top 8 and album reviews. Until then, the sleeve. */
export function Deck({ profile }: { profile: Profile }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 'calc(196px + var(--safe-top) - 40px)', flex: 'none', overflow: 'hidden', background: 'linear-gradient(150deg,#3d2560,#1d1230)' }}>
        <div style={{ position: 'absolute', right: -90, top: 'calc(var(--safe-top) - 30px)' }}><Disc size={250} spin="20s" /></div>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,#150f1f 22%,rgba(21,15,31,.55) 52%,transparent 76%)' }} />
        <div style={{ position: 'absolute', left: 22, bottom: 22 }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(233,228,240,.6)' }}>DECK · SIDE A</div>
          <h1 style={{ margin: '6px 0 0', fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 25, letterSpacing: 4, background: 'linear-gradient(180deg,#ffffff,#d9c6ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{profile.displayName.toUpperCase()}</h1>
          <div style={{ fontSize: 9, color: '#c9a6ff', marginTop: 4 }}>@{profile.handle}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 32px', textAlign: 'center' }}>
        <ChromeText style={{ fontSize: 12, letterSpacing: 3 }}>SIDE B · COMING NEXT</ChromeText>
        <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.7, color: 'rgba(233,228,240,.72)' }}>your profile song, liner notes, top 8 and album reviews press onto this sleeve in phase 2.</p>
      </div>
    </div>
  );
}
