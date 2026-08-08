import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics';

import { readHaptics } from '@/modules/settings';

// A device without a vibrator rejects the request.
function play(request: () => Promise<void>): void {
  if (!readHaptics().enabled) {
    return;
  }

  void request().catch(() => undefined);
}

export const haptics = {
  select: (): void => play(selectionAsync),
  commit: (): void => play(() => impactAsync(ImpactFeedbackStyle.Light)),
  pickUp: (): void => play(() => impactAsync(ImpactFeedbackStyle.Medium)),
  drop: (): void => play(() => impactAsync(ImpactFeedbackStyle.Light)),
  destroy: (): void => play(() => impactAsync(ImpactFeedbackStyle.Heavy)),
  succeed: (): void =>
    play(() => notificationAsync(NotificationFeedbackType.Success)),
  fail: (): void =>
    play(() => notificationAsync(NotificationFeedbackType.Error)),
};
