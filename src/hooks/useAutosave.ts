import { useCallback, useEffect, useRef } from 'react';

const AUTOSAVE_DEBOUNCE_MS = 500;

interface Autosave<K, T> {
  schedule: (key: K, payload: T) => void;
  cancel: (key: K) => void;
  peek: (key: K) => T | undefined;
}

// One debounced write per key. A pending write is flushed when the hook goes
// away rather than dropped, so leaving a screen mid-edit saves. The payload
// is stored beside its timer, which is what makes the flush possible: at that
// point the state it came from is already gone.
export function useAutosave<K, T>(
  write: (key: K, payload: T) => void
): Autosave<K, T> {
  const pending = useRef(
    new Map<K, { timer: ReturnType<typeof setTimeout>; payload: T }>()
  );
  const writeRef = useRef(write);

  useEffect(() => {
    writeRef.current = write;
  });

  const cancel = useCallback((key: K) => {
    const entry = pending.current.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      pending.current.delete(key);
    }
  }, []);

  const schedule = useCallback(
    (key: K, payload: T) => {
      cancel(key);
      const timer = setTimeout(() => {
        pending.current.delete(key);
        writeRef.current(key, payload);
      }, AUTOSAVE_DEBOUNCE_MS);
      pending.current.set(key, { timer, payload });
    },
    [cancel]
  );

  const peek = useCallback((key: K) => pending.current.get(key)?.payload, []);

  useEffect(() => {
    const writes = pending.current;
    return () => {
      writes.forEach((entry, key) => {
        clearTimeout(entry.timer);
        writeRef.current(key, entry.payload);
      });
      writes.clear();
    };
  }, []);

  return { schedule, cancel, peek };
}
