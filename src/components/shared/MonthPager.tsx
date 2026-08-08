import { addMonths, format, startOfMonth } from 'date-fns';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { useTranslation } from '@/hooks/useTranslation';
import { haptics } from '@/modules/haptics';

// Every month from `start` to `end` inclusive, normalised to the first of the
// month. An `end` before `start` yields nothing.
export function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const last = startOfMonth(end);
  let cursor = startOfMonth(start);

  while (cursor.getTime() <= last.getTime()) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

export interface MonthPagerHeaderProps {
  month: Date;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

export function MonthPagerHeader({
  month,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: MonthPagerHeaderProps) {
  const { locale } = useTranslation();

  return (
    <View style={styles.header}>
      <IconButton icon="chevron-left" disabled={!canGoBack} onPress={onBack} />
      <Text variant="titleMedium">
        {format(month, 'MMMM yyyy', { locale })}
      </Text>
      <IconButton
        icon="chevron-right"
        disabled={!canGoForward}
        onPress={onForward}
      />
    </View>
  );
}

export interface MonthPagerListProps {
  months: readonly Date[];
  index: number;
  width: number;
  height: number;
  onIndexChange: (index: number) => void;
  renderMonth: (month: Date) => ReactNode;
}

// A swipeable page per month. The visible page is driven from outside, so
// chevrons and swipes stay in step without either fighting the other.
export function MonthPagerList({
  months,
  index,
  width,
  height,
  onIndexChange,
  renderMonth,
}: MonthPagerListProps) {
  const listRef = useRef<FlatList<Date>>(null);
  const settledIndex = useRef(index);

  useEffect(() => {
    if (settledIndex.current === index) {
      return;
    }
    settledIndex.current = index;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [index]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== settledIndex.current) {
        haptics.select();
      }
      settledIndex.current = next;
      onIndexChange(next);
    },
    [width, onIndexChange]
  );

  const keyExtractor = useCallback((month: Date) => month.toISOString(), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Date> | null | undefined, itemIndex: number) => ({
      length: width,
      offset: width * itemIndex,
      index: itemIndex,
    }),
    [width]
  );

  const renderItem = useCallback(
    ({ item }: { item: Date }) => (
      <View style={{ width }}>{renderMonth(item)}</View>
    ),
    [width, renderMonth]
  );

  return (
    <FlatList
      ref={listRef}
      data={months}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={index}
      style={{ height }}
      getItemLayout={getItemLayout}
      onMomentumScrollEnd={onMomentumScrollEnd}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
