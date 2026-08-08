import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Surface,
  Text,
} from 'react-native-paper';

import { HighlightList, TagPickerSheet } from '@/components/highlights';
import type { ResolvedHighlight } from '@/components/highlights';
import { NoteEditorArea } from '@/components/notes/NoteEditorArea';
import { RADIUS, SPACING } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useHighlights } from '@/hooks/useHighlights';
import { useJournalNote } from '@/hooks/useJournalNote';
import { useRenderMode } from '@/hooks/useRenderMode';
import { useTags } from '@/hooks/useTags';
import { useTranslation } from '@/hooks/useTranslation';
import { recessedSurfaceFor } from '@/modules/palette';

const BLUR_CLOSE_DELAY_MS = 150;

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { note, error, isLoading, setText } = useJournalNote(id);
  const { highlights, addHighlight, updateText, assignTag, reorderHighlights } =
    useHighlights(id);
  const { tags } = useTags();
  const { t } = useTranslation();
  const { theme, stoneId } = useAppTheme();
  const { isRenderMode, toggleRenderMode } = useRenderMode({
    noteId: id,
    isLoading,
    hasText: (note?.text ?? '').length > 0,
  });

  const resolvedHighlights: ResolvedHighlight[] = useMemo(
    () =>
      highlights.map(highlight => ({
        id: highlight.id,
        text: highlight.text,
        tag: tags.find(tag => tag.id === highlight.tag_id) ?? null,
      })),
    [highlights, tags]
  );

  const navigation = useNavigation();
  const [focusedHighlightId, setFocusedHighlightId] = useState<string | null>(
    null
  );
  const focusedHighlight = highlights.find(
    highlight => highlight.id === focusedHighlightId
  );
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon={isRenderMode ? 'pencil' : 'eye'}
          onPress={toggleRenderMode}
        />
      ),
    });
  }, [navigation, isRenderMode, toggleRenderMode]);

  const focusHighlight = (id: string) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocusedHighlightId(id);
  };

  const blurHighlight = (id: string) => {
    blurTimeoutRef.current = setTimeout(() => {
      setFocusedHighlightId(current => (current === id ? null : current));
    }, BLUR_CLOSE_DELAY_MS);
  };

  if (isLoading) {
    return (
      <Surface elevation={0} style={styles.centered}>
        <ActivityIndicator />
      </Surface>
    );
  }

  return (
    <Surface elevation={0} style={styles.screen}>
      <NoteEditorArea
        placeholder={t('note.placeholder')}
        value={note?.text ?? ''}
        onChangeText={setText}
        isRenderMode={isRenderMode}
      >
        <View
          style={[
            styles.highlights,
            { backgroundColor: recessedSurfaceFor(stoneId, theme.dark) },
          ]}
        >
          <HighlightList
            highlights={resolvedHighlights}
            onChangeText={updateText}
            onAddHighlight={addHighlight}
            onFocusHighlight={focusHighlight}
            onBlurHighlight={blurHighlight}
            onReorderHighlights={reorderHighlights}
          />
        </View>
      </NoteEditorArea>
      {error ? (
        <Text
          variant="labelMedium"
          style={[styles.error, { color: theme.colors.error }]}
        >
          {t('note.saveFailed', { cause: error.cause ?? t('note.tryAgain') })}
        </Text>
      ) : null}

      <TagPickerSheet
        isOpen={focusedHighlightId !== null}
        tags={tags}
        selectedTagId={focusedHighlight?.tag_id ?? null}
        onSelectTag={tagId => {
          if (focusedHighlightId) {
            assignTag(focusedHighlightId, tagId);
          }
        }}
        onManageTagsPress={() => {
          if (!focusedHighlightId) {
            return;
          }
          const highlightId = focusedHighlightId;
          setFocusedHighlightId(null);
          router.push({ pathname: '/tag', params: { highlightId } });
        }}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: SPACING.md,
  },
  highlights: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    padding: SPACING.sm,
  },
});
