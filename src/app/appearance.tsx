import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Surface } from 'react-native-paper';

import { HapticsToggle } from '@/components/settings/HapticsToggle';
import { stoneLabel } from '@/components/settings/stone-labels';
import { ThemeModeToggle } from '@/components/settings/ThemeModeToggle';
import { SPACING } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { readAppIcon } from '@/modules/settings';
import type { StoneId } from '@/modules/types';

function useAppIconStone(): StoneId {
  const [stoneId, setStoneId] = useState<StoneId>(() => readAppIcon().stoneId);

  useFocusEffect(
    useCallback(() => {
      setStoneId(readAppIcon().stoneId);
    }, [])
  );

  return stoneId;
}

export default function AppearanceScreen() {
  const { t, language } = useTranslation();
  const { themeMode, stoneId, setThemeMode } = useAppTheme();
  const appIconStone = useAppIconStone();

  return (
    <Surface elevation={0} style={styles.screen}>
      <View style={styles.toggle}>
        <ThemeModeToggle value={themeMode} onChange={setThemeMode} />
      </View>

      <HapticsToggle />
      <List.Item
        title={t('appearance.language.title')}
        description={t(`appearance.language.${language}`)}
        left={props => <List.Icon {...props} icon="translate" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/language')}
      />
      <List.Item
        title={t('appearance.stone.title')}
        description={stoneLabel(stoneId, t)}
        left={props => <List.Icon {...props} icon="palette-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/color')}
      />
      <List.Item
        title={t('appearance.appIcon.title')}
        description={stoneLabel(appIconStone, t)}
        left={props => <List.Icon {...props} icon="application-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/app-icon')}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  toggle: {
    padding: SPACING.md,
  },
});
