import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';

export const MONTH_GRID_COLUMNS = 7;
export const MONTH_GRID_GAP = 7;
export const MONTH_GRID_WEEK_STARTS_ON = 1;
// A month needs at most this many rows depending on the weekday it starts on.
export const MONTH_GRID_MAX_ROWS = 6;
export const MONTH_GRID_RADIUS_RATIO = 0.32;

const MAX_CELL_HEIGHT = 34;
const DEFAULT_OUTLINE_WIDTH = 2;
const WEEKDAY_INITIAL = 'EEEEE';

// Read from a real week rather than hardcoded, so the initials follow the
// active locale.
function weekdayLabels(locale: DateFnsLocale): string[] {
  const weekStart = startOfWeek(new Date(), {
    weekStartsOn: MONTH_GRID_WEEK_STARTS_ON,
  });
  return Array.from({ length: MONTH_GRID_COLUMNS }, (_unused, index) =>
    format(addDays(weekStart, index), WEEKDAY_INITIAL, { locale })
  );
}
const DAY_LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
};

// Paint for one day. Adjacent days in the same row sharing a runKey are drawn
// as a single rounded shape; a paint without a runKey always stands alone.
export interface MonthGridPaint {
  color: string;
  runKey?: string;
}

export interface MonthGridOutline extends MonthGridPaint {
  width?: number;
}

// Fill and outline run independently, so a day can be a filled square of its
// own while still belonging to an outlined run spanning its neighbours.
export interface MonthGridCell<T = undefined> {
  day: Date;
  // Outside the displayed month: holds the slot, paints nothing, renders
  // nothing, never presses.
  padding?: boolean;
  // Painted, but not pressable.
  disabled?: boolean;
  fill?: MonthGridPaint;
  outline?: MonthGridOutline;
  data?: T;
}

export interface MonthGridProps<T = undefined> {
  // One entry per slot, ordered, length a whole number of weeks.
  cells: readonly MonthGridCell<T>[];
  cellWidth: number;
  cellHeight: number;
  // Corner radius of every run, as a fraction of cellHeight.
  radiusRatio?: number | SharedValue<number>;
  renderDay?: (day: Date, data: T | undefined) => ReactNode;
  onDayPress?: (day: Date, data: T | undefined) => void;
}

export interface MonthGridMetrics {
  cellWidth: number;
  cellHeight: number;
  rowWidth: number;
  height: number;
}

// Every slot the grid shows for `month`, padded to whole weeks.
export function monthGridDays(month: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(month), {
    weekStartsOn: MONTH_GRID_WEEK_STARTS_ON,
  });
  const gridEnd = endOfWeek(endOfMonth(month), {
    weekStartsOn: MONTH_GRID_WEEK_STARTS_ON,
  });
  const total = differenceInCalendarDays(gridEnd, gridStart) + 1;

  return Array.from({ length: total }, (_, index) => addDays(gridStart, index));
}

// Width always fills the container edge to edge — floored so a row of seven
// can never overflow by a fraction of a pixel. Height is capped separately so
// wide screens produce flat bricks instead of ever-larger squares.
export function monthGridMetrics(
  width: number,
  rows: number = MONTH_GRID_MAX_ROWS
): MonthGridMetrics {
  const cellWidth = Math.floor(
    (width - MONTH_GRID_GAP * (MONTH_GRID_COLUMNS - 1)) / MONTH_GRID_COLUMNS
  );
  const cellHeight = Math.min(cellWidth, MAX_CELL_HEIGHT);

  return {
    cellWidth,
    cellHeight,
    rowWidth:
      cellWidth * MONTH_GRID_COLUMNS +
      MONTH_GRID_GAP * (MONTH_GRID_COLUMNS - 1),
    height: rows * cellHeight + MONTH_GRID_GAP * (rows - 1),
  };
}

interface PaintRun<P extends MonthGridPaint> {
  key: string;
  row: number;
  column: number;
  span: number;
  paint: P;
}

// Walks the slots left to right, merging neighbours that share a runKey. A run
// never crosses a row boundary, so a range spanning a week edge draws as one
// brick per row.
function buildRuns<T, P extends MonthGridPaint>(
  cells: readonly MonthGridCell<T>[],
  paintOf: (cell: MonthGridCell<T>) => P | undefined
): PaintRun<P>[] {
  const paints = cells.map(paintOf);
  const runs: PaintRun<P>[] = [];
  let index = 0;

  while (index < paints.length) {
    const paint = paints.at(index);
    if (!paint) {
      index += 1;
      continue;
    }

    const column = index % MONTH_GRID_COLUMNS;
    let span = 1;
    if (paint.runKey !== undefined) {
      while (
        span < MONTH_GRID_COLUMNS - column &&
        paints.at(index + span)?.runKey === paint.runKey
      ) {
        span += 1;
      }
    }

    runs.push({
      key: `${paint.runKey ?? 'solo'}-${index}`,
      row: Math.floor(index / MONTH_GRID_COLUMNS),
      column,
      span,
      paint,
    });
    index += span;
  }

  return runs;
}

function slotRect(
  row: number,
  column: number,
  span: number,
  cellWidth: number,
  cellHeight: number
) {
  return {
    left: column * (cellWidth + MONTH_GRID_GAP),
    top: row * (cellHeight + MONTH_GRID_GAP),
    width: span * cellWidth + (span - 1) * MONTH_GRID_GAP,
    height: cellHeight,
  };
}

interface DaySlotProps<T> {
  cell: MonthGridCell<T>;
  index: number;
  cellWidth: number;
  cellHeight: number;
  renderDay?: (day: Date, data: T | undefined) => ReactNode;
  onDayPress?: (day: Date, data: T | undefined) => void;
}

function DaySlot<T>({
  cell,
  index,
  cellWidth,
  cellHeight,
  renderDay,
  onDayPress,
}: DaySlotProps<T>) {
  const isPressable =
    !cell.padding && !cell.disabled && onDayPress !== undefined;
  const rect = slotRect(
    Math.floor(index / MONTH_GRID_COLUMNS),
    index % MONTH_GRID_COLUMNS,
    1,
    cellWidth,
    cellHeight
  );

  return (
    <Pressable
      disabled={!isPressable}
      onPress={() => onDayPress?.(cell.day, cell.data)}
      accessibilityRole={isPressable ? 'button' : 'none'}
      accessibilityLabel={
        cell.padding
          ? undefined
          : cell.day.toLocaleDateString(undefined, DAY_LABEL_FORMAT)
      }
      style={[styles.slot, rect]}
    >
      {cell.padding ? null : renderDay?.(cell.day, cell.data)}
    </Pressable>
  );
}

// Lays a month out in two layers: merged runs painted underneath, one
// transparent tap target per day on top. Merging and hit-testing stay
// independent, so a run of days can read as a single brick while every tap
// still resolves to the exact day it landed on.
export function MonthGrid<T = undefined>({
  cells,
  cellWidth,
  cellHeight,
  radiusRatio = MONTH_GRID_RADIUS_RATIO,
  renderDay,
  onDayPress,
}: MonthGridProps<T>) {
  // Every run is one cell tall, so the radius is the same for all of them.
  const radiusStyle = useAnimatedStyle(() => ({
    borderRadius:
      cellHeight *
      (typeof radiusRatio === 'number' ? radiusRatio : radiusRatio.value),
  }));

  if (cells.length % MONTH_GRID_COLUMNS !== 0) {
    throw new Error(
      `MonthGrid needs whole weeks, received ${cells.length} cells`
    );
  }

  const rows = cells.length / MONTH_GRID_COLUMNS;
  const fills = buildRuns(cells, cell => cell.fill);
  const outlines = buildRuns(cells, cell => cell.outline);

  return (
    <View
      style={{
        width:
          cellWidth * MONTH_GRID_COLUMNS +
          MONTH_GRID_GAP * (MONTH_GRID_COLUMNS - 1),
        height: rows * cellHeight + MONTH_GRID_GAP * (rows - 1),
      }}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {fills.map(run => (
          <Animated.View
            key={run.key}
            style={[
              styles.run,
              slotRect(run.row, run.column, run.span, cellWidth, cellHeight),
              { backgroundColor: run.paint.color },
              radiusStyle,
            ]}
          />
        ))}
        {outlines.map(run => (
          <Animated.View
            key={run.key}
            style={[
              styles.run,
              slotRect(run.row, run.column, run.span, cellWidth, cellHeight),
              {
                borderColor: run.paint.color,
                borderWidth: run.paint.width ?? DEFAULT_OUTLINE_WIDTH,
              },
              radiusStyle,
            ]}
          />
        ))}
      </View>

      {cells.map((cell, index) => (
        <DaySlot
          key={cell.day.getTime()}
          cell={cell}
          index={index}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          renderDay={renderDay}
          onDayPress={onDayPress}
        />
      ))}
    </View>
  );
}

export interface MonthGridWeekdaysProps {
  cellWidth: number;
}

export function MonthGridWeekdays({ cellWidth }: MonthGridWeekdaysProps) {
  const { locale } = useTranslation();

  return (
    <View style={styles.weekdays}>
      {weekdayLabels(locale).map((label, index) => (
        <Text
          key={index}
          variant="labelSmall"
          style={[styles.weekday, { width: cellWidth }]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  run: {
    position: 'absolute',
  },
  slot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdays: {
    flexDirection: 'row',
    gap: MONTH_GRID_GAP,
    marginBottom: SPACING.sm,
    alignSelf: 'center',
  },
  weekday: {
    textAlign: 'center',
    opacity: 0.5,
  },
});
