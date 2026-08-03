import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { EmojiPicker } from '@/components/ui';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';
import { SPACING } from '@/constants/layout';

export default function NewFolderEmojiScreen() {
  const router = useRouter();
  const { setEmoji, openSheet } = useNewFolderDraft();

  return (
    <Surface style={styles.screen} elevation={0}>
      <EmojiPicker
        onSelect={emoji => {
          setEmoji(emoji);
          openSheet();
          router.back();
        }}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: SPACING.md,
  },
});
