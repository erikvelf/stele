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

import {
  FoldersCarousel,
  FoldersCarouselEmptyState,
} from '@/components/folders';
import { ActivityGrid } from '@/components/notes/ActivityGrid';
import { ActivityList } from '@/components/notes/ActivityList';
import { DayRangeModal } from '@/components/notes/DayRangeModal';
import { NotesEmptyState } from '@/components/notes/NotesEmptyState';
import { ConfirmDeleteModal } from '@/components/shared';
import type { CreationStatRow } from '@/components/shared/CreationStats';
import { CreationStats } from '@/components/shared/CreationStats';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useDailyReminder } from '@/hooks/useDailyReminder';
import { useFolders } from '@/hooks/useFolders';
import { useHighlightCounts } from '@/hooks/useHighlightCounts';
import { useJournalComposer } from '@/hooks/useJournalComposer';
import { useJournalFeed } from '@/hooks/useJournalFeed';
import { useTranslation } from '@/hooks/useTranslation';
import { countHighlights } from '@/modules/highlights';
import type { Translate } from '@/modules/i18n';
import {
  countJournalNotes,
  dayRangesSchema,
  deleteJournalNote,
  type JournalNote,
  writeJournalNote,
} from '@/modules/journal';
import { pickCreationVerb } from '@/modules/stats';

const EMPTY_STATE_TRANSITION_DURATION = 380;
const STATS_ROW_HEIGHT = 120;
const ERROR_SNACKBAR_DURATION = 4000;

function creationVerb(t: Translate, today: Date, salt: number): string {
  return t(`creationVerbs.${pickCreationVerb(today, salt)}`);
}

interface UseCreationStatsResult {
  rows: CreationStatRow[];
  refresh: () => void;
}

// Single consumer (this screen), so it stays local rather than in hooks/.
function useCreationStats(): UseCreationStatsResult {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CreationStatRow[]>([]);

  const refresh = useCallback(() => {
    const today = new Date();

    void Promise.all([
      countJournalNotes(startOfYear(today).getTime()),
      countHighlights(),
    ]).then(([notesResult, highlightsResult]) => {
      if (!notesResult.success || !highlightsResult.success) {
        return;
      }

      setRows([
        {
          icon: 'calendar-month',
          text: t('home.stats.stonesThisYear', {
            verb: creationVerb(t, today, 0),
            count: notesResult.data.year,
          }),
        },
        {
          icon: 'terrain',
          text: t('home.stats.stonesTotal', {
            verb: creationVerb(t, today, 1),
            count: notesResult.data.total,
          }),
        },
        {
          icon: 'pickaxe',
          text: t('home.stats.highlightsTotal', {
            verb: creationVerb(t, today, 2),
            count: highlightsResult.data,
          }),
        },
      ]);
    });
  }, [t]);

  useFocusEffect(refresh);

  return { rows, refresh };
}

interface JournalNoteActionsOptions {
  removeNote: (id: string) => void;
  refresh: () => void;
  refreshCreationStats: () => void;
  rescheduleDailyReminder: () => void;
}

interface JournalNoteActions {
  error: string | null;
  dismissError: () => void;
  pendingDelete: JournalNote | null;
  pendingDayRange: JournalNote | null;
  requestDelete: (note: JournalNote) => void;
  requestDayRange: (note: JournalNote) => void;
  cancelDelete: () => void;
  cancelDayRange: () => void;
  confirmDelete: () => void;
  confirmDayRange: (note: JournalNote) => void;
}

// Single consumer (this screen), so it stays local rather than in hooks/.
function useJournalNoteActions({
  removeNote,
  refresh,
  refreshCreationStats,
  rescheduleDailyReminder,
}: JournalNoteActionsOptions): JournalNoteActions {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JournalNote | null>(null);
  const [pendingDayRange, setPendingDayRange] = useState<JournalNote | null>(
    null
  );

  // The row leaves the list first; a failed delete puts it back through the
  // refresh.
  const confirmDelete = useCallback(() => {
    if (!pendingDelete) {
      return;
    }
    removeNote(pendingDelete.id);
    void deleteJournalNote(pendingDelete.id).then(result => {
      if (!result.success) {
        setError(t('home.errors.deleteNote'));
        refresh();
        return;
      }
      refreshCreationStats();
      rescheduleDailyReminder();
    });
  }, [
    pendingDelete,
    removeNote,
    refresh,
    refreshCreationStats,
    rescheduleDailyReminder,
    t,
  ]);

  const confirmDayRange = useCallback(
    (note: JournalNote) => {
      setPendingDayRange(null);
      void writeJournalNote(note).then(result => {
        if (!result.success) {
          setError(t('home.errors.setDayRange'));
          return;
        }
        refresh();
      });
    },
    [refresh, t]
  );

  return {
    error,
    dismissError: useCallback(() => setError(null), []),
    pendingDelete,
    pendingDayRange,
    requestDelete: setPendingDelete,
    requestDayRange: setPendingDayRange,
    cancelDelete: useCallback(() => setPendingDelete(null), []),
    cancelDayRange: useCallback(() => setPendingDayRange(null), []),
    confirmDelete,
    confirmDayRange,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { reschedule: rescheduleDailyReminder } = useDailyReminder();
  const { folders, refresh: refreshFolders } = useFolders();
  const { notes, isLoading, refresh, prependNote, removeNote } =
    useJournalFeed();
  const highlightCounts = useHighlightCounts(notes);
  const { rows: creationStatRows, refresh: refreshCreationStats } =
    useCreationStats();
  const noteActions = useJournalNoteActions({
    removeNote,
    refresh,
    refreshCreationStats,
    rescheduleDailyReminder,
  });

  const ranges = useMemo(
    () =>
      dayRangesSchema.parse(
        notes.map(note => ({
          id: note.id,
          start_timestamp: note.start_timestamp,
          end_timestamp: note.end_timestamp,
        }))
      ),
    [notes]
  );

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const {
    isCreating,
    pendingNoteId,
    handleCreate,
    handleTopNoteSettled,
    resetCreating,
  } = useJournalComposer({
    notes,
    isLoadingNotes: isLoading,
    prependNote,
    onCreated: refreshCreationStats,
  });

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
          onSelectRange={range => router.push(`/note/${range.id}`)}
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

        {notes.length === 0 ? (
          <Animated.View
            exiting={FadeOut.duration(EMPTY_STATE_TRANSITION_DURATION)}
          >
            <NotesEmptyState />
          </Animated.View>
        ) : (
          <ActivityList
            notes={notes}
            highlightCounts={highlightCounts}
            pendingNoteId={pendingNoteId}
            onTopNoteSettled={handleTopNoteSettled}
            onOpenNote={note => router.push(`/note/${note.id}`)}
            onSetDayRangeNote={noteActions.requestDayRange}
            onDeleteNote={noteActions.requestDelete}
          />
        )}
      </Animated.ScrollView>

      <ConfirmDeleteModal
        visible={noteActions.pendingDelete !== null}
        subject={t('common.stone')}
        onConfirm={noteActions.confirmDelete}
        onDismiss={noteActions.cancelDelete}
      />

      <DayRangeModal
        note={noteActions.pendingDayRange}
        ranges={ranges}
        onDismiss={noteActions.cancelDayRange}
        onConfirm={noteActions.confirmDayRange}
      />

      <FAB
        icon="pencil"
        style={styles.fab}
        disabled={isCreating}
        onPress={handleCreate}
      />

      <Snackbar
        visible={noteActions.error !== null}
        onDismiss={noteActions.dismissError}
        duration={ERROR_SNACKBAR_DURATION}
      >
        {noteActions.error}
      </Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  statsRow: {
    marginTop: SPACING.lg,
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
