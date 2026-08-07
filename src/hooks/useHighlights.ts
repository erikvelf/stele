import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  assignTag as assignTagQuery,
  deleteHighlight,
  listHighlights,
  reorderHighlights as reorderHighlightsQuery,
  writeHighlight,
} from '@/modules/highlights';
import type { DayHighlight } from '@/modules/highlights';
import type { AppError } from '@/modules/types';

import { useAutosave } from './useAutosave';

interface UseHighlightsResult {
  highlights: DayHighlight[];
  error: AppError | null;
  isLoading: boolean;
  addHighlight: (id: string, text: string) => void;
  updateText: (id: string, text: string) => void;
  assignTag: (id: string, tagId: string | null) => void;
  reorderHighlights: (orderedIds: string[]) => void;
}

// Loads a note's highlights and keeps them in sync. A highlight with no text
// is never persisted; clearing an existing one's text deletes it.
export function useHighlights(noteId: string): UseHighlightsResult {
  const [highlights, setHighlights] = useState<DayHighlight[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);

  // What updateText builds its payload from: it is handed an id and a text,
  // and the rest of the highlight has to come from somewhere the write can
  // still read once the screen is gone.
  const highlightsRef = useRef<DayHighlight[]>([]);

  const { schedule, cancel, peek } = useAutosave<string, DayHighlight>(
    (id, highlight) => {
      void writeHighlight(highlight).then(result => {
        if (!result.success) {
          setError(result.error);
        }
      });
    }
  );

  if (loadedNoteId !== noteId) {
    setLoadedNoteId(noteId);
    setIsLoading(true);
    setHighlights([]);
    setError(null);
  }

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  useEffect(() => {
    let cancelled = false;

    void listHighlights(noteId).then(result => {
      if (cancelled) {
        return;
      }
      if (result.success) {
        setHighlights(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });

    // Pending writes are left alone: each carries its own highlight, so one
    // scheduled against the note you just left still lands correctly.
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  // A tag can be assigned from the /tag screen, which writes straight to the
  // db without going through this hook's instance. Refresh on refocus so a
  // tag picked there shows up back on the note.
  useFocusEffect(
    useCallback(() => {
      if (isLoading) {
        return;
      }
      void listHighlights(noteId).then(result => {
        if (result.success) {
          setHighlights(result.data);
        }
      });
    }, [noteId, isLoading])
  );

  const addHighlight = useCallback(
    (id: string, text: string) => {
      const highlight: DayHighlight = { id, note_id: noteId, text, tag_id: null };
      setHighlights(previous => [...previous, highlight]);
      void writeHighlight(highlight).then(result => {
        if (!result.success) {
          setError(result.error);
        }
      });
    },
    [noteId]
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      setHighlights(previous =>
        previous.map(highlight =>
          highlight.id === id ? { ...highlight, text } : highlight
        )
      );

      if (text.trim().length === 0) {
        cancel(id);
        setHighlights(previous => previous.filter(highlight => highlight.id !== id));
        void deleteHighlight(id).then(result => {
          if (!result.success) {
            setError(result.error);
          }
        });
        return;
      }

      const existing = highlightsRef.current.find(highlight => highlight.id === id);
      const highlight: DayHighlight = existing
        ? { ...existing, text }
        : { id, note_id: noteId, text, tag_id: null };
      schedule(id, highlight);
    },
    [noteId, cancel, schedule]
  );

  const assignTag = useCallback(
    (id: string, tagId: string | null) => {
      setHighlights(previous =>
        previous.map(highlight =>
          highlight.id === id ? { ...highlight, tag_id: tagId } : highlight
        )
      );

      // A text write scheduled a moment ago still holds the old tag, and
      // would put it back when it lands.
      const pending = peek(id);
      if (pending) {
        schedule(id, { ...pending, tag_id: tagId });
      }

      void assignTagQuery(id, tagId).then(result => {
        if (!result.success) {
          setError(result.error);
        }
      });
    },
    [peek, schedule]
  );

  const reorderHighlights = useCallback((orderedIds: string[]) => {
    setHighlights(previous => {
      const byId = new Map(previous.map(highlight => [highlight.id, highlight]));
      return orderedIds
        .map(id => byId.get(id))
        .filter((highlight): highlight is DayHighlight => highlight !== undefined);
    });
    void reorderHighlightsQuery(orderedIds).then(result => {
      if (!result.success) {
        setError(result.error);
      }
    });
  }, []);

  return {
    highlights,
    error,
    isLoading,
    addHighlight,
    updateText,
    assignTag,
    reorderHighlights,
  };
}
