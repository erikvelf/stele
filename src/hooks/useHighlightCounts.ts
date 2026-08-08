import { useEffect, useState } from 'react';

import { countHighlightsByJournalNote } from '@/modules/highlights';

const NO_COUNTS: ReadonlyMap<string, number> = new Map();

// How many highlights each listed note carries, keyed by note id. The feed
// hands back a new array on every refresh, so the counts reload whenever the
// notes do. A failed load reads as no highlights, which the card renders by
// showing nothing.
export function useHighlightCounts(
  notes: readonly { id: string }[]
): ReadonlyMap<string, number> {
  const [counts, setCounts] = useState<ReadonlyMap<string, number>>(NO_COUNTS);

  useEffect(() => {
    let cancelled = false;

    void countHighlightsByJournalNote(notes.map(note => note.id)).then(
      result => {
        if (cancelled) {
          return;
        }
        setCounts(result.success ? result.data : NO_COUNTS);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [notes]);

  return counts;
}
