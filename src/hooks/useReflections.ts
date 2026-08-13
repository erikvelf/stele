import { useCallback, useEffect, useState } from 'react';

import type { Span } from '@/modules/log';
import { listReflections, writeReflection } from '@/modules/reflections';
import type { Reflection, ReflectionKind } from '@/modules/reflections';
import type { AppError } from '@/modules/types';

import { useAutosave } from './useAutosave';

// The kind travels with the text so a resolution change mid-edit cannot land
// the write on the wrong period.
interface PendingReflection {
  kind: ReflectionKind;
  text: string;
}

// The text of every visible period, and which of them the field has changed.
interface Draft {
  texts: Map<number, string>;
  edited: Set<number>;
}

interface UseReflectionsResult {
  textFor: (periodStart: number) => string;
  setText: (periodStart: number, text: string) => void;
  error: AppError | null;
  dismissError: () => void;
}

const NO_TEXT = '';

function emptyDraft(): Draft {
  return { texts: new Map(), edited: new Set() };
}

// An edited period keeps its typed text; every other one takes the stored
// value. The window reloads as pages arrive, and a reload must not put the
// stored text back over the row being typed into.
function mergeLoaded(draft: Draft, loaded: readonly Reflection[]): Draft {
  const texts = new Map(
    loaded.map(reflection => [reflection.period_start, reflection.text])
  );

  draft.edited.forEach(periodStart => {
    texts.set(periodStart, draft.texts.get(periodStart) ?? NO_TEXT);
  });

  return { texts, edited: draft.edited };
}

// Every reflection in the visible window, loaded in one read and written
// back debounced — the same autosave shape as useHighlights, because it is
// the same problem: a field that saves itself while you are still typing.
export function useReflections(
  kind: ReflectionKind | null,
  span: Span
): UseReflectionsResult {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<AppError | null>(null);
  const { schedule } = useAutosave<number, PendingReflection>(
    (periodStart, pending) => {
      void writeReflection(pending.kind, periodStart, pending.text).then(
        result => {
          if (!result.success) {
            setError(result.error);
          }
        }
      );
    }
  );

  const from = span.start.getTime();
  const to = span.end.getTime();

  // A month that starts on a Monday has the same timestamp as its week, so a
  // draft built for one kind cannot be read by another. Dropped during render
  // rather than in an effect, which would draw the wrong text first.
  const [loadedKind, setLoadedKind] = useState(kind);
  if (loadedKind !== kind) {
    setLoadedKind(kind);
    setDraft(emptyDraft);
  }

  useEffect(() => {
    // Nothing to load at day resolution, and nothing rendered either: the
    // stale draft is unreachable rather than wrong.
    if (kind === null) {
      return undefined;
    }

    let cancelled = false;
    void listReflections(kind, from, to).then(result => {
      if (cancelled || !result.success) {
        return;
      }
      setDraft(previous => mergeLoaded(previous, result.data));
    });

    return () => {
      cancelled = true;
    };
  }, [kind, from, to]);

  const textFor = useCallback(
    (periodStart: number) => draft.texts.get(periodStart) ?? NO_TEXT,
    [draft]
  );

  const setText = useCallback(
    (periodStart: number, text: string) => {
      setDraft(previous => ({
        texts: new Map(previous.texts).set(periodStart, text),
        edited: new Set(previous.edited).add(periodStart),
      }));

      if (kind === null) {
        return;
      }

      schedule(periodStart, { kind, text });
    },
    [kind, schedule]
  );

  const dismissError = useCallback(() => setError(null), []);

  return { textFor, setText, error, dismissError };
}
