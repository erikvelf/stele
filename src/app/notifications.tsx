import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  Button,
  List,
  Surface,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import { DailyReminderTimePicker } from '@/components/settings/DailyReminderTimePicker';
import { SPACING } from '@/constants/layout';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import {
  requestNotificationPermission,
  scheduleOneShotNotification,
} from '@/lib/notifications';

const TEST_NOTIFICATION_DELAY_MS = 3000;

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

  const sendTestNotification = () => {
    void requestNotificationPermission().then(granted => {
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      void scheduleOneShotNotification(
        { title: 'Stele', body: 'Test notification' },
        new Date(Date.now() + TEST_NOTIFICATION_DELAY_MS)
      );
    });
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
      <Button
        style={styles.testButton}
        mode="outlined"
        onPress={sendTestNotification}
      >
        Send test notification
      </Button>
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
  testButton: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
});
