# Vellum Dermatology: a cinematic, scroll-driven clinic site

A 3D journey *into* the skin (surface → epidermis → dermis → treatments → renewal), followed by art-directed content sections. Vellum is a fictional brand and every contact detail is a placeholder.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview
```

Debug query params: `?quality=high|medium|low` pins the GPU tier, `?nowebgl` forces the poster fallback, `?reduced` forces reduced-motion mode.

## Art direction: "Clinical Editorial Luxe"

| | |
|---|---|
| Base | pearl `#FBF8F4`, porcelain `#F3ECE5`, nude `#E6D5C7` |
| Ink | espresso `#1C1411` (15.5:1 on porcelain), soft `#4A3B34`, mute `#6B5A51` (5.6:1) |
| Accent | rose-gold, luminous `#E7B79B` on dark and deep `#8A553F` for text on light (5.2:1) |
| Dark | espresso-black `#0D0908` (never pure black) |
| Display | **Bodoni Moda** (variable, optical size): a high-contrast Didone that reads as editorial luxury |
| Body | **Jost**: geometric, calm, legible |
| Labels | **IBM Plex Mono** uppercase: the "medical documentary" voice (figure numbers, specimen labels) |

Fonts are self-hosted through Fontsource. Layouts follow an asymmetric 12-column grid (labels in columns 1–3, content in columns 4–12) with hairline rules and numbered sections. There are no gradients-as-decoration, no emoji and no stock icons; the glyphs are hand-drawn inline SVG.

## Architecture

- `src/lib/timeline.ts` is the single source of truth for chapter lengths. HTML panel heights and 3D progress windows are both derived from it, so they cannot drift apart.
- `src/sections/Journey.tsx` contains the sticky canvas, the scrolling chapter copy (real HTML), the HUD, and the GSAP ScrollTrigger scrub (`scrub: 1.1`) of `journey.progress`.
- `src/three/` holds the scene:
  - `shaders/skin.ts`: procedural skin. Crossing dermatoglyphic line families, pillowy Voronoi plateaus and pores; finite-difference normals; wrap diffuse plus a red-shifted subsurface term; oil and dew GGX lobes; a softbox sheen; the droplet ripple; and treatment effects (fractional laser zones, needling pulses, peel dissolve, fold restoration).
  - `CameraRig.tsx`: centripetal Catmull-Rom spline camera path, the espresso → umber → porcelain atmosphere, and chromatic-aberration pulses on transitions.
  - `Epidermis`, `Collagen`, `Hyaluronic`, `TreatmentStage`, `Droplet`: one or two draw calls each (instancing or merged geometry).
  - `Post.tsx` + `LensEffect.ts`: DoF (high tier only), bloom, the cursor refraction lens, CA, vignette and ACES tone mapping.
- Everything is procedural. `public/posters/*.jpg` are frames rendered from this scene and are used as the no-WebGL fallback.

## Quality & accessibility

- The 3D bundle is lazy-loaded (`Experience` chunk), the render loop pauses when the journey is off-screen, DPR is capped at 2/1.5/1.25 per tier, and `PerformanceMonitor` steps the tier down (dropping DoF, then all post-processing).
- `prefers-reduced-motion`: no Lenis, no camera flight. The scene crossfades between still chapter key-frames, and time-based motion is frozen.
- Real HTML text throughout, a skip link, visible focus styles, an accessible split-text headline (`aria-label`), a range-input before/after slider, and an Esc-closable mobile menu.
- SEO: semantic sections, meta/OG tags, and a `MedicalClinic` JSON-LD block in `index.html` (placeholder values).

## Before launch

Replace everything marked **placeholder**: clinician names and portraits (`src/content/clinic.ts`), testimonials (verified, with consent), address, phone, email and hours, the JSON-LD values and canonical URL, and the map link. Then connect the booking form.
