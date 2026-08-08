import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import type { PeriodKind } from '@/modules/types';

const MOAI = '🗿';
const AVATAR_SIZE = 36;
const EMOJI_SIZE = 18;
// The same tinted disc the empty states use, at the size a list row affords.
const CIRCLE_FILL_OPACITY = 0.24;

// Only weeks and months roll; any other kind reads as a week.
function messageKeyFor(kind: PeriodKind): string {
  return kind === 'month'
    ? 'reflection.rolling.month'
    : 'reflection.rolling.week';
}

interface PeriodRollingNoticeProps {
  kind: PeriodKind;
}

// Stands in for the reflection field while its period is still running. It
// states the rule rather than disabling an input with no explanation, and it
// asks for nothing — the period simply has not finished yet.
export function PeriodRollingNotice({ kind }: PeriodRollingNoticeProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <View style={styles.circle}>
        <View
          style={[styles.circleFill, { backgroundColor: theme.colors.primary }]}
        />
        <Text style={styles.emoji}>{MOAI}</Text>
      </View>
      <Text
        variant="bodySmall"
        style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
      >
        {t(messageKeyFor(kind))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  circle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
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
  message: {
    flex: 1,
  },
});
