import { StyleSheet, View } from 'react-native';
import { Appbar, Surface, Text } from 'react-native-paper';

export default function LogScreen() {
  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title="Strati" />
      </Appbar.Header>
      <View style={styles.body}>
        <Text variant="bodyMedium">Log</Text>
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
