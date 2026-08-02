import { StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import type { ThemeMode } from '@/modules/settings';

interface ThemeModeToggleProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const THEME_MODE_SEGMENTS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: 'Sistema', icon: 'theme-light-dark' },
  { value: 'light', label: 'Chiaro', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Scuro', icon: 'weather-night' },
];

export function ThemeModeToggle({ value, onChange }: ThemeModeToggleProps) {
  return (
    <SegmentedButtons<ThemeMode>
      style={styles.segments}
      value={value}
      onValueChange={onChange}
      buttons={THEME_MODE_SEGMENTS}
    />
  );
}

const styles = StyleSheet.create({
  segments: {
    alignSelf: 'stretch',
  },
});
