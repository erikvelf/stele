import { format } from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';
import { StyleSheet } from 'react-native';

import { FadingList } from '@/components/shared';
import { SPACING } from '@/constants/layout';
import { useTranslation } from '@/hooks/useTranslation';
import { capitalize } from '@/lib/capitalize';
import type { JournalNote } from '@/modules/journal';

import { MonthHeader } from './MonthHeader';
import { NoteCard } from './NoteCard';

const MONTH_LABEL_FORMAT = 'MMMM yyyy';

function monthLabel(note: JournalNote, locale: DateFnsLocale): string {
  return capitalize(
    format(new Date(note.start_timestamp), MONTH_LABEL_FORMAT, { locale })
  );
}

export interface ActivityListProps {
  notes: JournalNote[];
  highlightCounts: ReadonlyMap<string, number>;
  pendingNoteId?: string;
  onTopNoteSettled?: () => void;
  onOpenNote: (note: JournalNote) => void;
  onSetDayRangeNote: (note: JournalNote) => void;
  onDeleteNote: (note: JournalNote) => void;
}

export function ActivityList({
  notes,
  highlightCounts,
  pendingNoteId,
  onTopNoteSettled,
  onOpenNote,
  onSetDayRangeNote,
  onDeleteNote,
}: ActivityListProps) {
  const { locale } = useTranslation();

  return (
    <FadingList
      items={notes}
      keyExtractor={note => note.id}
      pendingId={pendingNoteId}
      onTopItemSettled={onTopNoteSettled}
      style={styles.list}
      renderItem={(note, index) => {
        const previousNote = index > 0 ? notes[index - 1] : undefined;
        const showMonthHeader =
          !previousNote ||
          monthLabel(note, locale) !== monthLabel(previousNote, locale);

        return (
          <>
            {showMonthHeader ? (
              <MonthHeader label={monthLabel(note, locale)} />
            ) : null}
            <NoteCard
              noteText={note.text}
              range={note}
              highlightCount={highlightCounts.get(note.id) ?? 0}
              onOpenPress={() => onOpenNote(note)}
              onSetDayRangePress={() => onSetDayRangeNote(note)}
              onDeletePress={() => onDeleteNote(note)}
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
