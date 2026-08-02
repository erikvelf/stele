import { useCallback, useEffect, useRef, useState } from 'react';

import { readDateDayRange, readNote, writeNote } from '@/modules/notes';
import type { DateDayRange, Note } from '@/modules/notes';
import type { AppError } from '@/modules/types';

const AUTOSAVE_DEBOUNCE_MS = 500;

interface UseNoteResult {
  note: Note | null;
  range: DateDayRange | null;
  error: AppError | null;
  isLoading: boolean;
  setText: (text: string) => void;
}

// Loads a note and its date range, and autosaves text after a typing pause.
// A failed autosave surfaces as `error` without discarding what was typed.
export function useNote(noteId: string): UseNoteResult {
  const [note, setNote] = useState<Note | null>(null);
  const [range, setRange] = useState<DateDayRange | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resets state during render when `noteId` changes, rather than inside the
  // effect below — React applies this before paint, with no extra effect run.
  if (loadedNoteId !== noteId) {
    setLoadedNoteId(noteId);
    setIsLoading(true);
    setNote(null);
    setRange(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.all([readNote(noteId), readDateDayRange(noteId)]).then(
      ([noteResult, rangeResult]) => {
        if (cancelled) {
          return;
        }
        if (noteResult.success) {
          setNote(noteResult.data);
        } else {
          setError(noteResult.error);
        }
        if (rangeResult.success) {
          setRange(rangeResult.data);
        }
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [noteId]);

  const setText = useCallback(
    (text: string) => {
      setNote(previous => (previous ? { ...previous, text } : { id: noteId, text }));

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void writeNote({ id: noteId, text }).then(result => {
          if (!result.success) {
            setError(result.error);
          }
        });
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [noteId]
  );

  return { note, range, error, isLoading, setText };
}
