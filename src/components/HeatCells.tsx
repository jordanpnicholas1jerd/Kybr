import { heatWord, starFill, tapStar } from '../theme/heat';

/** The heat input (spec §4.5): five 44×44 star cells and the word. */
export function HeatCells({ value, onChange, label = 'heat' }: { value: number; onChange: (h: number) => void; label?: string }) {
  return (
    <div role="group" aria-label={`${label}: ${heatWord(value)}`} style={{ display: 'flex', alignItems: 'center', marginLeft: -10 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = starFill(value, n);
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(tapStar(value, n))}
            className="kybr-star"
            style={{ flex: 'none', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
          >
            <span style={{ position: 'relative', display: 'inline-block', fontSize: 24, lineHeight: 1, color: 'rgba(255,180,94,.2)' }}>
              ★
              <span style={{ position: 'absolute', left: 0, top: 0, width: `${fill * 100}%`, overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFB45E', textShadow: '0 0 8px rgba(255,138,61,.55)' }}>★</span>
            </span>
          </button>
        );
      })}
      <span style={{ marginLeft: 6, fontSize: 10, color: '#FFB45E', whiteSpace: 'nowrap' }}>{value ? heatWord(value) : ''}</span>
    </div>
  );
}
