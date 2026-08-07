import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { PeriodKind } from '@/lib/format-period';

import { RADIUS, SPACING } from '@/constants/layout';

const MOAI = '🗿';
const AVATAR_SIZE = 36;
const EMOJI_SIZE = 18;
// The same tinted disc the empty states use, at the size a list row affords.
const CIRCLE_FILL_OPACITY = 0.24;

const WEEK_MESSAGE =
  'La settimana sta ancora rotolando. Aspetta che si fermi per rifletterci.';
const MONTH_MESSAGE =
  'Il mese sta ancora rotolando. Aspetta che si fermi per rifletterci.';

function messageFor(kind: PeriodKind): string {
  return kind === 'month' ? MONTH_MESSAGE : WEEK_MESSAGE;
}

interface PeriodRollingNoticeProps {
  kind: PeriodKind;
}

// Stands in for the reflection field while its period is still running. It
// states the rule rather than disabling an input with no explanation, and it
// asks for nothing — the period simply has not finished yet.
export function PeriodRollingNotice({ kind }: PeriodRollingNoticeProps) {
  const theme = useTheme();

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
        {messageFor(kind)}
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
