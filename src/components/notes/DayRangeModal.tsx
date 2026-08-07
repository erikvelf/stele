import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subYears,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import {
  MonthGrid,
  MonthGridWeekdays,
  MonthPagerHeader,
  MonthPagerList,
  monthGridDays,
  monthGridMetrics,
  monthsBetween,
} from '@/components/shared';
import type { MonthGridCell } from '@/components/shared';
import { RADIUS, SPACING } from '@/constants/layout';
import { useMonthPager } from '@/hooks/useMonthPager';
import {
  indexRangesByDay,
  isRunFree,
  isWithinBounds,
  readNoteCreated,
  toDayBounds,
} from '@/modules/notes';
import type {
  DateDayRange,
  DateDayRanges,
  DayBounds,
  NoteEntry,
} from '@/modules/notes';

type DayState = 'anchor' | 'pending' | 'blocked' | 'future' | 'free';

// The anchor is a filled square of its own that still belongs to the pending
// outline run, so the capsule passes through it unbroken. Free days never
// merge — each has to stay individually tappable and show its own number.
function pickerCells(
  month: Date,
  anchor: Date,
  pending: DayBounds,
  occupied: Map<number, DateDayRange>,
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

    const isAnchor = isSameDay(day, anchor);
    const isPending = isWithinBounds(day, pending);

    return {
      day,
      fill: isAnchor
        ? { color: theme.colors.primary }
        : isPending
          ? undefined
          : { color: theme.colors.surfaceVariant },
      outline: isPending
        ? { color: theme.colors.primary, runKey: 'pending' }
        : undefined,
      data: isAnchor ? 'anchor' : isPending ? 'pending' : 'free',
    };
  });
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

function rangeLabel(bounds: DayBounds): string {
  if (isSameDay(bounds.start, bounds.end)) {
    return format(bounds.start, 'MMM d');
  }
  return `${format(bounds.start, 'MMM d')} – ${format(bounds.end, 'MMM d')}`;
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

export interface DayRangeModalProps {
  entry: NoteEntry | null;
  ranges: DateDayRanges;
  onDismiss: () => void;
  onConfirm: (range: DateDayRange) => void;
}

export function DayRangeModal({
  entry,
  ranges,
  onDismiss,
  onConfirm,
}: DayRangeModalProps) {
  const theme = useTheme();
  const [pending, setPending] = useState<DayBounds | null>(null);
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [width, setWidth] = useState(0);
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (!entry) {
      return;
    }
    let cancelled = false;
    const bounds = toDayBounds(entry.range);
    setPending(bounds);
    // The one day that can never leave the range is the day the note was
    // written for, not whatever the range currently spans — otherwise a
    // saved extension becomes permanent, and there is no way back.
    setAnchor(null);

    void readNoteCreated(entry.note.id).then(result => {
      if (cancelled) {
        return;
      }
      setAnchor(
        result.success && result.data
          ? startOfDay(new Date(result.data.created_at))
          : bounds.start
      );
    });

    return () => {
      cancelled = true;
    };
  }, [entry]);

  const otherRanges = useMemo(
    () => (entry ? ranges.filter(range => range.id !== entry.range.id) : ranges),
    [ranges, entry]
  );
  const occupied = useMemo(() => indexRangesByDay(otherRanges), [otherRanges]);

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

  const handleDayPress = useCallback(
    (day: Date) => {
      if (!anchor || !pending) {
        return;
      }

      if (isWithinBounds(day, pending)) {
        if (day.getTime() < anchor.getTime()) {
          setPending(bounds => (bounds ? { ...bounds, start: anchor } : bounds));
        } else if (day.getTime() > anchor.getTime()) {
          setPending(bounds => (bounds ? { ...bounds, end: anchor } : bounds));
        }
        return;
      }

      if (
        day.getTime() < pending.start.getTime() &&
        isRunFree(day, pending.start, otherRanges)
      ) {
        setPending(bounds => (bounds ? { ...bounds, start: day } : bounds));
        return;
      }

      if (
        day.getTime() > pending.end.getTime() &&
        isRunFree(pending.end, day, otherRanges)
      ) {
        setPending(bounds => (bounds ? { ...bounds, end: day } : bounds));
      }
    },
    [anchor, pending, otherRanges]
  );

  const { cellWidth, cellHeight, height } = monthGridMetrics(width);
  const gridHeight = Math.max(height, 0);

  const renderDay = useCallback(
    (day: Date, state: DayState | undefined) => (
      <Text variant="labelSmall" style={{ color: dayTextColor(state, theme) }}>
        {format(day, 'd')}
      </Text>
    ),
    [theme]
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
            onDayPress={handleDayPress}
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
      handleDayPress,
    ]
  );

  if (!entry) {
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
          <Text variant="titleLarge">Set day range</Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Edit the note of{' '}
            {format(anchor ?? toDayBounds(entry.range).start, 'EEE, MMM d')} by
            tapping the squares.
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
            {pending ? rangeLabel(pending) : ' '}
          </Text>

          <Button
            mode="contained"
            disabled={!pending}
            onPress={() => {
              if (!pending) {
                return;
              }
              onConfirm({
                ...entry.range,
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
