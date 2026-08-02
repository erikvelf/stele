import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Surface style={styles.screen}>
      <Text variant="bodyMedium">Folder {id}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
