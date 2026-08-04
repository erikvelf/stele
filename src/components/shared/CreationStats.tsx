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
const TEXT_LINE_HEIGHT = 20;

export function CreationStats({ rows }: CreationStatsProps) {
  const theme = useTheme();

  return (
    <Surface style={styles.surface} elevation={0}>
      {rows.map(row => (
        <View key={row.icon} style={styles.row}>
          <View style={styles.iconSlot}>
            <Icon source={row.icon} size={ICON_SIZE} color={theme.colors.onSurfaceVariant} />
          </View>
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
  iconSlot: {
    height: TEXT_LINE_HEIGHT,
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    flexWrap: 'wrap',
  },
});
