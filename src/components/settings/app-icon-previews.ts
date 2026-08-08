import type { StoneId } from '@/modules/types';

const APP_ICON_PREVIEWS: Record<StoneId, number> = {
  basalt: require('@/assets/icons/previews/icon-basalt.png'),
  slate: require('@/assets/icons/previews/icon-slate.png'),
  travertine: require('@/assets/icons/previews/icon-travertine.png'),
  turquoise: require('@/assets/icons/previews/icon-turquoise.png'),
  'lapis-lazuli': require('@/assets/icons/previews/icon-lapis-lazuli.png'),
  sodalite: require('@/assets/icons/previews/icon-sodalite.png'),
  amethyst: require('@/assets/icons/previews/icon-amethyst.png'),
  porphyry: require('@/assets/icons/previews/icon-porphyry.png'),
  rhodochrosite: require('@/assets/icons/previews/icon-rhodochrosite.png'),
  garnet: require('@/assets/icons/previews/icon-garnet.png'),
  cinnabar: require('@/assets/icons/previews/icon-cinnabar.png'),
  carnelian: require('@/assets/icons/previews/icon-carnelian.png'),
  amber: require('@/assets/icons/previews/icon-amber.png'),
  ochre: require('@/assets/icons/previews/icon-ochre.png'),
  sulfur: require('@/assets/icons/previews/icon-sulfur.png'),
  serpentine: require('@/assets/icons/previews/icon-serpentine.png'),
  malachite: require('@/assets/icons/previews/icon-malachite.png'),
  verdigris: require('@/assets/icons/previews/icon-verdigris.png'),
};

// A Map, not bracket access on the Record above, so a lookup by a
// caller-supplied id isn't a dynamic property access.
const PREVIEW_LOOKUP: ReadonlyMap<StoneId, number> = new Map(
  Object.entries(APP_ICON_PREVIEWS) as [StoneId, number][]
);

export function appIconPreviewFor(id: StoneId): number {
  const preview = PREVIEW_LOOKUP.get(id);
  if (preview === undefined) {
    throw new Error(`Unknown stone id: ${id}`);
  }
  return preview;
}
