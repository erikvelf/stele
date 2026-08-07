import { addDays, isAfter, startOfDay, subDays } from 'date-fns';

import type { DateDayRange } from './schema';
import type { DayBounds, FreeRun } from './types';

// The whole days a range covers. Timestamps are stored to the millisecond, so
// every comparison against a calendar day goes through here first.
export function toDayBounds(range: DateDayRange): DayBounds {
  return {
    start: startOfDay(new Date(range.start_timestamp)),
    end: startOfDay(new Date(range.end_timestamp)),
  };
}

export function isWithinBounds(day: Date, bounds: DayBounds): boolean {
  const target = startOfDay(day).getTime();
  return target >= bounds.start.getTime() && target <= bounds.end.getTime();
}

// Every occupied day keyed by its start-of-day timestamp, so a calendar can
// ask who owns a day once per day instead of scanning every range for every
// cell it draws.
export function indexRangesByDay(
  ranges: readonly DateDayRange[]
): Map<number, DateDayRange> {
  const byDay = new Map<number, DateDayRange>();

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

// How far a range starting at `day` may extend before it would cover a day
// another note already occupies. `end: null` means nothing is in the way.
export function findFreeRunFrom(day: Date, ranges: readonly DateDayRange[]): FreeRun {
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

// Whether every day between `a` and `b` (inclusive, either order) is free of
// the given ranges — used to trace a day-range extension one tap at a time
// without ever crossing into a day another note already occupies.
export function isRunFree(a: Date, b: Date, ranges: readonly DateDayRange[]): boolean {
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
