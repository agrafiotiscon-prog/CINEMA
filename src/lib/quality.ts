import type { Tier } from './journeyState'

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    const ok = typeof gl.getParameter === 'function'
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}

export function isMobileLike() {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
}

/** Initial heuristic. PerformanceMonitor refines it at runtime. */
export function detectTier(): Tier {
  const params = new URLSearchParams(location.search)
  const forced = params.get('quality')
  if (forced === 'high' || forced === 'medium' || forced === 'low') return forced

  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  let renderer = ''
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl') as WebGLRenderingContext | null
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    if (gl && ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase()
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    /* ignore */
  }
  if (/swiftshader|llvmpipe|software|basic render/.test(renderer)) return 'low'
  if (isMobileLike()) return cores >= 8 && mem >= 6 ? 'medium' : 'low'
  if (cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
