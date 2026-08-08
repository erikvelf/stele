import { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  List,
  Snackbar,
  Surface,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import { DailyReminderTimePicker } from '@/components/settings/DailyReminderTimePicker';
import { SPACING } from '@/constants/layout';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { reminder, setReminder, error, dismissError } = useDailyReminder();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const toggleEnabled = (enabled: boolean) => {
    void setReminder(enabled, reminder.hour, reminder.minute).then(granted => {
      const denied = enabled && !granted;
      setPermissionDenied(denied);
      if (denied) {
        return;
      }
    });
  };

  const changeTime = (hour: number, minute: number) => {
    void setReminder(true, hour, minute);
  };

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title={t('notifications.dailyReminder.title')}
        description={t('notifications.dailyReminder.description')}
        left={props => <List.Icon {...props} icon="bell-outline" />}
        right={({ style }) => (
          <Switch
            style={style}
            value={reminder.enabled}
            onValueChange={toggleEnabled}
          />
        )}
      />
      {permissionDenied && (
        <Text
          variant="bodySmall"
          style={[styles.permissionHint, { color: theme.colors.error }]}
        >
          {t('notifications.permissionDenied')}
        </Text>
      )}
      {reminder.enabled && (
        <DailyReminderTimePicker
          hour={reminder.hour}
          minute={reminder.minute}
          onChange={changeTime}
        />
      )}

      <Snackbar visible={error !== null} onDismiss={dismissError}>
        {t('notifications.scheduleFailed')}
      </Snackbar>
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
