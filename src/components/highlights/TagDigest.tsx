import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { Tag as TagType } from '@/modules/highlights';

import { SPACING } from '@/constants/layout';

import { Tag as TagPill } from './Tag';

export interface TagDigestEntry {
  tag: TagType | null;
  count: number;
}

const UNTAGGED_LABEL = 'senza tag';

interface TagDigestProps {
  entries: readonly TagDigestEntry[];
}

// What a period amounted to, by subject: each tag on the left, how often it
// came up on the right. Untagged highlights are reported rather than hidden,
// so the counts add up to the period.
export function TagDigest({ entries }: TagDigestProps) {
  const theme = useTheme();

  return (
    <View style={styles.list}>
      {entries.map(entry => (
        <View key={entry.tag?.id ?? UNTAGGED_LABEL} style={styles.row}>
          {entry.tag ? (
            <TagPill tag={entry.tag} isSmall />
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {UNTAGGED_LABEL}
            </Text>
          )}
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {entry.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
