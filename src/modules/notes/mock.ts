import {
  addDays,
  endOfDay,
  min as minDate,
  startOfDay,
  subMonths,
} from 'date-fns';

import { dateDayRangesSchema } from './schema';
import type { DateDayRange, DateDayRanges } from './schema';

const DEFAULT_SEED = 20260801;
const DEFAULT_MONTHS_BACK = 5;

const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_BITS = 32;
const LCG_M = 2 ** LCG_BITS;

const MAX_GAP_DAYS = 3;
const LONG_RANGE_CHANCE = 0.22;
const MIN_LONG_DAYS = 2;
const MAX_LONG_DAYS = 6;

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * LCG_A + LCG_C) % LCG_M;
    return state / LCG_M;
  };
}

interface MockOptions {
  monthsBack?: number;
  seed?: number;
}

// Walks forward day by day, so ranges come out ordered and never overlap.
export function mockDateDayRanges({
  monthsBack = DEFAULT_MONTHS_BACK,
  seed = DEFAULT_SEED,
}: MockOptions = {}): DateDayRanges {
  const random = createRandom(seed);
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const ranges: DateDayRange[] = [];

  let cursor = startOfDay(subMonths(today, monthsBack));
  let count = 0;

  while (cursor <= yesterday) {
    cursor = addDays(cursor, Math.floor(random() * (MAX_GAP_DAYS + 1)));
    if (cursor > yesterday) {
      break;
    }

    const isLong = random() < LONG_RANGE_CHANCE;
    const length = isLong
      ? MIN_LONG_DAYS +
        Math.floor(random() * (MAX_LONG_DAYS - MIN_LONG_DAYS + 1))
      : 1;
    const end = minDate([addDays(cursor, length - 1), yesterday]);

    ranges.push({
      id: `mock-${count}`,
      note_id: `mock-note-${count}`,
      start_timestamp: cursor.getTime(),
      end_timestamp: endOfDay(end).getTime(),
    });

    count += 1;
    cursor = addDays(end, 1);
  }

  // The run being written right now: starts today and continues into tomorrow.
  ranges.push({
    id: 'mock-current',
    note_id: 'mock-note-current',
    start_timestamp: today.getTime(),
    end_timestamp: endOfDay(addDays(today, 1)).getTime(),
  });

  return dateDayRangesSchema.parse(ranges);
}
