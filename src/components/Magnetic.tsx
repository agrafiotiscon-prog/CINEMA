import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef, type ReactNode, type MouseEvent } from 'react'
import { journey } from '../lib/journeyState'

type Variant = 'solid' | 'outline' | 'light'

const styles: Record<Variant, string> = {
  solid: 'bg-ink text-pearl',
  outline: 'border border-current text-current',
  light: 'bg-pearl text-ink',
}

/** Magnetic pill button: the shell drifts toward the pointer, the label drifts further. */
export function Magnetic({
  children,
  href,
  onClick,
  variant = 'solid',
  className = '',
  type,
  ariaLabel,
}: {
  children: ReactNode
  href?: string
  onClick?: (e: MouseEvent) => void
  variant?: Variant
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const cfg = { stiffness: 140, damping: 18, mass: 0.6 }
  const sx = useSpring(x, cfg)
  const sy = useSpring(y, cfg)
  const lx = useSpring(useMotionValue(0), cfg)
  const ly = useSpring(useMotionValue(0), cfg)

  const move = (e: MouseEvent) => {
    if (journey.reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    x.set(dx * 0.28)
    y.set(dy * 0.36)
    lx.set(dx * 0.12)
    ly.set(dy * 0.16)
  }
  const leave = () => {
    x.set(0)
    y.set(0)
    lx.set(0)
    ly.set(0)
  }

  const cls = `group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-7 py-4 label !text-[0.72rem] !tracking-[0.18em] transition-colors duration-500 ${styles[variant]} ${className}`
  const inner = (
    <>
      <span className="absolute inset-0 origin-bottom scale-y-0 rounded-full bg-rose transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-y-100" aria-hidden="true" />
      <motion.span style={{ x: lx, y: ly }} className="relative z-10 inline-flex items-center gap-3 transition-colors duration-500 group-hover:text-ink">
        {children}
      </motion.span>
    </>
  )
  const common = {
    onMouseMove: move,
    onMouseLeave: leave,
    style: { x: sx, y: sy },
    className: cls,
    'data-cursor': 'magnet',
    'aria-label': ariaLabel,
  }
  if (href)
    return (
      <motion.a ref={ref as React.Ref<HTMLAnchorElement>} href={href} onClick={onClick} {...common}>
        {inner}
      </motion.a>
    )
  return (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} type={type ?? 'button'} onClick={onClick} {...common}>
      {inner}
    </motion.button>
  )
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
