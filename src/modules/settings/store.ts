import { createMMKV } from 'react-native-mmkv';

import type { Appearance } from './schema';
import { APPEARANCE_DEFAULTS, appearanceSchema } from './schema';

const APPEARANCE_STORAGE_KEY = 'settings.appearance';

const storage = createMMKV({ id: 'settings' });

// A stored value is untrusted: it may predate the current schema or be
// hand-edited. A parse failure falls back to defaults rather than throwing,
// so a corrupt preference never blocks the app from opening.
export function readAppearance(): Appearance {
  const raw = storage.getString(APPEARANCE_STORAGE_KEY);
  if (raw === undefined) {
    return APPEARANCE_DEFAULTS;
  }

  const parsed = appearanceSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : APPEARANCE_DEFAULTS;
}

export function writeAppearance(appearance: Appearance): void {
  storage.set(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
}
