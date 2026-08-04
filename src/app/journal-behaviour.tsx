import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { List, Surface, TextInput } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { readEntryTemplate, writeEntryTemplate } from '@/modules/settings';

export default function JournalBehaviourScreen() {
  const [entryTemplate, setEntryTemplate] = useState(readEntryTemplate);

  const changeText = (text: string) => {
    const next = { text };
    setEntryTemplate(next);
    writeEntryTemplate(next);
  };

  return (
    <Surface style={styles.screen} elevation={0}>
      <List.Item
        title="Entry template"
        description="Pre-fills new sassi with this text. Leave blank to start empty."
        left={props => <List.Icon {...props} icon="text-box-outline" />}
      />
      <TextInput
        mode="outlined"
        multiline
        style={styles.input}
        value={entryTemplate.text}
        onChangeText={changeText}
        placeholder="How was your day?"
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
