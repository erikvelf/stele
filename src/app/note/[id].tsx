import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useNote } from '@/hooks/useNote';

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { note, error, isLoading, setText } = useNote(id);
  const theme = useTheme();

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
      {error ? (
        <Text
          variant="labelMedium"
          style={[styles.error, { color: theme.colors.error }]}
        >
          Couldn’t save — {error.cause ?? 'try again'}
        </Text>
      ) : null}
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
