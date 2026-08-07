import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, List, Menu, useTheme } from 'react-native-paper';

import type { Note } from '@/modules/notes';

import { MarkdownPreview } from './MarkdownPreview';

export interface FolderNoteItemProps {
  note: Note;
  onPress: (note: Note) => void;
  onEditPress: (note: Note) => void;
  onMovePress: (note: Note) => void;
  onDeletePress: (note: Note) => void;
}

const EMPTY_NOTE_TITLE = 'Empty note';

function titleFor(text: string): string {
  const [firstLine] = text.split('\n');
  return firstLine.length > 0 ? firstLine : EMPTY_NOTE_TITLE;
}

function NoteActionsMenu({
  onEditPress,
  onMovePress,
  onDeletePress,
}: {
  onEditPress: () => void;
  onMovePress: () => void;
  onDeletePress: () => void;
}) {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const runAndClose = (action: () => void) => () => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <Menu
      visible={isMenuOpen}
      onDismiss={() => setIsMenuOpen(false)}
      anchor={
        <IconButton
          icon="dots-vertical"
          accessibilityLabel="Note actions"
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="pencil"
        title="Edit"
        onPress={runAndClose(onEditPress)}
      />
      <Menu.Item
        leadingIcon="folder-move"
        title="Move"
        onPress={runAndClose(onMovePress)}
      />
      <Menu.Item
        leadingIcon="delete"
        title="Delete"
        theme={{
          colors: {
            onSurface: theme.colors.error,
            onSurfaceVariant: theme.colors.error,
          },
        }}
        onPress={runAndClose(onDeletePress)}
      />
    </Menu>
  );
}

export function FolderNoteItem({
  note,
  onPress,
  onEditPress,
  onMovePress,
  onDeletePress,
}: FolderNoteItemProps) {
  const theme = useTheme();

  return (
    <List.Item
      style={[styles.item, { borderColor: theme.colors.outlineVariant }]}
      title={() => (
        <MarkdownPreview
          markdown={titleFor(note.text)}
          fontSize={theme.fonts.bodyLarge.fontSize}
          lineHeight={theme.fonts.bodyLarge.lineHeight}
        />
      )}
      onPress={() => onPress(note)}
      right={() => (
        <NoteActionsMenu
          onEditPress={() => onEditPress(note)}
          onMovePress={() => onMovePress(note)}
          onDeletePress={() => onDeletePress(note)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
