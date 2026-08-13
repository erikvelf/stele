import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

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
      <View style={style}>
        <MarkdownPreview markdown={value} />
      </View>
    );
  }

  return (
    <MarkdownEditor
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={style}
    />
  );
}
