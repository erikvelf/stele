import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalize } from '@/lib/capitalize';
import { formatPeriod } from '@/modules/i18n';
import type { Period } from '@/modules/types';

interface HeaderProps {
  period: Period;
  variant: 'medium' | 'small';
  onPress?: () => void;
}

// A period divider, drawn as a tinted band rather than a rule: the layer it
// opens sits below it, so the header reads as the lid on that stack. The
// tone is the theme's own elevation tint — a lighter surface, not a shadow.
// The variant carries which layer: medium is the one the view is grouped by,
// small is the layer nested inside it.
export function Header({ period, variant, onPress }: HeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
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
          color: isMedium
            ? theme.colors.onSurface
            : theme.colors.onSurfaceVariant,
        }}
      >
        {capitalize(formatPeriod(period, t))}
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
