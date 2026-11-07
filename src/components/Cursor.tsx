import { useEffect, useRef } from 'react'
import { journey } from '../lib/journeyState'

/**
 * Custom cursor: a precise dot + a lagging lens ring. Also feeds the pointer to the WebGL
 * lens effect. Hidden on touch / coarse pointers and under reduced motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      journey.pointer.x = e.clientX / innerWidth
      journey.pointer.y = e.clientY / innerHeight
      journey.pointer.active = e.pointerType === 'mouse'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    if (!fine || journey.reduced) return () => window.removeEventListener('pointermove', onMove)

    document.documentElement.classList.add('has-custom-cursor')
    let x = innerWidth / 2,
      y = innerHeight / 2,
      rx = x,
      ry = y,
      scale = 1,
      targetScale = 1,
      raf = 0,
      shown = false
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        shown = true
        rx = x
        ry = y
        dot.current!.style.opacity = ring.current!.style.opacity = '1'
      }
      const t = e.target as HTMLElement
      const hit = t.closest('a, button, [data-cursor], input, select, textarea, label')
      targetScale = hit ? (hit.getAttribute('data-cursor') === 'magnet' ? 1.9 : 1.55) : 1
    }
    const leave = () => {
      shown = false
      dot.current!.style.opacity = ring.current!.style.opacity = '0'
      journey.pointer.active = false
    }
    const loop = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      scale += (targetScale - scale) * 0.14
      dot.current!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      ring.current!.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95] hidden mix-blend-difference [@media(pointer:fine)]:block">
      <div ref={dot} className="absolute left-0 top-0 h-[5px] w-[5px] rounded-full bg-[#fbf8f4] opacity-0 transition-opacity duration-300" />
      <div ref={ring} className="absolute left-0 top-0 h-9 w-9 rounded-full border border-[#fbf8f4]/70 opacity-0 transition-opacity duration-300" />
    </div>
  )
}
