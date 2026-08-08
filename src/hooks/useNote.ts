import { useCallback, useEffect, useRef, useState } from 'react';

import { readNote, writeNote } from '@/modules/notes';
import type { Note } from '@/modules/notes';
import type { AppError } from '@/modules/types';

const AUTOSAVE_DEBOUNCE_MS = 500;

interface UseNoteResult {
  note: Note | null;
  error: AppError | null;
  isLoading: boolean;
  setText: (text: string) => void;
}

export function useNote(noteId: string): UseNoteResult {
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteRef = useRef<Note | null>(null);
  const pendingWriteRef = useRef<Note | null>(null);

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

    void readNote(noteId).then(result => {
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
        debounceRef.current = null;
      }

      // The screen is leaving before the debounce fired: write the last edit
      // now, or it is lost.
      const pending = pendingWriteRef.current;
      pendingWriteRef.current = null;
      if (pending) {
        void writeNote(pending);
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
    pendingWriteRef.current = updated;
    setNote(updated);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      pendingWriteRef.current = null;
      void writeNote(updated).then(result => {
        if (!result.success) {
          setError(result.error);
        }
      });
    }, AUTOSAVE_DEBOUNCE_MS);
  }, []);

  return { note, error, isLoading, setText };
}
