import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { Period } from '@/modules/types';

import { WEEK_OPTIONS } from './calendar';
import { countByTag } from './stats';
import type {
  Direction,
  HeaderVariant,
  LayerEntry,
  LayerRow,
  Resolution,
  Span,
  TagCount,
} from './types';

interface RangeGroup {
  start: Date;
  end: Date;
  entries: LayerEntry[];
}

function rangeKey(entry: LayerEntry): string {
  return `${entry.start.getTime()}-${entry.end.getTime()}`;
}

// Slots are exclusive, so a note's day-run is already a unique bucket: two
// notes never share one and every highlight of a run belongs to it whole.
function groupByRange(entries: readonly LayerEntry[]): RangeGroup[] {
  const groups = new Map<string, RangeGroup>();

  entries.forEach(entry => {
    const key = rangeKey(entry);
    const group = groups.get(key);
    if (group) {
      group.entries.push(entry);
      return;
    }
    groups.set(key, { start: entry.start, end: entry.end, entries: [entry] });
  });

  return [...groups.values()];
}

function ordered<T extends { start: Date }>(
  items: readonly T[],
  direction: Direction
): T[] {
  const sorted = [...items].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  return direction === 'newest' ? sorted.reverse() : sorted;
}

function coversDay(period: Period, day: Date): boolean {
  return (
    day.getTime() >= period.start.getTime() &&
    day.getTime() <= period.end.getTime()
  );
}

// Every period start between the span's ends, in reading order — driven by
// the calendar rather than by the entries, so a caller can decide for itself
// what an empty period is worth.
function periodStarts(
  span: Span,
  direction: Direction,
  startOf: (date: Date) => Date,
  next: (date: Date) => Date
): Date[] {
  const last = startOf(span.end).getTime();
  const starts: Date[] = [];
  let cursor = startOf(span.start);

  while (cursor.getTime() <= last) {
    starts.push(cursor);
    cursor = next(cursor);
  }

  return direction === 'newest' ? starts.reverse() : starts;
}

function headerRow(period: Period, variant: HeaderVariant): LayerRow {
  return {
    kind: 'header',
    id: `header-${period.kind}-${period.start.getTime()}`,
    period,
    variant,
  };
}

// A period is over once the day after its last has begun; until then the
// reflection is shown but not yet writable.
function isPeriodOver(period: Period, today: Date): boolean {
  return period.end.getTime() < startOfDay(today).getTime();
}

function reflectionRow(period: Period, today: Date): LayerRow {
  return {
    kind: 'reflection',
    id: `reflection-${period.kind}-${period.start.getTime()}`,
    period,
    isPeriodOver: isPeriodOver(period, today),
  };
}

function digestRow(period: Period, counts: TagCount[]): LayerRow {
  return {
    kind: 'digest',
    id: `digest-${period.start.getTime()}`,
    period,
    counts,
  };
}

function scagliaRows(entries: readonly LayerEntry[]): LayerRow[] {
  return entries.map(entry => ({
    kind: 'scaglia' as const,
    id: entry.id,
    noteId: entry.noteId,
    text: entry.text,
    tagId: entry.tagId,
  }));
}

function rangePeriod(group: RangeGroup): Period {
  return { kind: 'range', start: group.start, end: group.end };
}

function rangeSection(group: RangeGroup, variant: HeaderVariant): LayerRow[] {
  return [
    headerRow(rangePeriod(group), variant),
    ...scagliaRows(group.entries),
  ];
}

function buildDayLayers(
  groups: readonly RangeGroup[],
  direction: Direction
): LayerRow[] {
  return ordered(groups, direction).flatMap(group =>
    rangeSection(group, 'medium')
  );
}

function buildWeekLayers(
  groups: readonly RangeGroup[],
  span: Span,
  direction: Direction,
  today: Date
): LayerRow[] {
  const starts = periodStarts(
    span,
    direction,
    date => startOfWeek(date, WEEK_OPTIONS),
    date => addWeeks(date, 1)
  );

  return starts.flatMap(weekStart => {
    const period: Period = {
      kind: 'week',
      start: weekStart,
      end: endOfWeek(weekStart, WEEK_OPTIONS),
    };
    const within = ordered(
      groups.filter(group => coversDay(period, group.start)),
      direction
    );

    // A week you wrote nothing in is skipped rather than shown blank: the
    // log records what happened, and a run of empty dividers would be the
    // app reporting your gaps back at you.
    if (within.length === 0) {
      return [];
    }

    return [
      headerRow(period, 'medium'),
      reflectionRow(period, today),
      ...within.flatMap(group => rangeSection(group, 'small')),
    ];
  });
}

// A month is the digest of itself: what you tagged and how often, plus the
// reflection. The scaglie behind it are reached by opening the month.
function buildMonthLayers(
  entries: readonly LayerEntry[],
  span: Span,
  direction: Direction,
  today: Date
): LayerRow[] {
  const starts = periodStarts(span, direction, startOfMonth, date =>
    addMonths(date, 1)
  );

  return starts.flatMap(monthStart => {
    const period: Period = {
      kind: 'month',
      start: monthStart,
      end: endOfMonth(monthStart),
    };
    const within = entries.filter(entry => coversDay(period, entry.start));

    return [
      headerRow(period, 'medium'),
      reflectionRow(period, today),
      digestRow(period, countByTag(within)),
    ];
  });
}

interface BuildLayersInput {
  entries: readonly LayerEntry[];
  resolution: Resolution;
  span: Span;
  direction: Direction;
  today: Date;
}

// Ordered highlights in, flat display rows out. Pure: no formatting, no
// locale copy, no knowledge of how a row is drawn.
export function buildLayers({
  entries,
  resolution,
  span,
  direction,
  today,
}: BuildLayersInput): LayerRow[] {
  if (resolution === 'month') {
    return buildMonthLayers(entries, span, direction, today);
  }

  const groups = groupByRange(entries);

  if (resolution === 'week') {
    return buildWeekLayers(groups, span, direction, today);
  }
  return buildDayLayers(groups, direction);
}
