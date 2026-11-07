import { clinic } from '../content/clinic'
import { scrollToTarget } from '../lib/scroll'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer data-theme="dark" className="on-dark relative overflow-hidden bg-espresso text-pearl">
      <div className="mx-auto max-w-[1600px] px-5 pb-10 pt-24 md:px-10 md:pt-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="display text-[1.9rem] italic leading-tight">Skin, understood.</p>
            <p className="mt-4 max-w-sm text-pearl/70">Medical & aesthetic dermatology · {clinic.city}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-4">
            <ul className="space-y-3">
              {[
                ['#services', 'Treatments'],
                ['#doctors', 'Doctors'],
                ['#process', 'Process'],
                ['#results', 'Outcomes'],
              ].map(([h, l]) => (
                <li key={h}>
                  <a href={h} onClick={(e) => (e.preventDefault(), scrollToTarget(h))} className="text-pearl/75 hover:text-pearl">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-3">
              <li><a href={clinic.phoneHref} className="text-pearl/75 hover:text-pearl">{clinic.phone}</a></li>
              <li><a href={`mailto:${clinic.email}`} className="text-pearl/75 hover:text-pearl">{clinic.email}</a></li>
              <li><a href="#book" onClick={(e) => (e.preventDefault(), scrollToTarget('#book'))} className="text-pearl/75 hover:text-pearl">Book consultation</a></li>
            </ul>
          </nav>
          <div className="md:col-span-3">
            <button onClick={() => scrollToTarget(0)} className="label inline-flex items-center gap-3 text-pearl/70 hover:text-pearl">
              Back to the surface
              <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true"><path d="M5 13V1M1 5l4-4 4 4" fill="none" stroke="currentColor" /></svg>
            </button>
          </div>
        </div>

        <p aria-hidden="true" className="display pointer-events-none mt-20 select-none whitespace-nowrap text-[23vw] italic leading-[0.8] text-pearl/[0.06] md:mt-24">
          Vellum
        </p>

        <div className="mt-6 grid gap-8 border-t border-pearl/15 pt-8 md:grid-cols-12">
          <p className="text-[0.85rem] leading-relaxed text-pearl/65 md:col-span-8">
            <strong className="font-medium text-pearl/80">Medical disclaimer.</strong> The content of this website is for general information only and is not a substitute for professional medical advice, diagnosis or treatment. All treatments are offered only after an in-person consultation with a qualified clinician, and suitability, risks and expected outcomes are discussed individually. Results vary between people. Imagery and 3D visualisations are illustrative and do not depict real patients. If you notice a mole or skin lesion that is new, changing, bleeding or itching, please seek medical advice promptly. In an emergency, contact your local emergency services.
          </p>
          <div className="label space-y-2 text-pearl/55 md:col-span-4 md:text-right">
            <p>© {year} Vellum Dermatology</p>
            <p>Fictional brand · placeholder details</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
