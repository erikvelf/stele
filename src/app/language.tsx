import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

import { LanguagePicker } from '@/components/settings/LanguagePicker';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage } = useTranslation();

  return (
    <Surface elevation={0} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <LanguagePicker
          value={language}
          onChange={preference => {
            setLanguage(preference);
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
});
