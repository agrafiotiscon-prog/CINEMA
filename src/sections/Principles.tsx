import { Counter } from '../components/Counter'
import { Reveal } from '../components/Reveal'
import { Split } from '../components/Split'

const stats = [
  { n: 45, suffix: ' min', label: 'First consultation, never rushed' },
  { n: 12, suffix: '\u2011point', label: 'Skin analysis protocol' },
  { n: 6, suffix: ' weeks', label: 'Standard follow-up review' },
  { n: 1, suffix: ' plan', label: 'Written, personal, no packages' },
]

export function Principles() {
  return (
    <section id="approach" data-theme="light" aria-labelledby="approach-title" className="relative bg-porcelain pb-28 pt-10 text-ink md:pb-40 md:pt-16">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-y-10 md:grid-cols-12 md:gap-x-10">
          <p className="label text-rose-deep md:col-span-3 md:pt-6">01 · The approach</p>
          <div className="md:col-span-9">
            <Split
              id="approach-title"
              text={'Medicine first.\nBeauty, as a consequence.'}
              italic={['Beauty,', 'consequence.']}
              className="display text-[clamp(2.6rem,6.4vw,6.6rem)]"
            />
            <Reveal className="mt-10 grid gap-8 md:mt-14 md:grid-cols-2 md:gap-14">
              <p data-reveal className="max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-soft">
                Every visit starts with diagnosis. We look at your skin the way a dermatologist should: closely, under magnification, with your full history in mind. Only then do we talk about treatment, and that includes the option of doing nothing at all.
              </p>
              <p data-reveal className="max-w-[34rem] text-[1.08rem] leading-relaxed text-ink-soft">
                Our aesthetic work follows the same discipline. Measured doses, conservative plans, and results judged against your own baseline images, not against a trend.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal className="mt-20 grid grid-cols-2 border-t border-line md:mt-28 md:grid-cols-4" stagger={0.1}>
          {stats.map((s, i) => (
            <div key={s.label} data-reveal className={`border-line py-8 pr-4 md:py-10 ${i % 2 === 1 ? 'border-l pl-5 md:pl-8' : ''} ${i >= 2 ? 'border-t md:border-t-0' : ''} ${i === 2 ? 'md:border-l md:pl-8' : ''}`}>
              <Counter to={s.n} suffix={s.suffix} className="display block text-[clamp(2.1rem,5vw,4.6rem)] leading-none" />
              <p className="label mt-4 max-w-[14rem] text-ink-mute">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
