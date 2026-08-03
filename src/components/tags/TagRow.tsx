import { Pressable, StyleSheet } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { ColorSwatch } from '@/components/ui';
import type { Tag } from '@/modules/highlights';
import type { StoneId } from '@/modules/types';

import { SPACING } from '@/constants/layout';

interface TagRowProps {
  tag: Tag;
  onPress: (tag: Tag) => void;
  onEditPress: (tag: Tag) => void;
}

const SWATCH_SIZE = 24;

export function TagRow({ tag, onPress, onEditPress }: TagRowProps) {
  const theme = useTheme();
  // Every tag is written with a color from STONE_IDS — see the same cast in
  // FolderCard.
  const stoneId = tag.color as StoneId;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(tag)}
      style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
    >
      <ColorSwatch stoneId={stoneId} size={SWATCH_SIZE} />
      <Text variant="bodyLarge" style={styles.name}>
        {tag.name}
      </Text>
      <IconButton
        icon="pencil"
        accessibilityLabel="Modifica tag"
        onPress={() => onEditPress(tag)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    flex: 1,
  },
});
