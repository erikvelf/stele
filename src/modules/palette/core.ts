import { CorePalette, Hct, argbFromHex } from '@material/material-color-utilities';

import type { StoneId } from '@/modules/types';

import { seedFor } from './constants';

// Below this chroma a seed is treated as neutral and keeps its own low
// chroma via contentOf; at or above it, CorePalette.of amplifies to chroma 48.
const NEUTRAL_CONTENT_CHROMA_THRESHOLD = 20;

const corePaletteCache = new Map<StoneId, CorePalette>();

export function corePaletteFor(stoneId: StoneId): CorePalette {
  const cached = corePaletteCache.get(stoneId);
  if (cached) {
    return cached;
  }

  const sourceArgb = argbFromHex(seedFor(stoneId));
  const isNearNeutral = Hct.fromInt(sourceArgb).chroma < NEUTRAL_CONTENT_CHROMA_THRESHOLD;
  const corePalette = isNearNeutral ? CorePalette.contentOf(sourceArgb) : CorePalette.of(sourceArgb);
  corePaletteCache.set(stoneId, corePalette);
  return corePalette;
}
