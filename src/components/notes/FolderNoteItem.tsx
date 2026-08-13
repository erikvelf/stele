import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Menu, useTheme } from 'react-native-paper';

import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { titleOf } from '@/modules/notes';
import type { Note } from '@/modules/notes';
import { TRANSPARENT } from '@/modules/palette';

import { MarkdownPreview } from './MarkdownPreview';

const ROW_MIN_HEIGHT = 44;
const PREVIEW_MAX_LINES = 2;
const MENU_ICON_SIZE = 20;

export interface FolderNoteItemProps {
  note: Note;
  onPress: (note: Note) => void;
  onEditPress: (note: Note) => void;
  onMovePress: (note: Note) => void;
  onDeletePress: (note: Note) => void;
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
  const { t } = useTranslation();
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
          size={MENU_ICON_SIZE}
          style={styles.menuButton}
          accessibilityLabel={t('noteActions.label')}
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="pencil"
        title={t('common.edit')}
        onPress={runAndClose(onEditPress)}
      />
      <Menu.Item
        leadingIcon="folder-move"
        title={t('common.move')}
        onPress={runAndClose(onMovePress)}
      />
      <Menu.Item
        leadingIcon="delete"
        title={t('common.delete')}
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

// The same flush row a scaglia draws: hairlines above and below, collapsed
// into a single shared line between neighbours, so a folder reads as one
// stack of notes rather than a column of list items.
export function FolderNoteItem({
  note,
  onPress,
  onEditPress,
  onMovePress,
  onDeletePress,
}: FolderNoteItemProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(note)}
      style={[styles.row, { borderColor: theme.colors.outlineVariant }]}
    >
      <View style={styles.preview}>
        <MarkdownPreview
          markdown={titleOf(note.text) ?? t('notes.untitled')}
          fontSize={theme.fonts.bodyMedium.fontSize}
          lineHeight={theme.fonts.bodyMedium.lineHeight}
          maxLines={PREVIEW_MAX_LINES}
        />
      </View>
      <View style={styles.trailingSlot}>
        <NoteActionsMenu
          onEditPress={() => onEditPress(note)}
          onMovePress={() => onMovePress(note)}
          onDeletePress={() => onDeletePress(note)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: TRANSPARENT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: -StyleSheet.hairlineWidth,
    minHeight: ROW_MIN_HEIGHT,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  // The menu keeps its intrinsic width; the preview is the elastic one.
  preview: {
    flex: 1,
    flexShrink: 1,
  },
  trailingSlot: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  menuButton: {
    margin: 0,
  },
});
