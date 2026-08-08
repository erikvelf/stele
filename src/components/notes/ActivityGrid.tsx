import { isSameDay, isSameMonth, startOfDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import {
  MONTH_GRID_RADIUS_RATIO,
  MonthGrid,
  monthGridDays,
  monthGridMetrics,
  MonthGridWeekdays,
  MonthPagerHeader,
  MonthPagerList,
  monthsBetween,
} from '@/components/shared';
import type { MonthGridCell } from '@/components/shared';
import { useMonthPager } from '@/hooks/useMonthPager';
import { indexRangesByDay } from '@/modules/journal';
import type { DayRange, DayRanges } from '@/modules/journal';

const TODAY_DOT_RATIO = 0.22;
const DAY_NUMBER_SIZE_RATIO = 0.42;
// How flat the grid gets when squished, as a fraction of its full height.
const SQUISH_RATIO = 0.45;
// Squished bricks read flush rather than pill-shaped when barely rounded.
const SQUISHED_RADIUS_RATIO = 0.08;
const EXPAND_DURATION = 120;
const COLLAPSE_DURATION = 220;
// Scrolled pixels past which an expanded grid collapses back down.
const COLLAPSE_SCROLL_THRESHOLD = 32;

interface ActivityDay {
  range: DayRange | undefined;
  isToday: boolean;
}

// Only a day another note already owns merges into a brick — every other day
// stays its own square, so an unjournaled stretch reads as a row of empties
// rather than one long bar.
function activityCells(
  month: Date,
  rangesByDay: Map<number, DayRange>,
  today: Date,
  theme: MD3Theme
): MonthGridCell<ActivityDay>[] {
  return monthGridDays(month).map(day => {
    if (!isSameMonth(day, month)) {
      return { day, padding: true };
    }

    const range = rangesByDay.get(day.getTime());
    return {
      day,
      fill: range
        ? { color: theme.colors.primary, runKey: range.id }
        : { color: theme.colors.surfaceVariant },
      data: { range, isToday: isSameDay(day, today) },
    };
  });
}

function journalMonths(ranges: DayRanges, today: Date): Date[] {
  const earliest = ranges.reduce(
    (found, range) => Math.min(found, range.start_timestamp),
    today.getTime()
  );
  return monthsBetween(new Date(earliest), today);
}

interface SquishAnimation {
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  progress: SharedValue<number>;
  clipStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
  scaleStyle: ReturnType<typeof useAnimatedStyle<ViewStyle>>;
}

// Collapses the grid to a flattened strip while the home screen scrolls down,
// and expands it back on tap. Isolated here so ActivityGrid stays focused on
// the month pager itself.
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
    const scaleY = progress.value * (1 - SQUISH_RATIO) + SQUISH_RATIO;
    return { height: naturalHeight * scaleY };
  });

  const scaleStyle = useAnimatedStyle<ViewStyle>(() => {
    const scaleY = progress.value * (1 - SQUISH_RATIO) + SQUISH_RATIO;
    return { transform: [{ scaleY }] };
  });

  return { isExpanded, setIsExpanded, progress, clipStyle, scaleStyle };
}

interface DayNumberProps {
  day: Date;
  size: number;
  color: string;
  progress: SharedValue<number>;
}

// Fades in with the expansion so the squished, vertically distorted frames of
// the number never show.
function DayNumber({ day, size, color, progress }: DayNumberProps) {
  const style = useAnimatedStyle<ViewStyle>(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: size, lineHeight: size, color }}>
        {day.getDate()}
      </Text>
    </Animated.View>
  );
}

export interface ActivityGridProps {
  ranges: DayRanges;
  scrollY?: SharedValue<number>;
  onSelectRange?: (range: DayRange) => void;
}

export function ActivityGrid({
  ranges,
  scrollY,
  onSelectRange,
}: ActivityGridProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const today = useMemo(() => startOfDay(new Date()), []);

  const months = useMemo(() => journalMonths(ranges, today), [ranges, today]);
  const rangesByDay = useMemo(() => indexRangesByDay(ranges), [ranges]);
  const pager = useMonthPager(months, months.length - 1);

  const { cellWidth, cellHeight, height } = monthGridMetrics(width);
  const naturalHeight = Math.max(height, 0);

  const { isExpanded, setIsExpanded, progress, clipStyle, scaleStyle } =
    useSquishAnimation(scrollY, naturalHeight);

  // The squish flattens the bricks, so their corners round off with it.
  const radiusRatio = useDerivedValue(() =>
    interpolate(
      progress.value,
      [0, 1],
      [SQUISHED_RADIUS_RATIO, MONTH_GRID_RADIUS_RATIO],
      Extrapolation.CLAMP
    )
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const handleDayPress = useCallback(
    (_day: Date, data: ActivityDay | undefined) => {
      if (data?.range) {
        onSelectRange?.(data.range);
      }
    },
    [onSelectRange]
  );

  const renderDay = useCallback(
    (day: Date, data: ActivityDay | undefined) => {
      if (data?.isToday) {
        const size = cellHeight * TODAY_DOT_RATIO;
        return (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: data.range
                ? theme.colors.onPrimary
                : theme.colors.onSurface,
            }}
          />
        );
      }

      return (
        <DayNumber
          day={day}
          size={cellHeight * DAY_NUMBER_SIZE_RATIO}
          color={
            data?.range ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
          }
          progress={progress}
        />
      );
    },
    [cellHeight, theme, progress]
  );

  const renderMonth = useCallback(
    (month: Date) => (
      <View style={styles.month}>
        <MonthGrid
          cells={activityCells(month, rangesByDay, today, theme)}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          radiusRatio={radiusRatio}
          renderDay={renderDay}
          onDayPress={isExpanded ? handleDayPress : undefined}
        />
      </View>
    ),
    [
      rangesByDay,
      today,
      theme,
      cellWidth,
      cellHeight,
      radiusRatio,
      renderDay,
      isExpanded,
      handleDayPress,
    ]
  );

  return (
    <View onLayout={onLayout}>
      {pager.month && (
        <MonthPagerHeader
          month={pager.month}
          canGoBack={pager.canGoBack}
          canGoForward={pager.canGoForward}
          onBack={pager.goBack}
          onForward={pager.goForward}
        />
      )}

      {cellWidth > 0 && (
        <>
          <MonthGridWeekdays cellWidth={cellWidth} />

          {/* Collapsed, the day cells are inert, so the first tap anywhere on
              the strip expands it rather than selecting a note. */}
          <Pressable disabled={isExpanded} onPress={() => setIsExpanded(true)}>
            <Animated.View style={[styles.squish, clipStyle]}>
              <Animated.View
                style={[
                  styles.scaleFromTop,
                  { height: naturalHeight },
                  scaleStyle,
                ]}
              >
                <MonthPagerList
                  months={months}
                  index={pager.index}
                  width={width}
                  height={naturalHeight}
                  onIndexChange={pager.setIndex}
                  renderMonth={renderMonth}
                />
              </Animated.View>
            </Animated.View>
          </Pressable>
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
  month: {
    alignItems: 'center',
  },
});
