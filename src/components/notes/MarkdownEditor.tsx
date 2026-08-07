import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { TRANSPARENT } from '@/modules/palette';

const EDITOR_FONT_SIZE = 16;
const EDITOR_LINE_HEIGHT = 24;

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function MarkdownEditor({
  value,
  onChangeText,
  placeholder,
  style,
}: MarkdownEditorProps) {
  const theme = useTheme();

  return (
    <View style={style}>
      <TextInput
        mode="flat"
        multiline
        scrollEnabled={false}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        contentStyle={[styles.content, { color: theme.colors.onSurface }]}
        underlineStyle={styles.underline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: TRANSPARENT,
    paddingHorizontal: 0,
  },
  content: {
    marginHorizontal: 0,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 0,
    fontSize: EDITOR_FONT_SIZE,
    lineHeight: EDITOR_LINE_HEIGHT,
  },
  underline: {
    display: 'none',
  },
});
