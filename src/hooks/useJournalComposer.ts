import { startOfDay } from 'date-fns';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDailyReminder } from '@/hooks/useDailyReminder';
import { createId } from '@/lib/id';
import { JOURNAL_FOLDER_ID } from '@/modules/folders';
import {
  writeDateDayRange,
  writeNote,
  writeNoteCreated,
  writeNoteFolder,
  type NoteEntry,
} from '@/modules/notes';
import { readEntryTemplate } from '@/modules/settings';

interface UseJournalComposerOptions {
  entries: NoteEntry[];
  isLoadingEntries: boolean;
  prependEntry: (entry: NoteEntry) => void;
  onCreated: () => void;
}

interface UseJournalComposerResult {
  isCreating: boolean;
  pendingEntryId: string | undefined;
  handleCreate: () => void;
  handleTopEntrySettled: () => void;
  resetCreating: () => void;
}

// Owns opening today's sasso, whether from the FAB or a tapped daily-reminder
// notification: find-or-create, then hand off navigation once the created
// entry settles into the list. Composes notes with the reminder scheduler,
// which a domain module may not do itself.
export function useJournalComposer({
  entries,
  isLoadingEntries,
  prependEntry,
  onCreated,
}: UseJournalComposerOptions): UseJournalComposerResult {
  const router = useRouter();
  const { openComposer } = useLocalSearchParams<{ openComposer?: string }>();
  const { reschedule: rescheduleDailyReminder } = useDailyReminder();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingEntryId, setPendingEntryId] = useState<string | undefined>(
    undefined
  );

  const handleCreate = useCallback(() => {
    void impactAsync(ImpactFeedbackStyle.Light);

    const today = startOfDay(new Date());
    const todaysEntry = entries.find(entry => {
      const start = startOfDay(new Date(entry.range.start_timestamp));
      const end = startOfDay(new Date(entry.range.end_timestamp));
      return today >= start && today <= end;
    });

    if (todaysEntry) {
      router.push(`/note/${todaysEntry.note.id}`);
      return;
    }

    setIsCreating(true);
    const noteId = createId();
    const rangeId = createId();
    const newEntry: NoteEntry = {
      note: { id: noteId, text: readEntryTemplate().text },
      range: {
        id: rangeId,
        note_id: noteId,
        start_timestamp: today.getTime(),
        end_timestamp: today.getTime(),
      },
    };

    setPendingEntryId(rangeId);
    prependEntry(newEntry);

    void Promise.all([
      writeNote(newEntry.note),
      writeDateDayRange(newEntry.range),
      writeNoteCreated({ note_id: noteId, created_at: today.getTime() }),
      writeNoteFolder({ note_id: noteId, folder_id: JOURNAL_FOLDER_ID }),
    ]).then(() => {
      onCreated();
      rescheduleDailyReminder();
    });
  }, [entries, router, prependEntry, onCreated, rescheduleDailyReminder]);

  // A tapped daily-reminder notification deep-links here with this param, so
  // the app opens straight into today's compose flow, as if the FAB had been
  // pressed.
  useFocusEffect(
    useCallback(() => {
      if (openComposer !== '1' || isLoadingEntries) {
        return;
      }
      router.setParams({ openComposer: undefined });
      handleCreate();
    }, [openComposer, isLoadingEntries, router, handleCreate])
  );

  const handleTopEntrySettled = useCallback(() => {
    if (!pendingEntryId) {
      return;
    }
    const pendingEntry = entries.find(
      entry => entry.range.id === pendingEntryId
    );
    if (pendingEntry) {
      router.push(`/note/${pendingEntry.note.id}`);
    }
    setPendingEntryId(undefined);
  }, [router, pendingEntryId, entries]);

  const resetCreating = useCallback(() => setIsCreating(false), []);

  return {
    isCreating,
    pendingEntryId,
    handleCreate,
    handleTopEntrySettled,
    resetCreating,
  };
}
