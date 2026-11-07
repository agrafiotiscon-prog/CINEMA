/**
 * Single source of truth for clinic content.
 * Everything marked PLACEHOLDER must be replaced with verified information before launch.
 */

export const clinic = {
  name: 'Vellum',
  fullName: 'Vellum Dermatology',
  // PLACEHOLDER: contact details
  address: ['00 Placeholder Street', 'Your City, 00000'],
  city: 'Your City',
  phone: '+00 0000 000000',
  phoneHref: 'tel:+000000000000',
  email: 'hello@example.com',
  hours: [
    { days: 'Monday to Thursday', time: '08:30 to 19:00' },
    { days: 'Friday', time: '08:30 to 17:00' },
    { days: 'Saturday', time: '09:00 to 14:00' },
    { days: 'Sunday', time: 'Closed' },
  ],
}

export type ServiceKind = 'Medical' | 'Aesthetic' | 'Diagnostic'

export interface Service {
  id: string
  kind: ServiceKind
  title: string
  body: string
  glyph: GlyphName
}

export type GlyphName =
  | 'acne'
  | 'eczema'
  | 'psoriasis'
  | 'mole'
  | 'toxin'
  | 'filler'
  | 'peel'
  | 'laser'
  | 'needle'
  | 'analysis'

export const services: Service[] = [
  {
    id: 'analysis',
    kind: 'Diagnostic',
    title: 'Skin analysis consultation',
    body: 'Multispectral imaging, barrier and sebum readings, and a clinician who explains every finding. The starting point for every plan.',
    glyph: 'analysis',
  },
  {
    id: 'mole',
    kind: 'Medical',
    title: 'Mole checks & skin cancer screening',
    body: 'Full-body dermoscopic examination with digital mole mapping, so changes over time are measured, not guessed.',
    glyph: 'mole',
  },
  {
    id: 'acne',
    kind: 'Medical',
    title: 'Acne',
    body: 'Evidence-based treatment of active acne and its marks, from topical regimes to prescription therapy.',
    glyph: 'acne',
  },
  {
    id: 'eczema',
    kind: 'Medical',
    title: 'Eczema',
    body: 'Barrier repair, trigger identification and long-term control plans for atopic and contact dermatitis.',
    glyph: 'eczema',
  },
  {
    id: 'psoriasis',
    kind: 'Medical',
    title: 'Psoriasis',
    body: 'Topical, phototherapy and systemic options, reviewed against how the condition affects your daily life.',
    glyph: 'psoriasis',
  },
  {
    id: 'toxin',
    kind: 'Aesthetic',
    title: 'Anti-wrinkle injections',
    body: 'Botulinum toxin placed with anatomical precision to soften expression lines while keeping expression.',
    glyph: 'toxin',
  },
  {
    id: 'filler',
    kind: 'Aesthetic',
    title: 'Dermal fillers',
    body: 'Hyaluronic acid used sparingly to restore lost volume and support, never to change who you are.',
    glyph: 'filler',
  },
  {
    id: 'peel',
    kind: 'Aesthetic',
    title: 'Chemical peels',
    body: 'Controlled exfoliation, from superficial to medium depth, matched to your skin type and season.',
    glyph: 'peel',
  },
  {
    id: 'laser',
    kind: 'Aesthetic',
    title: 'Laser resurfacing',
    body: 'Fractional and ablative lasers for texture, scarring, pigmentation and fine lines, with recovery planned in advance.',
    glyph: 'laser',
  },
  {
    id: 'needle',
    kind: 'Aesthetic',
    title: 'Microneedling',
    body: 'Controlled micro-injury that prompts your own collagen production for firmer, more even skin.',
    glyph: 'needle',
  },
]

// PLACEHOLDER clinicians: replace names, roles, credentials and portraits with verified details.
export const doctors = [
  {
    initials: 'A',
    name: 'Dr. [Placeholder Name]',
    role: 'Medical Director, Consultant Dermatologist',
    focus: 'Skin cancer screening · Dermoscopy',
    tone: 'from-[#d9bba8] to-[#8f6a58]',
  },
  {
    initials: 'B',
    name: 'Dr. [Placeholder Name]',
    role: 'Consultant Dermatologist',
    focus: 'Inflammatory skin disease · Paediatric eczema',
    tone: 'from-[#e8d6c8] to-[#a98a77]',
  },
  {
    initials: 'C',
    name: 'Dr. [Placeholder Name]',
    role: 'Aesthetic Dermatologist',
    focus: 'Laser medicine · Injectables',
    tone: 'from-[#cfae9a] to-[#6e4d3f]',
  },
]

export const processSteps = [
  {
    n: '01',
    title: 'Consultation',
    duration: '45 min',
    body: 'A conversation first. Your history, your concerns, and what you hope to change or simply understand.',
  },
  {
    n: '02',
    title: 'Skin analysis',
    duration: '20 min',
    body: 'Imaging and measurements across a 12-point protocol, reviewed with you on screen, in plain language.',
  },
  {
    n: '03',
    title: 'Personalised plan',
    duration: 'Same day',
    body: 'A written plan with options, timelines, expected recovery and costs. No pressure, and no packages.',
  },
  {
    n: '04',
    title: 'Follow-up',
    duration: '6 weeks',
    body: 'We review results against your baseline images and adjust. Medical patients receive ongoing monitoring.',
  },
]

// PLACEHOLDER testimonials: publish only verified reviews with written patient consent.
export const testimonials = [
  { topic: 'Mole mapping', body: 'Testimonial placeholder. A verified patient account of their screening experience will appear here.' },
  { topic: 'Acne treatment', body: 'Testimonial placeholder. A verified patient account of their treatment journey will appear here.' },
  { topic: 'Laser resurfacing', body: 'Testimonial placeholder. A verified patient account of their recovery and results will appear here.' },
]
