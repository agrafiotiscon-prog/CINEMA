import { testimonials } from '../content/clinic'
import { Reveal } from '../components/Reveal'
import { Split } from '../components/Split'

export function Testimonials() {
  return (
    <section id="testimonials" data-theme="light" aria-labelledby="testimonials-title" className="relative bg-pearl py-28 text-ink md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-10">
          <p className="label text-rose-deep md:col-span-3 md:pt-5">06 · In their words</p>
          <div className="md:col-span-9">
            <Split id="testimonials-title" text={'Patient voices,\nverified before published.'} italic={['verified']} className="display text-[clamp(2.4rem,5.4vw,5.4rem)]" />
          </div>
        </div>
        <Reveal className="mt-16 grid gap-5 md:mt-24 md:grid-cols-3" stagger={0.12}>
          {testimonials.map((t, i) => (
            <figure key={i} data-reveal className="relative flex min-h-[20rem] flex-col rounded-[1.25rem] border border-dashed border-nude-deep bg-porcelain p-8 md:p-10">
              <span className="placeholder-tag self-start text-rose-deep">Placeholder testimonial</span>
              <span aria-hidden="true" className="mt-10 block h-px w-10 bg-rose-deep/50" />
              <blockquote className="display mt-6 text-[1.55rem] italic leading-snug text-ink-soft">{t.body}</blockquote>
              <figcaption className="label mt-auto pt-8 text-ink-mute">Topic · {t.topic}</figcaption>
            </figure>
          ))}
        </Reveal>
        <p className="label mt-8 max-w-xl text-ink-mute">
          We will only publish reviews from real patients, shared with their written consent, in line with medical advertising guidance.
        </p>
      </div>
    </section>
  )
}
