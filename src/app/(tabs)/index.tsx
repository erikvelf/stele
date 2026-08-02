import { startOfDay } from 'date-fns';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, FAB, Snackbar, Surface } from 'react-native-paper';
import Animated, {
  FadeOut,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ActivityGrid } from '@/components/notes/ActivityGrid';
import { ActivityList } from '@/components/notes/ActivityList';
import { NotesEmptyState } from '@/components/notes/NotesEmptyState';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useListNotes } from '@/hooks/useListNotes';
import { createId } from '@/lib/id';
import { JOURNAL_FOLDER_ID } from '@/modules/folders';
import {
  dateDayRangesSchema,
  deleteNote,
  writeDateDayRange,
  writeNote,
  writeNoteFolder,
  type NoteEntry,
} from '@/modules/notes';

const EMPTY_STATE_TRANSITION_DURATION = 380;

export default function HomeScreen() {
  const router = useRouter();
  const { entries, refresh, prependEntry, removeEntry } = useListNotes();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingEntryId, setPendingEntryId] = useState<string | undefined>(
    undefined
  );
  const [deleteError, setDeleteError] = useState(false);

  const ranges = useMemo(
    () => dateDayRangesSchema.parse(entries.map(entry => entry.range)),
    [entries]
  );

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const handleCreate = useCallback(() => {
    void impactAsync(ImpactFeedbackStyle.Light);

    const today = startOfDay(new Date());
    const todaysEntry = entries.find(entry => {
      const start = startOfDay(new Date(entry.range.start_timestamp));
      const end = startOfDay(new Date(entry.range.end_timestamp));
      return today >= start && today <= end;
    });

    if (todaysEntry) {
      router.push(`/note/${todaysEntry.note.id}`);
      return;
    }

    setIsCreating(true);
    const noteId = createId();
    const rangeId = createId();
    const newEntry: NoteEntry = {
      note: { id: noteId, text: '' },
      range: {
        id: rangeId,
        note_id: noteId,
        start_timestamp: today.getTime(),
        end_timestamp: today.getTime(),
      },
    };

    setPendingEntryId(rangeId);
    prependEntry(newEntry);

    void Promise.all([
      writeNote(newEntry.note),
      writeDateDayRange(newEntry.range),
      writeNoteFolder({ note_id: noteId, folder_id: JOURNAL_FOLDER_ID }),
    ]);
  }, [entries, router, prependEntry]);

  const handleTopEntrySettled = useCallback(() => {
    if (!pendingEntryId) {
      return;
    }
    const pendingEntry = entries.find(
      entry => entry.range.id === pendingEntryId
    );
    if (pendingEntry) {
      router.push(`/note/${pendingEntry.note.id}`);
    }
    setPendingEntryId(undefined);
  }, [router, pendingEntryId, entries]);

  const handleDeleteEntry = useCallback(
    (entry: NoteEntry) => {
      removeEntry(entry.range.id);
      void deleteNote(entry.note.id).then(result => {
        if (!result.success) {
          setDeleteError(true);
          refresh();
        }
      });
    },
    [removeEntry, refresh]
  );

  useFocusEffect(
    useCallback(() => {
      setIsCreating(false);
      refresh();
    }, [refresh])
  );

  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title="Stele" />
      </Appbar.Header>

      <Animated.ScrollView
        contentContainerStyle={styles.body}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <ActivityGrid
          ranges={ranges}
          scrollY={scrollY}
          onSelectRange={range => router.push(`/note/${range.note_id}`)}
        />

        {entries.length === 0 ? (
          <Animated.View
            exiting={FadeOut.duration(EMPTY_STATE_TRANSITION_DURATION)}
          >
            <NotesEmptyState />
          </Animated.View>
        ) : (
          <ActivityList
            entries={entries}
            pendingEntryId={pendingEntryId}
            onTopEntrySettled={handleTopEntrySettled}
            onOpenEntry={entry => router.push(`/note/${entry.note.id}`)}
            onEditEntry={entry => router.push(`/note/${entry.note.id}`)}
            onDeleteEntry={handleDeleteEntry}
          />
        )}
      </Animated.ScrollView>

      <FAB
        icon="pencil"
        style={styles.fab}
        disabled={isCreating}
        onPress={handleCreate}
      />

      <Snackbar
        visible={deleteError}
        onDismiss={() => setDeleteError(false)}
        duration={4000}
      >
        Couldn&apos;t delete the note. Please try again.
      </Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
