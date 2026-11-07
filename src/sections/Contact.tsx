import { clinic } from '../content/clinic'
import { Reveal } from '../components/Reveal'
import { Split } from '../components/Split'

/** Stylised, illustrative street map (inline SVG). No third-party map tiles or trackers. */
function MapIllustration() {
  return (
    <svg viewBox="0 0 640 480" className="h-full w-full" role="img" aria-label="Illustrative map showing the clinic location. Not to scale.">
      <rect width="640" height="480" fill="#ebe1d8" />
      <g stroke="#f8f3ee" strokeLinecap="round" fill="none">
        <path d="M-20 120 C 160 100, 260 160, 660 130" strokeWidth="18" />
        <path d="M-20 330 C 200 300, 420 360, 660 320" strokeWidth="26" />
        <path d="M190 -20 C 210 140, 160 300, 220 500" strokeWidth="16" />
        <path d="M430 -20 C 420 160, 470 320, 440 500" strokeWidth="20" />
        <path d="M-20 220 L 660 250" strokeWidth="8" />
        <path d="M300 -20 L 330 500" strokeWidth="7" />
        <path d="M560 -20 L 520 500" strokeWidth="7" />
      </g>
      <path d="M470 380 C 520 360, 600 400, 660 390 L 660 480 L 460 480 Z" fill="#d9e0d4" opacity=".8" />
      <path d="M-20 20 C 40 40, 80 0, 140 30 L 120 80 C 60 70, 20 90, -20 70 Z" fill="#d9e0d4" opacity=".8" />
      <g transform="translate(318 236)">
        <circle r="44" fill="#8a553f" opacity=".1">
          <animate attributeName="r" values="18;48;18" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".25;0;.25" dur="4s" repeatCount="indefinite" />
        </circle>
        <path d="M0 -30 C 9 -16 16 -8 16 2 a16 16 0 0 1 -32 0 C -16 -8 -9 -16 0 -30z" fill="#1c1411" />
        <circle cy="2" r="5" fill="#e7b79b" />
      </g>
      <text x="340" y="232" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="2" fill="#1c1411">VELLUM</text>
    </svg>
  )
}

export function Contact() {
  return (
    <section id="contact" data-theme="light" aria-labelledby="contact-title" className="relative bg-porcelain py-28 text-ink md:py-40">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid gap-16 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <p className="label text-rose-deep">08 · Visit</p>
            <Split id="contact-title" text={'Quiet rooms.\nClear answers.'} italic={['Clear']} className="display mt-8 text-[clamp(2.6rem,5.2vw,5.2rem)]" />
            <Reveal className="mt-12 grid gap-10 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <address data-reveal className="not-italic">
                <p className="label mb-4 text-ink-mute">Address</p>
                {clinic.address.map((l) => (
                  <span key={l} className="block text-[1.05rem] leading-relaxed">
                    {l}
                  </span>
                ))}
                <span className="placeholder-tag mt-4 text-rose-deep">Placeholder details</span>
              </address>
              <div data-reveal>
                <p className="label mb-4 text-ink-mute">Contact</p>
                <a href={clinic.phoneHref} className="block text-[1.05rem] leading-relaxed underline decoration-line underline-offset-4 hover:decoration-rose-deep">
                  {clinic.phone}
                </a>
                <a href={`mailto:${clinic.email}`} className="block text-[1.05rem] leading-relaxed underline decoration-line underline-offset-4 hover:decoration-rose-deep">
                  {clinic.email}
                </a>
              </div>
              <div data-reveal className="sm:col-span-2 md:col-span-1 lg:col-span-2">
                <p className="label mb-4 text-ink-mute">Opening hours</p>
                <dl className="divide-y divide-line border-y border-line">
                  {clinic.hours.map((h) => (
                    <div key={h.days} className="flex justify-between py-3 text-[1rem]">
                      <dt>{h.days}</dt>
                      <dd className="tabular-nums text-ink-soft">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-line">
              <MapIllustration />
              <span className="placeholder-tag absolute bottom-4 left-4 bg-pearl/85 text-ink">Illustrative map · not to scale</span>
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="label absolute bottom-4 right-4 rounded-full bg-ink px-4 py-3 text-pearl transition-colors hover:bg-rose hover:text-ink"
              >
                Open in maps<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
