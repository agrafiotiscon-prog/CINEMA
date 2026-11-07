import { doctors } from '../content/clinic'
import { MaskReveal, Reveal } from '../components/Reveal'
import { Split } from '../components/Split'

/** Abstract portrait placeholder: tonal gradient + contour lines + monogram. Clearly not a photo. */
function PortraitPlaceholder({ initials, tone, i }: { initials: string; tone: string; i: number }) {
  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${tone}`}>
      <svg className="absolute inset-0 h-full w-full opacity-40 mix-blend-soft-light" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, k) => (
          <ellipse key={k} cx={150 + (i - 1) * 18} cy={170} rx={30 + k * 16} ry={42 + k * 19} fill="none" stroke="#fff" strokeWidth="0.8" />
        ))}
      </svg>
      <span className="display absolute bottom-4 right-6 text-[9rem] italic leading-none text-pearl/80">{initials}</span>
      <span className="placeholder-tag absolute left-4 top-4 bg-pearl/80 text-ink">Portrait placeholder</span>
    </div>
  )
}

export function Doctors() {
  return (
    <section id="doctors" data-theme="light" aria-labelledby="doctors-title" className="relative bg-pearl py-28 text-ink md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-10">
          <p className="label text-rose-deep md:col-span-3 md:pt-5">03 · The doctors</p>
          <div className="md:col-span-9">
            <Split id="doctors-title" text={'Consultant-led,\nwithout exception.'} italic={['without']} className="display text-[clamp(2.6rem,6vw,6rem)]" />
            <Reveal className="mt-8 flex flex-wrap items-center gap-4">
              <p data-reveal className="max-w-[36rem] text-[1.05rem] leading-relaxed text-ink-soft">
                Every patient is seen by a dermatologist. Not a sales consultant, not a junior practitioner working from a protocol.
              </p>
              <span data-reveal className="placeholder-tag text-rose-deep">
                Placeholder profiles · replace with verified clinicians
              </span>
            </Reveal>
          </div>
        </div>

        <ul className="mt-16 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-6">
          {doctors.map((d, i) => (
            <li key={i} className={i === 1 ? 'md:mt-24' : i === 2 ? 'md:mt-10' : ''}>
              <MaskReveal className="aspect-[3/4] rounded-[1.25rem]">
                <div className="h-full w-full">
                  <PortraitPlaceholder initials={d.initials} tone={d.tone} i={i} />
                </div>
              </MaskReveal>
              <Reveal className="mt-6" y={18}>
                <h3 data-reveal className="display text-[1.9rem] leading-tight">
                  {d.name}
                </h3>
                <p data-reveal className="mt-2 text-[0.98rem] text-ink-soft">
                  {d.role}
                </p>
                <p data-reveal className="label mt-4 text-ink-mute">
                  {d.focus}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
