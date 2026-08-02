import { FadingList } from '@/components/shared';
import type { Folder } from '@/modules/folders';

import { FolderCard } from './FolderCard';

export interface FolderListProps {
  folders: Folder[];
  pendingFolderId?: string;
  onTopFolderSettled?: () => void;
  onPress: (folder: Folder) => void;
  onEditPress: (folder: Folder) => void;
  onDeletePress: (folder: Folder) => void;
}

export function FolderList({
  folders,
  pendingFolderId,
  onTopFolderSettled,
  onPress,
  onEditPress,
  onDeletePress,
}: FolderListProps) {
  return (
    <FadingList
      items={folders}
      keyExtractor={folder => folder.id}
      pendingId={pendingFolderId}
      onTopItemSettled={onTopFolderSettled}
      renderItem={folder => (
        <FolderCard
          folder={folder}
          onPress={onPress}
          onEditPress={onEditPress}
          onDeletePress={onDeletePress}
        />
      )}
    />
  );
}
