import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';

export interface MonthHeaderProps {
  label: string;
}

export function MonthHeader({ label }: MonthHeaderProps) {
  const theme = useTheme();

  return (
    <Text
      variant="labelLarge"
      style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
});
