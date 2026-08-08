import { format, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';

const EN_DASH = '–';

const WEEKDAY = 'EEE';
const DAY = 'd';
const MONTH = 'MMM';
const DAY_AND_MONTH = 'd MMM';
const DAY_MONTH_AND_YEAR = 'd MMM yyyy';

function label(date: Date, pattern: string, locale: DateFnsLocale): string {
  return format(date, pattern, { locale });
}

function pair(start: string, end: string): string {
  return `${start}${EN_DASH}${end}`;
}

// The compact span a card footer shows: "thu, 6 aug" for one day, "thu–fri,
// 6–7 aug" for a run inside one month, "thu–fri, 31 jul–1 aug" when it leaves
// its month. A run crossing a year names both years and drops the weekdays,
// which no longer place it.
export function formatDayRange(
  start: Date,
  end: Date,
  locale: DateFnsLocale
): string {
  if (isSameDay(start, end)) {
    return `${label(start, WEEKDAY, locale)}, ${label(start, DAY_AND_MONTH, locale)}`;
  }

  if (!isSameYear(start, end)) {
    return pair(
      label(start, DAY_MONTH_AND_YEAR, locale),
      label(end, DAY_MONTH_AND_YEAR, locale)
    );
  }

  const weekdays = pair(
    label(start, WEEKDAY, locale),
    label(end, WEEKDAY, locale)
  );

  if (isSameMonth(start, end)) {
    const days = pair(label(start, DAY, locale), label(end, DAY, locale));
    return `${weekdays}, ${days} ${label(start, MONTH, locale)}`;
  }

  return `${weekdays}, ${pair(
    label(start, DAY_AND_MONTH, locale),
    label(end, DAY_AND_MONTH, locale)
  )}`;
}
