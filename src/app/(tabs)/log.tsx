import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Menu,
  Surface,
  useTheme,
} from 'react-native-paper';

import { LayerRowView, TagFilterBar } from '@/components/log';
import { EmptyState } from '@/components/shared';
import { formatPeriod } from '@/lib/format-period';
import type { Period } from '@/lib/format-period';
import type { LayerRow, Resolution } from '@/modules/log';
import type { ReflectionKind } from '@/modules/reflections';
import { readLogView, writeLogView } from '@/modules/settings';
import type { LogView } from '@/modules/settings';

import { SPACING } from '@/constants/layout';
import { useReflections } from '@/hooks/useReflections';
import { useStrati } from '@/hooks/useStrati';

const END_REACHED_THRESHOLD = 0.5;
const NO_PERIOD = 0;

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: 'day', label: 'Giorno' },
  { value: 'week', label: 'Carrello' },
  { value: 'month', label: 'Cippo' },
];

const DIRECTION_OPTIONS: { value: LogView['direction']; label: string }[] = [
  { value: 'newest', label: 'Prima i più recenti' },
  { value: 'oldest', label: 'Prima i più vecchi' },
];

// Only weeks and months hold a reflection; a single day already has its note.
function reflectionKindFor(resolution: Resolution): ReflectionKind | null {
  if (resolution === 'week') {
    return 'week';
  }
  return resolution === 'month' ? 'month' : null;
}

function periodStartOf(row: LayerRow): number {
  return row.kind === 'reflection' ? row.period.start.getTime() : NO_PERIOD;
}

export default function LogScreen() {
  const theme = useTheme();
  const [view, setView] = useState<LogView>(readLogView);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scopePeriod, setScopePeriod] = useState<Period | null>(null);
  const [isViewMenuVisible, setIsViewMenuVisible] = useState(false);
  const [isSortMenuVisible, setIsSortMenuVisible] = useState(false);

  // Drilling into a month reads it a week at a time, whatever the menu says.
  const resolution: Resolution = scopePeriod ? 'week' : view.resolution;
  const scope = useMemo(
    () => (scopePeriod ? { start: scopePeriod.start, end: scopePeriod.end } : null),
    [scopePeriod]
  );

  const { rows, span, tags, isLoading, loadMore } = useStrati({
    resolution,
    direction: view.direction,
    tagIds,
    scope,
  });
  const { textFor, setText } = useReflections(reflectionKindFor(resolution), span);

  // A filter is a question you are asking now: leaving the screen drops it,
  // so the log never quietly under-reports the archive on your next visit.
  useFocusEffect(
    useCallback(
      () => () => {
        setTagIds([]);
      },
      []
    )
  );

  const applyView = useCallback((patch: Partial<LogView>) => {
    setIsViewMenuVisible(false);
    setIsSortMenuVisible(false);
    setView(current => {
      const next = { ...current, ...patch };
      writeLogView(next);
      return next;
    });
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setTagIds(current =>
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    );
  }, []);

  const tagList = useMemo(() => [...tags.values()], [tags]);

  // The stack headers behind "Aspetto" and its siblings paint level2 with no
  // shadow; the tab screens share the chrome so they read as one surface.
  const chrome = useMemo(
    () => ({ backgroundColor: theme.colors.elevation.level2 }),
    [theme]
  );

  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header style={chrome}>
        {scopePeriod ? <Appbar.BackAction onPress={() => setScopePeriod(null)} /> : null}
        <Appbar.Content title={scopePeriod ? formatPeriod(scopePeriod) : 'Strati'} />
        <Menu
          visible={isSortMenuVisible}
          onDismiss={() => setIsSortMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="filter-variant"
              onPress={() => setIsSortMenuVisible(true)}
            />
          }
        >
          {DIRECTION_OPTIONS.map(option => (
            <Menu.Item
              key={option.value}
              title={option.label}
              leadingIcon={view.direction === option.value ? 'check' : undefined}
              onPress={() => applyView({ direction: option.value })}
            />
          ))}
        </Menu>
        <Menu
          visible={isViewMenuVisible}
          onDismiss={() => setIsViewMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="tune-variant"
              onPress={() => setIsViewMenuVisible(true)}
            />
          }
        >
          {RESOLUTION_OPTIONS.map(option => (
            <Menu.Item
              key={option.value}
              title={option.label}
              leadingIcon={view.resolution === option.value ? 'check' : undefined}
              onPress={() => applyView({ resolution: option.value })}
            />
          ))}
        </Menu>
      </Appbar.Header>

      <TagFilterBar
        tags={tagList}
        selectedIds={tagIds}
        onToggle={toggleTag}
        style={chrome}
      />

      <FlatList
        data={rows}
        keyExtractor={row => row.id}
        contentContainerStyle={styles.content}
        onEndReached={loadMore}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <LayerRowView
            row={item}
            tags={tags}
            reflectionText={textFor(periodStartOf(item))}
            onChangeReflection={text => setText(periodStartOf(item), text)}
            onOpenNote={noteId => router.push(`/note/${noteId}`)}
            onOpenPeriod={setScopePeriod}
          />
        )}
        ListFooterComponent={
          isLoading ? <ActivityIndicator style={styles.footer} /> : null
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji="🗿"
              title="Nessuna scaglia"
              subtitle="Le scaglie che stacchi dai tuoi sassi finiscono qui, a strati."
            />
          )
        }
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    // Grows to fill the screen but stacks from the top, so a short log sits
    // under the tag bar instead of floating in the middle of it.
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: SPACING.xl,
  },
  footer: {
    paddingVertical: SPACING.lg,
  },
});
