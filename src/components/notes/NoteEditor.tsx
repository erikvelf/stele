import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { MarkdownEditor } from '@/components/notes/MarkdownEditor';
import { MarkdownPreview } from '@/components/notes/MarkdownPreview';

interface NoteEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  isRenderMode: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

export function NoteEditor({
  value,
  onChangeText,
  isRenderMode,
  placeholder,
  style,
}: NoteEditorProps) {
  if (isRenderMode) {
    return (
      <ScrollView style={[styles.renderContainer, style]}>
        <MarkdownPreview markdown={value} />
      </ScrollView>
    );
  }

  return (
    <MarkdownEditor
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
  renderContainer: {
    flex: 1,
  },
});
