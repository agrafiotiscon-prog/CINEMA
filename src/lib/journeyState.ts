/**
 * Mutable, render-loop friendly state shared between DOM (GSAP/Lenis) and the WebGL scene.
 * Deliberately not React state: it changes every frame.
 */
export const journey = {
  /** GSAP-scrubbed progress through the journey, 0..1 */
  progress: 0,
  /** Scroll velocity in px/frame from Lenis (signed) */
  velocity: 0,
  /** Pointer in NDC-ish 0..1 screen space (y down) */
  pointer: { x: 0.5, y: 0.5, active: false },
  /** Whether the journey section is on screen (pauses the render loop when not) */
  visible: true,
  /** Reduced motion: camera jumps between chapter keys with crossfades */
  reduced: false,
  /** Progress the scene shows under reduced motion (switched behind a crossfade) */
  reducedP: 0,
}

export type Tier = 'high' | 'medium' | 'low'
