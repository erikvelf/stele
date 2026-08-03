import { StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';

export interface CreationStatRow {
  icon: string;
  text: string;
}

export interface CreationStatsProps {
  rows: CreationStatRow[];
}

const ICON_SIZE = 16;

export function CreationStats({ rows }: CreationStatsProps) {
  const theme = useTheme();

  return (
    <Surface style={styles.surface} elevation={0}>
      {rows.map(row => (
        <View key={row.icon} style={styles.row}>
          <Icon source={row.icon} size={ICON_SIZE} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.text}>
            {row.text}
          </Text>
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  text: {
    flex: 1,
    flexWrap: 'wrap',
  },
});
