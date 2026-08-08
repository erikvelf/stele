import type { StoneId } from '@/modules/types';

import { seedFor } from './constants';

import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
} from '@material/material-color-utilities';

// MD3's container/on-container tone pair: a low-chroma-reads-as-tinted
// background with body-text-legible contrast against it, generated in HCT
// (hue/chroma/tone) rather than blended in sRGB — the same mechanism
// Material uses for its own dynamic color roles.
const CONTAINER_TONE_LIGHT = 90;
const CONTAINER_TONE_DARK = 30;
const ON_CONTAINER_TONE_LIGHT = 10;
const ON_CONTAINER_TONE_DARK = 90;

export interface TonalPair {
  container: string;
  onContainer: string;
}

// (stoneId, isDark) is a small finite domain, so the expensive tonal
// palette generation behind this is computed once per combination and reused.
const tonalPairCache = new Map<string, TonalPair>();

export function tonalPairFor(stoneId: StoneId, isDark: boolean): TonalPair {
  const cacheKey = `${stoneId}-${isDark}`;
  const cached = tonalPairCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const palette = TonalPalette.fromInt(argbFromHex(seedFor(stoneId)));
  const containerTone = isDark ? CONTAINER_TONE_DARK : CONTAINER_TONE_LIGHT;
  const onContainerTone = isDark
    ? ON_CONTAINER_TONE_DARK
    : ON_CONTAINER_TONE_LIGHT;

  const pair: TonalPair = {
    container: hexFromArgb(palette.tone(containerTone)),
    onContainer: hexFromArgb(palette.tone(onContainerTone)),
  };
  tonalPairCache.set(cacheKey, pair);
  return pair;
}
