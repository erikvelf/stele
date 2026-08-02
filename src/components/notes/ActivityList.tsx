import { format } from 'date-fns';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  SlideInRight,
  runOnJS,
} from 'react-native-reanimated';

import { SPACING } from '@/constants/layout';
import type { NoteEntry } from '@/modules/notes';

import { MonthHeader } from './MonthHeader';
import { NoteCard } from './NoteCard';

const CARD_TRANSITION_DURATION = 380;
const cardEasing = Easing.out(Easing.cubic);
const MONTH_LABEL_FORMAT = 'MMMM yyyy';

function monthLabel(entry: NoteEntry): string {
  return format(new Date(entry.range.start_timestamp), MONTH_LABEL_FORMAT);
}

export interface ActivityListProps {
  entries: NoteEntry[];
  pendingEntryId?: string;
  onTopEntrySettled?: () => void;
  onOpenEntry: (entry: NoteEntry) => void;
  onEditEntry: (entry: NoteEntry) => void;
  onDeleteEntry: (entry: NoteEntry) => void;
}

export function ActivityList({
  entries,
  pendingEntryId,
  onTopEntrySettled,
  onOpenEntry,
  onEditEntry,
  onDeleteEntry,
}: ActivityListProps) {
  return (
    <Animated.View style={styles.list}>
      {entries.map((entry, index) => {
        const previousEntry = entries.at(index - 1);
        const showMonthHeader =
          !previousEntry || monthLabel(entry) !== monthLabel(previousEntry);

        return (
          <Animated.View
            key={entry.range.id}
            layout={LinearTransition.duration(CARD_TRANSITION_DURATION).easing(
              cardEasing
            )}
            exiting={FadeOut.duration(CARD_TRANSITION_DURATION)}
            entering={
              entry.range.id === pendingEntryId
                ? SlideInRight.duration(CARD_TRANSITION_DURATION)
                    .easing(cardEasing)
                    // Waits out the push-down of the rest of the list before
                    // sliding in, so the two motions read as one then the other.
                    .delay(CARD_TRANSITION_DURATION)
                    .withCallback(finished => {
                      'worklet';
                      if (finished && onTopEntrySettled) {
                        runOnJS(onTopEntrySettled)();
                      }
                    })
                : undefined
            }
          >
            {showMonthHeader ? <MonthHeader label={monthLabel(entry)} /> : null}
            <NoteCard
              noteText={entry.note.text}
              range={entry.range}
              onOpenPress={() => onOpenEntry(entry)}
              onEditPress={() => onEditEntry(entry)}
              onDeletePress={() => onDeleteEntry(entry)}
            />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
});
