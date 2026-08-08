import { addDays, isAfter, startOfDay, subDays } from 'date-fns';

import type { DayRange } from './schema';
import type { DayBounds, FreeRun } from './types';

// The whole days a range covers, with its millisecond timestamps truncated.
export function toDayBounds(range: DayRange): DayBounds {
  return {
    start: startOfDay(new Date(range.start_timestamp)),
    end: startOfDay(new Date(range.end_timestamp)),
  };
}

export function isWithinBounds(day: Date, bounds: DayBounds): boolean {
  const target = startOfDay(day).getTime();
  return target >= bounds.start.getTime() && target <= bounds.end.getTime();
}

// Every occupied day keyed by its start-of-day timestamp.
export function indexRangesByDay(
  ranges: readonly DayRange[]
): Map<number, DayRange> {
  const byDay = new Map<number, DayRange>();

  ranges.forEach(range => {
    const { start, end } = toDayBounds(range);
    let cursor = start;
    while (cursor.getTime() <= end.getTime()) {
      byDay.set(cursor.getTime(), range);
      cursor = addDays(cursor, 1);
    }
  });

  return byDay;
}

// How far a range starting at `day` may extend before it reaches a day another
// entry occupies. `end: null` means no range follows.
export function findFreeRunFrom(
  day: Date,
  ranges: readonly DayRange[]
): FreeRun {
  const start = startOfDay(day);

  const nextOccupiedStart = ranges
    .map(range => startOfDay(new Date(range.start_timestamp)))
    .filter(occupiedStart => isAfter(occupiedStart, start))
    .sort((a, b) => a.getTime() - b.getTime())
    .at(0);

  return {
    start,
    end: nextOccupiedStart ? subDays(nextOccupiedStart, 1) : null,
  };
}

// Whether every day between `a` and `b` — inclusive, in either order — is free
// of the given ranges.
export function isRunFree(
  a: Date,
  b: Date,
  ranges: readonly DayRange[]
): boolean {
  const start = startOfDay(a.getTime() <= b.getTime() ? a : b);
  const end = startOfDay(a.getTime() <= b.getTime() ? b : a);

  return !ranges.some(range => {
    const bounds = toDayBounds(range);
    return (
      bounds.start.getTime() <= end.getTime() &&
      bounds.end.getTime() >= start.getTime()
    );
  });
}
