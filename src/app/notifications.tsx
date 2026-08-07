import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { List, Surface, Switch, Text, useTheme } from 'react-native-paper';

import { DailyReminderTimePicker } from '@/components/settings/DailyReminderTimePicker';
import { SPACING } from '@/constants/layout';
import { useDailyReminder } from '@/hooks/useDailyReminder';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { reminder, setReminder } = useDailyReminder();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const toggleEnabled = (enabled: boolean) => {
    void setReminder(enabled, reminder.hour, reminder.minute).then(granted => {
      setPermissionDenied(enabled && !granted);
    });
  };

  const changeTime = (hour: number, minute: number) => {
    void setReminder(true, hour, minute);
  };

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title="Daily reminder"
        description="A single reminder at a time you choose"
        left={props => <List.Icon {...props} icon="bell-outline" />}
        right={() => (
          <Switch value={reminder.enabled} onValueChange={toggleEnabled} />
        )}
      />
      {permissionDenied && (
        <Text
          variant="bodySmall"
          style={[styles.permissionHint, { color: theme.colors.error }]}
        >
          Notifications are off for Stele in system settings. Enable them
          there to turn this on.
        </Text>
      )}
      {reminder.enabled && (
        <DailyReminderTimePicker
          hour={reminder.hour}
          minute={reminder.minute}
          onChange={changeTime}
        />
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  permissionHint: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
