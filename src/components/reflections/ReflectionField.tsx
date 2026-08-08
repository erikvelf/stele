import { StyleSheet, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { TRANSPARENT } from '@/modules/palette';

const ROW_MIN_HEIGHT = 44;

interface ReflectionFieldProps {
  value: string;
  onChangeText: (text: string) => void;
}

// The flush row a scaglia draws, with the text editable: full bleed, no
// underline, on the same raised fill a filled field has. No label — the
// divider above already says which period this belongs to, and a labelled
// field would read as something the period is asking you to fill in.
export function ReflectionField({ value, onChangeText }: ReflectionFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.row, { backgroundColor: theme.colors.surfaceVariant }]}
    >
      <TextInput
        mode="flat"
        dense
        multiline
        value={value}
        onChangeText={onChangeText}
        placeholder={t('reflection.placeholder')}
        placeholderTextColor={theme.colors.onSurfaceDisabled}
        style={styles.field}
        contentStyle={styles.fieldContent}
        underlineStyle={styles.fieldUnderline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  field: {
    backgroundColor: TRANSPARENT,
    paddingHorizontal: 0,
  },
  fieldContent: {
    paddingVertical: 0,
  },
  fieldUnderline: {
    display: 'none',
  },
});
