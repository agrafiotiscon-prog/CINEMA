import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, type PointerEvent } from 'react'
import { services, type Service } from '../content/clinic'
import { Glyph } from '../components/Glyph'
import { Split } from '../components/Split'
import { Reveal } from '../components/Reveal'
import { journey } from '../lib/journeyState'
import { scrollToTarget } from '../lib/scroll'

const filters = ['All', 'Medical', 'Aesthetic'] as const
type Filter = (typeof filters)[number]

function Card({ s, index, featured }: { s: Service; index: number; featured: boolean }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const cfg = { stiffness: 120, damping: 16 }
  const srx = useSpring(rx, cfg)
  const sry = useSpring(ry, cfg)
  const gx = useMotionValue(50)
  const glare = useTransform(gx, (v) => `radial-gradient(420px circle at ${v}% 0%, rgb(255 255 255 / 0.55), transparent 60%)`)

  const move = (e: PointerEvent<HTMLElement>) => {
    if (journey.reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 7)
    rx.set(-(py - 0.5) * 6)
    gx.set(px * 100)
  }
  const leave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={`[perspective:1200px] ${featured ? 'md:col-span-2' : ''}`}
    >
      <motion.article
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: srx, rotateY: sry }}
        className="group relative flex h-full min-h-[19rem] flex-col overflow-hidden rounded-[1.25rem] border border-line bg-pearl p-7 transition-[border-color,box-shadow] duration-700 hover:border-nude-deep hover:shadow-[0_30px_80px_-40px_rgb(28_20_17/0.35)] md:min-h-[22rem] md:p-9"
        data-cursor="card"
      >
        {/* light sweep */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-none group-hover:animate-[sweep_1.4s_var(--ease-luxe)_forwards] group-hover:opacity-100" />
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" style={{ background: glare }} />
        <div className="relative flex items-start justify-between">
          <span className="label text-ink-mute">
            {String(index + 1).padStart(2, '0')} · <span className="text-rose-deep">{s.kind}</span>
          </span>
          <Glyph name={s.glyph} className="h-12 w-12 text-ink transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:rotate-[8deg] group-hover:scale-110" />
        </div>
        <h3 className={`display relative mt-auto pt-14 ${featured ? 'text-[clamp(2.2rem,3.6vw,3.6rem)]' : 'text-[clamp(1.9rem,2.4vw,2.5rem)]'} leading-[1]`}>{s.title}</h3>
        <p className={`relative mt-4 text-[0.98rem] leading-relaxed text-ink-soft ${featured ? 'max-w-[30rem]' : ''}`}>{s.body}</p>
        <span className="label relative mt-6 inline-flex items-center gap-2 text-ink-mute transition-colors duration-500 group-hover:text-rose-deep">
          <span className="h-px w-6 bg-current transition-[width] duration-700 ease-[var(--ease-luxe)] group-hover:w-12" />
          Discuss at consultation
        </span>
      </motion.article>
    </motion.li>
  )
}

export function Services() {
  const [filter, setFilter] = useState<Filter>('All')
  const list = services.filter((s) => filter === 'All' || s.kind === filter || (filter === 'Medical' && s.kind === 'Diagnostic'))

  return (
    <section id="services" data-theme="light" aria-labelledby="services-title" className="relative bg-porcelain pb-28 text-ink md:pb-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-y-8 border-t border-line pt-16 md:grid-cols-12 md:gap-x-10 md:pt-24">
          <p className="label text-rose-deep md:col-span-3 md:pt-5">02 · Treatments</p>
          <div className="md:col-span-6">
            <Split id="services-title" text={'Ten treatments.\nOne standard.'} italic={['One']} className="display text-[clamp(2.6rem,6vw,6rem)]" />
          </div>
          <Reveal className="flex items-end md:col-span-3">
            <p data-reveal className="text-[1rem] leading-relaxed text-ink-soft">
              Medical dermatology and aesthetic treatment under one roof, delivered by the same dermatologists, held to the same clinical standard.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 md:mt-20">
          <div role="group" aria-label="Filter treatments" className="flex gap-2 rounded-full border border-line p-1.5">
            {filters.map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`label relative rounded-full px-5 py-2.5 transition-colors duration-500 ${filter === f ? 'text-pearl' : 'text-ink-soft hover:text-ink'}`}
              >
                {filter === f && <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} />}
                <span className="relative">{f}</span>
              </button>
            ))}
          </div>
          <a href="#book" onClick={(e) => (e.preventDefault(), scrollToTarget('#book'))} className="label text-ink-soft underline decoration-line underline-offset-8 hover:text-ink">
            Not sure where to start? Begin with skin analysis
          </a>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((s, i) => (
              <Card key={s.id} s={s} index={services.indexOf(s)} featured={i === 0 && filter === 'All'} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}
