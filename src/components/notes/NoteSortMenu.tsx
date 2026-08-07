import { useState } from 'react';
import { IconButton, Menu } from 'react-native-paper';

// Newest first is how the folder query returns notes; oldest first reads them
// in the order they were written.
export type NoteSort = 'newest' | 'oldest';

export interface NoteSortMenuProps {
  sort: NoteSort;
  onSortChange: (sort: NoteSort) => void;
}

const SORT_OPTIONS: readonly { value: NoteSort; label: string; icon: string }[] =
  [
    {
      value: 'newest',
      label: 'Più recenti',
      icon: 'sort-calendar-descending',
    },
    { value: 'oldest', label: 'Più vecchi', icon: 'sort-calendar-ascending' },
  ];

export function NoteSortMenu({ sort, onSortChange }: NoteSortMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const select = (next: NoteSort) => {
    setIsMenuOpen(false);
    onSortChange(next);
  };

  return (
    <Menu
      visible={isMenuOpen}
      onDismiss={() => setIsMenuOpen(false)}
      anchor={
        <IconButton
          icon="filter-variant"
          accessibilityLabel="Sort notes"
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      {SORT_OPTIONS.map(option => (
        <Menu.Item
          key={option.value}
          leadingIcon={option.icon}
          title={option.label}
          trailingIcon={option.value === sort ? 'check' : undefined}
          onPress={() => select(option.value)}
        />
      ))}
    </Menu>
  );
}
