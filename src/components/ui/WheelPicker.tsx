import { selectionAsync } from 'expo-haptics';
import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const VISIBLE_ITEMS = 3;
const CENTER_INDEX_OFFSET = Math.floor(VISIBLE_ITEMS / 2);
const DEFAULT_ITEM_HEIGHT = 44;

const FADE_DISTANCE_STEPS = [-1, 0, 1];
const EDGE_OPACITY = 0.35;
const EDGE_SCALE = 0.7;
const OPACITY_BY_DISTANCE = [EDGE_OPACITY, 1, EDGE_OPACITY];
const SCALE_BY_DISTANCE = [EDGE_SCALE, 1, EDGE_SCALE];

const DEFAULT_ITEM_WIDTH = 64;

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight?: number;
  itemWidth?: number;
}

// A vertical, snapping "roulette" list — the iOS-style wheel this app has no
// other primitive for. Generic over its item labels so hour and minute
// wheels are two instances of the same component.
export function WheelPicker({
  items,
  selectedIndex,
  onChange,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  itemWidth = DEFAULT_ITEM_WIDTH,
}: WheelPickerProps) {
  const theme = useTheme();
  const listRef = useRef<Animated.FlatList<string>>(null);
  const scrollY = useSharedValue(selectedIndex * itemHeight);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // A haptic tick each time the centered item changes, matching the feel of
  // a native wheel picker as it scrolls, not just on release.
  useAnimatedReaction(
    () => Math.round(scrollY.value / itemHeight),
    (current, previous) => {
      if (previous !== null && current !== previous) {
        runOnJS(selectionAsync)();
      }
    }
  );

  const snapToNearest = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const rawIndex = Math.round(offsetY / itemHeight);
      const index = Math.max(0, Math.min(items.length - 1, rawIndex));
      const targetOffset = index * itemHeight;
      if (Math.abs(offsetY - targetOffset) > 1) {
        listRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
      }
      onChange(index);
    },
    [items.length, itemHeight, onChange]
  );

  return (
    <View
      style={[
        styles.container,
        { height: itemHeight * VISIBLE_ITEMS, width: itemWidth },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.selectionOverlay,
          {
            top: itemHeight * CENTER_INDEX_OFFSET,
            height: itemHeight,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      />
      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        disableIntervalMomentum
        contentOffset={{ x: 0, y: selectedIndex * itemHeight }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={snapToNearest}
        onScrollEndDrag={snapToNearest}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        contentContainerStyle={{
          paddingVertical: itemHeight * CENTER_INDEX_OFFSET,
        }}
        renderItem={({ item, index }) => (
          <WheelPickerItem
            label={item}
            index={index}
            itemHeight={itemHeight}
            itemWidth={itemWidth}
            scrollY={scrollY}
            color={theme.colors.onSurface}
          />
        )}
      />
    </View>
  );
}

interface WheelPickerItemProps {
  label: string;
  index: number;
  itemHeight: number;
  itemWidth: number;
  scrollY: SharedValue<number>;
  color: string;
}

function WheelPickerItem({
  label,
  index,
  itemHeight,
  itemWidth,
  scrollY,
  color,
}: WheelPickerItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = scrollY.value / itemHeight - index;
    return {
      opacity: interpolate(
        distance,
        FADE_DISTANCE_STEPS,
        OPACITY_BY_DISTANCE,
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            distance,
            FADE_DISTANCE_STEPS,
            SCALE_BY_DISTANCE,
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.item, { height: itemHeight, width: itemWidth }, animatedStyle]}
    >
      <Text variant="displayMedium" style={{ color }}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
