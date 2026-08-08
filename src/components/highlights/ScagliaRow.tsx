import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import type { Tag as TagType } from '@/modules/highlights';
import { TRANSPARENT } from '@/modules/palette';

import { Tag as TagPill } from './Tag';

const ROW_MIN_HEIGHT = 44;

interface ScagliaRowProps {
  text: string;
  tag: TagType | null;
  onPress: () => void;
}

// The same flush row the editor draws, minus the editing: hairline rules
// above and below, collapsed into a single shared line between neighbours,
// so a run of scaglie reads as one stack rather than a column of cards.
export function ScagliaRow({ text, tag, onPress }: ScagliaRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
    >
      <Text variant="bodyMedium" style={styles.text}>
        {text}
      </Text>
      <View style={styles.trailingSlot}>
        {tag ? <TagPill tag={tag} isSmall /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    backgroundColor: TRANSPARENT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: -StyleSheet.hairlineWidth,
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  text: {
    flex: 1,
  },
  trailingSlot: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
});
