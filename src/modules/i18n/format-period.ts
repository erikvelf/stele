import { format, isSameDay, isSameMonth } from 'date-fns';

import { capitalize } from '@/lib/capitalize';
import type { Period } from '@/modules/types';

import type { Translate } from './i18n';
import { dateLocale } from './i18n';

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
  return format(date, pattern, { locale: dateLocale() });
}

function pair(start: string, end: string): string {
  return `${start}${EN_DASH}${end}`;
}

// "Sunday 2 March" for one day. A run names its two days, then its two
// weekdays, then the month once: "31-1 Sunday-Monday March*".
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

export function formatPeriod(period: Period, t: Translate): string {
  if (period.kind === 'month') {
    return label(period.start, MONTH_AND_YEAR);
  }
  if (period.kind === 'week') {
    return t('period.week', {
      span: formatSpan(period.start, period.end),
    });
  }
  return formatSpan(period.start, period.end);
}
