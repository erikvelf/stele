import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import type { DateDayRange, DateDayRanges } from '@/modules/notes';

const COLUMNS = 7;
const GAP = 4;
const WEEK_STARTS_ON = 1;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MAX_CELL_SIZE = 34;
const RADIUS_RATIO = 0.32;
// Squished bricks read flush rather than pill-shaped when barely rounded.
const SQUISHED_RADIUS_RATIO = 0.08;
const TODAY_DOT_RATIO = 0.22;

// A month's grid can need this many rows depending on where it starts, so the
// squished container reserves height for the tallest case regardless of month.
const MAX_ROWS = 6;
// How flat the grid gets when squished, as a fraction of its full height.
const SQUISH_RATIO = 0.45;
const EXPAND_DURATION = 120;
const COLLAPSE_DURATION = 220;
// Scrolled pixels past which an expanded grid collapses back down.
const COLLAPSE_SCROLL_THRESHOLD = 32;

// One flexbox child. A range that covers several days is a single wide cell; a
// range crossing a Sunday is split so that every row still sums to exactly
// seven columns, which is what makes the wrap land on the week boundary.
interface Cell {
  key: string;
  span: number;
  range?: DateDayRange;
  isToday: boolean;
  inMonth: boolean;
}

function buildCells(ranges: DateDayRanges, month: Date): Cell[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
  const totalDays = differenceInCalendarDays(gridEnd, gridStart) + 1;
  const today = startOfDay(new Date());
  const isCurrentMonth = today >= monthStart && today <= monthEnd;
  const todayOffset = differenceInCalendarDays(today, gridStart);
  const monthStartOffset = differenceInCalendarDays(monthStart, gridStart);
  const monthEndOffset = differenceInCalendarDays(monthEnd, gridStart);

  // Day offset within the grid to the range covering it, clipped to the month
  // so a run continuing into the next month does not bleed into the padding.
  const covering = new Map<number, DateDayRange>();
  for (const range of ranges) {
    const from = Math.max(
      differenceInCalendarDays(new Date(range.start_timestamp), gridStart),
      monthStartOffset
    );
    const to = Math.min(
      differenceInCalendarDays(new Date(range.end_timestamp), gridStart),
      monthEndOffset
    );
    for (let offset = from; offset <= to; offset++) {
      covering.set(offset, range);
    }
  }

  const cells: Cell[] = [];
  let offset = 0;

  while (offset < totalDays) {
    const range = covering.get(offset);
    const inMonth = offset >= monthStartOffset && offset <= monthEndOffset;
    const column = offset % COLUMNS;

    let span = 1;
    if (range) {
      while (span < COLUMNS - column && covering.get(offset + span) === range) {
        span += 1;
      }
    }

    cells.push({
      key: range ? `${range.id}-${offset}` : `empty-${offset}`,
      span,
      range,
      isToday:
        isCurrentMonth && todayOffset >= offset && todayOffset < offset + span,
      inMonth,
    });
    offset += span;
  }

  return cells;
}

function monthsSpanned(ranges: DateDayRanges): Date[] {
  const now = new Date();
  const earliest = ranges.reduce(
    (found, range) => Math.min(found, range.start_timestamp),
    now.getTime()
  );

  const months: Date[] = [];
  let cursor = startOfMonth(new Date(earliest));
  const last = startOfMonth(now);
  while (cursor <= last) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

interface MonthPageProps {
  month: Date;
  pageWidth: number;
  cellWidth: number;
  cellHeight: number;
  ranges: DateDayRanges;
  progress: SharedValue<number>;
  isExpanded: boolean;
  onRequestExpand: () => void;
  onSelectRange?: (range: DateDayRange) => void;
}

function cellColor(cell: Cell, theme: MD3Theme): string {
  if (!cell.inMonth) {
    return 'transparent';
  }
  if (cell.range) {
    return theme.colors.primary;
  }
  return theme.colors.surfaceVariant;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DayCellProps {
  cell: Cell;
  cellWidth: number;
  cellHeight: number;
  progress: SharedValue<number>;
  isExpanded: boolean;
  onRequestExpand: () => void;
  onSelectRange?: (range: DateDayRange) => void;
}

function DayCellComponent({
  cell,
  cellWidth,
  cellHeight,
  progress,
  isExpanded,
  onRequestExpand,
  onSelectRange,
}: DayCellProps) {
  const theme = useTheme();
  const dotSize = cellHeight * TODAY_DOT_RATIO;

  const radiusStyle = useAnimatedStyle(() => ({
    borderRadius:
      cellHeight *
      interpolate(
        progress.value,
        [0, 1],
        [SQUISHED_RADIUS_RATIO, RADIUS_RATIO],
        Extrapolation.CLAMP
      ),
  }));

  return (
    <AnimatedPressable
      disabled={isExpanded && !cell.range}
      onPress={() => {
        if (!isExpanded) {
          onRequestExpand();
          return;
        }
        if (cell.range) {
          onSelectRange?.(cell.range);
        }
      }}
      accessibilityRole={!isExpanded || cell.range ? 'button' : 'none'}
      style={[
        styles.cell,
        {
          width: cell.span * cellWidth + (cell.span - 1) * GAP,
          height: cellHeight,
          backgroundColor: cellColor(cell, theme),
        },
        radiusStyle,
      ]}
    >
      {cell.isToday && (
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: cell.range
              ? theme.colors.onPrimary
              : theme.colors.onSurface,
          }}
        />
      )}
    </AnimatedPressable>
  );
}

const DayCell = memo(DayCellComponent);

function MonthPageComponent({
  month,
  pageWidth,
  cellWidth,
  cellHeight,
  ranges,
  progress,
  isExpanded,
  onRequestExpand,
  onSelectRange,
}: MonthPageProps) {
  const cells = useMemo(() => buildCells(ranges, month), [ranges, month]);

  return (
    <View style={[styles.page, { width: pageWidth }]}>
      <View
        style={[
          styles.grid,
          { width: cellWidth * COLUMNS + GAP * (COLUMNS - 1) },
        ]}
      >
        {cells.map(cell => (
          <DayCell
            key={cell.key}
            cell={cell}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
            progress={progress}
            isExpanded={isExpanded}
            onRequestExpand={onRequestExpand}
            onSelectRange={onSelectRange}
          />
        ))}
      </View>
    </View>
  );
}

const MonthPage = memo(MonthPageComponent);

interface SquishAnimation {
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  progress: SharedValue<number>;
  clipStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  scaleStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
}

// Collapses the grid to a flattened strip while the home screen scrolls down,
// and expands it back on tap. Isolated here so ActivityGrid stays focused on
// the month FlatList itself.
function useSquishAnimation(
  scrollY: SharedValue<number> | undefined,
  naturalHeight: number
): SquishAnimation {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? EXPAND_DURATION : COLLAPSE_DURATION,
    });
  }, [isExpanded, progress]);

  useAnimatedReaction(
    () => scrollY?.value ?? 0,
    (offset, previousOffset) => {
      if (previousOffset === null) {
        return;
      }
      if (offset > COLLAPSE_SCROLL_THRESHOLD && offset > previousOffset) {
        runOnJS(setIsExpanded)(false);
      }
    }
  );

  // The clip window animates height so the collapsed grid takes up less
  // vertical space; the scaled content inside always lays out at full height
  // so no row is ever dropped, only visually flattened.
  const clipStyle = useAnimatedStyle<ViewStyle>(() => {
    const scaleY = interpolate(
      progress.value,
      [0, 1],
      [SQUISH_RATIO, 1],
      Extrapolation.CLAMP
    );
    return { height: naturalHeight * scaleY };
  });

  const scaleStyle = useAnimatedStyle<ViewStyle>(() => {
    const scaleY = interpolate(
      progress.value,
      [0, 1],
      [SQUISH_RATIO, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scaleY }] };
  });

  return { isExpanded, setIsExpanded, progress, clipStyle, scaleStyle };
}

export interface ActivityGridProps {
  ranges: DateDayRanges;
  scrollY?: SharedValue<number>;
  onSelectRange?: (range: DateDayRange) => void;
}

export function ActivityGrid({
  ranges,
  scrollY,
  onSelectRange,
}: ActivityGridProps) {
  const listRef = useRef<FlatList<Date>>(null);
  const [width, setWidth] = useState(0);

  const months = useMemo(() => monthsSpanned(ranges), [ranges]);
  const lastIndex = months.length - 1;
  const [page, setPage] = useState(lastIndex);
  const current = months.at(Math.min(page, lastIndex)) ?? new Date();

  // Width always fills the container edge to edge — floored so a row of seven
  // can never overflow by a fraction of a pixel and wrap a column early.
  // Height is capped separately so wide screens produce flat brick-like
  // cells instead of ever-larger squares.
  const cellWidth = Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS);
  const cellHeight = Math.min(cellWidth, MAX_CELL_SIZE);
  const naturalHeight = MAX_ROWS * cellHeight + GAP * (MAX_ROWS - 1);

  const { isExpanded, setIsExpanded, progress, clipStyle, scaleStyle } =
    useSquishAnimation(scrollY, naturalHeight);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPage(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width]
  );

  const goTo = useCallback((index: number) => {
    setPage(index);
    listRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const onRequestExpand = useCallback(
    () => setIsExpanded(true),
    [setIsExpanded]
  );

  const keyExtractor = useCallback((month: Date) => month.toISOString(), []);

  const renderItem = useCallback(
    ({ item }: { item: Date }) => (
      <MonthPage
        month={item}
        pageWidth={width}
        cellWidth={cellWidth}
        cellHeight={cellHeight}
        ranges={ranges}
        progress={progress}
        isExpanded={isExpanded}
        onRequestExpand={onRequestExpand}
        onSelectRange={onSelectRange}
      />
    ),
    [width, cellWidth, cellHeight, ranges, progress, isExpanded, onRequestExpand, onSelectRange]
  );

  return (
    <View onLayout={onLayout}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          disabled={page <= 0}
          onPress={() => goTo(page - 1)}
        />
        <Text variant="titleMedium">{format(current, 'MMMM yyyy')}</Text>
        <IconButton
          icon="chevron-right"
          disabled={page >= lastIndex}
          onPress={() => goTo(page + 1)}
        />
      </View>

      {cellWidth > 0 && (
        <>
          <View
            style={[
              styles.weekdays,
              { width: cellWidth * COLUMNS + GAP * (COLUMNS - 1) },
            ]}
          >
            {WEEKDAYS.map((day, index) => (
              <Text
                key={index}
                variant="labelSmall"
                style={[styles.weekday, { width: cellWidth }]}
              >
                {day}
              </Text>
            ))}
          </View>

          <Animated.View style={[styles.squish, clipStyle]}>
            <Animated.View
              style={[styles.scaleFromTop, { height: naturalHeight }, scaleStyle]}
            >
              <FlatList
                ref={listRef}
                data={months}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={lastIndex}
                style={{ height: naturalHeight }}
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                onMomentumScrollEnd={onMomentumEnd}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={3}
              />
            </Animated.View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  squish: {
    overflow: 'hidden',
  },
  scaleFromTop: {
    transformOrigin: 'top',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekdays: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
    alignSelf: 'center',
  },
  weekday: {
    textAlign: 'center',
    opacity: 0.5,
  },
  page: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
