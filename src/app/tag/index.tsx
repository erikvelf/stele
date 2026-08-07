import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { FAB, Searchbar, Surface } from 'react-native-paper';

import { EmptyState } from '@/components/shared';
import { TagEditModal, TagRow, TagsEmptyState } from '@/components/tags';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useTags } from '@/hooks/useTags';
import { assignTag } from '@/modules/highlights';
import type { Tag } from '@/modules/highlights';

export default function TagListScreen() {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams<{ highlightId: string }>();
  const { tags } = useTags();
  const [query, setQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const filteredTags = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return tags;
    }
    return tags.filter(tag => tag.name.toLowerCase().includes(needle));
  }, [tags, query]);

  const handleSelect = (tag: Tag) => {
    void assignTag(highlightId, tag.id).then(() => router.back());
  };

  const openNewTag = () => {
    setEditingTagId(null);
    setIsModalVisible(true);
  };

  const openEditTag = (tag: Tag) => {
    setEditingTagId(tag.id);
    setIsModalVisible(true);
  };

  const renderList = () => {
    if (tags.length === 0) {
      return <TagsEmptyState />;
    }
    if (filteredTags.length === 0) {
      return (
        <EmptyState
          emoji="🔍"
          title="Nessun tag trovato"
          subtitle="Prova a cercare qualcos'altro."
        />
      );
    }
    return (
      <FlatList
        data={filteredTags}
        keyExtractor={tag => tag.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TagRow tag={item} onPress={handleSelect} onEditPress={openEditTag} />
        )}
      />
    );
  };

  return (
    <Surface elevation={0} style={styles.screen}>
      <Searchbar
        placeholder="Cerca un tag"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      {renderList()}
      <FAB icon="plus" style={styles.fab} onPress={openNewTag} />
      <TagEditModal
        visible={isModalVisible}
        tagId={editingTagId}
        onDismiss={() => setIsModalVisible(false)}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  search: {
    margin: SPACING.md,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: FAB_CLEARANCE,
  },
});
