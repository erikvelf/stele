import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { authenticateAsync } from 'expo-local-authentication';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  Stack,
  ThemeProvider,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { Avatar, Button, PaperProvider, Surface, Text } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppThemeProvider, useAppTheme } from '@/hooks/useAppTheme';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { NewFolderDraftProvider } from '@/hooks/useNewFolderDraft';
import { SPACING } from '@/constants/layout';
import { addNotificationResponseListener } from '@/lib/notifications';
import { db, migrations } from '@/modules/db';
import { seedJournalFolder } from '@/modules/folders';
import { applyPrivacyProtection, readAppLock, readPrivacy } from '@/modules/settings';

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
  const router = useRouter();
  const { reschedule } = useDailyReminder();
  const [isLocked, setIsLocked] = useState(() => readAppLock().enabled);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const subscription = addNotificationResponseListener(() => {
      router.push('/?openComposer=1');
    });
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (status === 'active') {
          reschedule();
        }
      }
    );
    return () => subscription.remove();
  }, [reschedule]);

  const attemptUnlock = useCallback(() => {
    void authenticateAsync().then(result => {
      if (result.success) {
        setIsLocked(false);
      }
    });
  }, []);

  useEffect(() => {
    if (isLocked) {
      attemptUnlock();
    }
  }, [isLocked, attemptUnlock]);

  useEffect(() => {
    applyPrivacyProtection(readPrivacy().hideInRecents);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      const { enabled, relockIntervalMs } = readAppLock();
      if (!enabled) {
        return;
      }

      if (status === 'background' || status === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }

      if (status === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        if (elapsed >= Number(relockIntervalMs)) {
          setIsLocked(true);
        }
        backgroundedAt.current = null;
      }
    });

    return () => subscription.remove();
  }, []);

  const navigationTheme = useMemo(
    () =>
      adaptTheme(theme.dark ? NavigationDarkTheme : NavigationLightTheme, theme),
    [theme]
  );

  if (isLocked) {
    return (
      <PaperProvider theme={theme} settings={paperSettings}>
        <Surface style={styles.lockScreen}>
          <Avatar.Icon
            size={112}
            icon="lock"
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
          <View style={styles.lockScreenCopy}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              Stele is locked
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Unlock to continue
            </Text>
          </View>
          <Button mode="contained" onPress={attemptUnlock}>
            Unlock
          </Button>
        </Surface>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme} settings={paperSettings}>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="note/[id]" options={{ title: 'Sasso' }} />
          <Stack.Screen name="note/plain/[id]" options={{ title: 'Nota' }} />
          <Stack.Screen name="folder/[id]" options={{ title: 'Tavola' }} />
          <Stack.Screen
            name="folder/new-color"
            options={{ title: 'Colore', presentation: 'modal' }}
          />
          <Stack.Screen
            name="folder/new-emoji"
            options={{ title: 'Emoji', presentation: 'modal' }}
          />
          <Stack.Screen name="tag/index" options={{ title: 'Tag' }} />
          <Stack.Screen name="appearance" options={{ title: 'Aspetto' }} />
          <Stack.Screen
            name="privacy-security"
            options={{ title: 'Privacy & security' }}
          />
          <Stack.Screen
            name="notifications"
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="journal-behaviour"
            options={{ title: 'Journal behaviour' }}
          />
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
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <AppThemeProvider>
          <NewFolderDraftProvider>
            <RootLayoutNavigator />
          </NewFolderDraftProvider>
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
  },
  lockScreenCopy: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
});
