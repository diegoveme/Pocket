export const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'concept', label: 'Concept' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'difference', label: 'The difference' },
  { id: 'two-sides', label: 'Two sides' },
  { id: 'cta', label: 'Get early access' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
