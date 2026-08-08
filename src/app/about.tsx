import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslateValues } from '@/modules/i18n';

// Metro replaces the call with an asset registry id.
const STELE = require<number>('../../assets/images/splash-icon.png');

// The dimensions of the source artboard.
const STELE_ARTBOARD_WIDTH = 1044;
const STELE_ARTBOARD_HEIGHT = 1912;
const STELE_ASPECT_RATIO = STELE_ARTBOARD_WIDTH / STELE_ARTBOARD_HEIGHT;

const STELE_HEIGHT = 220;

// Holds the assurance to about six words a line, so it reads as a statement.
const ASSURANCE_MAX_WIDTH = 280;

const AUTHOR_LINE = 'Erik Velf · 2026';

// Reads the installed binary, and falls back to the build config on web,
// where both expo-application values are null.
function versionMessage(): { key: string; values: TranslateValues } {
  const version = nativeApplicationVersion ?? Constants.expoConfig?.version;
  if (version === undefined || version === null) {
    return { key: 'about.versionUnknown', values: {} };
  }
  if (nativeBuildVersion === null) {
    return { key: 'about.version', values: { version } };
  }
  return {
    key: 'about.versionWithBuild',
    values: { version, build: nativeBuildVersion },
  };
}

export default function AboutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const version = versionMessage();

  return (
    <Surface style={styles.screen} elevation={0}>
      <View style={styles.card}>
        <Image
          style={styles.stele}
          source={STELE}
          contentFit="contain"
          accessibilityLabel="Stele"
        />
        <View style={styles.identity}>
          <Text variant="headlineSmall">Stele</Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t(version.key, version.values)}
          </Text>
        </View>
        <Text
          variant="bodySmall"
          style={[styles.assurance, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('about.assurance')}
        </Text>
      </View>
      <Text
        variant="labelSmall"
        style={[
          styles.author,
          {
            color: theme.colors.outline,
            marginBottom: insets.bottom + SPACING.lg,
          },
        ]}
      >
        {AUTHOR_LINE}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
  },
  stele: {
    height: STELE_HEIGHT,
    aspectRatio: STELE_ASPECT_RATIO,
  },
  identity: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  assurance: {
    maxWidth: ASSURANCE_MAX_WIDTH,
    textAlign: 'center',
  },
  author: {
    textAlign: 'center',
  },
});
