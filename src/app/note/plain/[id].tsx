import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Surface, TextInput } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useNote } from '@/hooks/useNote';

export default function PlainNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { note, isLoading, setText } = useNote(id);

  if (isLoading) {
    return (
      <Surface style={styles.centered}>
        <ActivityIndicator />
      </Surface>
    );
  }

  return (
    <Surface style={styles.screen}>
      <TextInput
        mode="flat"
        multiline
        placeholder="Writing…"
        value={note?.text ?? ''}
        onChangeText={setText}
        style={styles.input}
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
});
