import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/**
 * Page loader: a droplet that fills with the real load progress (fonts, 3D chunk, shader compile).
 * Capped so content is never held hostage: the hero text must paint quickly (LCP).
 */
export function Loader({ target, onDone }: { target: number; onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [open, setOpen] = useState(true)
  const start = useRef(performance.now())
  const targetRef = useRef(target)
  targetRef.current = target
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    let raf = 0
    let v = 0
    let finished = false
    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.25)
      last = now
      const elapsed = now - start.current
      // never wait longer than ~1.9s: the scene can fade in behind the poster later
      const goal = elapsed > 1900 ? 100 : Math.min(targetRef.current, 100)
      v += (goal - v) * (1 - Math.exp(-dt * 5))
      if (goal - v < 0.6) v = goal
      setShown(v)
      if (v >= 100 && elapsed > 900 && !finished) {
        finished = true
        setTimeout(() => {
          setOpen(false)
          doneRef.current()
        }, 260)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pct = Math.round(shown)
  const fillY = 100 - shown

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-espresso text-pearl"
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
          role="progressbar"
          aria-label="Loading Vellum Dermatology"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <motion.div exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center">
            <svg width="76" height="104" viewBox="0 0 76 104" aria-hidden="true">
              <defs>
                <clipPath id="drop-clip">
                  <path d="M38 3C50 22 72 44 72 66a34 34 0 0 1-68 0C4 44 26 22 38 3z" />
                </clipPath>
                <linearGradient id="drop-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#f6d3bf" />
                  <stop offset="1" stopColor="#c98d72" />
                </linearGradient>
              </defs>
              <g clipPath="url(#drop-clip)">
                <rect x="0" y="0" width="76" height="104" fill="#1c1411" />
                <g style={{ transform: `translateY(${fillY}%)`, transition: 'transform 0.1s linear' }}>
                  <path d={`M-20 4 Q 0 -2 19 4 T 57 4 T 96 4 V 120 H -20 Z`} fill="url(#drop-fill)">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-38 0" dur="2.4s" repeatCount="indefinite" />
                  </path>
                </g>
              </g>
              <path d="M38 3C50 22 72 44 72 66a34 34 0 0 1-68 0C4 44 26 22 38 3z" fill="none" stroke="#e7b79b" strokeWidth="1" />
              <ellipse cx="24" cy="62" rx="4" ry="9" fill="#fff" opacity="0.18" transform="rotate(18 24 62)" />
            </svg>
            <div className="mt-8 font-mono text-[0.72rem] tracking-[0.3em] tabular-nums text-rose">{String(pct).padStart(3, '0')}%</div>
            <div className="display mt-6 text-[2.2rem] italic tracking-[-0.01em]">Vellum</div>
            <div className="label mt-2 text-pearl/60">Dermatology</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
