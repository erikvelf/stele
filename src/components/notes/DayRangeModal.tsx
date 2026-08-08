import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subYears,
} from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import {
  MonthGrid,
  monthGridDays,
  monthGridMetrics,
  MonthGridWeekdays,
  MonthPagerHeader,
  MonthPagerList,
  monthsBetween,
} from '@/components/shared';
import type { MonthGridCell } from '@/components/shared';
import { RADIUS, SPACING } from '@/constants/layout';
import { useMonthPager } from '@/hooks/useMonthPager';
import { useTranslation } from '@/hooks/useTranslation';
import {
  indexRangesByDay,
  isRunFree,
  isWithinBounds,
  toDayBounds,
} from '@/modules/journal';
import type {
  DayBounds,
  DayRange,
  DayRanges,
  JournalNote,
} from '@/modules/journal';

type DayState = 'anchor' | 'pending' | 'blocked' | 'future' | 'free';

// The anchor is a filled square of its own that still belongs to the pending
// outline run, so the capsule passes through it unbroken. Free days never
// merge — each has to stay individually tappable and show its own number.
function pickerCells(
  month: Date,
  anchor: Date,
  pending: DayBounds,
  occupied: Map<number, DayRange>,
  today: Date,
  theme: MD3Theme
): MonthGridCell<DayState>[] {
  return monthGridDays(month).map(day => {
    if (!isSameMonth(day, month)) {
      return { day, padding: true };
    }

    // A note can only cover days that have happened. Future days never merge
    // into a run — they stay separate squares so the wall reads as day by day.
    if (day.getTime() > today.getTime()) {
      return {
        day,
        disabled: true,
        fill: { color: theme.colors.surfaceDisabled },
        data: 'future',
      };
    }

    const blocked = occupied.get(day.getTime());
    if (blocked) {
      return {
        day,
        disabled: true,
        fill: { color: theme.colors.surfaceDisabled, runKey: blocked.id },
        data: 'blocked',
      };
    }

    return selectableCell(
      day,
      isSameDay(day, anchor),
      isWithinBounds(day, pending),
      theme
    );
  });
}

function selectableCell(
  day: Date,
  isAnchor: boolean,
  isPending: boolean,
  theme: MD3Theme
): MonthGridCell<DayState> {
  // The anchor keeps the pending runKey, so the capsule passes through it.
  const outline = isPending
    ? { color: theme.colors.primary, runKey: 'pending' }
    : undefined;

  if (isAnchor) {
    return {
      day,
      fill: { color: theme.colors.primary },
      outline,
      data: 'anchor',
    };
  }
  if (isPending) {
    return { day, outline, data: 'pending' };
  }
  return {
    day,
    fill: { color: theme.colors.surfaceVariant },
    data: 'free',
  };
}

function dayTextColor(state: DayState | undefined, theme: MD3Theme): string {
  if (state === 'anchor') {
    return theme.colors.onPrimary;
  }
  if (state === 'blocked' || state === 'future') {
    return theme.colors.onSurfaceDisabled;
  }
  if (state === 'pending') {
    return theme.colors.primary;
  }
  return theme.colors.onSurfaceVariant;
}

const SHORT_DAY = 'MMM d';

function shortDay(date: Date, locale: DateFnsLocale): string {
  return format(date, SHORT_DAY, { locale });
}

function rangeLabel(bounds: DayBounds, locale: DateFnsLocale): string {
  if (isSameDay(bounds.start, bounds.end)) {
    return shortDay(bounds.start, locale);
  }
  return `${shortDay(bounds.start, locale)} – ${shortDay(bounds.end, locale)}`;
}

// What has already been journaled does not bound the picker: any free day is
// a legal end for a range, in either direction. The window around the anchor
// is wide enough that its edges are never reached, so the chevrons never
// dead-end on a month that is merely empty.
const PICKER_WINDOW_YEARS = 25;

// Nothing past the current month is selectable, so the window stops there
// rather than paging through months of disabled squares.
function pickerMonths(anchor: Date | null, today: Date): Date[] {
  if (!anchor) {
    return [];
  }
  const center = startOfMonth(anchor);
  return monthsBetween(subYears(center, PICKER_WINDOW_YEARS), today);
}

// Pressing inside the range pulls the nearer edge back to the anchor, which
// never moves. Pressing outside extends that edge, but only over free days.
function nextBounds(
  day: Date,
  anchor: Date,
  pending: DayBounds,
  otherRanges: readonly DayRange[]
): DayBounds | null {
  if (isWithinBounds(day, pending)) {
    if (day.getTime() < anchor.getTime()) {
      return { ...pending, start: anchor };
    }
    if (day.getTime() > anchor.getTime()) {
      return { ...pending, end: anchor };
    }
    return null;
  }

  if (
    day.getTime() < pending.start.getTime() &&
    isRunFree(day, pending.start, otherRanges)
  ) {
    return { ...pending, start: day };
  }

  if (
    day.getTime() > pending.end.getTime() &&
    isRunFree(pending.end, day, otherRanges)
  ) {
    return { ...pending, end: day };
  }

  return null;
}

interface DayRangeSelection {
  // The day the note was written for, which no edit may push out of the range.
  anchor: Date | null;
  pending: DayBounds | null;
  occupied: Map<number, DayRange>;
  selectDay: (day: Date) => void;
}

// Single consumer (this modal), so it stays local rather than in hooks/.
function useDayRangeSelection(
  note: JournalNote | null,
  ranges: DayRanges
): DayRangeSelection {
  const [pending, setPending] = useState<DayBounds | null>(null);
  const [loadedNoteId, setLoadedNoteId] = useState<string | null>(null);

  if (note && loadedNoteId !== note.id) {
    setLoadedNoteId(note.id);
    setPending(toDayBounds(note));
  }

  const anchor = useMemo(
    () => (note ? startOfDay(new Date(note.created_at)) : null),
    [note]
  );

  const otherRanges = useMemo(
    () => (note ? ranges.filter(range => range.id !== note.id) : ranges),
    [ranges, note]
  );
  const occupied = useMemo(() => indexRangesByDay(otherRanges), [otherRanges]);

  const selectDay = useCallback(
    (day: Date) => {
      if (!anchor || !pending) {
        return;
      }
      const next = nextBounds(day, anchor, pending, otherRanges);
      if (!next) {
        return;
      }
      setPending(next);
    },
    [anchor, pending, otherRanges]
  );

  return { anchor, pending, occupied, selectDay };
}

export interface DayRangeModalProps {
  note: JournalNote | null;
  ranges: DayRanges;
  onDismiss: () => void;
  onConfirm: (note: JournalNote) => void;
}

export function DayRangeModal({
  note,
  ranges,
  onDismiss,
  onConfirm,
}: DayRangeModalProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const [width, setWidth] = useState(0);
  const today = useMemo(() => startOfDay(new Date()), []);
  const { anchor, pending, occupied, selectDay } = useDayRangeSelection(
    note,
    ranges
  );

  const months = useMemo(() => pickerMonths(anchor, today), [anchor, today]);
  const anchorIndex = useMemo(
    () =>
      anchor
        ? Math.max(
            months.findIndex(month => isSameMonth(month, anchor)),
            0
          )
        : 0,
    [months, anchor]
  );
  const pager = useMonthPager(months, anchorIndex);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const { cellWidth, cellHeight, height } = monthGridMetrics(width);
  const gridHeight = Math.max(height, 0);

  const renderDay = useCallback(
    (day: Date, state: DayState | undefined) => (
      <Text variant="labelSmall" style={{ color: dayTextColor(state, theme) }}>
        {format(day, 'd', { locale })}
      </Text>
    ),
    [theme, locale]
  );

  const renderMonth = useCallback(
    (month: Date) => {
      if (!anchor || !pending) {
        return null;
      }
      return (
        <View style={styles.month}>
          <MonthGrid
            cells={pickerCells(month, anchor, pending, occupied, today, theme)}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
            renderDay={renderDay}
            onDayPress={selectDay}
          />
        </View>
      );
    },
    [
      anchor,
      pending,
      occupied,
      today,
      theme,
      cellWidth,
      cellHeight,
      renderDay,
      selectDay,
    ]
  );

  if (!note) {
    return null;
  }

  const isReady = anchor !== null && pending !== null && cellWidth > 0;

  return (
    <Portal>
      <Modal
        visible
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <View style={styles.body}>
          <Text variant="titleLarge">{t('dayRange.title')}</Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t('dayRange.instructions', {
              day: format(anchor ?? toDayBounds(note).start, 'EEE, MMM d', {
                locale,
              }),
            })}
          </Text>

          {pager.month && (
            <MonthPagerHeader
              month={pager.month}
              canGoBack={pager.canGoBack}
              canGoForward={pager.canGoForward}
              onBack={pager.goBack}
              onForward={pager.goForward}
            />
          )}

          {cellWidth > 0 && <MonthGridWeekdays cellWidth={cellWidth} />}

          <View onLayout={onLayout} style={{ height: gridHeight }}>
            {isReady && (
              <MonthPagerList
                months={months}
                index={pager.index}
                width={width}
                height={gridHeight}
                onIndexChange={pager.setIndex}
                renderMonth={renderMonth}
              />
            )}
          </View>

          <Text variant="titleMedium" style={styles.rangeLabel}>
            {pending ? rangeLabel(pending, locale) : ' '}
          </Text>

          <Button
            mode="contained"
            disabled={!pending}
            onPress={() => {
              if (!pending) {
                return;
              }
              onConfirm({
                ...note,
                start_timestamp: pending.start.getTime(),
                end_timestamp: pending.end.getTime(),
              });
            }}
          >
            Done
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  body: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  month: {
    alignItems: 'center',
  },
  rangeLabel: {
    textAlign: 'center',
  },
});
