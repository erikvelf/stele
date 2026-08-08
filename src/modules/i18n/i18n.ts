import type { Locale as DateFnsLocale } from 'date-fns';
import { enUS, it as itDateFns } from 'date-fns/locale';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { FALLBACK_LOCALE, LOCALES } from '@/modules/types';
import type { AppLocale, LanguagePreference } from '@/modules/types';

import en from './en.json';
import it from './it.json';

// A key the active catalog does not carry falls back to English rather than
// rendering a missing-translation marker in the interface.
const i18n = new I18n({ en, it });
i18n.defaultLocale = FALLBACK_LOCALE;
i18n.enableFallback = true;
i18n.locale = FALLBACK_LOCALE;

// i18n.locale is a plain string, so the active locale is tracked separately
// to keep the date-fns lookup exhaustive.
let activeLocale: AppLocale = FALLBACK_LOCALE;

function isAppLocale(code: string): code is AppLocale {
  return LOCALES.some(locale => locale === code);
}

// The first device language the catalog covers. A device set to a language
// with no catalog reads English.
function deviceLocale(): AppLocale {
  for (const locale of getLocales()) {
    const code = locale.languageCode;
    if (code !== null && isAppLocale(code)) {
      return code;
    }
  }
  return FALLBACK_LOCALE;
}

export function resolveLocale(preference: LanguagePreference): AppLocale {
  return preference === 'system' ? deviceLocale() : preference;
}

export function setLocale(locale: AppLocale): void {
  activeLocale = locale;
  i18n.locale = locale;
}

// The values a message interpolates. `count` additionally selects the plural
// form, so a pluralised key reads its `one` and `other` branches from it.
export type TranslateValues = Record<string, string | number>;

export type Translate = (key: string, values?: TranslateValues) => string;

export function translate(key: string, values?: TranslateValues): string {
  return i18n.t(key, values);
}

export function dateLocale(): DateFnsLocale {
  return activeLocale === 'it' ? itDateFns : enUS;
}
