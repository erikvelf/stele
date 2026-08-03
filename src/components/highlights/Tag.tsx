import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { SELECTION_BORDER_COLOR, tonalPairFor } from '@/modules/palette';
import type { Tag as TagType } from '@/modules/highlights';
import type { StoneId } from '@/modules/types';

import { RADIUS, SPACING } from '@/constants/layout';

const SELECTED_BORDER_WIDTH = 2;

interface TagProps {
  tag: TagType;
  isSmall?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

// Renders as a plain pill, or — when onPress is given — as a selectable one
// with a border reserved for the selected state.
export function Tag({ tag, isSmall = false, isSelected = false, onPress }: TagProps) {
  // Every tag is written with a color from STONE_IDS — see the same cast in FolderCard.
  const stoneId = tag.color as StoneId;
  // Always the dark tonal pair — a glowing tint on a dark chip, regardless
  // of the app's own light/dark theme.
  const { container, onContainer } = tonalPairFor(stoneId, true);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      {...(onPress
        ? {
            accessibilityRole: 'button' as const,
            accessibilityState: { selected: isSelected },
            onPress,
          }
        : {})}
      style={[
        isSmall ? styles.pillSmall : styles.pill,
        {
          backgroundColor: container,
          borderWidth: onPress ? SELECTED_BORDER_WIDTH : 0,
          borderColor: onPress && isSelected ? SELECTION_BORDER_COLOR : 'transparent',
        },
      ]}
    >
      <Text variant={isSmall ? 'labelSmall' : 'labelLarge'} style={{ color: onContainer }}>
        {tag.name}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pillSmall: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
  },
});
