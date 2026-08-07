import { addMonths, addWeeks, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

import { WEEK_OPTIONS } from './calendar';
import type { Direction, Resolution, Span } from './types';

// How many units of the outermost layer one page covers. Days and weeks page
// by the calendar week so a page boundary never cuts a week in half; months
// page by the month for the same reason.
const PAGE_WEEKS_BY_DAY = 4;
const PAGE_WEEKS_BY_WEEK = 6;
const PAGE_MONTHS = 12;

const LAST_UNIT_OFFSET = 1;

function isMonthly(resolution: Resolution): boolean {
  return resolution === 'month';
}

function pageUnits(resolution: Resolution): number {
  if (isMonthly(resolution)) {
    return PAGE_MONTHS;
  }
  return resolution === 'week' ? PAGE_WEEKS_BY_WEEK : PAGE_WEEKS_BY_DAY;
}

function unitStart(resolution: Resolution, date: Date): Date {
  return isMonthly(resolution) ? startOfMonth(date) : startOfWeek(date, WEEK_OPTIONS);
}

function unitEnd(resolution: Resolution, date: Date): Date {
  return isMonthly(resolution) ? endOfMonth(date) : endOfWeek(date, WEEK_OPTIONS);
}

function shiftUnits(resolution: Resolution, date: Date, amount: number): Date {
  return isMonthly(resolution) ? addMonths(date, amount) : addWeeks(date, amount);
}

// The calendar span page `page` covers, counting away from `anchor` in the
// direction being read. Page 0 always contains the anchor.
export function pageSpan(
  resolution: Resolution,
  direction: Direction,
  anchor: Date,
  page: number
): Span {
  const units = pageUnits(resolution);
  const nearOffset = page * units;
  const farOffset = nearOffset + units - LAST_UNIT_OFFSET;

  if (direction === 'newest') {
    return {
      start: unitStart(resolution, shiftUnits(resolution, anchor, -farOffset)),
      end: unitEnd(resolution, shiftUnits(resolution, anchor, -nearOffset)),
    };
  }

  return {
    start: unitStart(resolution, shiftUnits(resolution, anchor, nearOffset)),
    end: unitEnd(resolution, shiftUnits(resolution, anchor, farOffset)),
  };
}

const FIRST_PAGE = 0;

// Everything loaded so far: the first page's near edge out to the newest
// page's far edge. Rebuilding the whole window each time a page is added
// keeps the list one derivation of one span, with no appended state to
// drift out of order.
export function pagesSpan(
  resolution: Resolution,
  direction: Direction,
  anchor: Date,
  pageCount: number
): Span {
  const first = pageSpan(resolution, direction, anchor, FIRST_PAGE);
  const last = pageSpan(resolution, direction, anchor, Math.max(pageCount - 1, FIRST_PAGE));

  return direction === 'newest'
    ? { start: last.start, end: first.end }
    : { start: first.start, end: last.end };
}
