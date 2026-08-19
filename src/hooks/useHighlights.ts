import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import {
  assignTag as assignTagQuery,
  deleteHighlight,
  listHighlights,
  reorderHighlights as reorderHighlightsQuery,
  writeHighlight,
} from '@/modules/highlights';
import type { DayHighlight } from '@/modules/highlights';
import type { AppError, Result } from '@/modules/types';

import { useAutosave } from './useAutosave';

// A blank highlight is not dropped the moment the field settles: the row
// stays put long enough to type into again.
const BLANK_REMOVE_DELAY_MS = 1000;

function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

type OperationChains = Map<string, Promise<void>>;

// Runs `operation` after everything already queued for that highlight. Writes
// are transactions and deletes single statements, so calls left unsequenced
// commit in the order the database finishes them, not the order they were
// made.
function enqueue(
  chains: OperationChains,
  id: string,
  operation: () => Promise<Result<void>>,
  onError: (error: AppError) => void
): void {
  const next = (chains.get(id) ?? Promise.resolve()).then(async () => {
    const result = await operation();
    if (!result.success) {
      onError(result.error);
    }
  });

  chains.set(id, next);
  void next.then(() => {
    if (chains.get(id) === next) {
      chains.delete(id);
    }
  });
}

type RunOperation = (
  id: string,
  operation: () => Promise<Result<void>>
) => void;

// Blank deletes, anything else writes — decided once the field settles, not
// on the keystroke that blanked it: an IME commit clears the composing text
// before inserting the correction, so the field is briefly empty.
function persistSettled(
  id: string,
  highlight: DayHighlight,
  run: RunOperation,
  scheduleRemoval: (id: string) => void
): void {
  if (isBlank(highlight.text)) {
    scheduleRemoval(id);
    return;
  }
  run(id, () => writeHighlight(highlight));
}

interface DelayedRemoval {
  scheduleRemoval: (id: string) => void;
  cancelRemoval: (id: string) => void;
}

// Removal on a timer, cancellable while it runs. A row still waiting to go
// when the screen closes is deleted rather than reprieved, the way a pending
// write is flushed rather than dropped.
function useDelayedRemoval(
  run: RunOperation,
  setHighlights: Dispatch<SetStateAction<DayHighlight[]>>
): DelayedRemoval {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const cancelRemoval = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleRemoval = useCallback(
    (id: string) => {
      cancelRemoval(id);
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          setHighlights(previous =>
            previous.filter(current => current.id !== id)
          );
          run(id, () => deleteHighlight(id));
        }, BLANK_REMOVE_DELAY_MS)
      );
    },
    [cancelRemoval, run, setHighlights]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        run(id, () => deleteHighlight(id));
      });
      pending.clear();
    };
  }, [run]);

  return { scheduleRemoval, cancelRemoval };
}

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
export function useHighlights(journalNoteId: string): UseHighlightsResult {
  const [highlights, setHighlights] = useState<DayHighlight[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);

  // What updateText builds its payload from: it is handed an id and a text,
  // and the rest of the highlight has to come from somewhere the write can
  // still read once the screen is gone.
  const highlightsRef = useRef<DayHighlight[]>([]);
  const chainsRef = useRef<OperationChains>(new Map());

  const run = useCallback<RunOperation>((id, operation) => {
    enqueue(chainsRef.current, id, operation, setError);
  }, []);

  const { scheduleRemoval, cancelRemoval } = useDelayedRemoval(
    run,
    setHighlights
  );

  const { schedule, peek } = useAutosave<string, DayHighlight>(
    (id, highlight) => persistSettled(id, highlight, run, scheduleRemoval)
  );

  if (loadedNoteId !== journalNoteId) {
    setLoadedNoteId(journalNoteId);
    setIsLoading(true);
    setHighlights([]);
    setError(null);
  }

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  useEffect(() => {
    let cancelled = false;

    void listHighlights(journalNoteId).then(result => {
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
  }, [journalNoteId]);

  // A tag can be assigned from the /tag screen, which writes straight to the
  // db without going through this hook's instance. Refresh on refocus so a
  // tag picked there shows up back on the note.
  useFocusEffect(
    useCallback(() => {
      if (isLoading) {
        return;
      }
      void listHighlights(journalNoteId).then(result => {
        if (result.success) {
          setHighlights(result.data);
        }
      });
    }, [journalNoteId, isLoading])
  );

  const addHighlight = useCallback(
    (id: string, text: string) => {
      const highlight: DayHighlight = {
        id,
        journal_note_id: journalNoteId,
        text,
        tag_id: null,
      };
      setHighlights(previous =>
        previous.some(current => current.id === id)
          ? previous
          : [...previous, highlight]
      );
      run(id, () => writeHighlight(highlight));
    },
    [journalNoteId, run]
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      cancelRemoval(id);
      setHighlights(previous =>
        previous.map(highlight =>
          highlight.id === id ? { ...highlight, text } : highlight
        )
      );

      const existing = highlightsRef.current.find(
        highlight => highlight.id === id
      );
      const highlight: DayHighlight = existing
        ? { ...existing, text }
        : { id, journal_note_id: journalNoteId, text, tag_id: null };
      schedule(id, highlight);
    },
    [journalNoteId, schedule, cancelRemoval]
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

      run(id, () => assignTagQuery(id, tagId));
    },
    [peek, schedule, run]
  );

  const reorderHighlights = useCallback((orderedIds: string[]) => {
    setHighlights(previous => {
      const byId = new Map(
        previous.map(highlight => [highlight.id, highlight])
      );
      return orderedIds
        .map(id => byId.get(id))
        .filter(
          (highlight): highlight is DayHighlight => highlight !== undefined
        );
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
