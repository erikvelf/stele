import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useAutosave } from '@/hooks/useAutosave';
import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const HOUR_STEP = 1;
const MINUTE_STEP = 5;

const STEP_ICON_SIZE = 32;
const VALUE_WIDTH = 88;
const SEPARATOR_WIDTH = 24;

const REMINDER_KEY = 'dailyReminder';

interface ReminderTime {
  hour: number;
  minute: number;
}

// Steps `value` by `step` and wraps at `limit`, so 23 + 1 reads 00 and
// 00 - 5 reads 55. The second modulo turns a negative remainder positive.
function wrap(value: number, step: number, limit: number): number {
  return (((value + step) % limit) + limit) % limit;
}

// A stored minute the reminder kept from an earlier version, or from a system
// clock, may sit off the 5-minute grid the steppers move on.
function snapMinute(minute: number): number {
  return (Math.round(minute / MINUTE_STEP) * MINUTE_STEP) % MINUTES_PER_HOUR;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

interface DailyReminderTimePickerProps {
  hour: number;
  minute: number;
  onSave: (hour: number, minute: number) => void;
}

// The steppers move a draft, and the draft is written once the taps stop, so
// a run of taps re-queues the notification once instead of on every step.
export function DailyReminderTimePicker({
  hour,
  minute,
  onSave,
}: DailyReminderTimePickerProps) {
  const { t } = useTranslation();
  const [draftHour, setDraftHour] = useState(hour);
  const [draftMinute, setDraftMinute] = useState(() => snapMinute(minute));

  const autosave = useAutosave<string, ReminderTime>((_, time) =>
    onSave(time.hour, time.minute)
  );

  const stepHour = (direction: number) => {
    haptics.select();
    const next = wrap(draftHour, direction * HOUR_STEP, HOURS_PER_DAY);
    setDraftHour(next);
    autosave.schedule(REMINDER_KEY, { hour: next, minute: draftMinute });
  };

  const stepMinute = (direction: number) => {
    haptics.select();
    const next = wrap(draftMinute, direction * MINUTE_STEP, MINUTES_PER_HOUR);
    setDraftMinute(next);
    autosave.schedule(REMINDER_KEY, { hour: draftHour, minute: next });
  };

  return (
    <View style={styles.container}>
      <StepperColumn
        value={draftHour}
        unit={t('notifications.dailyReminder.hours')}
        onStep={stepHour}
      />
      <Text variant="displaySmall" style={styles.separator}>
        :
      </Text>
      <StepperColumn
        value={draftMinute}
        unit={t('notifications.dailyReminder.minutes')}
        onStep={stepMinute}
      />
    </View>
  );
}

interface StepperColumnProps {
  value: number;
  unit: string;
  onStep: (direction: number) => void;
}

function StepperColumn({ value, unit, onStep }: StepperColumnProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.column}>
      <IconButton
        icon="chevron-up"
        size={STEP_ICON_SIZE}
        accessibilityLabel={t('notifications.dailyReminder.increase', { unit })}
        onPress={() => onStep(1)}
      />
      <Text variant="displaySmall" style={styles.value}>
        {pad(value)}
      </Text>
      <IconButton
        icon="chevron-down"
        size={STEP_ICON_SIZE}
        accessibilityLabel={t('notifications.dailyReminder.decrease', { unit })}
        onPress={() => onStep(-1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
  },
  column: {
    alignItems: 'center',
    width: VALUE_WIDTH,
  },
  value: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    width: SEPARATOR_WIDTH,
    textAlign: 'center',
  },
});
