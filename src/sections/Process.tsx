import { useLayoutEffect, useRef } from 'react'
import { processSteps } from '../content/clinic'
import { Reveal } from '../components/Reveal'
import { Split } from '../components/Split'
import { gsap } from '../lib/scroll'
import { journey } from '../lib/journeyState'

export function Process() {
  const line = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLOListElement>(null)
  useLayoutEffect(() => {
    if (!line.current || !wrap.current) return
    if (journey.reduced) {
      gsap.set(line.current, { scaleX: 1, scaleY: 1 })
      return
    }
    const t = gsap.fromTo(
      line.current,
      { scaleX: 0, scaleY: 0 },
      { scaleX: 1, scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap.current, start: 'top 75%', end: 'bottom 60%', scrub: 1 } },
    )
    return () => {
      t.scrollTrigger?.kill()
      t.kill()
    }
  }, [])

  return (
    <section id="process" data-theme="dark" aria-labelledby="process-title" className="on-dark relative overflow-hidden bg-espresso py-28 text-pearl md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-10">
          <p className="label text-rose md:col-span-3 md:pt-5">05 · The process</p>
          <div className="md:col-span-9">
            <Split id="process-title" text={'Four steps.\nNo shortcuts.'} italic={['No']} className="display text-[clamp(2.6rem,6vw,6rem)]" />
          </div>
        </div>

        <ol ref={wrap} className="relative mt-16 grid gap-12 md:mt-28 md:grid-cols-4 md:gap-8">
          {/* drawn timeline */}
          <div aria-hidden="true" className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-pearl/15 md:left-0 md:top-[7px] md:h-px md:w-full">
            <div ref={line} className="h-full w-full origin-top bg-rose md:origin-left" />
          </div>
          {processSteps.map((s) => (
            <li key={s.n} className="relative pl-10 md:pl-0 md:pt-14">
              <span aria-hidden="true" className="absolute left-0 top-1 h-[15px] w-[15px] rounded-full border border-rose bg-espresso md:top-0" />
              <Reveal y={22}>
                <p data-reveal className="label flex items-center justify-between text-pearl/60">
                  <span>Step {s.n}</span>
                  <span className="text-rose">{s.duration}</span>
                </p>
                <h3 data-reveal className="display mt-5 text-[clamp(2rem,2.8vw,2.8rem)] leading-none">
                  {s.title}
                </h3>
                <p data-reveal className="mt-5 max-w-[22rem] text-[0.98rem] leading-relaxed text-pearl/75">
                  {s.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
