// The catalog's locale space. Needed by modules/i18n (which owns the catalogs
// and the date-fns mapping) and modules/settings (which persists the chosen
// language) — a type two domains need is owned by neither.
export const LOCALES = ['en', 'it'] as const;

export type AppLocale = (typeof LOCALES)[number];

export const FALLBACK_LOCALE: AppLocale = 'en';

// 'system' defers to the device language, and resolves to a locale at read
// time rather than being stored as one.
export const LANGUAGE_PREFERENCES = ['system', ...LOCALES] as const;

export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];
