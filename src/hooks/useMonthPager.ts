import { useEffect, useRef, useState } from 'react';

export interface MonthPager {
  index: number;
  month: Date | undefined;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  setIndex: (index: number) => void;
}

// Keeps the visible page in step with `targetIndex` until the reader pages
// away, so a list that grows once its data loads still lands on the month it
// was asked to open at rather than on whichever month existed at mount.
export function useMonthPager(
  months: readonly Date[],
  targetIndex: number
): MonthPager {
  const [index, setIndex] = useState(targetIndex);
  const lastTarget = useRef(targetIndex);

  useEffect(() => {
    if (lastTarget.current === targetIndex) {
      return;
    }
    lastTarget.current = targetIndex;
    setIndex(targetIndex);
  }, [targetIndex]);

  const lastIndex = months.length - 1;
  const current = Math.min(Math.max(index, 0), Math.max(lastIndex, 0));

  return {
    index: current,
    month: months.at(current),
    canGoBack: current > 0,
    canGoForward: current < lastIndex,
    goBack: () => setIndex(current - 1),
    goForward: () => setIndex(current + 1),
    setIndex,
  };
}
