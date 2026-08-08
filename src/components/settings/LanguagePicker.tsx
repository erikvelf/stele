import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGE_PREFERENCES } from '@/modules/types';
import type { LanguagePreference } from '@/modules/types';

export function LanguagePicker() {
  const { t, language, setLanguage } = useTranslation();

  const buttons = LANGUAGE_PREFERENCES.map(preference => ({
    value: preference,
    label: t(`appearance.language.${preference}`),
  }));

  return (
    <View style={styles.section}>
      <Text variant="titleLarge" style={styles.title}>
        {t('appearance.language.title')}
      </Text>
      <SegmentedButtons<LanguagePreference>
        value={language}
        onValueChange={setLanguage}
        buttons={buttons}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm,
  },
  title: {
    marginLeft: SPACING.xs,
  },
});
