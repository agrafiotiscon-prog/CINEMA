import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { scrollToTarget } from '../lib/scroll'
import { Magnetic } from './Magnetic'

const links = [
  { href: '#journey', label: 'The skin' },
  { href: '#services', label: 'Treatments' },
  { href: '#doctors', label: 'Doctors' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Visit' },
]

/** Fixed navigation that inverts over dark sections ([data-theme="dark"]). */
export function Nav() {
  const [dark, setDark] = useState(true)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    let lastY = scrollY
    const check = () => {
      const probe = 36
      const sections = document.querySelectorAll<HTMLElement>('[data-theme]')
      let theme = 'dark'
      sections.forEach((s) => {
        const r = s.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) theme = s.dataset.theme!
      })
      // the journey's last chapter turns light
      const j = document.getElementById('journey')
      if (j && theme === 'dark' && j.style.getPropertyValue('--light')) {
        if (parseFloat(j.style.getPropertyValue('--light')) > 0.55) theme = 'light'
      }
      setDark(theme === 'dark')
      const y = scrollY
      setHidden(y > 400 && y > lastY + 2)
      if (y < lastY - 2 || y < 400) setHidden(false)
      lastY = y
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  useEffect(() => {
    if (!open) return
    firstLink.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuBtn.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToTarget(href)
    const el = document.querySelector<HTMLElement>(href)
    el?.setAttribute('tabindex', '-1')
    setTimeout(() => el?.focus({ preventScroll: true }), 50)
  }

  const fg = dark ? 'text-pearl' : 'text-ink'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-[transform,color] duration-700 ease-[var(--ease-luxe)] ${fg} ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <nav aria-label="Primary" className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <a href="#top" onClick={go('#top')} className="group flex items-baseline gap-2" aria-label="Vellum Dermatology, back to top">
            <span className="display text-[1.65rem] italic leading-none">Vellum</span>
            <span className="label hidden opacity-70 sm:inline">Dermatology</span>
          </a>
          <ul className="hidden items-center gap-9 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={go(l.href)} className="label relative py-2 opacity-85 transition-opacity hover:opacity-100 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-700 hover:after:origin-left hover:after:scale-x-100">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Magnetic href="#book" onClick={go('#book')} variant={dark ? 'light' : 'solid'} className="hidden !px-6 !py-3 sm:inline-flex">
              Book consultation
            </Magnetic>
            <button
              ref={menuBtn}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-full border border-current/30 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <span className={`h-px w-5 bg-current transition-transform duration-500 ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <span className={`h-px w-5 bg-current transition-transform duration-500 ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
            </button>
          </div>
        </nav>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[75] flex flex-col justify-end bg-espresso px-6 pb-12 pt-28 text-pearl lg:hidden"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.li key={l.href} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                  <a ref={i === 0 ? firstLink : undefined} href={l.href} onClick={go(l.href)} className="display flex items-baseline gap-4 py-1 text-[3rem]">
                    <span className="label text-rose">0{i + 1}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <a href="#book" onClick={go('#book')} className="label mt-10 inline-flex w-full justify-center rounded-full bg-pearl px-6 py-4 text-ink">
              Book consultation
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
