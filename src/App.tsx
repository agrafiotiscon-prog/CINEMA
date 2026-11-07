import { useCallback, useEffect, useMemo, useState } from 'react'
import { initScroll, getLenis, ScrollTrigger } from './lib/scroll'
import { journey } from './lib/journeyState'
import { detectTier, hasWebGL, prefersReducedMotion } from './lib/quality'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { Journey } from './sections/Journey'
import { Principles } from './sections/Principles'
import { Services } from './sections/Services'
import { Doctors } from './sections/Doctors'
import { BeforeAfter } from './sections/BeforeAfter'
import { Process } from './sections/Process'
import { Testimonials } from './sections/Testimonials'
import { Booking } from './sections/Booking'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'

// evaluated once, before first render, so every component reads the same value
journey.reduced = prefersReducedMotion() || new URLSearchParams(location.search).has('reduced')

export default function App() {
  const { tier, webglInitial } = useMemo(() => ({ tier: detectTier(), webglInitial: hasWebGL() && !new URLSearchParams(location.search).has('nowebgl') }), [])
  const [webgl, setWebgl] = useState(webglInitial)
  const [load, setLoad] = useState(8)
  const [intro, setIntro] = useState(false)

  useEffect(() => {
    const lenis = initScroll(journey.reduced)
    lenis?.stop()
    document.fonts?.ready.then(() => setLoad((v) => Math.max(v, webglInitial ? 30 : 70)))
    if (!webglInitial) {
      const img = new Image()
      img.onload = img.onerror = () => setLoad(100)
      img.src = '/posters/surface.jpg'
    }
  }, [webglInitial])

  const onProgress = useCallback((stage: 'chunk' | 'ready') => {
    setLoad((v) => Math.max(v, stage === 'chunk' ? 62 : 100))
  }, [])

  const onDone = useCallback(() => {
    getLenis()?.start()
    setIntro(true)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  const onFail = useCallback(() => setWebgl(false), [])

  return (
    <>
      <Loader target={load} onDone={onDone} />
      <Cursor />
      <Nav />
      <main id="main">
        <div id="top" />
        <Journey tier={tier} webgl={webgl} intro={intro} onProgress={onProgress} onFail={onFail} />
        <Principles />
        <Services />
        <Doctors />
        <BeforeAfter />
        <Process />
        <Testimonials />
        <Booking />
        <Contact />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
