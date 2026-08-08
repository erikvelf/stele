// The accent palette's id space. Needed by modules/palette (which owns the
// hex seeds and family groupings) and modules/settings (which persists the
// chosen id) — a type two domains need is owned by neither, per the
// structure guide's Period precedent.
export const STONE_IDS = [
  'basalt',
  'slate',
  'travertine',
  'turquoise',
  'lapis-lazuli',
  'sodalite',
  'amethyst',
  'porphyry',
  'rhodochrosite',
  'garnet',
  'cinnabar',
  'carnelian',
  'amber',
  'ochre',
  'sulfur',
  'serpentine',
  'malachite',
  'verdigris',
] as const;

export type StoneId = (typeof STONE_IDS)[number];

export const DEFAULT_STONE_ID: StoneId = 'slate';

export const DEFAULT_ICON_STONE_ID: StoneId = 'serpentine';
