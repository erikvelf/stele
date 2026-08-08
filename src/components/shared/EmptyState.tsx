import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';

const CIRCLE_SIZE = 96;
const EMOJI_SIZE = 40;
const CIRCLE_FILL_OPACITY = 0.24;

export interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <View
          style={[styles.circleFill, { backgroundColor: theme.colors.primary }]}
        />
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFill: {
    ...StyleSheet.absoluteFill,
    opacity: CIRCLE_FILL_OPACITY,
  },
  emoji: {
    fontSize: EMOJI_SIZE,
  },
  title: {
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
