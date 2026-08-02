import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { StonePicker } from '@/components/settings/StonePicker';
import { ThemeModeToggle } from '@/components/settings/ThemeModeToggle';
import { SPACING } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AppearanceScreen() {
  const { themeMode, stoneId, setThemeMode, setStoneId } = useAppTheme();

  return (
    <Surface style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <ThemeModeToggle value={themeMode} onChange={setThemeMode} />
        <StonePicker value={stoneId} onChange={setStoneId} />
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
});
