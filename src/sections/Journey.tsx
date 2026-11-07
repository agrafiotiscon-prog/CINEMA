import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, ScrollTrigger, scrollToTarget } from '../lib/scroll'
import { journey, type Tier } from '../lib/journeyState'
import { chapters, chapterAt, W, smooth, type ChapterId } from '../lib/timeline'
import { Split } from '../components/Split'
import { Arrow, Magnetic } from '../components/Magnetic'

const Experience = lazy(() => import('../three/Experience'))

interface ChapterCopy {
  id: ChapterId
  fig: string
  kicker: string
  title: string
  italic?: string[]
  body: string
  spec?: string
  align: 'left' | 'right'
}

const copy: ChapterCopy[] = [
  {
    id: 'epidermis',
    fig: 'Fig. 02',
    kicker: 'Epidermis · 0.05 to 0.1 mm',
    title: 'The first\nfifty layers.',
    italic: ['fifty'],
    body: 'Living cells rise from the basal layer, flatten and seal into a barrier thinner than paper. It keeps water in and the world out. Every treatment we offer begins by protecting it.',
    spec: 'Stratum corneum · granulosum · spinosum · basale',
    align: 'right',
  },
  {
    id: 'dermis',
    fig: 'Fig. 03',
    kicker: 'Dermis · collagen & elastin',
    title: 'Structure\nis youth.',
    italic: ['is'],
    body: 'Beneath, a woven lattice of collagen gives skin its strength and elastin its spring, cushioned by hyaluronic acid. With time and sun, the weave loosens. Good dermatology helps it reorganise.',
    spec: 'Type I & III collagen · elastin · hyaluronan',
    align: 'left',
  },
  {
    id: 'laser',
    fig: 'Fig. 04a',
    kicker: 'Treatment · Laser resurfacing',
    title: 'Light, placed\nwith precision.',
    italic: ['precision.'],
    body: 'A fractional beam creates thousands of microscopic treatment zones, leaving healthy tissue between them to drive fast, even renewal of texture and tone.',
    spec: 'Fractional · ablative & non-ablative',
    align: 'right',
  },
  {
    id: 'needling',
    fig: 'Fig. 04b',
    kicker: 'Treatment · Microneedling',
    title: 'A signal,\nnot a wound.',
    italic: ['signal,'],
    body: 'Fine, sterile needles create controlled micro-channels. The skin answers with a regeneration pulse, laying down new collagen in the weeks that follow.',
    spec: '0.25 to 2.0 mm · medical grade',
    align: 'left',
  },
  {
    id: 'peel',
    fig: 'Fig. 04c',
    kicker: 'Treatment · Chemical peels',
    title: 'Dissolve\nthe dull.',
    italic: ['dull.'],
    body: 'Carefully chosen acids loosen the bonds between tired surface cells, so they lift away and reveal the smoother, brighter layer beneath.',
    spec: 'Glycolic · salicylic · TCA',
    align: 'right',
  },
  {
    id: 'volume',
    fig: 'Fig. 04d',
    kicker: 'Treatment · Injectables',
    title: 'Restore,\nnever remake.',
    italic: ['never'],
    body: 'Hyaluronic acid filler supports what time has softened, and anti-wrinkle injections relax overactive lines. We use small amounts, in the right place, for a result nobody can name.',
    spec: 'Hyaluronic acid · botulinum toxin',
    align: 'left',
  },
]

function useIsDesktop() {
  const [d, setD] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)')
    const on = () => setD(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return d
}

function Panel({ id, children, className = '', exit: withExit = true }: { id: ChapterId; children: ReactNode; className?: string; exit?: boolean }) {
  const span = chapters.find((c) => c.id === id)!.span
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const inner = el.querySelector<HTMLElement>('[data-panel-inner]')!
    const items = inner.querySelectorAll<HTMLElement>('[data-reveal]')
    const enter = gsap.fromTo(
      items,
      { opacity: 0, y: journey.reduced ? 0 : 24 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 55%', toggleActions: 'play none none reverse' } },
    )
    const exit = withExit && gsap.to(inner, {
      opacity: 0,
      y: journey.reduced ? 0 : -50,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'bottom 98%', end: 'bottom 50%', scrub: true },
    })
    return () => {
      enter.scrollTrigger?.kill()
      enter.kill()
      if (exit) {
        exit.scrollTrigger?.kill()
        exit.kill()
      }
    }
  }, [withExit])
  return (
    <div ref={ref} className="relative" style={{ height: `${span * 100}svh` }} data-chapter={id}>
      <div data-panel-inner className={`sticky top-0 flex h-[100svh] w-full ${className}`}>
        {children}
      </div>
    </div>
  )
}

export function Journey({ tier, webgl, intro, onProgress, onFail }: { tier: Tier; webgl: boolean; intro: boolean; onProgress: (stage: 'chunk' | 'ready') => void; onFail: () => void }) {
  const root = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const depthRef = useRef<HTMLSpanElement>(null)
  const layerRef = useRef<HTMLSpanElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)
  const [ready, setReady] = useState(false)
  const [chapter, setChapter] = useState<ChapterId>('surface')
  const desktop = useIsDesktop()

  // scrub journey progress with GSAP ScrollTrigger
  useLayoutEffect(() => {
    const el = root.current!
    const tween = gsap.to(journey, {
      progress: 1,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: journey.reduced ? true : 1.1 },
    })
    const vis = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (s) => setActive(s.isActive),
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      vis.kill()
    }
  }, [])

  // HUD + light ramp + reduced-motion crossfades, driven from the same scrubbed progress
  useEffect(() => {
    let current: ChapterId = 'surface'
    let swapTimer = 0
    const update = () => {
      const p = journey.progress
      const light = smooth(W.renewal.start + 0.02, 0.985, p)
      root.current?.style.setProperty('--light', light.toFixed(3))
      const c = chapterAt(p)
      if (c.id !== current) {
        current = c.id
        setChapter(c.id)
        if (journey.reduced && fadeRef.current) {
          fadeRef.current.style.opacity = '1'
          clearTimeout(swapTimer)
          swapTimer = window.setTimeout(() => {
            journey.reducedP = c.keyProgress
            if (fadeRef.current) fadeRef.current.style.opacity = '0'
          }, 650)
        }
      }
      // documentary readout: approximate tissue depth in mm
      const depth =
        p < W.epidermis.start ? 0 : p < W.dermis.start ? 0.1 * smooth(W.epidermis.start, W.dermis.start, p) : p < W.laser.start ? 0.1 + 1.9 * smooth(W.dermis.start, W.laser.start, p) : 0
      if (depthRef.current) depthRef.current.textContent = p >= W.laser.start ? 'n/a' : depth.toFixed(2)
      if (railRef.current) railRef.current.style.transform = `scaleY(${p.toFixed(4)})`
    }
    journey.reducedP = chapters[0].keyProgress
    gsap.ticker.add(update)
    return () => {
      gsap.ticker.remove(update)
      clearTimeout(swapTimer)
    }
  }, [])

  useEffect(() => {
    if (layerRef.current) layerRef.current.textContent = layerName[chapter]
  }, [chapter])

  const onReady = () => {
    setReady(true)
    onProgress('ready')
  }

  return (
    <section
      id="journey"
      ref={root}
      data-theme="dark"
      aria-label="A journey into the skin"
      className="on-dark relative bg-espresso text-pearl"
      style={{ ['--light' as string]: '0' }}
    >
      {/* sticky stage */}
      <div ref={stickyRef} className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <Poster chapter={chapter} visible={!webgl || !ready} />
        {webgl && (
          <div className={`absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-luxe)] ${ready ? 'opacity-100' : 'opacity-0'}`}>
            <Suspense fallback={null}>
              <ChunkSignal onLoaded={() => onProgress('chunk')} />
              <Experience initialTier={tier} active={active} onReady={onReady} onFail={onFail} />
            </Suspense>
          </div>
        )}
        {/* reduced-motion crossfade veil */}
        <div ref={fadeRef} className="pointer-events-none absolute inset-0 bg-espresso opacity-0 transition-opacity duration-[650ms]" />
        {/* legibility scrims (fade away as the scene turns light) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 'calc(1 - var(--light))',
            background: desktop
              ? 'linear-gradient(90deg, rgb(13 9 8 / 0.62) 0%, rgb(13 9 8 / 0.18) 38%, transparent 55%, transparent 62%, rgb(13 9 8 / 0.18) 78%, rgb(13 9 8 / 0.55) 100%)'
              : 'linear-gradient(0deg, rgb(13 9 8 / 0.82) 0%, rgb(13 9 8 / 0.45) 42%, transparent 70%)',
          }}
        />
        {/* HUD */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ color: 'color-mix(in oklab, var(--color-pearl), var(--color-ink) calc(var(--light) * 100%))' }}>
          <div className="absolute right-5 top-1/2 hidden h-[44vh] -translate-y-1/2 md:right-10 md:flex">
            <div className="relative mr-4 w-px bg-current/20">
              <div ref={railRef} className="absolute inset-x-0 top-0 h-full origin-top bg-rose" style={{ transform: 'scaleY(0)' }} />
            </div>
            <ol className="flex flex-col justify-between">
              {chapters.map((c, i) => (
                <li key={c.id} className={`label !text-[0.6rem] transition-opacity duration-700 ${c.id === chapter ? 'opacity-100' : 'opacity-40'}`}>
                  {String(i + 1).padStart(2, '0')} {shortName[c.id]}
                </li>
              ))}
            </ol>
          </div>
          <div className="absolute bottom-6 left-5 hidden items-center gap-6 md:left-10 md:flex">
            <span className="label opacity-70">
              Depth <span ref={depthRef} className="tabular-nums">0.00</span> mm
            </span>
            <span className="h-px w-10 bg-current/30" />
            <span ref={layerRef} className="label opacity-70">
              {layerName.surface}
            </span>
          </div>
        </div>
      </div>

      {/* scrolling chapter copy */}
      <div className="relative -mt-[100svh] overflow-x-clip">
        <Panel id="surface" className="items-end pb-[14svh] md:items-center md:pb-0">
          <Hero intro={intro} />
        </Panel>
        {copy.map((c) => (
          <Panel key={c.id} id={c.id} className={`items-end pb-[11svh] md:items-center md:pb-0 ${c.align === 'right' ? 'md:justify-end' : ''}`}>
            <ChapterText c={c} />
          </Panel>
        ))}
        <Panel id="renewal" exit={false} className="items-end pb-[12svh] md:items-end md:pb-[14svh]">
          <div className="mx-auto w-full max-w-[1600px] px-5 text-ink md:px-10" style={{ opacity: 'clamp(0, (var(--light) - 0.66) * 4, 1)' }}>
            <div className="grid gap-8 md:grid-cols-12">
              <p data-reveal className="label md:col-span-12">
                <span className="text-rose-deep">Fig. 05</span> · Resurface · Renewal
              </p>
              <h2 data-reveal className="display text-[clamp(3rem,9vw,9.5rem)] md:col-span-8">
                Renewed,
                <br />
                <em>not altered.</em>
              </h2>
              <div data-reveal className="self-end md:col-span-4 md:pb-4">
                <p className="max-w-sm text-[1.05rem] leading-relaxed opacity-90">
                  Healthy skin is skin that works: a sound barrier, an organised dermis, an even surface. That is what we treat for. Luminosity follows.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  )
}

const shortName: Record<ChapterId, string> = {
  surface: 'Surface',
  epidermis: 'Epidermis',
  dermis: 'Dermis',
  laser: 'Laser',
  needling: 'Needling',
  peel: 'Peel',
  volume: 'Volume',
  renewal: 'Renewal',
}
const layerName: Record<ChapterId, string> = {
  surface: 'Surface · macro ×40',
  epidermis: 'Stratified epidermis',
  dermis: 'Papillary & reticular dermis',
  laser: 'Specimen · laser',
  needling: 'Specimen · microneedling',
  peel: 'Specimen · chemical peel',
  volume: 'Specimen · injectables',
  renewal: 'Specimen · renewed',
}

function ChunkSignal({ onLoaded }: { onLoaded: () => void }) {
  const once = useRef(onLoaded)
  useEffect(() => {
    once.current()
  }, [])
  return null
}

function Hero({ intro }: { intro: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 md:px-10">
      <div className="max-w-[56rem]">
        <p className="label mb-6 text-rose md:mb-8">
          Fig. 01 · Medical & aesthetic dermatology
        </p>
        <Split as="h1" text={'Skin,\nunderstood.'} italic={['understood']} play={intro} scroll={false} delay={0.1} stagger={0.12} className="display text-[clamp(3.6rem,12.5vw,12rem)] leading-[0.9]" />
        <div className={`mt-8 grid gap-7 transition-all delay-500 duration-[1400ms] ease-[var(--ease-luxe)] md:mt-12 md:grid-cols-[minmax(0,26rem)_auto] md:items-center md:gap-14 ${intro ? 'translate-y-0' : 'translate-y-5'}`}>
          <p className="max-w-[26rem] text-[1.05rem] leading-relaxed text-pearl/85 md:text-[1.12rem]">
            Medical and aesthetic dermatology, practised with the precision of a laboratory and the calm of a sanctuary.
          </p>
          <div>
            <Magnetic href="#book" variant="light" onClick={(e) => (e.preventDefault(), scrollToTarget('#book'))}>
              Book a consultation <Arrow />
            </Magnetic>
          </div>
        </div>
      </div>
      <a
        href="#epidermis"
        onClick={(e) => (e.preventDefault(), scrollToTarget(window.innerHeight * 1.7))}
        className={`label absolute bottom-[4.5svh] right-5 hidden items-center gap-3 py-3 text-pearl/75 transition-opacity delay-700 duration-1000 hover:text-pearl md:right-10 md:inline-flex ${intro ? 'opacity-100' : 'opacity-0'}`}
      >
        Scroll to go deeper
        <span className="relative block h-8 w-px overflow-hidden bg-pearl/25">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_var(--ease-silk)_infinite] bg-rose motion-reduce:animate-none" />
        </span>
      </a>
    </div>
  )
}

function ChapterText({ c }: { c: ChapterCopy }) {
  const [first, second] = c.title.split('\n')
  const ital = (s: string) =>
    s.split(' ').map((w, i, a) => (
      <span key={i}>
        {c.italic?.includes(w.replace(/[.,]/g, '')) || c.italic?.includes(w) ? <em>{w}</em> : w}
        {i < a.length - 1 ? ' ' : ''}
      </span>
    ))
  return (
    <div
      className={`relative isolate w-full px-5 md:w-[46%] md:max-w-[40rem] md:px-10 ${c.align === 'right' ? 'md:mr-[7vw]' : 'md:ml-[2vw]'} before:pointer-events-none before:absolute before:-inset-x-[18%] before:-inset-y-[35%] before:-z-10 before:bg-[radial-gradient(closest-side,rgb(13_9_8/0.62),rgb(13_9_8/0.25)_60%,transparent)] before:content-['']`}
    >
      <p data-reveal className="label mb-5 flex items-center gap-3 text-pearl/75">
        <span className="text-rose">{c.fig}</span>
        <span className="h-px w-8 bg-pearl/30" />
        {c.kicker}
      </p>
      <h2 data-reveal className="display text-[clamp(2.7rem,6.2vw,6.4rem)]">
        {ital(first)}
        <br />
        {ital(second)}
      </h2>
      <p data-reveal className="mt-6 max-w-[30rem] text-[1rem] leading-relaxed text-pearl/85 md:mt-8 md:text-[1.08rem]">
        {c.body}
      </p>
      {c.spec && (
        <p data-reveal className="label mt-6 text-pearl/60">
          {c.spec}
        </p>
      )}
    </div>
  )
}

function Poster({ chapter, visible }: { chapter: ChapterId; visible: boolean }) {
  const ids: ChapterId[] = ['surface', 'epidermis', 'dermis', 'laser', 'needling', 'peel', 'volume', 'renewal']
  return (
    <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${visible ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true">
      {ids.map((id, i) => (
        <img
          key={id}
          src={`${import.meta.env.BASE_URL}posters/${id}.jpg`}
          alt=""
          decoding="async"
          fetchPriority={i === 0 ? 'high' : 'low'}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${chapter === id ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  )
}
