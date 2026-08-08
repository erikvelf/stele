import {
  addNotificationResponseReceivedListener,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationHandler,
} from 'expo-notifications';
import type { EventSubscription } from 'expo-notifications';

// Without a handler, the OS default is to suppress a notification while the
// app is foregrounded — this is what makes a scheduled notification appear
// to silently never fire during testing.
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationContent {
  title: string;
  body: string;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await getPermissionsAsync();
  if (existing.granted) {
    return true;
  }
  const requested = await requestPermissionsAsync();
  return requested.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const status = await getPermissionsAsync();
  return status.granted;
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await cancelAllScheduledNotificationsAsync();
}

export async function scheduleOneShotNotification(
  content: NotificationContent,
  date: Date
): Promise<string> {
  return scheduleNotificationAsync({
    content,
    trigger: { type: SchedulableTriggerInputTypes.DATE, date },
  });
}

export function addNotificationResponseListener(
  handler: () => void
): EventSubscription {
  return addNotificationResponseReceivedListener(handler);
}
