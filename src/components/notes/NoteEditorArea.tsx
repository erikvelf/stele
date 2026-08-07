import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { NoteEditor } from '@/components/notes/NoteEditor';
import { SPACING } from '@/constants/layout';

const CARET_KEYBOARD_GAP = SPACING.xl;
const EDITOR_TRAILING_SLACK = 128;
const EDITOR_MIN_HEIGHT = 240;

interface NoteEditorAreaProps {
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
}: NoteEditorAreaProps) {
  return (
    <KeyboardAwareScrollView
      style={styles.editorArea}
      contentContainerStyle={styles.scrollContent}
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
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  editorArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: EDITOR_TRAILING_SLACK,
  },
  noteBody: {
    paddingVertical: SPACING.xl,
  },
  editor: {
    minHeight: EDITOR_MIN_HEIGHT,
  },
});
