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

export const relockIntervalMsSchema = z.enum(['0', '60000', '120000', '180000', '300000']);
export type RelockIntervalMs = z.infer<typeof relockIntervalMsSchema>;

export const appLockSchema = z.object({
  enabled: z.boolean().default(false),
  relockIntervalMs: relockIntervalMsSchema.default('0'),
});
export type AppLock = z.infer<typeof appLockSchema>;

export const APP_LOCK_DEFAULTS = appLockSchema.parse({});

export const privacySchema = z.object({
  hideInRecents: z.boolean().default(false),
});
export type Privacy = z.infer<typeof privacySchema>;

export const PRIVACY_DEFAULTS = privacySchema.parse({});

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const DEFAULT_REMINDER_HOUR = 20;

export const dailyReminderSchema = z.object({
  enabled: z.boolean().default(false),
  hour: z.number().int().min(0).max(HOURS_PER_DAY - 1).default(DEFAULT_REMINDER_HOUR),
  minute: z.number().int().min(0).max(MINUTES_PER_HOUR - 1).default(0),
});
export type DailyReminder = z.infer<typeof dailyReminderSchema>;

export const DAILY_REMINDER_DEFAULTS = dailyReminderSchema.parse({});

export const entryTemplateSchema = z.object({
  text: z.string().default(''),
});
export type EntryTemplate = z.infer<typeof entryTemplateSchema>;

export const ENTRY_TEMPLATE_DEFAULTS = entryTemplateSchema.parse({});

// How the log was last being read. Tag filters are deliberately absent: a
// filter is a question you are asking now, and one that survived a restart
// would quietly misrepresent the archive.
export const logViewSchema = z.object({
  resolution: z.enum(['day', 'week', 'month']).default('day'),
  direction: z.enum(['newest', 'oldest']).default('newest'),
});
export type LogView = z.infer<typeof logViewSchema>;

export const LOG_VIEW_DEFAULTS = logViewSchema.parse({});

// Every preference in one shape, for the settings export file. A block the
// file omits falls back to its defaults rather than failing the parse.
export const allSettingsSchema = z.object({
  appearance: appearanceSchema.default(APPEARANCE_DEFAULTS),
  appLock: appLockSchema.default(APP_LOCK_DEFAULTS),
  privacy: privacySchema.default(PRIVACY_DEFAULTS),
  dailyReminder: dailyReminderSchema.default(DAILY_REMINDER_DEFAULTS),
  entryTemplate: entryTemplateSchema.default(ENTRY_TEMPLATE_DEFAULTS),
  logView: logViewSchema.default(LOG_VIEW_DEFAULTS),
});
export type AllSettings = z.infer<typeof allSettingsSchema>;
