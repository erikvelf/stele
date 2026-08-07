import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  FAB,
  IconButton,
  Searchbar,
  Surface,
  Text,
} from 'react-native-paper';

import { FolderPickerModal } from '@/components/folders';
import { FolderNoteList } from '@/components/notes/FolderNoteList';
import { FolderNotesEmptyState } from '@/components/notes/FolderNotesEmptyState';
import { NoteSortMenu, type NoteSort } from '@/components/notes/NoteSortMenu';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useFolderNotes } from '@/hooks/useFolderNotes';
import { useFolders } from '@/hooks/useFolders';
import { readFolder } from '@/modules/folders';
import type { Folder } from '@/modules/folders';
import type { Note } from '@/modules/notes';

function matchesQuery(note: Note, query: string): boolean {
  return note.text.toLowerCase().includes(query);
}

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [sort, setSort] = useState<NoteSort>('newest');
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [notePendingMove, setNotePendingMove] = useState<Note | null>(null);
  const { notes, isLoading, refresh, createNote, moveNote, removeNote } =
    useFolderNotes(id);
  const { folders } = useFolders();

  const moveTargets = useMemo(
    () => folders.filter(folder => folder.id !== id),
    [folders, id]
  );

  // The query already returns notes newest first, so chronological order is
  // the same list read backwards.
  const visibleNotes = useMemo(() => {
    const ordered = sort === 'newest' ? notes : [...notes].reverse();
    const needle = query.trim().toLowerCase();
    return needle ? ordered.filter(note => matchesQuery(note, needle)) : ordered;
  }, [notes, sort, query]);

  const toggleSearch = () => {
    setIsSearching(previous => !previous);
    setQuery('');
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
      void readFolder(id).then(result => {
        if (result.success) {
          setFolder(result.data);
        }
      });
    }, [id, refresh])
  );

  const openNote = (note: Note) => router.push(`/note/plain/${note.id}`);

  const handleCreate = () => {
    const noteId = createNote();
    router.push(`/note/plain/${noteId}`);
  };

  const renderNotes = () => {
    if (notes.length === 0) {
      return <FolderNotesEmptyState />;
    }

    if (visibleNotes.length === 0) {
      return (
        <Surface elevation={0} style={styles.centered}>
          <Text variant="bodyMedium">Nessuna nota trovata</Text>
        </Surface>
      );
    }

    return (
      <FolderNoteList
        notes={visibleNotes}
        onPress={openNote}
        onEditPress={openNote}
        onMovePress={setNotePendingMove}
        onDeletePress={note => removeNote(note.id)}
      />
    );
  };

  return (
    <Surface elevation={0} style={styles.screen}>
      <Stack.Screen
        options={{
          title: folder?.name ?? 'Tavola',
          headerRight: () =>
            notes.length > 1 ? (
              <Surface elevation={0} style={styles.headerActions}>
                <IconButton
                  icon={isSearching ? 'close' : 'magnify'}
                  accessibilityLabel="Search notes"
                  onPress={toggleSearch}
                />
                <NoteSortMenu sort={sort} onSortChange={setSort} />
              </Surface>
            ) : null,
        }}
      />

      {isSearching ? (
        <Searchbar
          autoFocus
          placeholder="Cerca una nota"
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
      ) : null}

      {isLoading ? (
        <Surface elevation={0} style={styles.centered}>
          <ActivityIndicator />
        </Surface>
      ) : (
        <Surface elevation={0} style={styles.body}>
          {renderNotes()}
        </Surface>
      )}

      <FAB icon="pencil" style={styles.fab} onPress={handleCreate} />

      <FolderPickerModal
        visible={notePendingMove !== null}
        folders={moveTargets}
        title="Sposta in"
        emptyLabel="Nessun'altra tavola"
        onSelect={folder => {
          if (notePendingMove) {
            moveNote(notePendingMove.id, folder.id);
          }
        }}
        onDismiss={() => setNotePendingMove(null)}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  search: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: FAB_CLEARANCE,
  },
});
