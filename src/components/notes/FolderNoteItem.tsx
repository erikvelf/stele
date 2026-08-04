import { List } from 'react-native-paper';

import { ItemActionsMenu } from '@/components/shared';
import type { Note } from '@/modules/notes';

export interface FolderNoteItemProps {
  note: Note;
  onPress: (note: Note) => void;
  onEditPress: (note: Note) => void;
  onDeletePress: (note: Note) => void;
}

const EMPTY_NOTE_TITLE = 'Empty note';

function titleFor(text: string): string {
  const [firstLine] = text.split('\n');
  return firstLine.length > 0 ? firstLine : EMPTY_NOTE_TITLE;
}

export function FolderNoteItem({
  note,
  onPress,
  onEditPress,
  onDeletePress,
}: FolderNoteItemProps) {
  return (
    <List.Item
      title={titleFor(note.text)}
      titleNumberOfLines={0}
      onPress={() => onPress(note)}
      right={() => (
        <ItemActionsMenu
          onEditPress={() => onEditPress(note)}
          onDeletePress={() => onDeletePress(note)}
        />
      )}
    />
  );
}
