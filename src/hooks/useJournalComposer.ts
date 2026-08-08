import { startOfDay } from 'date-fns';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDailyReminder } from '@/hooks/useDailyReminder';
import { createId } from '@/lib/id';
import { type JournalNote, writeJournalNote } from '@/modules/journal';
import { readEntryTemplate } from '@/modules/settings';

interface UseJournalComposerOptions {
  notes: JournalNote[];
  isLoadingNotes: boolean;
  prependNote: (note: JournalNote) => void;
  onCreated: () => void;
}

interface UseJournalComposerResult {
  isCreating: boolean;
  pendingNoteId: string | undefined;
  handleCreate: () => void;
  handleTopNoteSettled: () => void;
  resetCreating: () => void;
}

// Composes the journal with the reminder scheduler, which a domain module may
// not do itself.
export function useJournalComposer({
  notes,
  isLoadingNotes,
  prependNote,
  onCreated,
}: UseJournalComposerOptions): UseJournalComposerResult {
  const router = useRouter();
  const { openComposer } = useLocalSearchParams<{ openComposer?: string }>();
  const { reschedule: rescheduleDailyReminder } = useDailyReminder();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingNoteId, setPendingNoteId] = useState<string | undefined>(
    undefined
  );

  const handleCreate = useCallback(() => {
    void impactAsync(ImpactFeedbackStyle.Light);

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
    const newNote: JournalNote = {
      id: createId(),
      text: readEntryTemplate().text,
      created_at: today.getTime(),
      start_timestamp: today.getTime(),
      end_timestamp: today.getTime(),
    };

    setPendingNoteId(newNote.id);
    prependNote(newNote);

    void writeJournalNote(newNote).then(() => {
      onCreated();
      rescheduleDailyReminder();
    });
  }, [notes, router, prependNote, onCreated, rescheduleDailyReminder]);

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
    handleTopNoteSettled,
    resetCreating,
  };
}
