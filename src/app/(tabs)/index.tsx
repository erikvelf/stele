import { startOfYear } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, FAB, Snackbar, Surface } from 'react-native-paper';
import Animated, {
  FadeOut,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { FoldersCarousel, FoldersCarouselEmptyState } from '@/components/folders';
import { ActivityGrid } from '@/components/notes/ActivityGrid';
import { ActivityList } from '@/components/notes/ActivityList';
import { NotesEmptyState } from '@/components/notes/NotesEmptyState';
import { ConfirmDeleteModal } from '@/components/shared';
import type { CreationStatRow } from '@/components/shared/CreationStats';
import { CreationStats } from '@/components/shared/CreationStats';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { useFolders } from '@/hooks/useFolders';
import { useJournalComposer } from '@/hooks/useJournalComposer';
import { useListNotes } from '@/hooks/useListNotes';
import { JOURNAL_FOLDER_ID } from '@/modules/folders';
import { countHighlights } from '@/modules/highlights';
import {
  countJournalNotes,
  dateDayRangesSchema,
  deleteNote,
  type NoteEntry,
} from '@/modules/notes';
import { pickCreationVerb } from '@/modules/stats';

const EMPTY_STATE_TRANSITION_DURATION = 380;
const STATS_ROW_HEIGHT = 120;

function capitalize(word: string): string {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

interface UseCreationStatsResult {
  rows: CreationStatRow[];
  refresh: () => void;
}

// Single consumer (this screen), so it stays local rather than in hooks/.
function useCreationStats(): UseCreationStatsResult {
  const [rows, setRows] = useState<CreationStatRow[]>([]);

  const refresh = useCallback(() => {
    const today = new Date();

    void Promise.all([
      countJournalNotes(JOURNAL_FOLDER_ID, startOfYear(today).getTime()),
      countHighlights(),
    ]).then(([notesResult, highlightsResult]) => {
      if (!notesResult.success || !highlightsResult.success) {
        return;
      }

      setRows([
        {
          icon: 'calendar-month',
          text: `${capitalize(pickCreationVerb(today, 0))} ${notesResult.data.year} sassi this year`,
        },
        {
          icon: 'terrain',
          text: `${capitalize(pickCreationVerb(today, 1))} ${notesResult.data.total} sassi total`,
        },
        {
          icon: 'pickaxe',
          text: `${capitalize(pickCreationVerb(today, 2))} ${highlightsResult.data} scaglie total`,
        },
      ]);
    });
  }, []);

  useFocusEffect(refresh);

  return { rows, refresh };
}

export default function HomeScreen() {
  const router = useRouter();
  const { reschedule: rescheduleDailyReminder } = useDailyReminder();
  const { folders, refresh: refreshFolders } = useFolders();
  const { entries, isLoading, refresh, prependEntry, removeEntry } =
    useListNotes();
  const { rows: creationStatRows, refresh: refreshCreationStats } =
    useCreationStats();
  const [deleteError, setDeleteError] = useState(false);
  const [entryPendingDelete, setEntryPendingDelete] =
    useState<NoteEntry | null>(null);

  const ranges = useMemo(
    () => dateDayRangesSchema.parse(entries.map(entry => entry.range)),
    [entries]
  );

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const {
    isCreating,
    pendingEntryId,
    handleCreate,
    handleTopEntrySettled,
    resetCreating,
  } = useJournalComposer({
    entries,
    isLoadingEntries: isLoading,
    prependEntry,
    onCreated: refreshCreationStats,
  });

  const handleDeleteEntry = useCallback(
    (entry: NoteEntry) => {
      removeEntry(entry.range.id);
      void deleteNote(entry.note.id).then(result => {
        if (!result.success) {
          setDeleteError(true);
          refresh();
          return;
        }
        refreshCreationStats();
        rescheduleDailyReminder();
      });
    },
    [removeEntry, refresh, refreshCreationStats, rescheduleDailyReminder]
  );

  useFocusEffect(
    useCallback(() => {
      resetCreating();
      refresh();
      refreshFolders();
    }, [resetCreating, refresh, refreshFolders])
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

        <View style={styles.statsRow}>
          {creationStatRows.length > 0 && (
            <CreationStats rows={creationStatRows} />
          )}

          {folders.length > 0 ? (
            <FoldersCarousel
              folders={folders}
              size={STATS_ROW_HEIGHT}
              onSelectFolder={folder => router.push(`/folder/${folder.id}`)}
            />
          ) : (
            <FoldersCarouselEmptyState size={STATS_ROW_HEIGHT} />
          )}
        </View>

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
            onDeleteEntry={setEntryPendingDelete}
          />
        )}
      </Animated.ScrollView>

      <ConfirmDeleteModal
        visible={entryPendingDelete !== null}
        subject="sasso"
        onConfirm={() => {
          if (entryPendingDelete) {
            handleDeleteEntry(entryPendingDelete);
          }
        }}
        onDismiss={() => setEntryPendingDelete(null)}
      />

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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    height: STATS_ROW_HEIGHT,
    gap: SPACING.sm,
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
