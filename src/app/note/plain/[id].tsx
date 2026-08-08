import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, IconButton, Surface } from 'react-native-paper';

import { NoteEditorArea } from '@/components/notes/NoteEditorArea';
import { SPACING } from '@/constants/layout';
import { useNote } from '@/hooks/useNote';
import { useRenderMode } from '@/hooks/useRenderMode';
import { useTranslation } from '@/hooks/useTranslation';

export default function PlainNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { note, isLoading, setText } = useNote(id);
  const { isRenderMode, toggleRenderMode } = useRenderMode({
    noteId: id,
    isLoading,
    hasText: (note?.text ?? '').length > 0,
  });

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
