import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { StonePicker } from '@/components/settings/StonePicker';
import { SPACING } from '@/constants/layout';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';

export default function NewFolderColorScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { stoneId, setStoneId, openSheet } = useNewFolderDraft();

  // Fires for every way of leaving this screen (header back, swipe, hardware
  // back), so the editing sheet reopens even when no color was picked.
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      openSheet();
    });
  }, [navigation, openSheet]);

  return (
    <Surface elevation={0} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <StonePicker
          value={stoneId}
          onChange={id => {
            setStoneId(id);
            router.back();
          }}
        />
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
  },
});
