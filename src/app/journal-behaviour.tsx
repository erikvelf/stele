import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { List, Surface, TextInput } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { readEntryTemplate, writeEntryTemplate } from '@/modules/settings';

export default function JournalBehaviourScreen() {
  const { t } = useTranslation();
  const [entryTemplate, setEntryTemplate] = useState(readEntryTemplate);

  const changeText = (text: string) => {
    const next = { text };
    setEntryTemplate(next);
    writeEntryTemplate(next);
  };

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title={t('journalBehaviour.entryTemplate.title')}
        description={t('journalBehaviour.entryTemplate.description')}
        left={props => <List.Icon {...props} icon="text-box-outline" />}
      />
      <TextInput
        mode="outlined"
        multiline
        style={styles.input}
        value={entryTemplate.text}
        onChangeText={changeText}
        placeholder={t('journalBehaviour.entryTemplate.placeholder')}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  input: {
    marginHorizontal: SPACING.md,
    minHeight: 120,
  },
});
