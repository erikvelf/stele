import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Appbar, List, Surface } from 'react-native-paper';

export default function SettingsScreen() {
  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      <List.Item
        title="Aspetto"
        left={props => <List.Icon {...props} icon="palette-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/appearance')}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
