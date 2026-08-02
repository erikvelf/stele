const HEX_RADIX = 16;
const HEX_CHANNEL_LENGTH = 2;

// WCAG relative luminance channel weights.
const LUMINANCE_WEIGHTS = { r: 0.299, g: 0.587, b: 0.114 } as const;
const LUMINANCE_THRESHOLD = 0.6;
const MAX_CHANNEL_VALUE = 255;

function channel(hex: string, index: number): number {
  const start = index * HEX_CHANNEL_LENGTH + 1;
  return parseInt(hex.slice(start, start + HEX_CHANNEL_LENGTH), HEX_RADIX);
}

// Picks black or white text/icon colour for legibility against a hex background.
export function contrastColor(backgroundHex: string): '#000000' | '#FFFFFF' {
  const luminance =
    (LUMINANCE_WEIGHTS.r * channel(backgroundHex, 0) +
      LUMINANCE_WEIGHTS.g * channel(backgroundHex, 1) +
      LUMINANCE_WEIGHTS.b * channel(backgroundHex, 2)) /
    MAX_CHANNEL_VALUE;
  return luminance > LUMINANCE_THRESHOLD ? '#000000' : '#FFFFFF';
}
