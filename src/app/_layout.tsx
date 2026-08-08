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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  Avatar,
  Button,
  PaperProvider,
  Surface,
  Text,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { AppThemeProvider, useAppTheme } from '@/hooks/useAppTheme';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { NewFolderDraftProvider } from '@/hooks/useNewFolderDraft';
import { TranslationProvider, useTranslation } from '@/hooks/useTranslation';
import { addNotificationResponseListener } from '@/lib/notifications';
import { db, migrations } from '@/modules/db';
import { seedJournalFolder } from '@/modules/folders';
import {
  applyPrivacyProtection,
  readAppLock,
  readPrivacy,
} from '@/modules/settings';

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

const LOCK_ICON_SIZE = 112;

// A proper noun, so it stays out of the catalogs.
const APP_NAME = 'Stele';

// Only the Settings tab pushes these, so their back button names it.
const SETTINGS_ROUTES = [
  { name: 'appearance', titleKey: 'routes.appearance' },
  { name: 'language', titleKey: 'routes.language' },
  { name: 'color', titleKey: 'routes.color' },
  { name: 'app-icon', titleKey: 'routes.appIcon' },
  { name: 'privacy-security', titleKey: 'routes.privacySecurity' },
  { name: 'notifications', titleKey: 'routes.notifications' },
  { name: 'archive', titleKey: 'routes.archive' },
  { name: 'journal-behaviour', titleKey: 'routes.journalBehaviour' },
  { name: 'about', titleKey: 'routes.about' },
] as const;

interface AppLock {
  isLocked: boolean;
  attemptUnlock: () => void;
}

// Single consumer (this navigator), so it stays local rather than in hooks/.
function useAppLock(): AppLock {
  const [isLocked, setIsLocked] = useState(() => readAppLock().enabled);
  const backgroundedAt = useRef<number | null>(null);
  const isPrompting = useRef(false);

  const attemptUnlock = useCallback(() => {
    if (isPrompting.current) {
      return;
    }

    isPrompting.current = true;
    void authenticateAsync()
      .then(result => {
        if (result.success) {
          setIsLocked(false);
        }
      })
      .finally(() => {
        isPrompting.current = false;
        backgroundedAt.current = null;
      });
  }, []);

  useEffect(() => {
    if (isLocked) {
      attemptUnlock();
    }
  }, [isLocked, attemptUnlock]);

  // The lock returns once the app has spent longer than the interval away.
  // `inactive` is not away: it is a banner, the app switcher, or the
  // biometric prompt itself, which would otherwise relock the app the
  // instant it unlocked it.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (isPrompting.current) {
          return;
        }

        const { enabled, relockIntervalMs } = readAppLock();
        if (!enabled) {
          backgroundedAt.current = null;
          return;
        }

        if (status === 'background') {
          backgroundedAt.current = Date.now();
          return;
        }

        if (status !== 'active' || backgroundedAt.current === null) {
          return;
        }

        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= Number(relockIntervalMs)) {
          setIsLocked(true);
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return { isLocked, attemptUnlock };
}

interface LockScreenProps {
  theme: MD3Theme;
  onUnlock: () => void;
}

function LockScreen({ theme, onUnlock }: LockScreenProps) {
  const { t } = useTranslation();

  return (
    <PaperProvider theme={theme} settings={paperSettings}>
      <Surface elevation={0} style={styles.lockScreen}>
        <Avatar.Icon
          size={LOCK_ICON_SIZE}
          icon="lock"
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
        <View style={styles.lockScreenCopy}>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onSurface }}
          >
            {t('lock.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t('lock.subtitle')}
          </Text>
        </View>
        <Button mode="contained" onPress={onUnlock}>
          {t('lock.action')}
        </Button>
      </Surface>
    </PaperProvider>
  );
}

function RootLayoutNavigator() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { reschedule } = useDailyReminder();
  const { isLocked, attemptUnlock } = useAppLock();

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

  useEffect(() => {
    applyPrivacyProtection(readPrivacy().hideInRecents);
  }, []);

  const navigationTheme = useMemo(
    () =>
      adaptTheme(
        theme.dark ? NavigationDarkTheme : NavigationLightTheme,
        theme
      ),
    [theme]
  );

  if (isLocked) {
    return <LockScreen theme={theme} onUnlock={attemptUnlock} />;
  }

  return (
    <PaperProvider theme={theme} settings={paperSettings}>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: APP_NAME }}
          />
          <Stack.Screen
            name="note/[id]"
            options={{ title: t('routes.stone') }}
          />
          <Stack.Screen
            name="note/plain/[id]"
            options={{ title: t('routes.note') }}
          />
          <Stack.Screen
            name="folder/[id]"
            options={{ title: t('routes.folder') }}
          />
          <Stack.Screen
            name="folder/new-color"
            options={{ title: t('routes.folderColor'), presentation: 'modal' }}
          />
          <Stack.Screen
            name="folder/new-emoji"
            options={{ title: t('routes.folderEmoji'), presentation: 'modal' }}
          />
          <Stack.Screen name="tag/index" options={{ title: t('routes.tag') }} />

          {SETTINGS_ROUTES.map(({ name, titleKey }) => (
            <Stack.Screen
              key={name}
              name={name}
              options={{
                title: t(titleKey),
                headerBackTitle: t('tabs.settings'),
              }}
            />
          ))}
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
        <TranslationProvider>
          <AppThemeProvider>
            <NewFolderDraftProvider>
              <RootLayoutNavigator />
            </NewFolderDraftProvider>
          </AppThemeProvider>
        </TranslationProvider>
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
