import { createMMKV } from 'react-native-mmkv';

import type {
  AllSettings,
  Appearance,
  AppIcon,
  AppLock,
  DailyReminder,
  EntryTemplate,
  Haptics,
  Language,
  LogView,
  Privacy,
} from './schema';
import {
  APP_ICON_DEFAULTS,
  APP_LOCK_DEFAULTS,
  APPEARANCE_DEFAULTS,
  appearanceSchema,
  appIconSchema,
  appLockSchema,
  DAILY_REMINDER_DEFAULTS,
  dailyReminderSchema,
  ENTRY_TEMPLATE_DEFAULTS,
  entryTemplateSchema,
  HAPTICS_DEFAULTS,
  hapticsSchema,
  LANGUAGE_DEFAULTS,
  languageSchema,
  LOG_VIEW_DEFAULTS,
  logViewSchema,
  PRIVACY_DEFAULTS,
  privacySchema,
} from './schema';

const APPEARANCE_STORAGE_KEY = 'settings.appearance';
const APP_ICON_STORAGE_KEY = 'settings.appIcon';
const APP_LOCK_STORAGE_KEY = 'settings.appLock';
const PRIVACY_STORAGE_KEY = 'settings.privacy';
const DAILY_REMINDER_STORAGE_KEY = 'settings.dailyReminder';
const ENTRY_TEMPLATE_STORAGE_KEY = 'settings.entryTemplate';
const LOG_VIEW_STORAGE_KEY = 'settings.logView';
const LANGUAGE_STORAGE_KEY = 'settings.language';
const HAPTICS_STORAGE_KEY = 'settings.haptics';

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

export function readAppIcon(): AppIcon {
  const raw = storage.getString(APP_ICON_STORAGE_KEY);
  if (raw === undefined) {
    return APP_ICON_DEFAULTS;
  }

  const parsed = appIconSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : APP_ICON_DEFAULTS;
}

export function writeAppIcon(appIcon: AppIcon): void {
  storage.set(APP_ICON_STORAGE_KEY, JSON.stringify(appIcon));
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

export function readLogView(): LogView {
  const raw = storage.getString(LOG_VIEW_STORAGE_KEY);
  if (raw === undefined) {
    return LOG_VIEW_DEFAULTS;
  }

  const parsed = logViewSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : LOG_VIEW_DEFAULTS;
}

export function writeLogView(logView: LogView): void {
  storage.set(LOG_VIEW_STORAGE_KEY, JSON.stringify(logView));
}

export function readLanguage(): Language {
  const raw = storage.getString(LANGUAGE_STORAGE_KEY);
  if (raw === undefined) {
    return LANGUAGE_DEFAULTS;
  }

  const parsed = languageSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : LANGUAGE_DEFAULTS;
}

export function writeLanguage(language: Language): void {
  storage.set(LANGUAGE_STORAGE_KEY, JSON.stringify(language));
}

export function readHaptics(): Haptics {
  const raw = storage.getString(HAPTICS_STORAGE_KEY);
  if (raw === undefined) {
    return HAPTICS_DEFAULTS;
  }

  const parsed = hapticsSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : HAPTICS_DEFAULTS;
}

export function writeHaptics(haptics: Haptics): void {
  storage.set(HAPTICS_STORAGE_KEY, JSON.stringify(haptics));
}

export function readAllSettings(): AllSettings {
  return {
    appearance: readAppearance(),
    appIcon: readAppIcon(),
    appLock: readAppLock(),
    privacy: readPrivacy(),
    haptics: readHaptics(),
    dailyReminder: readDailyReminder(),
    entryTemplate: readEntryTemplate(),
    logView: readLogView(),
    language: readLanguage(),
  };
}

export function writeAllSettings(settings: AllSettings): void {
  writeAppearance(settings.appearance);
  writeAppIcon(settings.appIcon);
  writeAppLock(settings.appLock);
  writePrivacy(settings.privacy);
  writeHaptics(settings.haptics);
  writeDailyReminder(settings.dailyReminder);
  writeEntryTemplate(settings.entryTemplate);
  writeLogView(settings.logView);
  writeLanguage(settings.language);
}
