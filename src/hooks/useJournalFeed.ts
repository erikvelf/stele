import { useCallback, useEffect, useState } from 'react';

import { JOURNAL_LIST_PAGE_SIZE, listJournalNotes } from '@/modules/journal';
import type { JournalNote } from '@/modules/journal';
import type { AppError, Result } from '@/modules/types';

interface UseJournalFeedResult {
  notes: JournalNote[];
  error: AppError | null;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  prependNote: (note: JournalNote) => void;
  removeNote: (id: string) => void;
}

export function useJournalFeed(): UseJournalFeedResult {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    (
      before?: number,
      limit: number = JOURNAL_LIST_PAGE_SIZE
    ): Promise<Result<JournalNote[]>> => listJournalNotes(before, limit),
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
      setNotes(result.data);
      setHasMore(result.data.length === JOURNAL_LIST_PAGE_SIZE);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore || notes.length === 0) {
      return;
    }
    setIsLoading(true);
    const oldest = notes[notes.length - 1];
    void fetchPage(oldest.start_timestamp).then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setNotes(previous => [...previous, ...result.data]);
      setHasMore(result.data.length === JOURNAL_LIST_PAGE_SIZE);
      setIsLoading(false);
    });
  }, [isLoading, hasMore, notes, fetchPage]);

  // Refetches every page already on screen, not just the first.
  const refresh = useCallback(() => {
    setIsLoading(true);
    const limit = Math.max(notes.length, JOURNAL_LIST_PAGE_SIZE);
    void fetchPage(undefined, limit).then(result => {
      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }
      setNotes(result.data);
      setHasMore(result.data.length === limit);
      setIsLoading(false);
    });
  }, [notes.length, fetchPage]);

  const prependNote = useCallback((note: JournalNote) => {
    setNotes(previous => [note, ...previous]);
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes(previous => previous.filter(note => note.id !== id));
  }, []);

  return {
    notes,
    error,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    prependNote,
    removeNote,
  };
}
