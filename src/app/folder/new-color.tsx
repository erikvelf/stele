import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { StonePicker } from '@/components/settings/StonePicker';
import { SPACING } from '@/constants/layout';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';

export default function NewFolderColorScreen() {
  const router = useRouter();
  const { stoneId, setStoneId, openSheet } = useNewFolderDraft();

  return (
    <Surface style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <StonePicker
          value={stoneId}
          onChange={id => {
            setStoneId(id);
            openSheet();
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
