import { endOfDay, startOfDay } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listHighlightsForJournalNotes, listTags } from '@/modules/highlights';
import type { Tag } from '@/modules/highlights';
import { readDayRanges } from '@/modules/journal';
import type { DayRange } from '@/modules/journal';
import { buildLayers, pagesSpan } from '@/modules/log';
import type {
  Direction,
  LayerEntry,
  LayerRow,
  Resolution,
  Span,
} from '@/modules/log';
import type { AppError } from '@/modules/types';

const FIRST_PAGE_COUNT = 1;

interface UseStratiOptions {
  resolution: Resolution;
  direction: Direction;
  tagIds: readonly string[];
  // A period the log is drilled into. While set, paging is off: the window
  // is exactly that period.
  scope: Span | null;
}

interface UseStratiResult {
  rows: LayerRow[];
  // The calendar window currently rendered, so reflections can be loaded for
  // exactly the periods on screen.
  span: Span;
  tags: Map<string, Tag>;
  error: AppError | null;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

interface HighlightRow {
  id: string;
  journal_note_id: string;
  text: string;
  tag_id: string | null;
}

function startDayOf(range: DayRange): number {
  return startOfDay(new Date(range.start_timestamp)).getTime();
}

function toEntries(
  highlights: readonly HighlightRow[],
  ranges: readonly DayRange[]
): LayerEntry[] {
  const byNote = new Map(ranges.map(range => [range.id, range]));

  return highlights.flatMap(highlight => {
    const range = byNote.get(highlight.journal_note_id);
    if (!range) {
      return [];
    }
    return [
      {
        id: highlight.id,
        noteId: highlight.journal_note_id,
        text: highlight.text,
        tagId: highlight.tag_id,
        start: startOfDay(new Date(range.start_timestamp)),
        end: startOfDay(new Date(range.end_timestamp)),
      },
    ];
  });
}

function coveredBySpan(range: DayRange, span: Span): boolean {
  const start = startDayOf(range);
  return start >= span.start.getTime() && start <= span.end.getTime();
}

// Whether the archive continues past the loaded window in the direction
// being read.
function extendsBeyond(
  ranges: readonly DayRange[],
  span: Span,
  direction: Direction
): boolean {
  return ranges.some(range =>
    direction === 'newest'
      ? startDayOf(range) < span.start.getTime()
      : startDayOf(range) > span.end.getTime()
  );
}

// The log never runs ahead of today: a period that has not happened yet has
// nothing in it, and an empty header for next month is the app inventing a
// gap rather than recording one.
function clampToToday(end: Date, today: Date): Date {
  const limit = endOfDay(today);
  return end.getTime() > limit.getTime() ? limit : end;
}

// Reading oldest-first starts at the archive's own beginning; anchoring on
// today would page forward into empty future weeks.
function earliestStart(ranges: readonly DayRange[]): number | null {
  return ranges.reduce<number | null>(
    (earliest, range) =>
      earliest === null || range.start_timestamp < earliest
        ? range.start_timestamp
        : earliest,
    null
  );
}

function spanKey(span: Span): string {
  return `${span.start.getTime()}-${span.end.getTime()}`;
}

// The journal's highlights, shaped into the layers of the current view. Two
// reads: every day-run once (small, one row per note), then only the
// highlights the visible window actually needs.
export function useStrati({
  resolution,
  direction,
  tagIds,
  scope,
}: UseStratiOptions): UseStratiResult {
  // Fixed for the screen's lifetime, so paging never shifts under a scroll
  // that crosses midnight. State rather than a ref: the span is derived from
  // it during render, and a ref may not be read there.
  const [today] = useState(() => new Date());
  const [pageCount, setPageCount] = useState(FIRST_PAGE_COUNT);
  const [ranges, setRanges] = useState<DayRange[]>([]);
  const [entries, setEntries] = useState<LayerEntry[]>([]);
  const [tags, setTags] = useState<Map<string, Tag>>(new Map());
  const [error, setError] = useState<AppError | null>(null);

  const tagKey = tagIds.join(',');
  const scopeKey = scope ? spanKey(scope) : '';
  const viewKey = `${resolution}|${direction}|${tagKey}|${scopeKey}`;

  // A changed view is a different window onto the same archive, so it starts
  // at page one. Adjusted during render rather than in an effect: the reset
  // is derived from props, and an effect would render the old depth first.
  const [loadedViewKey, setLoadedViewKey] = useState(viewKey);
  if (loadedViewKey !== viewKey) {
    setLoadedViewKey(viewKey);
    setPageCount(FIRST_PAGE_COUNT);
  }

  const oldest = useMemo(() => earliestStart(ranges), [ranges]);

  const span = useMemo(() => {
    if (scope) {
      return scope;
    }
    const anchor =
      direction === 'oldest' && oldest !== null ? new Date(oldest) : today;
    const window = pagesSpan(resolution, direction, anchor, pageCount);
    return { start: window.start, end: clampToToday(window.end, today) };
  }, [scope, resolution, direction, pageCount, oldest, today]);

  // Loading is derived, not announced: a request is outstanding exactly when
  // what the view asks for differs from what last came back.
  const requestKey = `${viewKey}|${spanKey(span)}|${ranges.length}`;
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const isLoading = settledKey !== requestKey;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void Promise.all([readDayRanges(), listTags()]).then(
        ([rangeResult, tagResult]) => {
          if (cancelled) {
            return;
          }
          if (rangeResult.success) {
            setRanges([...rangeResult.data]);
          } else {
            setError(rangeResult.error);
          }
          if (tagResult.success) {
            setTags(new Map(tagResult.data.map(tag => [tag.id, tag])));
          }
        }
      );

      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    const visible = ranges.filter(range => coveredBySpan(range, span));

    void listHighlightsForJournalNotes(
      visible.map(range => range.id),
      tagIds
    ).then(result => {
      if (cancelled) {
        return;
      }
      if (!result.success) {
        setError(result.error);
        setSettledKey(requestKey);
        return;
      }

      const loaded = toEntries(result.data, visible);
      setEntries(loaded);
      setSettledKey(requestKey);

      // An empty stretch renders nothing at all, so the list has no content
      // to scroll and would never ask for the next page. Walk past the gap
      // rather than stalling on it.
      if (
        loaded.length === 0 &&
        !scope &&
        extendsBeyond(ranges, span, direction)
      ) {
        setPageCount(current => current + 1);
      }
    });

    return () => {
      cancelled = true;
    };
    // tagIds is compared by its joined key, carried in requestKey: a fresh
    // array holding the same tags is the same filter.
  }, [ranges, span, requestKey, tagIds, direction, scope]);

  const hasMore = useMemo(
    () => (scope ? false : extendsBeyond(ranges, span, direction)),
    [ranges, span, direction, scope]
  );

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPageCount(current => current + 1);
    }
  }, [hasMore]);

  const rows = useMemo(
    () => buildLayers({ entries, resolution, span, direction, today }),
    [entries, resolution, span, direction, today]
  );

  return { rows, span, tags, error, isLoading, hasMore, loadMore };
}
