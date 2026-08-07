import { format, isSameDay, isSameMonth } from 'date-fns';
import { it } from 'date-fns/locale';

// A span of whole calendar days, labelled by what kind of period it is. The
// kind is what decides the phrasing: the same two dates read as
// "3-7 giovedì-lunedì Marzo" for an arbitrary run and "settimana …" for a
// calendar week.
export type PeriodKind = 'range' | 'week' | 'month';

export interface Period {
  kind: PeriodKind;
  start: Date;
  end: Date;
}

const EN_DASH = '–';

// A run that leaves the month it started in still shows one month name, so
// it is marked as approximate rather than silently wrong.
const CROSSES_MONTH_MARK = '*';

const WEEKDAY_AND_DAY = 'EEEE d MMMM';
const DAY = 'd';
const WEEKDAY = 'EEEE';
const MONTH = 'MMMM';
const MONTH_AND_YEAR = 'MMMM yyyy';

function label(date: Date, pattern: string): string {
  return format(date, pattern, { locale: it });
}

function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function pair(start: string, end: string): string {
  return `${start}${EN_DASH}${end}`;
}

// "domenica 2 marzo" for one day. A run names its two days, then its two
// weekdays, then the month once: "31-1 domenica-lunedì Marzo*".
function formatSpan(start: Date, end: Date): string {
  if (isSameDay(start, end)) {
    return capitalize(label(start, WEEKDAY_AND_DAY));
  }

  const days = pair(label(start, DAY), label(end, DAY));
  const weekdays = pair(
    capitalize(label(start, WEEKDAY)),
    capitalize(label(end, WEEKDAY))
  );
  const month = capitalize(label(start, MONTH));
  const mark = isSameMonth(start, end) ? '' : CROSSES_MONTH_MARK;

  return `${days} ${weekdays} ${month}${mark}`;
}

export function formatPeriod(period: Period): string {
  if (period.kind === 'month') {
    return label(period.start, MONTH_AND_YEAR);
  }
  if (period.kind === 'week') {
    return `settimana ${formatSpan(period.start, period.end)}`;
  }
  return formatSpan(period.start, period.end);
}
