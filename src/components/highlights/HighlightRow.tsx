import type { ComponentProps } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { ComposedGesture } from 'react-native-gesture-handler';
import { Icon, TextInput, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { movedOrder, topOfId } from '@/lib/reorder';
import type { Tag } from '@/modules/highlights';
import { TRANSPARENT } from '@/modules/palette';

import { Tag as TagPill } from './Tag';

const HANDLE_ICON_SIZE = 20;
const HANDLE_SIZE = 40;
const ROW_MIN_HEIGHT = 44;
const SHIFT_DURATION_MS = 160;
const DRAG_ELEVATION = 6;
const DRAG_SHADOW_OPACITY = 0.24;

const NO_HELD_ID = '';

export interface ReorderMotion {
  // The slots the rows were rendered into. Never permuted, so a drop moves
  // nothing in the tree and no layout can race the transforms.
  renderIds: SharedValue<string[]>;
  order: SharedValue<string[]>;
  heights: SharedValue<number[]>;
  heldId: SharedValue<string>;
  heldOffset: SharedValue<number>;
  targetIndex: SharedValue<number>;
}

type AnimatedViewProps = ComponentProps<typeof Animated.View>;

interface HighlightRowProps {
  id: string;
  text: string;
  tag: Tag | null;
  isFocused: boolean;
  motion: ReorderMotion;
  dragGesture: ComposedGesture | undefined;
  entering: AnimatedViewProps['entering'];
  exiting: AnimatedViewProps['exiting'];
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

function surfaceColorFor(
  isHeld: boolean,
  isFocused: boolean,
  heldColor: string,
  focusedColor: string
): string {
  'worklet';
  if (isHeld) {
    return heldColor;
  }
  if (isFocused) {
    return focusedColor;
  }
  return TRANSPARENT;
}

export function HighlightRow({
  id,
  text,
  tag,
  isFocused,
  motion,
  dragGesture,
  entering,
  exiting,
  onChangeText,
  onFocus,
  onBlur,
  onLayout,
}: HighlightRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const heldColor = theme.colors.secondaryContainer;
  const focusedColor = theme.colors.surfaceVariant;

  const slotStyle = useAnimatedStyle(() => {
    const slots = motion.renderIds.value;
    const heights = motion.heights.value;
    const renderedTop = topOfId(slots, slots, heights, id);
    const held = motion.heldId.value;

    // Above its neighbours only while carried, so the row it is passing over
    // cannot draw its text through the held row's surface.
    if (held === id) {
      const restingTop = topOfId(motion.order.value, slots, heights, id);
      return {
        zIndex: 1,
        transform: [
          { translateY: restingTop - renderedTop + motion.heldOffset.value },
        ],
      };
    }

    const sequence =
      held === NO_HELD_ID
        ? motion.order.value
        : movedOrder(motion.order.value, held, motion.targetIndex.value);
    const top = topOfId(sequence, slots, heights, id);
    return {
      zIndex: 0,
      transform: [
        {
          translateY: withTiming(top - renderedTop, {
            duration: SHIFT_DURATION_MS,
          }),
        },
      ],
    };
  });

  // The lift snaps on and off with the haptic. Fading it leaves the row
  // carrying a shadow over a background that has already gone, which iOS
  // then draws from the text's alpha instead of the row's.
  const surfaceStyle = useAnimatedStyle(() => {
    const isHeldRow = motion.heldId.value === id;
    return {
      backgroundColor: surfaceColorFor(
        isHeldRow,
        isFocused,
        heldColor,
        focusedColor
      ),
      elevation: isHeldRow ? DRAG_ELEVATION : 0,
      shadowOpacity: isHeldRow ? DRAG_SHADOW_OPACITY : 0,
    };
  });

  const handle = (
    <View
      accessibilityRole="button"
      accessibilityLabel={t('highlights.reorder')}
      style={styles.handle}
    >
      <Icon
        source="menu"
        size={HANDLE_ICON_SIZE}
        color={theme.colors.onSurfaceVariant}
      />
    </View>
  );

  return (
    <Animated.View
      onLayout={onLayout}
      style={slotStyle}
      entering={entering}
      exiting={exiting}
    >
      <Animated.View
        style={[
          styles.row,
          { borderColor: theme.colors.outlineVariant },
          surfaceStyle,
        ]}
      >
        <TextInput
          mode="flat"
          dense
          multiline
          placeholder={t('highlights.placeholder')}
          value={text}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          style={styles.input}
          contentStyle={styles.inputContent}
          underlineStyle={styles.inputUnderline}
        />
        <View style={styles.trailingSlot}>
          {dragGesture ? (
            <GestureDetector gesture={dragGesture}>{handle}</GestureDetector>
          ) : (
            handle
          )}
          {tag ? <TagPill tag={tag} isSmall /> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: -StyleSheet.hairlineWidth,
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  input: {
    backgroundColor: TRANSPARENT,
    flex: 1,
    paddingHorizontal: 0,
  },
  inputContent: {
    paddingVertical: 0,
  },
  inputUnderline: {
    display: 'none',
  },
  // The pill and the handle keep their intrinsic width; the field is the
  // elastic one.
  trailingSlot: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: SPACING.xs,
  },
  handle: {
    alignItems: 'center',
    height: HANDLE_SIZE,
    justifyContent: 'center',
    width: HANDLE_SIZE,
  },
});
