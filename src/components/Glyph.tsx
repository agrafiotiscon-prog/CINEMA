import type { GlyphName } from '../content/clinic'

/** Hand-drawn specimen glyphs (inline SVG, stroke = currentColor). No emoji, no icon fonts. */
export function Glyph({ name, className = '' }: { name: GlyphName; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round' as const }
  const g: Record<GlyphName, React.ReactNode> = {
    analysis: (
      <>
        <circle cx="24" cy="24" r="17" {...p} />
        <circle cx="24" cy="24" r="10" {...p} strokeDasharray="2 3" />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <path d="M24 2v8M24 38v8M2 24h8M38 24h8" {...p} />
      </>
    ),
    mole: (
      <>
        <path d="M24 13c6 0 11 4 11 10 0 7-6 12-12 12s-10-4-10-10c0-7 5-12 11-12z" {...p} />
        <circle cx="23" cy="24" r="4" fill="currentColor" opacity=".7" />
        <circle cx="24" cy="24" r="19" {...p} strokeDasharray="1 4" />
      </>
    ),
    acne: (
      <>
        <circle cx="17" cy="20" r="5" {...p} />
        <circle cx="30" cy="16" r="3" {...p} />
        <circle cx="29" cy="31" r="6.5" {...p} />
        <circle cx="16" cy="33" r="2" {...p} />
        <circle cx="29" cy="31" r="2" fill="currentColor" opacity=".6" />
      </>
    ),
    eczema: (
      <>
        <path d="M6 16c4-3 8 3 12 0s8-3 12 0 8 3 12 0" {...p} />
        <path d="M6 24c4-3 8 3 12 0s8-3 12 0 8 3 12 0" {...p} />
        <path d="M6 32c4-3 8 3 12 0s8-3 12 0 8 3 12 0" {...p} />
      </>
    ),
    psoriasis: (
      <>
        <path d="M8 30c5-8 13-8 18 0" {...p} />
        <path d="M18 24c5-8 13-8 18 0" {...p} />
        <path d="M14 38c5-8 13-8 18 0" {...p} />
        <path d="M24 18c4-6 10-6 14 0" {...p} />
      </>
    ),
    toxin: (
      <>
        <path d="M8 16c5 4 27 4 32 0" {...p} />
        <path d="M8 24c5 2.5 27 2.5 32 0" {...p} />
        <path d="M8 32h32" {...p} />
        <circle cx="24" cy="9" r="1.6" fill="currentColor" />
      </>
    ),
    filler: (
      <>
        <path d="M6 30c6 0 8-10 18-10s12 10 18 10" {...p} />
        <path d="M6 36c6 0 8-4 18-4s12 4 18 4" {...p} strokeDasharray="2 3" />
        <path d="M24 6c3 4 5 7 5 9a5 5 0 0 1-10 0c0-2 2-5 5-9z" {...p} />
      </>
    ),
    peel: (
      <>
        <path d="M6 36h36M6 30h36" {...p} />
        <path d="M6 23h18c6 0 10-6 16-10" {...p} />
        <circle cx="36" cy="9" r="1" fill="currentColor" />
        <circle cx="41" cy="14" r="1" fill="currentColor" />
        <circle cx="31" cy="12" r=".8" fill="currentColor" />
      </>
    ),
    laser: (
      <>
        <path d="M24 4v30" {...p} />
        <path d="M24 34l-9 8M24 34l9 8M24 34v9" {...p} opacity=".6" />
        <path d="M6 38h36" {...p} />
        <circle cx="24" cy="34" r="2" fill="currentColor" />
      </>
    ),
    needle: (
      <>
        {[0, 1, 2, 3, 4].map((x) =>
          [0, 1, 2, 3, 4].map((y) => <circle key={`${x}${y}`} cx={10 + x * 7} cy={10 + y * 7} r={x === 2 && y === 2 ? 2 : 1.1} fill="currentColor" opacity={x === 2 && y === 2 ? 1 : 0.65} />),
        )}
        <circle cx="24" cy="24" r="9" {...p} opacity=".5" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {g[name]}
    </svg>
  )
}
