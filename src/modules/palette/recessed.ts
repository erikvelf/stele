import type { StoneId } from '@/modules/types';

import { corePaletteFor } from './core';

import { hexFromArgb } from '@material/material-color-utilities';

// One step below the scheme's own surface tone (6 dark, 98 light), taken
// from the same neutral palette so it reads as a deeper cut of the surface
// rather than a tinted panel.
const RECESSED_TONE_DARK = 5;
const RECESSED_TONE_LIGHT = 94;

const recessedCache = new Map<string, string>();

export function recessedSurfaceFor(stoneId: StoneId, isDark: boolean): string {
  const cacheKey = `${stoneId}-${isDark}`;
  const cached = recessedCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tone = isDark ? RECESSED_TONE_DARK : RECESSED_TONE_LIGHT;
  const recessed = hexFromArgb(corePaletteFor(stoneId).n1.tone(tone));
  recessedCache.set(cacheKey, recessed);
  return recessed;
}
