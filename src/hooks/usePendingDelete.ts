import { useCallback, useState } from 'react';

export interface PendingDelete<T> {
  target: T | null;
  isVisible: boolean;
  request: (target: T) => void;
  cancel: () => void;
  confirm: () => void;
}

export function usePendingDelete<T>(
  onConfirm: (target: T) => void
): PendingDelete<T> {
  const [target, setTarget] = useState<T | null>(null);

  const confirm = useCallback(() => {
    if (target === null) {
      return;
    }
    onConfirm(target);
  }, [target, onConfirm]);

  return {
    target,
    isVisible: target !== null,
    request: useCallback((next: T) => setTarget(() => next), []),
    cancel: useCallback(() => setTarget(null), []),
    confirm,
  };
}
