import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';

// Fractional pixel widths mean the scroll offset rarely lands exactly on the
// content edge, so an edge counts as reached within a pixel of it.
const EDGE_EPSILON = 1;
const SCROLL_EVENT_THROTTLE_MS = 16;
// A tap moves just under a full screen of content, leaving a sliver of what
// was already read as an anchor.
const PAGE_FRACTION = 0.8;
const CHEVRON_SIZE = 20;

interface ScrollMetrics {
  offset: number;
  viewport: number;
  content: number;
}

const INITIAL_METRICS: ScrollMetrics = { offset: 0, viewport: 0, content: 0 };

type Direction = 'left' | 'right';

interface EdgeChevronProps {
  direction: Direction;
  isVisible: boolean;
  color: string;
  onPress: () => void;
}

// Keeps its slot in the row even when hidden, so reaching an edge does not
// resize the scroller and shift the content under the finger.
function EdgeChevron({
  direction,
  isVisible,
  color,
  onPress,
}: EdgeChevronProps) {
  const { t } = useTranslation();
  const isLeft = direction === 'left';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(isLeft ? 'scroller.left' : 'scroller.right')}
      accessibilityElementsHidden={!isVisible}
      disabled={!isVisible}
      onPress={onPress}
      style={
        isVisible ? styles.chevron : [styles.chevron, styles.chevronHidden]
      }
    >
      <Icon
        source={isLeft ? 'chevron-left' : 'chevron-right'}
        size={CHEVRON_SIZE}
        color={color}
      />
    </Pressable>
  );
}

export interface EdgeScrollerProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keepKeyboardOnTap?: boolean;
}

// A horizontal scroller that says which way it continues: a chevron appears
// at either end once the content overflows, and scrolls a page towards it.
// Neither appears when everything already fits.
export function EdgeScroller({
  children,
  contentContainerStyle,
  style,
  keepKeyboardOnTap = false,
}: EdgeScrollerProps) {
  const theme = useTheme();
  const scroller = useRef<ScrollView>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>(INITIAL_METRICS);

  // onScroll never fires before the first touch, so the initial overflow is
  // read from the layout and content widths instead.
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const viewport = event.nativeEvent.layout.width;
    setMetrics(current => ({ ...current, viewport }));
  }, []);

  const handleContentSizeChange = useCallback((content: number) => {
    setMetrics(current => ({ ...current, content }));
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      setMetrics({
        offset: contentOffset.x,
        viewport: layoutMeasurement.width,
        content: contentSize.width,
      });
    },
    []
  );

  const scrollByPage = useCallback(
    (towards: Direction) => {
      const step = metrics.viewport * PAGE_FRACTION;
      const target =
        towards === 'left' ? metrics.offset - step : metrics.offset + step;
      scroller.current?.scrollTo({ x: Math.max(target, 0), animated: true });
    },
    [metrics]
  );

  const scrollLeft = useCallback(() => scrollByPage('left'), [scrollByPage]);
  const scrollRight = useCallback(() => scrollByPage('right'), [scrollByPage]);

  const canScroll = metrics.content - metrics.viewport > EDGE_EPSILON;
  const atStart = metrics.offset <= EDGE_EPSILON;
  const atEnd =
    metrics.offset + metrics.viewport >= metrics.content - EDGE_EPSILON;

  return (
    <View style={[styles.row, style]}>
      {canScroll ? (
        <EdgeChevron
          direction="left"
          isVisible={!atStart}
          color={theme.colors.onSurfaceVariant}
          onPress={scrollLeft}
        />
      ) : null}

      <ScrollView
        ref={scroller}
        style={styles.scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps={keepKeyboardOnTap ? 'always' : undefined}
        contentContainerStyle={contentContainerStyle}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
      >
        {children}
      </ScrollView>

      {canScroll ? (
        <EdgeChevron
          direction="right"
          isVisible={!atEnd}
          color={theme.colors.onSurfaceVariant}
          onPress={scrollRight}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scroller: {
    flex: 1,
  },
  chevron: {
    paddingHorizontal: SPACING.xs,
  },
  chevronHidden: {
    opacity: 0,
  },
});
