import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { StoneId } from '@/modules/types';

import { corePaletteFor } from './core';

import { hexFromArgb, Scheme } from '@material/material-color-utilities';
import type { Scheme as SchemeType } from '@material/material-color-utilities';

type MD3Colors = MD3Theme['colors'];

// Matches react-native-paper's own MD3LightTheme/MD3DarkTheme derivation:
// elevation is `surface` opaquely tinted with `primary` at these stops.
const ELEVATION_TINT_ALPHA = {
  level1: 0.05,
  level2: 0.08,
  level3: 0.11,
  level4: 0.12,
  level5: 0.14,
} as const;

const DISABLED_SURFACE_ALPHA = 0.12;
const DISABLED_CONTENT_ALPHA = 0.38;
const BACKDROP_ALPHA = 0.4;
const BACKDROP_TONE = 20;

const HEX_RADIX = 16;
const HEX_CHANNEL_LENGTH = 2;

function parseHex(hex: string): { r: number; g: number; b: number } {
  const channel = (index: number) => {
    const start = index * HEX_CHANNEL_LENGTH + 1;
    return parseInt(hex.slice(start, start + HEX_CHANNEL_LENGTH), HEX_RADIX);
  };
  return { r: channel(0), g: channel(1), b: channel(2) };
}

function formatHex(r: number, g: number, b: number): string {
  const channel = (value: number) =>
    Math.round(value).toString(HEX_RADIX).padStart(HEX_CHANNEL_LENGTH, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

// Flattens `tint` over `base` at `tintAlpha`, producing an opaque colour.
// Elevation must stay opaque: a translucent surface composites against
// whatever sits behind it, which is unknown at the point it's painted.
function mixOpaque(base: string, tint: string, tintAlpha: number): string {
  const from = parseHex(base);
  const onto = parseHex(tint);
  const mix = (fromChannel: number, ontoChannel: number) =>
    fromChannel * (1 - tintAlpha) + ontoChannel * tintAlpha;
  return formatHex(
    mix(from.r, onto.r),
    mix(from.g, onto.g),
    mix(from.b, onto.b)
  );
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildColors(scheme: SchemeType, backdropSeed: string): MD3Colors {
  const surface = hexFromArgb(scheme.surface);
  const primary = hexFromArgb(scheme.primary);
  const onSurface = hexFromArgb(scheme.onSurface);

  return {
    primary,
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    surface,
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    surfaceDisabled: rgba(onSurface, DISABLED_SURFACE_ALPHA),
    background: hexFromArgb(scheme.background),
    error: hexFromArgb(scheme.error),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onPrimary: hexFromArgb(scheme.onPrimary),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    onSecondary: hexFromArgb(scheme.onSecondary),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    onTertiary: hexFromArgb(scheme.onTertiary),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    onSurface,
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    onSurfaceDisabled: rgba(onSurface, DISABLED_CONTENT_ALPHA),
    onError: hexFromArgb(scheme.onError),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),
    onBackground: hexFromArgb(scheme.onBackground),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary),
    shadow: hexFromArgb(scheme.shadow),
    scrim: hexFromArgb(scheme.scrim),
    backdrop: rgba(backdropSeed, BACKDROP_ALPHA),
    elevation: {
      level0: 'transparent',
      level1: mixOpaque(surface, primary, ELEVATION_TINT_ALPHA.level1),
      level2: mixOpaque(surface, primary, ELEVATION_TINT_ALPHA.level2),
      level3: mixOpaque(surface, primary, ELEVATION_TINT_ALPHA.level3),
      level4: mixOpaque(surface, primary, ELEVATION_TINT_ALPHA.level4),
      level5: mixOpaque(surface, primary, ELEVATION_TINT_ALPHA.level5),
    },
  };
}

const themeCache = new Map<string, MD3Theme>();

export function buildTheme(stoneId: StoneId, isDark: boolean): MD3Theme {
  const cacheKey = `${stoneId}-${isDark}`;
  const cached = themeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const corePalette = corePaletteFor(stoneId);
  const scheme = isDark
    ? Scheme.darkFromCorePalette(corePalette)
    : Scheme.lightFromCorePalette(corePalette);
  const backdropSeed = hexFromArgb(corePalette.n2.tone(BACKDROP_TONE));
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  const theme: MD3Theme = {
    ...base,
    colors: buildColors(scheme, backdropSeed),
  };
  themeCache.set(cacheKey, theme);
  return theme;
}
