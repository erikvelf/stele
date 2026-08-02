import { startOfDay } from 'date-fns';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, FAB, Surface } from 'react-native-paper';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';

import { ActivityGrid } from '@/components/notes/ActivityGrid';
import { ActivityList } from '@/components/notes/ActivityList';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { createId } from '@/lib/id';
import {
  dateDayRangesSchema,
  mockNoteEntries,
  type NoteEntry,
} from '@/modules/notes';

export default function HomeScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<NoteEntry[]>(() =>
    [...mockNoteEntries()].reverse()
  );
  const [isCreating, setIsCreating] = useState(false);
  const [pendingEntryId, setPendingEntryId] = useState<string | undefined>(
    undefined
  );

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
      router.push(`/note/${todaysEntry.range.id}`);
      return;
    }

    setIsCreating(true);
    const id = createId();
    const newEntry: NoteEntry = {
      note: { id: `note-${id}`, text: '' },
      range: {
        id,
        note_id: `note-${id}`,
        start_timestamp: today.getTime(),
        end_timestamp: today.getTime(),
      },
    };
    setPendingEntryId(id);
    setEntries(previous => [newEntry, ...previous]);
  }, [entries, router]);

  const handleTopEntrySettled = useCallback(() => {
    if (!pendingEntryId) {
      return;
    }
    router.push(`/note/${pendingEntryId}`);
    setPendingEntryId(undefined);
  }, [router, pendingEntryId]);

  useFocusEffect(
    useCallback(() => {
      setIsCreating(false);
    }, [])
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

        <ActivityList
          entries={entries}
          pendingEntryId={pendingEntryId}
          onTopEntrySettled={handleTopEntrySettled}
          onOpenEntry={entry => router.push(`/note/${entry.range.id}`)}
          onEditEntry={entry => router.push(`/note/${entry.range.id}`)}
          onDeleteEntry={entry =>
            setEntries(previous =>
              previous.filter(candidate => candidate.range.id !== entry.range.id)
            )
          }
        />
      </Animated.ScrollView>

      <FAB
        icon="pencil"
        style={styles.fab}
        disabled={isCreating}
        onPress={handleCreate}
      />
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
