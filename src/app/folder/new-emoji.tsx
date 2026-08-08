import { useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { EmojiPicker } from '@/components/ui';
import { SPACING } from '@/constants/layout';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';

export default function NewFolderEmojiScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { setEmoji, openSheet } = useNewFolderDraft();

  // Fires for every way of leaving this screen (header back, swipe, hardware
  // back), so the editing sheet reopens even when no emoji was picked.
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      openSheet();
    });
  }, [navigation, openSheet]);

  return (
    <Surface style={styles.screen} elevation={0}>
      <EmojiPicker
        onSelect={emoji => {
          setEmoji(emoji);
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
