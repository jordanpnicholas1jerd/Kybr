// A single seven-segment LED digit, for the answering machine's message counter.

//   a
// f   b
//   g
// e   c
//   d
const SEGMENTS: Record<string, string> = {
  a: '6,2 34,2 29,7 11,7',
  b: '35,4 35,33 30,30 30,9',
  c: '35,37 35,66 30,61 30,40',
  d: '6,68 34,68 29,63 11,63',
  e: '5,37 5,66 10,61 10,40',
  f: '5,4 5,33 10,30 10,9',
  g: '7,35 12,32 28,32 33,35 28,38 12,38',
};

const DIGITS: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg',
  '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
  '-': 'g', ' ': '',
};

interface Props {
  char: string;
  on?: string;
  height?: number;
}

export function SevenSeg({ char, on = '#ff3b30', height = 64 }: Props) {
  const lit = DIGITS[char] ?? '';
  return (
    <svg viewBox="0 0 40 70" height={height} width={(height * 40) / 70} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {Object.entries(SEGMENTS).map(([seg, pts]) => {
        const isOn = lit.includes(seg);
        return (
          <polygon
            key={seg}
            points={pts}
            transform="skewX(-6) translate(4 0)"
            fill={isOn ? on : 'rgba(255,59,48,.07)'}
            style={isOn ? { filter: `drop-shadow(0 0 3px ${on})` } : undefined}
          />
        );
      })}
    </svg>
  );
}
