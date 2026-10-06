/** Green LCD toast (prototype): "✓ etched · kept in your case". */
export function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div role="status" style={{ position: 'absolute', top: 'calc(var(--safe-top) + 2px)', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        maxWidth: '90%', padding: '8px 14px', borderRadius: 999, fontSize: 9.5, letterSpacing: .5, color: '#a8ffcf',
        background: 'linear-gradient(180deg,#0e2418,#06120c)', boxShadow: '0 6px 18px rgba(0,0,0,.5),inset 0 0 0 1px rgba(124,255,176,.35)',
        textShadow: '0 0 6px rgba(124,255,176,.5)', animation: 'kybrRise .25s ease both', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>✓ {text}</div>
    </div>
  );
}
