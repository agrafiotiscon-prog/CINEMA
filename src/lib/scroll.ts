import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { journey } from './journeyState'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

let inited = false
export function initScroll(reduced: boolean) {
  if (inited) return lenis
  inited = true
  if (reduced) {
    // native scrolling, no smoothing
    window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true })
    return null
  }
  lenis = new Lenis({ duration: 1.35, easing: expoOut, smoothWheel: true, autoRaf: false })
  lenis.on('scroll', (l: Lenis) => {
    journey.velocity = l.velocity
    ScrollTrigger.update()
  })
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  ;(window as unknown as { __lenis: Lenis }).__lenis = lenis
  return lenis
}

export const getLenis = () => lenis

export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  const reduced = journey.reduced
  if (lenis) lenis.scrollTo(target, { offset, duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    const y = typeof el === 'number' ? el : el instanceof HTMLElement ? el.getBoundingClientRect().top + scrollY + offset : 0
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
  }
}

export { gsap, ScrollTrigger }
