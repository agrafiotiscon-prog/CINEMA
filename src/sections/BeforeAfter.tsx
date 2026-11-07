import { useRef, useState, type PointerEvent } from 'react'
import { MaskReveal, Reveal } from '../components/Reveal'
import { Split } from '../components/Split'

/**
 * Procedurally generated, clearly illustrative skin textures (SVG turbulence). Not patient photography.
 */
function SkinTexture({ variant }: { variant: 'before' | 'after' }) {
  const before = variant === 'before'
  const id = `skin-${variant}`
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`${id}-tex`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={before ? '0.9' : '0.75'} numOctaves="3" seed="7" result="n" />
          <feDiffuseLighting in="n" lightingColor="#f3d2c0" surfaceScale={before ? 2.6 : 0.9} result="lit">
            <feDistantLight azimuth="235" elevation="58" />
          </feDiffuseLighting>
          <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
        <filter id={`${id}-blot`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.78  0 0 0 0 0.36  0 0 0 0 0.32  0 0 0 2.2 -1.05" />
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id={`${id}-light`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity={before ? 0.18 : 0.42} />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill={before ? '#cf9d86' : '#ddb39e'} />
      <rect width="800" height="600" fill="#fff" filter={`url(#${id}-tex)`} opacity={before ? 0.55 : 0.32} style={{ mixBlendMode: 'multiply' }} />
      {before && <rect width="800" height="600" filter={`url(#${id}-blot)`} opacity="0.55" />}
      {before &&
        [
          [180, 220, 7],
          [520, 160, 5],
          [610, 400, 8],
          [300, 430, 6],
          [420, 300, 4],
          [700, 250, 5],
        ].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#a8604d" opacity="0.45" />)}
      <rect width="800" height="600" fill={`url(#${id}-light)`} style={{ mixBlendMode: 'soft-light' }} />
    </svg>
  )
}

export function BeforeAfter() {
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const fromPointer = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
  }

  return (
    <section id="results" data-theme="light" aria-labelledby="results-title" className="relative bg-porcelain py-28 text-ink md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <p className="label text-rose-deep">04 · Outcomes</p>
            <Split id="results-title" text={'Measured\nagainst you.'} italic={['you.']} className="display mt-8 text-[clamp(2.6rem,5vw,5rem)]" />
            <Reveal className="mt-8 space-y-6">
              <p data-reveal className="text-[1.03rem] leading-relaxed text-ink-soft">
                We photograph your skin under standardised light at your first visit and at each review, so progress is something you can see, not something you are told.
              </p>
              <p data-reveal className="text-[0.92rem] leading-relaxed text-ink-mute">
                Drag the handle, or focus it and use the arrow keys, to compare.
              </p>
            </Reveal>
          </div>

          <div className="md:col-span-8">
            <MaskReveal className="rounded-[1.25rem]">
              <div
                ref={box}
                className="relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-[1.25rem] bg-nude md:aspect-[16/11]"
                onPointerDown={(e) => {
                  dragging.current = true
                  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
                  fromPointer(e)
                }}
                onPointerMove={(e) => dragging.current && fromPointer(e)}
                onPointerUp={() => (dragging.current = false)}
                onPointerCancel={() => (dragging.current = false)}
                data-cursor="magnet"
              >
                <SkinTexture variant="after" />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                  <SkinTexture variant="before" />
                </div>
                <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
                  <div className="absolute inset-y-0 -translate-x-1/2 border-l border-pearl/90" />
                  <div className="absolute top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-pearl bg-ink/30 text-pearl backdrop-blur-md">
                    <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">
                      <path d="M5 1L1 5l4 4M17 1l4 4-4 4M1 5h20" fill="none" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
                <span className="label absolute left-4 top-4 rounded-full bg-ink/55 px-3 py-2 text-pearl backdrop-blur">Before</span>
                <span className="label absolute right-4 top-4 rounded-full bg-pearl/80 px-3 py-2 text-ink backdrop-blur">After</span>
                <span className="placeholder-tag absolute bottom-4 left-4 bg-pearl/85 text-ink">Illustrative simulation · not a patient photograph</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(pos)}
                  onChange={(e) => setPos(+e.target.value)}
                  aria-label="Before and after comparison, illustrative"
                  aria-valuetext={`${Math.round(pos)}% before`}
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-0"
                  onFocus={(e) => e.currentTarget.parentElement!.classList.add('ring-2', 'ring-rose-deep', 'ring-offset-4', 'ring-offset-porcelain')}
                  onBlur={(e) => e.currentTarget.parentElement!.classList.remove('ring-2', 'ring-rose-deep', 'ring-offset-4', 'ring-offset-porcelain')}
                />
              </div>
            </MaskReveal>
            <p className="label mt-4 text-ink-mute">Fig. 06 · Texture & tone, simulated. Individual results vary.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
