import type {
  NativeSyntheticEvent,
  StyleProp,
  TextInputSelectionChangeEventData,
  ViewStyle,
} from 'react-native';
import { StyleSheet, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import type { TextSelection } from '@/lib/markdownFormat';
import { TRANSPARENT } from '@/modules/palette';

const EDITOR_FONT_SIZE = 16;
const EDITOR_LINE_HEIGHT = 24;

export interface EditorCaretProps {
  // Set only to move the caret after a format, and released as soon as the
  // input reports the move.
  selection?: TextSelection;
  onSelectionChange?: (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface MarkdownEditorProps extends EditorCaretProps {
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
  selection,
  onSelectionChange,
  onFocus,
  onBlur,
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
        selection={selection}
        onSelectionChange={onSelectionChange}
        onFocus={onFocus}
        onBlur={onBlur}
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
