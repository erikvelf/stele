import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { IconButton, Surface, Text } from 'react-native-paper';

import type { Tag } from '@/modules/highlights';

import { SPACING } from '@/constants/layout';

import { Tag as TagPill } from './Tag';

interface TagPickerSheetProps {
  isOpen: boolean;
  tags: Tag[];
  selectedTagId: string | null;
  onSelectTag: (tagId: string | null) => void;
  onManageTagsPress: () => void;
}

// Stays mounted at all times and only toggles visibility — a fresh mount
// timed to the same focus event that opens the keyboard can race the
// keyboard-controller's animation and land in a stale position.
export function TagPickerSheet({
  isOpen,
  tags,
  selectedTagId,
  onSelectTag,
  onManageTagsPress,
}: TagPickerSheetProps) {
  return (
    <KeyboardStickyView
      enabled={isOpen}
      style={[styles.sticky, !isOpen && styles.hidden]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <Surface style={styles.bar} elevation={2}>
        <Text variant="labelSmall" style={styles.label}>
          Tags
        </Text>
        <View style={styles.row}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.pills}
          >
            {tags.map(tag => (
              <TagPill
                key={tag.id}
                tag={tag}
                isSelected={tag.id === selectedTagId}
                onPress={() =>
                  onSelectTag(tag.id === selectedTagId ? null : tag.id)
                }
              />
            ))}
          </ScrollView>
          <IconButton
            icon="plus"
            accessibilityLabel="Gestisci tag"
            onPress={onManageTagsPress}
          />
        </View>
      </Surface>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
  bar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
});
