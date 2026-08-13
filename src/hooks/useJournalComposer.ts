import { startOfDay } from 'date-fns';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDailyReminder } from '@/hooks/useDailyReminder';
import { createId } from '@/lib/id';
import { haptics } from '@/modules/haptics';
import { type JournalNote, writeJournalNote } from '@/modules/journal';
import { readEntryTemplate } from '@/modules/settings';

interface UseJournalComposerOptions {
  notes: JournalNote[];
  isLoadingNotes: boolean;
  prependNote: (note: JournalNote) => void;
  onCreated: () => void;
  onCreateFailed: () => void;
}

interface UseJournalComposerResult {
  isCreating: boolean;
  pendingNoteId: string | undefined;
  handleCreate: () => void;
  createNoteForDay: (day: Date) => void;
  handleTopNoteSettled: () => void;
  resetCreating: () => void;
}

function newJournalNote(day: Date): JournalNote {
  return {
    id: createId(),
    text: readEntryTemplate().text,
    created_at: day.getTime(),
    start_timestamp: day.getTime(),
    end_timestamp: day.getTime(),
  };
}

// Composes the journal with the reminder scheduler, which a domain module may
// not do itself.
export function useJournalComposer({
  notes,
  isLoadingNotes,
  prependNote,
  onCreated,
  onCreateFailed,
}: UseJournalComposerOptions): UseJournalComposerResult {
  const router = useRouter();
  const { openComposer } = useLocalSearchParams<{ openComposer?: string }>();
  const { reschedule: rescheduleDailyReminder } = useDailyReminder();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingNoteId, setPendingNoteId] = useState<string | undefined>(
    undefined
  );

  const handleCreate = useCallback(() => {
    haptics.commit();

    const today = startOfDay(new Date());
    const todaysNote = notes.find(note => {
      const start = startOfDay(new Date(note.start_timestamp));
      const end = startOfDay(new Date(note.end_timestamp));
      return today >= start && today <= end;
    });

    if (todaysNote) {
      router.push(`/note/${todaysNote.id}`);
      return;
    }

    setIsCreating(true);
    const newNote = newJournalNote(today);

    setPendingNoteId(newNote.id);
    prependNote(newNote);

    void writeJournalNote(newNote).then(() => {
      onCreated();
      rescheduleDailyReminder();
    });
  }, [notes, router, prependNote, onCreated, rescheduleDailyReminder]);

  // A past day picked on the grid never lands on top of the feed, so it is
  // written first and opened only once it is on disk.
  const createNoteForDay = useCallback(
    (day: Date) => {
      const note = newJournalNote(startOfDay(day));

      void writeJournalNote(note).then(result => {
        if (!result.success) {
          onCreateFailed();
          return;
        }
        onCreated();
        rescheduleDailyReminder();
        router.push(`/note/${note.id}`);
      });
    },
    [router, onCreated, onCreateFailed, rescheduleDailyReminder]
  );

  // A tapped daily-reminder notification deep-links here with this param.
  useFocusEffect(
    useCallback(() => {
      if (openComposer !== '1' || isLoadingNotes) {
        return;
      }
      router.setParams({ openComposer: undefined });
      handleCreate();
    }, [openComposer, isLoadingNotes, router, handleCreate])
  );

  const handleTopNoteSettled = useCallback(() => {
    if (!pendingNoteId) {
      return;
    }
    if (notes.some(note => note.id === pendingNoteId)) {
      router.push(`/note/${pendingNoteId}`);
    }
    setPendingNoteId(undefined);
  }, [router, pendingNoteId, notes]);

  const resetCreating = useCallback(() => setIsCreating(false), []);

  return {
    isCreating,
    pendingNoteId,
    handleCreate,
    createNoteForDay,
    handleTopNoteSettled,
    resetCreating,
  };
}
