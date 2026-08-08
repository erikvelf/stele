import { useCallback, useEffect, useState } from 'react';

import type { Span } from '@/modules/log';
import { listReflections, writeReflection } from '@/modules/reflections';
import type { ReflectionKind } from '@/modules/reflections';

import { useAutosave } from './useAutosave';

// The kind travels with the text so a resolution change mid-edit cannot land
// the write on the wrong period.
interface PendingReflection {
  kind: ReflectionKind;
  text: string;
}

interface UseReflectionsResult {
  textFor: (periodStart: number) => string;
  setText: (periodStart: number, text: string) => void;
}

const NO_TEXT = '';

// Every reflection in the visible window, loaded in one read and written
// back debounced — the same autosave shape as useHighlights, because it is
// the same problem: a field that saves itself while you are still typing.
export function useReflections(
  kind: ReflectionKind | null,
  span: Span
): UseReflectionsResult {
  const [texts, setTexts] = useState<Map<number, string>>(new Map());
  const { schedule } = useAutosave<number, PendingReflection>(
    (periodStart, pending) => {
      void writeReflection(pending.kind, periodStart, pending.text);
    }
  );

  const from = span.start.getTime();
  const to = span.end.getTime();

  useEffect(() => {
    // Nothing to load at day resolution, and nothing rendered either: the
    // stale map is unreachable rather than wrong.
    if (kind === null) {
      return undefined;
    }

    let cancelled = false;
    void listReflections(kind, from, to).then(result => {
      if (cancelled || !result.success) {
        return;
      }
      setTexts(
        new Map(
          result.data.map(reflection => [
            reflection.period_start,
            reflection.text,
          ])
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [kind, from, to]);

  const textFor = useCallback(
    (periodStart: number) => texts.get(periodStart) ?? NO_TEXT,
    [texts]
  );

  const setText = useCallback(
    (periodStart: number, text: string) => {
      setTexts(previous => new Map(previous).set(periodStart, text));

      if (kind === null) {
        return;
      }

      schedule(periodStart, { kind, text });
    },
    [kind, schedule]
  );

  return { textFor, setText };
}
