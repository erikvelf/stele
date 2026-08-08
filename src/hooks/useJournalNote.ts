import { useCallback, useEffect, useRef, useState } from 'react';

import { readJournalNote, writeJournalNote } from '@/modules/journal';
import type { JournalNote } from '@/modules/journal';
import type { AppError } from '@/modules/types';

const AUTOSAVE_DEBOUNCE_MS = 500;

interface UseJournalNoteResult {
  note: JournalNote | null;
  error: AppError | null;
  isLoading: boolean;
  setText: (text: string) => void;
}

export function useJournalNote(noteId: string): UseJournalNoteResult {
  const [note, setNote] = useState<JournalNote | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef<JournalNote | null>(null);

  // setState during render: React applies it before paint, with no extra pass.
  if (loadedNoteId !== noteId) {
    setLoadedNoteId(noteId);
    setIsLoading(true);
    setNote(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    noteRef.current = null;

    void readJournalNote(noteId).then(result => {
      if (cancelled) {
        return;
      }
      if (result.success) {
        setNote(result.data);
        noteRef.current = result.data;
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [noteId]);

  const setText = useCallback((text: string) => {
    const loaded = noteRef.current;
    if (!loaded) {
      return;
    }

    const updated = { ...loaded, text };
    noteRef.current = updated;
    setNote(updated);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void writeJournalNote(updated).then(result => {
        if (!result.success) {
          setError(result.error);
        }
      });
    }, AUTOSAVE_DEBOUNCE_MS);
  }, []);

  return { note, error, isLoading, setText };
}
