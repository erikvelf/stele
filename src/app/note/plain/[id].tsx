import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Surface } from 'react-native-paper';

import { FormatBar } from '@/components/notes/FormatBar';
import { NoteEditorArea } from '@/components/notes/NoteEditorArea';
import { HeaderIconButton } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import { useFormatBarInset } from '@/hooks/useFormatBarInset';
import { useMarkdownFormat } from '@/hooks/useMarkdownFormat';
import { useNote } from '@/hooks/useNote';
import { useRenderMode } from '@/hooks/useRenderMode';
import { useTranslation } from '@/hooks/useTranslation';

export default function PlainNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { note, isLoading, setText } = useNote(id);
  const formatting = useMarkdownFormat({
    text: note?.text ?? '',
    onChangeText: setText,
  });
  const { isRenderMode, toggleRenderMode } = useRenderMode({
    noteId: id,
    isLoading,
    hasText: (note?.text ?? '').length > 0,
  });
  const isFormatBarOpen = formatting.isFocused && !isRenderMode;
  const formatBar = useFormatBarInset(isFormatBarOpen);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderIconButton
          icon={isRenderMode ? 'pencil' : 'eye'}
          onPress={toggleRenderMode}
        />
      ),
    });
  }, [navigation, isRenderMode, toggleRenderMode]);

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
        bottomInset={formatBar.inset}
        selection={formatting.selection}
        onSelectionChange={formatting.onSelectionChange}
        onFocus={formatting.onFocus}
        onBlur={formatting.onBlur}
      />

      <FormatBar
        isOpen={isFormatBarOpen}
        activeFormats={formatting.formats}
        onFormatPress={formatting.onFormatPress}
        onHeightChange={formatBar.onHeightChange}
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
});
