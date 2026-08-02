import { StyleSheet, View } from 'react-native';
import { Appbar, Surface, Text } from 'react-native-paper';

export default function FoldersScreen() {
  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title="Scaffale" />
      </Appbar.Header>
      <View style={styles.body}>
        <Text variant="bodyMedium">Folders</Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
