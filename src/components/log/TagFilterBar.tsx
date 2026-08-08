import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { Tag as TagPill } from '@/components/highlights';
import { EdgeScroller } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import type { Tag } from '@/modules/highlights';

interface TagFilterBarProps {
  tags: readonly Tag[];
  selectedIds: readonly string[];
  onToggle: (tagId: string) => void;
  style?: StyleProp<ViewStyle>;
}

// The same bar the note editor picks tags with, reused as a filter — a
// highlight carries at most one tag, so selecting several here widens the
// log rather than narrowing it. The inset lives on the pills rather than the
// bar, so the row scrolls the whole width and the chevrons sit at the edges.
export function TagFilterBar({
  tags,
  selectedIds,
  onToggle,
  style,
}: TagFilterBarProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <Surface style={[styles.bar, style]} elevation={1}>
      <EdgeScroller contentContainerStyle={styles.pills}>
        {tags.map(tag => (
          <TagPill
            key={tag.id}
            tag={tag}
            isSelected={selectedIds.includes(tag.id)}
            onPress={() => onToggle(tag.id)}
          />
        ))}
      </EdgeScroller>
    </Surface>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: SPACING.sm,
  },
  pills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
});
