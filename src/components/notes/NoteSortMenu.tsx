import { useState } from 'react';
import { Menu } from 'react-native-paper';

import { HeaderIconButton } from '@/components/shared';
import { useTranslation } from '@/hooks/useTranslation';

// Newest first is how the folder query returns notes; oldest first reads them
// in the order they were written.
export type NoteSort = 'newest' | 'oldest';

export interface NoteSortMenuProps {
  sort: NoteSort;
  onSortChange: (sort: NoteSort) => void;
}

const SORT_OPTIONS: readonly { value: NoteSort; icon: string }[] = [
  { value: 'newest', icon: 'sort-calendar-descending' },
  { value: 'oldest', icon: 'sort-calendar-ascending' },
];

export function NoteSortMenu({ sort, onSortChange }: NoteSortMenuProps) {
  const { t } = useTranslation();
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
        <HeaderIconButton
          icon="filter-variant"
          accessibilityLabel={t('noteSort.accessibilityLabel')}
          onPress={() => setIsMenuOpen(true)}
        />
      }
    >
      {SORT_OPTIONS.map(option => (
        <Menu.Item
          key={option.value}
          leadingIcon={option.icon}
          title={t(`noteSort.${option.value}`)}
          trailingIcon={option.value === sort ? 'check' : undefined}
          onPress={() => select(option.value)}
        />
      ))}
    </Menu>
  );
}
