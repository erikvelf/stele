import { useCallback, useEffect, useState } from 'react';

import { JOURNAL_FOLDER_ID } from '@/modules/folders';
import { NOTES_LIST_PAGE_SIZE, listNoteEntries } from '@/modules/notes';
import type { NoteEntry } from '@/modules/notes';
import type { AppError, Result } from '@/modules/types';

interface UseListNotesResult {
  entries: NoteEntry[];
  error: AppError | null;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  prependEntry: (entry: NoteEntry) => void;
  removeEntry: (rangeId: string) => void;
}

// Owns the diario's paginated feed, newest first. Creation and deletion are
// one-off actions the screen performs against the modules layer; this hook
// only reflects the result into the list it owns.
export function useListNotes(): UseListNotesResult {
  const [entries, setEntries] = useState<NoteEntry[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Pure I/O, no setState — every caller applies the result in its own
  // callback, which keeps every setState call inside a literal callback
  // rather than reached through a named function.
  const fetchPage = useCallback(
    (before?: number, limit: number = NOTES_LIST_PAGE_SIZE): Promise<Result<NoteEntry[]>> =>
      listNoteEntries(JOURNAL_FOLDER_ID, before, limit),
    []
  );

  useEffect(() => {
    let cancelled = false;

    void fetchPage().then(result => {
      if (cancelled) {
        return;
      }
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setEntries(result.data);
      setHasMore(result.data.length === NOTES_LIST_PAGE_SIZE);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || entries.length === 0) {
      return;
    }
    setIsLoading(true);
    const oldest = entries[entries.length - 1];
    void fetchPage(oldest.range.start_timestamp).then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setEntries(previous => [...previous, ...result.data]);
      setHasMore(result.data.length === NOTES_LIST_PAGE_SIZE);
      setIsLoading(false);
    });
  }, [isLoading, hasMore, entries, fetchPage]);

  // Reloads the same window already on screen (at least one page), so an
  // edit made elsewhere (e.g. the note editor) shows up without losing
  // whatever was already paged in via loadMore.
  const refresh = useCallback(() => {
    setIsLoading(true);
    const limit = Math.max(entries.length, NOTES_LIST_PAGE_SIZE);
    void fetchPage(undefined, limit).then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setEntries(result.data);
      setHasMore(result.data.length === limit);
      setIsLoading(false);
    });
  }, [entries.length, fetchPage]);

  const prependEntry = useCallback((entry: NoteEntry) => {
    setEntries(previous => [entry, ...previous]);
  }, []);

  const removeEntry = useCallback((rangeId: string) => {
    setEntries(previous =>
      previous.filter(entry => entry.range.id !== rangeId)
    );
  }, []);

  return {
    entries,
    error,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    prependEntry,
    removeEntry,
  };
}
