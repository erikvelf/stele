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
      <List.Item
        title="Privacy & security"
        left={props => <List.Icon {...props} icon="shield-lock-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/privacy-security')}
      />
      <List.Item
        title="Archivio"
        description="Export and import your data"
        left={props => <List.Icon {...props} icon="cloud-upload-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/archive')}
      />
      <List.Item
        title="Notifications"
        left={props => <List.Icon {...props} icon="bell-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/notifications')}
      />
      <List.Item
        title="Journal behaviour"
        left={props => <List.Icon {...props} icon="book-cog-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/journal-behaviour')}
      />
      <List.Item
        title="Test"
        description="Montagna (mock)"
        left={props => <List.Icon {...props} icon="flask-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/year-mock')}
      />
      <List.Item
        title="About"
        left={props => <List.Icon {...props} icon="information-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        disabled
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
