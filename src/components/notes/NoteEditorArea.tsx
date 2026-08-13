import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import type { EditorCaretProps } from '@/components/notes/MarkdownEditor';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { SPACING } from '@/constants/layout';

const CARET_KEYBOARD_GAP = SPACING.xl;
const EDITOR_MIN_HEIGHT = 240;

interface NoteEditorAreaProps extends EditorCaretProps {
  value: string;
  onChangeText: (text: string) => void;
  isRenderMode: boolean;
  placeholder?: string;
  children?: ReactNode;
}

export function NoteEditorArea({
  value,
  onChangeText,
  isRenderMode,
  placeholder,
  children,
  selection,
  onSelectionChange,
  onFocus,
  onBlur,
}: NoteEditorAreaProps) {
  return (
    <KeyboardAwareScrollView
      style={styles.editorArea}
      mode="layout"
      bottomOffset={CARET_KEYBOARD_GAP}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
      <View style={styles.noteBody}>
        <NoteEditor
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          isRenderMode={isRenderMode}
          style={styles.editor}
          selection={selection}
          onSelectionChange={onSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  editorArea: {
    flex: 1,
  },
  noteBody: {
    paddingVertical: SPACING.xl,
  },
  editor: {
    minHeight: EDITOR_MIN_HEIGHT,
  },
});
