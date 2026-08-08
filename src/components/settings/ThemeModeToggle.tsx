import { StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { useTranslation } from '@/hooks/useTranslation';
import type { ThemeMode } from '@/modules/settings';

interface ThemeModeToggleProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const THEME_MODE_SEGMENTS: { value: ThemeMode; icon: string }[] = [
  { value: 'system', icon: 'theme-light-dark' },
  { value: 'light', icon: 'white-balance-sunny' },
  { value: 'dark', icon: 'weather-night' },
];

export function ThemeModeToggle({ value, onChange }: ThemeModeToggleProps) {
  const { t } = useTranslation();

  const buttons = THEME_MODE_SEGMENTS.map(({ value: mode, icon }) => ({
    value: mode,
    label: t(`appearance.themeMode.${mode}`),
    icon,
  }));

  return (
    <SegmentedButtons<ThemeMode>
      style={styles.segments}
      value={value}
      onValueChange={onChange}
      buttons={buttons}
    />
  );
}

const styles = StyleSheet.create({
  segments: {
    alignSelf: 'stretch',
  },
});
