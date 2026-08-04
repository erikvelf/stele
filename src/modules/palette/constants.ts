import type { StoneId } from '@/modules/types';

export const STONE_FAMILIES = [
  'neutral',
  'blue',
  'violet',
  'red',
  'yellow',
  'green',
] as const;

export type StoneFamily = (typeof STONE_FAMILIES)[number];

// A named accent's hue family and the source colour handed to the MD3
// palette generator. The id is what settings persists; its Italian label is
// a map in the UI layer.
export interface Stone {
  family: StoneFamily;
  seed: string;
}

// Six families of three, ordered around the hue wheel, each member drifting
// towards the next family. A `Record` keyed by every `StoneId` means adding
// or removing an id in modules/types/stone.ts is a compile error here until
// this map is updated to match.
export const STONE_DETAILS: Record<StoneId, Stone> = {
  basalt: { family: 'neutral', seed: '#3B3C36' },
  slate: { family: 'neutral', seed: '#576675' },
  travertine: { family: 'neutral', seed: '#BFA06A' },

  turquoise: { family: 'blue', seed: '#3AA8B8' },
  'lapis-lazuli': { family: 'blue', seed: '#26619C' },
  sodalite: { family: 'blue', seed: '#3B3F94' },

  amethyst: { family: 'violet', seed: '#9966CC' },
  porphyry: { family: 'violet', seed: '#7C3245' },
  rhodochrosite: { family: 'violet', seed: '#C7466B' },

  garnet: { family: 'red', seed: '#A02B3A' },
  cinnabar: { family: 'red', seed: '#E34234' },
  carnelian: { family: 'red', seed: '#C1440E' },

  amber: { family: 'yellow', seed: '#E0A020' },
  ochre: { family: 'yellow', seed: '#CC7722' },
  sulfur: { family: 'yellow', seed: '#D9C400' },

  serpentine: { family: 'green', seed: '#6B8E23' },
  malachite: { family: 'green', seed: '#10A36A' },
  verdigris: { family: 'green', seed: '#43B3AE' },
};

// Placeholder border for a selected tag pill, pending a real selection style.
export const SELECTION_BORDER_COLOR = '#FFFFFF';

// The unselected counterpart to a themed or accent border colour.
export const TRANSPARENT = 'transparent';

// A Map, not bracket access on STONE_DETAILS, so a stone lookup by a
// caller-supplied id isn't a dynamic property access.
const STONE_LOOKUP: ReadonlyMap<StoneId, Stone> = new Map(
  Object.entries(STONE_DETAILS) as [StoneId, Stone][]
);

export function seedFor(id: StoneId): string {
  const stone = STONE_LOOKUP.get(id);
  if (!stone) {
    throw new Error(`Unknown stone id: ${id}`);
  }
  return stone.seed;
}
