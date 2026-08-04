import { createMMKV } from 'react-native-mmkv';

import type { AppLock, Appearance, DailyReminder, EntryTemplate, Privacy } from './schema';
import {
  APP_LOCK_DEFAULTS,
  APPEARANCE_DEFAULTS,
  DAILY_REMINDER_DEFAULTS,
  ENTRY_TEMPLATE_DEFAULTS,
  PRIVACY_DEFAULTS,
  appLockSchema,
  appearanceSchema,
  dailyReminderSchema,
  entryTemplateSchema,
  privacySchema,
} from './schema';

const APPEARANCE_STORAGE_KEY = 'settings.appearance';
const APP_LOCK_STORAGE_KEY = 'settings.appLock';
const PRIVACY_STORAGE_KEY = 'settings.privacy';
const DAILY_REMINDER_STORAGE_KEY = 'settings.dailyReminder';
const ENTRY_TEMPLATE_STORAGE_KEY = 'settings.entryTemplate';

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

export function readAppLock(): AppLock {
  const raw = storage.getString(APP_LOCK_STORAGE_KEY);
  if (raw === undefined) {
    return APP_LOCK_DEFAULTS;
  }

  const parsed = appLockSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : APP_LOCK_DEFAULTS;
}

export function writeAppLock(appLock: AppLock): void {
  storage.set(APP_LOCK_STORAGE_KEY, JSON.stringify(appLock));
}

export function readPrivacy(): Privacy {
  const raw = storage.getString(PRIVACY_STORAGE_KEY);
  if (raw === undefined) {
    return PRIVACY_DEFAULTS;
  }

  const parsed = privacySchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : PRIVACY_DEFAULTS;
}

export function writePrivacy(privacy: Privacy): void {
  storage.set(PRIVACY_STORAGE_KEY, JSON.stringify(privacy));
}

export function readDailyReminder(): DailyReminder {
  const raw = storage.getString(DAILY_REMINDER_STORAGE_KEY);
  if (raw === undefined) {
    return DAILY_REMINDER_DEFAULTS;
  }

  const parsed = dailyReminderSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : DAILY_REMINDER_DEFAULTS;
}

export function writeDailyReminder(dailyReminder: DailyReminder): void {
  storage.set(DAILY_REMINDER_STORAGE_KEY, JSON.stringify(dailyReminder));
}

export function readEntryTemplate(): EntryTemplate {
  const raw = storage.getString(ENTRY_TEMPLATE_STORAGE_KEY);
  if (raw === undefined) {
    return ENTRY_TEMPLATE_DEFAULTS;
  }

  const parsed = entryTemplateSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : ENTRY_TEMPLATE_DEFAULTS;
}

export function writeEntryTemplate(entryTemplate: EntryTemplate): void {
  storage.set(ENTRY_TEMPLATE_STORAGE_KEY, JSON.stringify(entryTemplate));
}
