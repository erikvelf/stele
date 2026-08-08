import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Appbar, List, Surface } from 'react-native-paper';

import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>
      <List.Item
        title={t('settings.appearance')}
        left={props => <List.Icon {...props} icon="palette-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/appearance')}
      />
      <List.Item
        title={t('settings.privacySecurity')}
        left={props => <List.Icon {...props} icon="shield-lock-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/privacy-security')}
      />
      <List.Item
        title={t('settings.archive')}
        description={t('settings.archiveDescription')}
        left={props => <List.Icon {...props} icon="cloud-upload-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/archive')}
      />
      <List.Item
        title={t('settings.notifications')}
        left={props => <List.Icon {...props} icon="bell-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/notifications')}
      />
      <List.Item
        title={t('settings.journalBehaviour')}
        left={props => <List.Icon {...props} icon="book-cog-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/journal-behaviour')}
      />
      <List.Item
        title={t('settings.about')}
        left={props => <List.Icon {...props} icon="information-outline" />}
        right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => router.push('/about')}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
