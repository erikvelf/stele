import { z } from 'zod';

import { DEFAULT_STONE_ID, STONE_IDS } from '@/modules/types';

export const themeModeSchema = z.enum(['system', 'light', 'dark']);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const appearanceSchema = z.object({
  themeMode: themeModeSchema.default('system'),
  stoneId: z.enum(STONE_IDS).default(DEFAULT_STONE_ID),
});
export type Appearance = z.infer<typeof appearanceSchema>;

export const APPEARANCE_DEFAULTS = appearanceSchema.parse({});
