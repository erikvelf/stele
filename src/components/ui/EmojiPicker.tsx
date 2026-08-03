import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';

import {
  type EmojiCategory,
  type EmojiEntry,
  getEmojiCategories,
  searchEmojis,
} from '@/lib/emoji';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EMOJI_FONT_SIZE = 28;
const EMOJIS_PER_ROW = 8;
const INITIAL_ROWS_TO_RENDER = 12;

interface EmojiRow {
  key: string;
  title: string | null;
  emojis: EmojiEntry[];
}

// Splits each category's emojis into fixed-width rows, so FlatList
// virtualizes at row granularity instead of mounting a whole category
// (hundreds of cells) as a single unwindowed item.
function chunkIntoRows(
  categorySlug: string,
  title: string | null,
  emojis: EmojiEntry[]
): EmojiRow[] {
  const rows: EmojiRow[] = [];
  for (let index = 0; index < emojis.length; index += EMOJIS_PER_ROW) {
    rows.push({
      key: `${categorySlug}-${index}`,
      title: index === 0 ? title : null,
      emojis: emojis.slice(index, index + EMOJIS_PER_ROW),
    });
  }
  return rows;
}

function buildRows(query: string, categories: EmojiCategory[]): EmojiRow[] {
  if (!query.trim()) {
    return categories.flatMap(category =>
      chunkIntoRows(category.slug, category.name, category.emojis)
    );
  }
  return chunkIntoRows('search-results', null, searchEmojis(query, categories));
}

const EmojiRowItem = memo(function EmojiRowItem({
  row,
  onSelect,
}: {
  row: EmojiRow;
  onSelect: (emoji: string) => void;
}) {
  return (
    <View style={styles.section}>
      {row.title && (
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {row.title}
        </Text>
      )}
      <View style={styles.grid}>
        {row.emojis.map(entry => (
          <Pressable
            key={entry.slug}
            accessibilityRole="button"
            accessibilityLabel={entry.name}
            onPress={() => onSelect(entry.emoji)}
            style={styles.cell}
          >
            <Text style={styles.emoji}>{entry.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const categories = useMemo(() => getEmojiCategories(), []);
  const rows = useMemo(() => buildRows(query, categories), [query, categories]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Cerca"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={rows}
        keyExtractor={row => row.key}
        renderItem={({ item: row }) => (
          <EmojiRowItem row={row} onSelect={onSelect} />
        )}
        initialNumToRender={INITIAL_ROWS_TO_RENDER}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.md,
  },
  searchbar: {
    marginHorizontal: SPACING.md,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    marginLeft: SPACING.xs,
    marginTop: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: EMOJI_FONT_SIZE,
  },
});
