import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { journey } from '../lib/journeyState'

export function Counter({ to, suffix = '', className = '' }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (journey.reduced) {
      el.textContent = `${to}${suffix}`
      return
    }
    const o = { v: 0 }
    el.textContent = `0${suffix}`
    const t = gsap.to(o, {
      v: to,
      duration: 2.4,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => {
        el.textContent = `${Math.round(o.v)}${suffix}`
      },
    })
    return () => {
      t.scrollTrigger?.kill()
      t.kill()
    }
  }, [to, suffix])
  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {to}
        {suffix}
      </span>
      <span className="sr-only">
        {to}
        {suffix}
      </span>
    </span>
  )
}
