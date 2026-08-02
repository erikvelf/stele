import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInRight,
  runOnJS,
} from 'react-native-reanimated';

import { SPACING } from '@/constants/layout';

const TRANSITION_DURATION = 380;
const transitionEasing = Easing.out(Easing.cubic);

export interface FadingListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  pendingId?: string;
  onTopItemSettled?: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

// A vertical list whose rows animate in/out/reorder, and which itself fades
// in as a whole — used where a list can appear from an empty state (the
// empty view's exit and this list's entrance share TRANSITION_DURATION so
// the two read as one motion, then the other).
export function FadingList<T>({
  items,
  keyExtractor,
  pendingId,
  onTopItemSettled,
  renderItem,
  style,
}: FadingListProps<T>) {
  return (
    <Animated.View
      style={[styles.list, style]}
      entering={FadeIn.duration(TRANSITION_DURATION)}
    >
      {items.map((item, index) => {
        const id = keyExtractor(item);
        return (
          <Animated.View
            key={id}
            layout={LinearTransition.duration(TRANSITION_DURATION).easing(
              transitionEasing
            )}
            exiting={FadeOut.duration(TRANSITION_DURATION)}
            entering={
              id === pendingId
                ? SlideInRight.duration(TRANSITION_DURATION)
                    .easing(transitionEasing)
                    // Waits out the push-down of the rest of the list (or the
                    // empty state's fade-out) before sliding in, so the
                    // motions read as one then the other, not at once.
                    .delay(TRANSITION_DURATION)
                    .withCallback(finished => {
                      'worklet';
                      if (finished && onTopItemSettled) {
                        runOnJS(onTopItemSettled)();
                      }
                    })
                : undefined
            }
          >
            {renderItem(item, index)}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.sm,
  },
});
