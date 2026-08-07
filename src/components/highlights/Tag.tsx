import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import {
  SELECTION_BORDER_COLOR,
  TRANSPARENT,
  buildTheme,
  tonalPairFor,
} from '@/modules/palette';
import type { Tag as TagType } from '@/modules/highlights';
import type { StoneId } from '@/modules/types';

import { SPACING } from '@/constants/layout';

const SELECTED_BORDER_WIDTH = 2;
const PILL_RADIUS = 18;
const PILL_RADIUS_SMALL = 12;

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

  const radius = isSmall ? PILL_RADIUS_SMALL : PILL_RADIUS;
  const paddingStyle = isSmall ? styles.pillSmall : styles.pill;
  const shapeStyle = [
    styles.shape,
    { backgroundColor: container, borderRadius: radius },
    onPress && isSelected ? styles.shapeSelected : styles.shapeUnselected,
  ];
  const label = (
    <Text variant={isSmall ? 'labelSmall' : 'labelLarge'} style={{ color: onContainer }}>
      {tag.name}
    </Text>
  );

  if (!onPress) {
    return <View style={[shapeStyle, paddingStyle]}>{label}</View>;
  }

  return (
    <View style={shapeStyle}>
      <TouchableRipple
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        borderless
        theme={buildTheme(stoneId, true)}
        onPress={onPress}
        style={[paddingStyle, { borderRadius: radius }]}
      >
        {label}
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  shape: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  shapeSelected: {
    borderWidth: SELECTED_BORDER_WIDTH,
    borderColor: SELECTION_BORDER_COLOR,
  },
  shapeUnselected: {
    borderWidth: 0,
    borderColor: TRANSPARENT,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pillSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
  },
});
