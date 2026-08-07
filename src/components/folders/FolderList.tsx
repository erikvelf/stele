import type { StyleProp, ViewStyle } from 'react-native';

import { FadingList } from '@/components/shared';
import type { Folder } from '@/modules/folders';

import { FolderCard } from './FolderCard';

export interface FolderListProps {
  folders: Folder[];
  pendingFolderId?: string;
  onTopFolderSettled?: () => void;
  onPress: (folder: Folder) => void;
  onEditPress?: (folder: Folder) => void;
  onDeletePress?: (folder: Folder) => void;
  style?: StyleProp<ViewStyle>;
}

export function FolderList({
  folders,
  pendingFolderId,
  onTopFolderSettled,
  onPress,
  onEditPress,
  onDeletePress,
  style,
}: FolderListProps) {
  return (
    <FadingList
      items={folders}
      keyExtractor={folder => folder.id}
      pendingId={pendingFolderId}
      onTopItemSettled={onTopFolderSettled}
      style={style}
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
