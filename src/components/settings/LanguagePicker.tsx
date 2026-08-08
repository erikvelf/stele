import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Searchbar } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGE_PREFERENCES } from '@/modules/types';
import type { LanguagePreference } from '@/modules/types';

interface LanguagePickerProps {
  value: LanguagePreference;
  onChange: (preference: LanguagePreference) => void;
}

const SYSTEM_ICON = 'cellphone-cog';
const LOCALE_ICON = 'translate';

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const matches = LANGUAGE_PREFERENCES.filter(preference =>
    t(`appearance.language.${preference}`).toLowerCase().includes(needle)
  );

  return (
    <View>
      <Searchbar
        style={styles.search}
        placeholder={t('appearance.language.search')}
        value={query}
        onChangeText={setQuery}
      />
      {matches.map(preference => (
        <List.Item
          key={preference}
          title={t(`appearance.language.${preference}`)}
          left={props => (
            <List.Icon
              {...props}
              icon={preference === 'system' ? SYSTEM_ICON : LOCALE_ICON}
            />
          )}
          right={props =>
            preference === value ? <List.Icon {...props} icon="check" /> : null
          }
          onPress={() => onChange(preference)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    margin: SPACING.md,
  },
});
