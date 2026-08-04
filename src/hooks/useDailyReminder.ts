import { addDays, isBefore, setHours, setMinutes, setSeconds } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import {
  cancelAllScheduledNotifications,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleOneShotNotification,
} from '@/lib/notifications';
import { JOURNAL_FOLDER_ID } from '@/modules/folders';
import { readNoteEntryForDate } from '@/modules/notes';
import { readDailyReminder, writeDailyReminder } from '@/modules/settings';
import type { DailyReminder } from '@/modules/settings';

const JOURNALED_TITLE = 'Stele';
const JOURNALED_TODAY_BODY = 'Anything else from today?';
const NOT_JOURNALED_TODAY_BODY = 'Got a minute for today?';

function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const candidate = setSeconds(setMinutes(setHours(now, hour), minute), 0);
  return isBefore(candidate, now) ? addDays(candidate, 1) : candidate;
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
}

// Composes the notes and settings domains to keep a single freshly-computed
// local notification queued. Neither domain module may import the other, so
// this hook is where they meet.
export function useDailyReminder(): UseDailyReminderResult {
  const [reminder, setReminderState] = useState<DailyReminder>(() =>
    readDailyReminder()
  );

  const reschedule = useCallback(() => {
    const current = readDailyReminder();

    if (!current.enabled) {
      void cancelAllScheduledNotifications();
      return;
    }

    void hasNotificationPermission().then(granted => {
      if (!granted) {
        return;
      }

      void readNoteEntryForDate(JOURNAL_FOLDER_ID, Date.now()).then(
        result => {
          const journaledToday = result.success && result.data !== null;
          const body = journaledToday
            ? JOURNALED_TODAY_BODY
            : NOT_JOURNALED_TODAY_BODY;
          const fireDate = nextOccurrence(
            current.hour,
            current.minute,
            new Date()
          );

          void cancelAllScheduledNotifications().then(() =>
            scheduleOneShotNotification(
              { title: JOURNALED_TITLE, body },
              fireDate
            )
          );
        }
      );
    });
  }, []);

  useEffect(() => {
    reschedule();
  }, [reschedule]);

  const setReminder = useCallback(
    async (enabled: boolean, hour: number, minute: number): Promise<boolean> => {
      if (!enabled) {
        const next = { enabled: false, hour, minute };
        writeDailyReminder(next);
        setReminderState(next);
        reschedule();
        return true;
      }

      const granted = await requestNotificationPermission();
      const next = { enabled: granted, hour, minute };
      writeDailyReminder(next);
      setReminderState(next);
      reschedule();
      return granted;
    },
    [reschedule]
  );

  return { reminder, setReminder, reschedule };
}
