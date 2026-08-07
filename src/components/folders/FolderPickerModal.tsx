import { ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, useTheme } from 'react-native-paper';

import { RADIUS, SPACING } from '@/constants/layout';
import type { Folder } from '@/modules/folders';

import { FolderList } from './FolderList';

export interface FolderPickerModalProps {
  visible: boolean;
  folders: Folder[];
  title: string;
  emptyLabel: string;
  onSelect: (folder: Folder) => void;
  onDismiss: () => void;
}

const LIST_MAX_HEIGHT = 420;

export function FolderPickerModal({
  visible,
  folders,
  title,
  emptyLabel,
  onSelect,
  onDismiss,
}: FolderPickerModalProps) {
  const theme = useTheme();

  const handleSelect = (folder: Folder) => {
    onSelect(folder);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        {folders.length === 0 ? (
          <Text variant="bodyLarge" style={styles.title}>
            {emptyLabel}
          </Text>
        ) : (
          <ScrollView style={styles.scroll}>
            <FolderList
              folders={folders}
              onPress={handleSelect}
              style={styles.list}
            />
          </ScrollView>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  title: {
    textAlign: 'center',
  },
  scroll: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  list: {
    gap: SPACING.sm,
  },
});
