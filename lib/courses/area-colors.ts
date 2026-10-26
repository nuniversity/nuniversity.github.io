/**
 * Area colour map.
 *
 * A course belongs to an "area" (Artificial Intelligence, Cloud & AI/ML, …).
 * Each area is given a colour from the site palette so the same area always
 * looks the same wherever it appears — on a card, in the spotlight, in the
 * course catalogue.
 */
export const AREA_GRADIENTS = [
  'bg-gradient-section-courses',
  'bg-gradient-section-tools',
  'bg-gradient-section-games',
  'bg-gradient-section-library',
  'bg-gradient-section-languages',
  'bg-gradient-section-roadmaps',
] as const

export const AREA_TEXT = [
  'text-section-courses',
  'text-section-tools',
  'text-section-games',
  'text-section-library',
  'text-section-languages',
  'text-section-roadmaps',
] as const

export const AREA_SOFT = [
  'bg-section-courses-soft',
  'bg-section-tools-soft',
  'bg-section-games-soft',
  'bg-section-library-soft',
  'bg-section-languages-soft',
  'bg-section-roadmaps-soft',
] as const

/** Gradient for a course area, by its position in the catalogue. */
export function getAreaGradient(index: number): string {
  return AREA_GRADIENTS[index % AREA_GRADIENTS.length]
}

/** Text colour for a course area, by its position in the catalogue. */
export function getAreaText(index: number): string {
  return AREA_TEXT[index % AREA_TEXT.length]
}

/** Soft background for a course area, by its position in the catalogue. */
export function getAreaSoft(index: number): string {
  return AREA_SOFT[index % AREA_SOFT.length]
}
