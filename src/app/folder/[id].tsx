import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, FAB, Surface } from 'react-native-paper';

import { FolderNoteList } from '@/components/notes/FolderNoteList';
import { FolderNotesEmptyState } from '@/components/notes/FolderNotesEmptyState';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useFolderNotes } from '@/hooks/useFolderNotes';
import { readFolder } from '@/modules/folders';
import type { Folder } from '@/modules/folders';
import type { Note } from '@/modules/notes';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [folder, setFolder] = useState<Folder | null>(null);
  const { notes, isLoading, refresh, createNote, removeNote } =
    useFolderNotes(id);

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

  return (
    <Surface style={styles.screen} elevation={0}>
      <Stack.Screen options={{ title: folder?.name ?? 'Tavola' }} />

      {isLoading ? (
        <Surface style={styles.centered}>
          <ActivityIndicator />
        </Surface>
      ) : (
        <Surface style={styles.body} elevation={0}>
          {notes.length === 0 ? (
            <FolderNotesEmptyState />
          ) : (
            <FolderNoteList
              notes={notes}
              onPress={openNote}
              onEditPress={openNote}
              onDeletePress={note => removeNote(note.id)}
            />
          )}
        </Surface>
      )}

      <FAB icon="pencil" style={styles.fab} onPress={handleCreate} />
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
  body: {
    flex: 1,
    padding: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
