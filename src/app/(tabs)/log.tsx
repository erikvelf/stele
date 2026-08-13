import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Snackbar,
  Surface,
  useTheme,
} from 'react-native-paper';

import { LayerRowView, LogOptionMenu, TagFilterBar } from '@/components/log';
import { EmptyState } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import { useReflections } from '@/hooks/useReflections';
import { useStrati } from '@/hooks/useStrati';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPeriod } from '@/modules/i18n';
import type { LayerRow, Resolution } from '@/modules/log';
import type { ReflectionKind } from '@/modules/reflections';
import { readLogView, writeLogView } from '@/modules/settings';
import type { LogView } from '@/modules/settings';
import type { Period } from '@/modules/types';

const END_REACHED_THRESHOLD = 0.5;
const NO_PERIOD = 0;
const ERROR_SNACKBAR_DURATION = 5000;

const RESOLUTIONS: Resolution[] = ['day', 'week', 'month'];

const DIRECTIONS: LogView['direction'][] = ['newest', 'oldest'];

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
  const { t } = useTranslation();
  const [view, setView] = useState<LogView>(readLogView);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [scopePeriod, setScopePeriod] = useState<Period | null>(null);

  // Drilling into a month reads it a week at a time, whatever the menu says.
  const resolution: Resolution = scopePeriod ? 'week' : view.resolution;
  const scope = useMemo(
    () =>
      scopePeriod ? { start: scopePeriod.start, end: scopePeriod.end } : null,
    [scopePeriod]
  );

  const { rows, span, tags, isLoading, loadMore } = useStrati({
    resolution,
    direction: view.direction,
    tagIds,
    scope,
  });
  const { textFor, setText, error, dismissError } = useReflections(
    reflectionKindFor(resolution),
    span
  );

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
    setView(current => {
      const next = { ...current, ...patch };
      writeLogView(next);
      return next;
    });
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setTagIds(current =>
      current.includes(tagId)
        ? current.filter(id => id !== tagId)
        : [...current, tagId]
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
        {scopePeriod ? (
          <Appbar.BackAction onPress={() => setScopePeriod(null)} />
        ) : null}
        <Appbar.Content
          title={scopePeriod ? formatPeriod(scopePeriod, t) : t('log.title')}
        />
        <LogOptionMenu
          icon="filter-variant"
          options={DIRECTIONS}
          selected={view.direction}
          labelFor={direction => t(`log.direction.${direction}`)}
          onSelect={direction => applyView({ direction })}
        />
        <LogOptionMenu
          icon="tune-variant"
          options={RESOLUTIONS}
          selected={view.resolution}
          labelFor={resolution => t(`log.resolution.${resolution}`)}
          onSelect={resolution => applyView({ resolution })}
        />
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
              title={t('log.empty.title')}
              subtitle={t('log.empty.subtitle')}
            />
          )
        }
      />

      <Snackbar
        visible={error !== null}
        onDismiss={dismissError}
        duration={ERROR_SNACKBAR_DURATION}
      >
        {t('log.errors.save')}
      </Snackbar>
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
