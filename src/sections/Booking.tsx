import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Arrow, Magnetic } from '../components/Magnetic'
import { Split } from '../components/Split'
import { Reveal } from '../components/Reveal'
import { clinic } from '../content/clinic'

const field =
  'peer w-full border-0 border-b border-pearl/25 bg-transparent px-0 pb-3 pt-6 text-[1.05rem] text-pearl placeholder-transparent outline-none transition-colors duration-500 focus:border-rose'
const lab =
  'label pointer-events-none absolute left-0 top-0 text-pearl/60 transition-all duration-500 peer-placeholder-shown:top-6 peer-placeholder-shown:text-[0.95rem] peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-sans peer-focus:top-0 peer-focus:text-[0.6875rem] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:font-mono peer-focus:text-rose'

export function Booking() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <section id="book" data-theme="dark" aria-labelledby="book-title" className="on-dark relative overflow-hidden bg-espresso-2 py-28 text-pearl md:py-40">
      {/* soft luminous accent, drawn not photographed */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-[20vw] top-[10%] h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgb(231_183_155/0.16),transparent_62%)]" />
      <div className="relative mx-auto grid max-w-[1600px] gap-16 px-5 md:grid-cols-12 md:gap-10 md:px-10">
        <div className="md:col-span-6">
          <p className="label text-rose">07 · Book</p>
          <Split id="book-title" text={'Begin with a\nconversation.'} italic={['conversation.']} className="display mt-8 text-[clamp(3rem,6.6vw,7rem)]" />
          <Reveal className="mt-10 max-w-md space-y-6">
            <p data-reveal className="text-[1.08rem] leading-relaxed text-pearl/80">
              A 45-minute consultation with a dermatologist, including skin analysis. You leave with a written plan, whether or not you choose to proceed.
            </p>
            <p data-reveal className="label text-pearl/60">
              Prefer to call? <a className="text-pearl underline decoration-pearl/30 underline-offset-4 hover:decoration-rose" href={clinic.phoneHref}>{clinic.phone}</a>
            </p>
          </Reveal>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }} className="grid gap-7" aria-describedby="form-note">
                <div className="grid gap-7 sm:grid-cols-2">
                  <div className="relative">
                    <input id="f-name" name="name" required autoComplete="name" placeholder="Full name" className={field} />
                    <label htmlFor="f-name" className={lab}>Full name</label>
                  </div>
                  <div className="relative">
                    <input id="f-phone" name="phone" type="tel" autoComplete="tel" placeholder="Phone" className={field} />
                    <label htmlFor="f-phone" className={lab}>Phone</label>
                  </div>
                </div>
                <div className="relative">
                  <input id="f-email" name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
                  <label htmlFor="f-email" className={lab}>Email</label>
                </div>
                <div className="relative">
                  <label htmlFor="f-concern" className="label text-pearl/60">Main concern</label>
                  <select id="f-concern" name="concern" defaultValue="" required className={`${field} appearance-none pt-3 [&>option]:bg-espresso`}>
                    <option value="" disabled>Choose one</option>
                    <option>Skin check / mole screening</option>
                    <option>Acne</option>
                    <option>Eczema or psoriasis</option>
                    <option>Ageing, lines or volume</option>
                    <option>Texture, scarring or pigmentation</option>
                    <option>Not sure: skin analysis</option>
                  </select>
                  <svg className="pointer-events-none absolute bottom-5 right-1" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" /></svg>
                </div>
                <div className="relative">
                  <textarea id="f-msg" name="message" rows={3} placeholder="Anything we should know" className={`${field} resize-none`} />
                  <label htmlFor="f-msg" className={lab}>Anything we should know (optional)</label>
                </div>
                <label className="flex items-start gap-3 text-[0.9rem] leading-relaxed text-pearl/70">
                  <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#e7b79b]" />
                  I agree to be contacted about my enquiry. Please don't include sensitive medical details here.
                </label>
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <Magnetic type="submit" variant="light">
                    Request consultation <Arrow />
                  </Magnetic>
                  <p id="form-note" className="label text-pearl/60">Demo form · not connected</p>
                </div>
              </motion.form>
            ) : (
              <motion.div key="ok" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} role="status" className="border-t border-pearl/20 pt-10">
                <p className="display text-[2.6rem] italic leading-tight">Thank you.</p>
                <p className="mt-4 max-w-sm text-pearl/80">
                  This is a demonstration form, so nothing has been sent. Connect it to your booking system before launch.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
