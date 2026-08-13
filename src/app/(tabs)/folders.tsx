import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, FAB, Surface } from 'react-native-paper';
import Animated, { FadeOut } from 'react-native-reanimated';

import {
  FolderList,
  FoldersEmptyState,
  NewFolderSheet,
} from '@/components/folders';
import { ConfirmDeleteModal } from '@/components/shared';
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useFolders } from '@/hooks/useFolders';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';
import { usePendingDelete } from '@/hooks/usePendingDelete';
import { useTranslation } from '@/hooks/useTranslation';
import type { Folder } from '@/modules/folders';

const EMPTY_STATE_TRANSITION_DURATION = 380;

export default function FoldersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { folders, createFolder, updateFolder, removeFolder } = useFolders();
  const { openSheet, openSheetFor, reset } = useNewFolderDraft();
  const [pendingFolderId, setPendingFolderId] = useState<string | undefined>(
    undefined
  );
  const folderDelete = usePendingDelete<Folder>(folder =>
    removeFolder(folder.id)
  );

  const handleCreatePress = () => {
    reset();
    openSheet();
  };

  const handleCreate = useCallback(
    (input: { name: string; emoji: string; color: Folder['color'] }) => {
      const folder = createFolder(input);
      setPendingFolderId(folder.id);
    },
    [createFolder]
  );

  const handleTopFolderSettled = useCallback(() => {
    setPendingFolderId(undefined);
  }, []);

  return (
    <Surface style={styles.screen} elevation={0}>
      <Appbar.Header>
        <Appbar.Content title={t('folders.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.body}>
        {folders.length === 0 ? (
          <Animated.View
            exiting={FadeOut.duration(EMPTY_STATE_TRANSITION_DURATION)}
          >
            <FoldersEmptyState />
          </Animated.View>
        ) : (
          <FolderList
            folders={folders}
            pendingFolderId={pendingFolderId}
            onTopFolderSettled={handleTopFolderSettled}
            onPress={folder => router.push(`/folder/${folder.id}`)}
            onEditPress={openSheetFor}
            onDeletePress={folderDelete.request}
            style={styles.list}
          />
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={handleCreatePress} />

      <NewFolderSheet onCreate={handleCreate} onEdit={updateFolder} />

      <ConfirmDeleteModal
        visible={folderDelete.isVisible}
        subject={t('common.folder')}
        onConfirm={folderDelete.confirm}
        onDismiss={folderDelete.cancel}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    padding: SPACING.md,
    paddingBottom: FAB_CLEARANCE,
  },
  list: {
    gap: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
