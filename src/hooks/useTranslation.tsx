import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import type { Locale as DateFnsLocale } from 'date-fns';

import { dateLocale, resolveLocale, setLocale, translate } from '@/modules/i18n';
import type { Translate, TranslateValues } from '@/modules/i18n';
import { readLanguage, writeLanguage } from '@/modules/settings';
import type { LanguagePreference } from '@/modules/types';

interface TranslationContextValue {
  t: Translate;
  // The date-fns locale for the active language. Taken from the context so a
  // language change re-renders whoever formats a date.
  locale: DateFnsLocale;
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

// The catalog is a plain object, so a locale change is invisible to React.
// Reading the preference through state is what turns it into a render.
function initialLanguage(): LanguagePreference {
  const { preference } = readLanguage();
  setLocale(resolveLocale(preference));
  return preference;
}

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguageState] =
    useState<LanguagePreference>(initialLanguage);

  const setLanguage = useCallback((next: LanguagePreference) => {
    writeLanguage({ preference: next });
    setLocale(resolveLocale(next));
    setLanguageState(next);
  }, []);

  const value = useMemo<TranslationContextValue>(
    () => ({
      // Rebuilt on every language change so memoised children see a new
      // identity and re-render with the new catalog.
      t: (key: string, values?: TranslateValues) => translate(key, values),
      locale: dateLocale(),
      language,
      setLanguage,
    }),
    [language, setLanguage]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextValue {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
