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
import { FAB_CLEARANCE, SPACING } from '@/constants/layout';
import { useFolders } from '@/hooks/useFolders';
import { useNewFolderDraft } from '@/hooks/useNewFolderDraft';
import type { Folder } from '@/modules/folders';

const EMPTY_STATE_TRANSITION_DURATION = 380;

export default function FoldersScreen() {
  const router = useRouter();
  const { folders, createFolder, updateFolder, removeFolder } = useFolders();
  const { openSheet, openSheetFor, reset } = useNewFolderDraft();
  const [pendingFolderId, setPendingFolderId] = useState<string | undefined>(
    undefined
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
        <Appbar.Content title="Scaffale" />
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
            onDeletePress={folder => removeFolder(folder.id)}
          />
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={handleCreatePress} />

      <NewFolderSheet onCreate={handleCreate} onEdit={updateFolder} />
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
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
