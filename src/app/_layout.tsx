import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { AppThemeProvider, useAppTheme } from '@/hooks/useAppTheme';
import { NewFolderDraftProvider } from '@/hooks/useNewFolderDraft';
import { db, migrations } from '@/modules/db';
import { seedJournalFolder } from '@/modules/folders';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type NavigationTheme = typeof NavigationLightTheme;

// Maps a Material 3 palette onto the six colors the navigator chrome reads.
function adaptTheme(base: NavigationTheme, paper: MD3Theme): NavigationTheme {
  return {
    ...base,
    colors: {
      primary: paper.colors.primary,
      background: paper.colors.background,
      card: paper.colors.elevation.level2,
      text: paper.colors.onSurface,
      border: paper.colors.outline,
      notification: paper.colors.error,
    },
  };
}

const paperSettings = {
  icon: (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
    <MaterialCommunityIcons {...props} />
  ),
};

function RootLayoutNavigator() {
  const { theme } = useAppTheme();

  const navigationTheme = useMemo(
    () =>
      adaptTheme(theme.dark ? NavigationDarkTheme : NavigationLightTheme, theme),
    [theme]
  );

  return (
    <PaperProvider theme={theme} settings={paperSettings}>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="note/[id]" options={{ title: 'Sasso' }} />
          <Stack.Screen name="folder/[id]" options={{ title: 'Tavola' }} />
          <Stack.Screen
            name="folder/new-color"
            options={{ title: 'Colore', presentation: 'modal' }}
          />
          <Stack.Screen
            name="folder/new-emoji"
            options={{ title: 'Emoji', presentation: 'modal' }}
          />
          <Stack.Screen name="appearance" options={{ title: 'Aspetto' }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }
    void seedJournalFolder().then(result => {
      if (!result.success) {
        setSeedError(new Error(result.error.cause));
        return;
      }
      setIsSeeded(true);
    });
  }, [success]);

  if (error) {
    throw error;
  }

  if (seedError) {
    throw seedError;
  }

  if (!success || !isSeeded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <NewFolderDraftProvider>
        <RootLayoutNavigator />
      </NewFolderDraftProvider>
    </AppThemeProvider>
  );
}
