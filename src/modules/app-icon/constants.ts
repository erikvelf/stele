import type { StoneId } from '@/modules/types';

export const APP_ICON_ERRORS = {
  APPLY_FAILED: 'APP_ICON_APPLY_FAILED',
} as const;

export type AppIconErrorCode =
  (typeof APP_ICON_ERRORS)[keyof typeof APP_ICON_ERRORS];

// Each key names an Android activity alias, `<package>.MainActivity<key>`,
// which a hyphen would make an invalid class name. `null` is the stone whose
// icon the app already ships: it is restored, not enabled.
const APP_ICON_KEYS = {
  basalt: 'basalt',
  slate: 'slate',
  travertine: 'travertine',
  turquoise: 'turquoise',
  'lapis-lazuli': 'lapisLazuli',
  sodalite: 'sodalite',
  amethyst: 'amethyst',
  porphyry: 'porphyry',
  rhodochrosite: 'rhodochrosite',
  garnet: 'garnet',
  cinnabar: 'cinnabar',
  carnelian: 'carnelian',
  amber: 'amber',
  ochre: 'ochre',
  sulfur: 'sulfur',
  serpentine: null,
  malachite: 'malachite',
  verdigris: 'verdigris',
} as const satisfies Record<StoneId, string | null>;

export type AppIconKey = (typeof APP_ICON_KEYS)[StoneId];

// A Map, not bracket access on the object above, so a lookup by a
// caller-supplied id isn't a dynamic property access.
const KEY_LOOKUP: ReadonlyMap<StoneId, AppIconKey> = new Map(
  Object.entries(APP_ICON_KEYS) as [StoneId, AppIconKey][]
);

export function appIconKeyFor(stoneId: StoneId): AppIconKey {
  if (!KEY_LOOKUP.has(stoneId)) {
    throw new Error(`Unknown stone id: ${stoneId}`);
  }
  return KEY_LOOKUP.get(stoneId) ?? null;
}
