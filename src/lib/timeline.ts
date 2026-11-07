/**
 * The journey timeline. Each chapter's `span` is its scroll length in viewport heights.
 * Windows in normalised progress [0, 1] are derived from the spans, so the HTML panels
 * and the 3D scene can never drift out of sync.
 */
export type ChapterId =
  | 'surface'
  | 'epidermis'
  | 'dermis'
  | 'laser'
  | 'needling'
  | 'peel'
  | 'volume'
  | 'renewal'

interface ChapterDef {
  id: ChapterId
  span: number
  /** progress inside the chapter that best represents it (used for posters & reduced motion) */
  key: number
}

export const chapterDefs: ChapterDef[] = [
  { id: 'surface', span: 1.6, key: 0.1 },
  { id: 'epidermis', span: 1.5, key: 0.55 },
  { id: 'dermis', span: 1.8, key: 0.75 },
  { id: 'laser', span: 1.1, key: 0.5 },
  { id: 'needling', span: 1.1, key: 0.5 },
  { id: 'peel', span: 1.1, key: 0.6 },
  { id: 'volume', span: 1.1, key: 0.65 },
  { id: 'renewal', span: 2.0, key: 0.98 },
]

export const totalSpan = chapterDefs.reduce((a, c) => a + c.span, 0)

export interface ChapterWindow extends ChapterDef {
  start: number
  end: number
  keyProgress: number
}

/**
 * Scroll range = journey height − one viewport (sticky stage), so a panel whose top reaches the
 * viewport top at `acc` viewports is at progress acc / (totalSpan − 1). The last chapter is clipped at 1.
 */
const range = totalSpan - 1
export const chapters: ChapterWindow[] = (() => {
  let acc = 0
  return chapterDefs.map((c) => {
    const start = acc / range
    acc += c.span
    const end = Math.min(1, acc / range)
    return { ...c, start, end, keyProgress: start + (end - start) * c.key }
  })
})()

export const W = Object.fromEntries(chapters.map((c) => [c.id, c])) as Record<ChapterId, ChapterWindow>

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
/** Local 0..1 progress inside a chapter */
export const local = (id: ChapterId, p: number) => clamp01((p - W[id].start) / (W[id].end - W[id].start))

/** Fade in over `fi` before start, out over `fo` after end. Returns 0..1 */
export const presence = (start: number, end: number, p: number, fi = 0.03, fo = 0.03) =>
  smooth(start - fi, start, p) * (1 - smooth(end, end + fo, p))

export const chapterAt = (p: number) => {
  for (let i = chapters.length - 1; i >= 0; i--) if (p >= chapters[i].start) return chapters[i]
  return chapters[0]
}
