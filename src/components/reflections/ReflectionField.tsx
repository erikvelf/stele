import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

import { SPACING } from '@/constants/layout';

const PLACEHOLDER = 'Una riga su questo periodo, se ti va';

interface ReflectionFieldProps {
  value: string;
  onChangeText: (text: string) => void;
}

// The app's one input look, reused: a flat filled field with an underline,
// the same as the highlight inputs on the note screen. No label — the
// divider above already says which period this belongs to, and a labelled
// field would read as something the period is asking you to fill in.
export function ReflectionField({ value, onChangeText }: ReflectionFieldProps) {
  return (
    <TextInput
      mode="flat"
      dense
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder={PLACEHOLDER}
      style={styles.field}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
