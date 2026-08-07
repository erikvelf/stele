import type {
  DateDayRange,
  Note,
  NoteCreated,
  NoteFolder,
} from './schema';

// A span of whole calendar days, both ends inclusive.
export interface DayBounds {
  start: Date;
  end: Date;
}

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

// Every row the notes domain owns, across the four tables that hold a note.
export interface NoteTables {
  notes: Note[];
  folders: NoteFolder[];
  created: NoteCreated[];
  ranges: DateDayRange[];
}
