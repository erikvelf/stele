import { FadingList } from '@/components/shared';
import type { Note } from '@/modules/notes';

import { FolderNoteItem } from './FolderNoteItem';

export interface FolderNoteListProps {
  notes: Note[];
  onPress: (note: Note) => void;
  onEditPress: (note: Note) => void;
  onDeletePress: (note: Note) => void;
}

export function FolderNoteList({
  notes,
  onPress,
  onEditPress,
  onDeletePress,
}: FolderNoteListProps) {
  return (
    <FadingList
      items={notes}
      keyExtractor={note => note.id}
      renderItem={note => (
        <FolderNoteItem
          note={note}
          onPress={onPress}
          onEditPress={onEditPress}
          onDeletePress={onDeletePress}
        />
      )}
    />
  );
}
