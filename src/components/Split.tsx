import { createElement, Fragment, useLayoutEffect, useRef, type ElementType } from 'react'
import { gsap } from '../lib/scroll'
import { journey } from '../lib/journeyState'

/**
 * Accessible split-text: the element carries the full text via aria-label;
 * visual words are aria-hidden spans inside masked lines (one line per `\n`).
 */
const norm = (s: string) => s.replace(/[.,!?]/g, '')

export function Split({
  text,
  as = 'h2',
  className = '',
  italic = [],
  play,
  delay = 0,
  stagger = 0.06,
  scroll = true,
  id,
}: {
  text: string
  as?: ElementType
  className?: string
  /** words (exact) to set in italic */
  italic?: string[]
  /** for non-scroll reveals: animate when this flips true */
  play?: boolean
  delay?: number
  stagger?: number
  scroll?: boolean
  id?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const lines = text.split('\n')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll<HTMLElement>('.split-word')
    if (journey.reduced) {
      gsap.set(words, { yPercent: 0, opacity: 0 })
      if (play === false) return
      const t = gsap.to(words, { opacity: 1, duration: 1.2, delay, ease: 'power1.out', scrollTrigger: scroll && play === undefined ? { trigger: el, start: 'top 85%' } : undefined })
      return () => {
        t.scrollTrigger?.kill()
        t.kill()
      }
    }
    gsap.set(words, { yPercent: 115, rotate: 2.5 })
    if (play === false) return
    const t = gsap.to(words, {
      yPercent: 0,
      rotate: 0,
      duration: 1.6,
      ease: 'expo.out',
      stagger,
      delay,
      scrollTrigger: scroll && play === undefined ? { trigger: el, start: 'top 85%' } : undefined,
    })
    return () => {
      t.scrollTrigger?.kill()
      t.kill()
    }
  }, [play, delay, stagger, scroll])

  return createElement(
    as,
    { ref, className, 'aria-label': text.replace(/\n/g, ' '), id },
    lines.map((line, li) => (
      <span key={li} className="split-line" aria-hidden="true">
        {line.split(' ').map((w, wi, arr) => (
          <Fragment key={wi}>
            <span className={`split-word ${italic.some((i) => norm(i) === norm(w)) ? 'italic' : ''}`}>{w}</span>
            {wi < arr.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    )),
  )
}
