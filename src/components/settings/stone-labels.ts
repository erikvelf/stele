import type { StoneFamily } from '@/modules/palette';
import type { StoneId } from '@/modules/types';

const STONE_FAMILY_LABELS: Record<StoneFamily, string> = {
  neutral: 'Neutro',
  blue: 'Blu',
  violet: 'Viola',
  red: 'Rosso',
  yellow: 'Giallo',
  green: 'Verde',
};

const STONE_LABELS: Record<StoneId, string> = {
  basalt: 'Basalto',
  slate: 'Ardesia',
  travertine: 'Travertino',
  turquoise: 'Turchese',
  'lapis-lazuli': 'Lapislazzuli',
  sodalite: 'Sodalite',
  amethyst: 'Ametista',
  porphyry: 'Porfido',
  rhodochrosite: 'Rodocrosite',
  garnet: 'Granato',
  cinnabar: 'Cinabro',
  carnelian: 'Corniola',
  amber: 'Ambra',
  ochre: 'Ocra',
  sulfur: 'Zolfo',
  serpentine: 'Serpentino',
  malachite: 'Malachite',
  verdigris: 'Verderame',
};

// Maps, not bracket access on the Records above, so a lookup by a
// caller-supplied id isn't a dynamic property access.
const FAMILY_LABEL_LOOKUP: ReadonlyMap<StoneFamily, string> = new Map(
  Object.entries(STONE_FAMILY_LABELS) as [StoneFamily, string][]
);
const STONE_LABEL_LOOKUP: ReadonlyMap<StoneId, string> = new Map(
  Object.entries(STONE_LABELS) as [StoneId, string][]
);

export function familyLabel(family: StoneFamily): string {
  const label = FAMILY_LABEL_LOOKUP.get(family);
  if (!label) {
    throw new Error(`Unknown stone family: ${family}`);
  }
  return label;
}

export function stoneLabel(id: StoneId): string {
  const label = STONE_LABEL_LOOKUP.get(id);
  if (!label) {
    throw new Error(`Unknown stone id: ${id}`);
  }
  return label;
}
