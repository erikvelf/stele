import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { HighlightList, TagPickerSheet } from '@/components/highlights';
import type { ResolvedHighlight } from '@/components/highlights';
import { SPACING } from '@/constants/layout';
import { useHighlights } from '@/hooks/useHighlights';
import { useNote } from '@/hooks/useNote';
import { useTags } from '@/hooks/useTags';

// A blurred TextInput closes the picker on the next tick, before a tap on
// the picker itself has finished — this delay gives that tap time to land.
const BLUR_CLOSE_DELAY_MS = 150;

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { note, error, isLoading, setText } = useNote(id);
  const { highlights, addHighlight, updateText, assignTag, reorderHighlights } =
    useHighlights(id);
  const { tags } = useTags();
  const theme = useTheme();

  const resolvedHighlights: ResolvedHighlight[] = useMemo(
    () =>
      highlights.map(highlight => ({
        id: highlight.id,
        text: highlight.text,
        tag: tags.find(tag => tag.id === highlight.tag_id) ?? null,
      })),
    [highlights, tags]
  );

  const [focusedHighlightId, setFocusedHighlightId] = useState<string | null>(
    null
  );
  const focusedHighlight = highlights.find(
    highlight => highlight.id === focusedHighlightId
  );
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <Surface style={styles.centered}>
        <ActivityIndicator />
      </Surface>
    );
  }

  return (
    <Surface style={styles.screen}>
      <HighlightList
        highlights={resolvedHighlights}
        onChangeText={updateText}
        onAddHighlight={addHighlight}
        onFocusHighlight={focusHighlight}
        onBlurHighlight={blurHighlight}
        onReorderHighlights={reorderHighlights}
      />
      <TextInput
        mode="flat"
        multiline
        placeholder="Writing…"
        value={note?.text ?? ''}
        onChangeText={setText}
        style={styles.input}
      />
      {error ? (
        <Text
          variant="labelMedium"
          style={[styles.error, { color: theme.colors.error }]}
        >
          Couldn’t save — {error.cause ?? 'try again'}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  error: {
    padding: SPACING.sm,
  },
});
