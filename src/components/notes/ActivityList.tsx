import { format } from 'date-fns';
import { StyleSheet } from 'react-native';

import { FadingList } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import type { NoteEntry } from '@/modules/notes';

import { MonthHeader } from './MonthHeader';
import { NoteCard } from './NoteCard';

const MONTH_LABEL_FORMAT = 'MMMM yyyy';

function monthLabel(entry: NoteEntry): string {
  return format(new Date(entry.range.start_timestamp), MONTH_LABEL_FORMAT);
}

export interface ActivityListProps {
  entries: NoteEntry[];
  pendingEntryId?: string;
  onTopEntrySettled?: () => void;
  onOpenEntry: (entry: NoteEntry) => void;
  onSetDayRangeEntry: (entry: NoteEntry) => void;
  onDeleteEntry: (entry: NoteEntry) => void;
}

export function ActivityList({
  entries,
  pendingEntryId,
  onTopEntrySettled,
  onOpenEntry,
  onSetDayRangeEntry,
  onDeleteEntry,
}: ActivityListProps) {
  return (
    <FadingList
      items={entries}
      keyExtractor={entry => entry.range.id}
      pendingId={pendingEntryId}
      onTopItemSettled={onTopEntrySettled}
      style={styles.list}
      renderItem={(entry, index) => {
        const previousEntry = index > 0 ? entries[index - 1] : undefined;
        const showMonthHeader =
          !previousEntry || monthLabel(entry) !== monthLabel(previousEntry);

        return (
          <>
            {showMonthHeader ? <MonthHeader label={monthLabel(entry)} /> : null}
            <NoteCard
              noteText={entry.note.text}
              range={entry.range}
              onOpenPress={() => onOpenEntry(entry)}
              onSetDayRangePress={() => onSetDayRangeEntry(entry)}
              onDeletePress={() => onDeleteEntry(entry)}
            />
          </>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
});
