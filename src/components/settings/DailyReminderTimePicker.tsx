import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { WheelPicker } from '@/components/ui';
import { SPACING } from '@/constants/layout';

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MINUTE_STEP = 5;

const HOUR_LABELS = Array.from({ length: HOURS_PER_DAY }, (_, hour) =>
  String(hour).padStart(2, '0')
);
const MINUTE_LABELS = Array.from(
  { length: MINUTES_PER_HOUR / MINUTE_STEP },
  (_, step) => String(step * MINUTE_STEP).padStart(2, '0')
);

interface DailyReminderTimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

// Minutes snap to the nearest 5, since a reminder needs no finer precision
// and it keeps the wheel short.
export function DailyReminderTimePicker({
  hour,
  minute,
  onChange,
}: DailyReminderTimePickerProps) {
  const minuteIndex = Math.round(minute / MINUTE_STEP);

  return (
    <View style={styles.row}>
      <WheelPicker
        items={HOUR_LABELS}
        selectedIndex={hour}
        onChange={nextHour => onChange(nextHour, minuteIndex * MINUTE_STEP)}
      />
      <Text variant="displayMedium">:</Text>
      <WheelPicker
        items={MINUTE_LABELS}
        selectedIndex={minuteIndex}
        onChange={nextIndex => onChange(hour, nextIndex * MINUTE_STEP)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
});
