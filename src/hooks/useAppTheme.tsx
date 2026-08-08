import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { MD3Theme } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';
import { buildTheme } from '@/modules/palette';
import { readAppearance, writeAppearance } from '@/modules/settings';
import type { Appearance, ThemeMode } from '@/modules/settings';
import type { StoneId } from '@/modules/types';

interface AppThemeContextValue {
  theme: MD3Theme;
  themeMode: ThemeMode;
  stoneId: StoneId;
  setThemeMode: (themeMode: ThemeMode) => void;
  setStoneId: (stoneId: StoneId) => void;
}

function persist(current: Appearance, patch: Partial<Appearance>): Appearance {
  const next = { ...current, ...patch };
  writeAppearance(next);
  return next;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  const systemScheme = useColorScheme();

  const isDark =
    appearance.themeMode === 'system'
      ? systemScheme === 'dark'
      : appearance.themeMode === 'dark';

  const theme = useMemo(
    () => buildTheme(appearance.stoneId, isDark),
    [appearance.stoneId, isDark]
  );

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setAppearance(current => persist(current, { themeMode }));
  }, []);

  const setStoneId = useCallback((stoneId: StoneId) => {
    setAppearance(current => persist(current, { stoneId }));
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      themeMode: appearance.themeMode,
      stoneId: appearance.stoneId,
      setThemeMode,
      setStoneId,
    }),
    [theme, appearance.themeMode, appearance.stoneId, setThemeMode, setStoneId]
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
}
