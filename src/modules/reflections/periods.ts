import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import { WEEK_OPTIONS } from '@/modules/log';
import type { Span } from '@/modules/log';

import type { ReflectionKind } from './schema';

// Date-fns rather than arithmetic, so daylight saving and uneven month
// lengths land on the right day.
function startOfKind(kind: ReflectionKind, at: Date): Date {
  if (kind === 'week') {
    return startOfWeek(at, WEEK_OPTIONS);
  }
  return kind === 'month' ? startOfMonth(at) : startOfYear(at);
}

function endOfKind(kind: ReflectionKind, at: Date): Date {
  if (kind === 'week') {
    return endOfWeek(at, WEEK_OPTIONS);
  }
  return kind === 'month' ? endOfMonth(at) : endOfYear(at);
}

// The start of the period of `kind` containing `at` — the timestamp its
// reflection is keyed by.
export function periodStartOf(kind: ReflectionKind, at: number): Date {
  return startOfKind(kind, new Date(at));
}

// The calendar span a stored reflection covers: the inverse of the identity
// that reflectionIdFor builds.
export function periodFor(kind: ReflectionKind, periodStart: number): Span {
  const start = new Date(periodStart);
  return { start, end: endOfKind(kind, start) };
}
