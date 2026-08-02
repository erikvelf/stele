import type { DateDayRange, Note } from './schema';

// The span a date-range picker may extend into when starting a run at `start`.
// `end` is null when nothing ahead is occupied.
export interface FreeRun {
  start: Date;
  end: Date | null;
}

// A note paired with the day range it occupies, for views that render both together.
export interface NoteEntry {
  note: Note;
  range: DateDayRange;
}
