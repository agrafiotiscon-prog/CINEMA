import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/scroll'
import { journey } from '../lib/journeyState'

/** Fades/rises children ([data-reveal]) in, staggered, when scrolled into view. */
export function Reveal({ children, className = '', y = 28, stagger = 0.08, start = 'top 82%' }: { children: ReactNode; className?: string; y?: number; stagger?: number; start?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const items = el.querySelectorAll<HTMLElement>('[data-reveal]')
    const targets = items.length ? items : [el]
    const t = gsap.fromTo(
      targets,
      { opacity: 0, y: journey.reduced ? 0 : y },
      { opacity: 1, y: 0, duration: journey.reduced ? 0.9 : 1.4, ease: 'power3.out', stagger, scrollTrigger: { trigger: el, start } },
    )
    return () => {
      t.scrollTrigger?.kill()
      t.kill()
    }
  }, [y, stagger, start])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/** Masked image reveal: clip-path wipes up while the inner layer settles from a slight zoom. */
export function MaskReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const inner = el.firstElementChild as HTMLElement
    if (journey.reduced) {
      const t = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1, scrollTrigger: { trigger: el, start: 'top 85%' } })
      return () => {
        t.scrollTrigger?.kill()
        t.kill()
      }
    }
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } })
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out' })
    tl.fromTo(inner, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0)
    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [])
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
