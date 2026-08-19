import { useCallback, useState } from 'react';

/**
 * Tracks the measured height of the format bar and reports it as an inset,
 * which is zero while the bar is closed.
 */
export function useFormatBarInset(isOpen: boolean) {
  const [height, setHeight] = useState(0);

  const onHeightChange = useCallback((measured: number) => {
    setHeight(current => (current === measured ? current : measured));
  }, []);

  return { inset: isOpen ? height : 0, onHeightChange };
}
