import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { formatPeriod } from '@/lib/format-period';
import type { Period } from '@/lib/format-period';

import { SPACING } from '@/constants/layout';

interface HeaderProps {
  period: Period;
  variant: 'medium' | 'small';
  onPress?: () => void;
}

// Dates come out of the locale lowercase; a divider reads better with its
// first letter raised.
function capitalize(label: string): string {
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

// A period divider, drawn as a tinted band rather than a rule: the layer it
// opens sits below it, so the header reads as the lid on that stack. The
// tone is the theme's own elevation tint — a lighter surface, not a shadow.
// The variant carries which layer: medium is the one the view is grouped by,
// small is the layer nested inside it.
export function Header({ period, variant, onPress }: HeaderProps) {
  const theme = useTheme();
  const isMedium = variant === 'medium';

  const content = (
    <View
      style={[
        isMedium ? styles.medium : styles.small,
        {
          backgroundColor: isMedium
            ? theme.colors.elevation.level4
            : theme.colors.elevation.level2,
        },
      ]}
    >
      <Text
        variant={isMedium ? 'titleMedium' : 'labelLarge'}
        style={{
          color: isMedium ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
        }}
      >
        {capitalize(formatPeriod(period))}
      </Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  medium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
});
