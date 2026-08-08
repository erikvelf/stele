import { addDays, isBefore, setHours, setMinutes, setSeconds } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { COMMON_ERRORS } from '@/constants/error-codes';
import {
  cancelAllScheduledNotifications,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleOneShotNotification,
} from '@/lib/notifications';
import { translate } from '@/modules/i18n';
import { readJournalNoteForDate } from '@/modules/journal';
import { readDailyReminder, writeDailyReminder } from '@/modules/settings';
import type { DailyReminder } from '@/modules/settings';
import type { AppError } from '@/modules/types';

const REMINDER_TITLE = 'Stele';

function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const candidate = setSeconds(setMinutes(setHours(now, hour), minute), 0);
  return isBefore(candidate, now) ? addDays(candidate, 1) : candidate;
}

function toAppError(cause: unknown): AppError {
  return { code: COMMON_ERRORS.UNDEFINED, cause: String(cause) };
}

// Cancels the queued notification and, when the reminder is on and permitted,
// queues the next one. A failed journal read only decides the wording, so it
// leaves the notification scheduled rather than aborting.
async function applySchedule(current: DailyReminder): Promise<void> {
  if (!current.enabled) {
    await cancelAllScheduledNotifications();
    return;
  }

  const granted = await hasNotificationPermission();
  if (!granted) {
    return;
  }

  const today = await readJournalNoteForDate(Date.now());
  const journaledToday = today.success && today.data !== null;
  // Read at schedule time rather than at fire time: a language changed
  // between the two leaves one notification in the previous language.
  const body = translate(
    journaledToday
      ? 'notifications.body.journaled'
      : 'notifications.body.notJournaled'
  );
  const fireDate = nextOccurrence(current.hour, current.minute, new Date());

  await cancelAllScheduledNotifications();
  await scheduleOneShotNotification({ title: REMINDER_TITLE, body }, fireDate);
}

interface UseDailyReminderResult {
  reminder: DailyReminder;
  // Applies the preference and, if enabling, requests OS permission — the
  // returned boolean reflects whether the reminder actually ended up active.
  setReminder: (
    enabled: boolean,
    hour: number,
    minute: number
  ) => Promise<boolean>;
  // Cancels and re-schedules the next occurrence from current settings and
  // today's journal state. Call after a note is created or deleted, or the
  // app returns to the foreground, so the queued notification stays fresh.
  reschedule: () => void;
  // Reports a failed OS notification call from this hook instance.
  error: AppError | null;
  dismissError: () => void;
}

// Composes the journal and settings domains, which may not import each other.
export function useDailyReminder(): UseDailyReminderResult {
  const [reminder, setReminderState] = useState<DailyReminder>(() =>
    readDailyReminder()
  );

  const [error, setError] = useState<AppError | null>(null);

  const reschedule = useCallback(() => {
    void applySchedule(readDailyReminder()).then(
      () => setError(null),
      (cause: unknown) => setError(toAppError(cause))
    );
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  useEffect(() => {
    reschedule();
  }, [reschedule]);

  const setReminder = useCallback(
    async (
      enabled: boolean,
      hour: number,
      minute: number
    ): Promise<boolean> => {
      if (!enabled) {
        const next = { enabled: false, hour, minute };
        writeDailyReminder(next);
        setReminderState(next);
        reschedule();
        return true;
      }

      try {
        const granted = await requestNotificationPermission();
        const next = { enabled: granted, hour, minute };
        writeDailyReminder(next);
        setReminderState(next);
        reschedule();
        return granted;
      } catch (cause) {
        setError(toAppError(cause));
        return false;
      }
    },
    [reschedule]
  );

  return { reminder, setReminder, reschedule, error, dismissError };
}
